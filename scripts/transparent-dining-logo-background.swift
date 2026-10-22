import AppKit
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct RGB {
  let red: UInt8
  let green: UInt8
  let blue: UInt8
}

func isExteriorBackground(_ data: UnsafeMutablePointer<UInt8>, _ pixel: Int, _ reference: RGB) -> Bool {
  let offset = pixel * 4
  let tolerance: Int = 12
  return abs(Int(data[offset]) - Int(reference.red)) <= tolerance
    && abs(Int(data[offset + 1]) - Int(reference.green)) <= tolerance
    && abs(Int(data[offset + 2]) - Int(reference.blue)) <= tolerance
}

func makeTransparent(_ source: URL, output: URL) throws {
  guard let sourceData = try? Data(contentsOf: source),
        let original = NSBitmapImageRep(data: sourceData) else {
    throw NSError(domain: "SafeBite", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not load \(source.lastPathComponent)"])
  }

  let width = original.pixelsWide
  let height = original.pixelsHigh
  guard let sourceImage = original.cgImage else {
    throw NSError(domain: "SafeBite", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create source image"])
  }
  let bytesPerRow = width * 4
  guard let rawData = calloc(1, height * bytesPerRow) else {
    throw NSError(domain: "SafeBite", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not allocate pixels"])
  }
  defer { free(rawData) }
  let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
  guard let context = CGContext(
    data: rawData,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: bitmapInfo
  ) else {
    throw NSError(domain: "SafeBite", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not create graphics context"])
  }
  context.interpolationQuality = CGInterpolationQuality.high
  context.draw(sourceImage, in: CGRect(x: 0, y: 0, width: width, height: height))
  let data = rawData.bindMemory(to: UInt8.self, capacity: width * height * 4)
  let firstOffset = 0
  let background = RGB(red: data[firstOffset], green: data[firstOffset + 1], blue: data[firstOffset + 2])
  let total = width * height
  var visited = Array(repeating: false, count: total)
  var queue: [Int] = []
  queue.reserveCapacity(total / 2)

  func enqueue(_ pixel: Int) {
    guard !visited[pixel], isExteriorBackground(data, pixel, background) else { return }
    visited[pixel] = true
    queue.append(pixel)
  }

  for x in 0..<width {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for y in 0..<height {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  var cursor = 0
  while cursor < queue.count {
    let pixel = queue[cursor]
    cursor += 1
    let x = pixel % width
    let y = pixel / width
    if x > 0 { enqueue(pixel - 1) }
    if x + 1 < width { enqueue(pixel + 1) }
    if y > 0 { enqueue(pixel - width) }
    if y + 1 < height { enqueue(pixel + width) }
  }

  for pixel in queue {
    data[pixel * 4 + 3] = 0
  }

  var minX = width
  var minY = height
  var maxX = -1
  var maxY = -1
  for y in 0..<height {
    for x in 0..<width where data[(y * width + x) * 4 + 3] > 0 {
      minX = min(minX, x)
      minY = min(minY, y)
      maxX = max(maxX, x)
      maxY = max(maxY, y)
    }
  }
  let padding = 12
  let cropRect = maxX >= minX
    ? CGRect(
        x: max(0, minX - padding),
        y: max(0, minY - padding),
        width: min(width - max(0, minX - padding), maxX - minX + 1 + padding * 2),
        height: min(height - max(0, minY - padding), maxY - minY + 1 + padding * 2)
      )
    : CGRect(x: 0, y: 0, width: width, height: height)

  guard let fullImage = context.makeImage(),
        let outputImage = fullImage.cropping(to: cropRect),
        let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    throw NSError(domain: "SafeBite", code: 5, userInfo: [NSLocalizedDescriptionKey: "Could not encode PNG"])
  }
  CGImageDestinationAddImage(destination, outputImage, nil)
  guard CGImageDestinationFinalize(destination) else {
    throw NSError(domain: "SafeBite", code: 6, userInfo: [NSLocalizedDescriptionKey: "Could not write PNG"])
  }
}

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
  fputs("Usage: transparent-dining-logo-background <input-directory> <output-directory>\n", stderr)
  exit(1)
}

let input = URL(fileURLWithPath: arguments[1])
let output = URL(fileURLWithPath: arguments[2])
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
for source in try FileManager.default.contentsOfDirectory(at: input, includingPropertiesForKeys: nil)
where source.pathExtension.lowercased() == "png" {
  print("Processing \(source.lastPathComponent)")
  try makeTransparent(source, output: output.appendingPathComponent(source.lastPathComponent))
}
