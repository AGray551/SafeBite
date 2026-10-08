/**
 * Sample data for the mock API.
 *
 * Locations are UC's campus dining spots; the dishes, hours and buildings
 * are sample values for demo purposes only. Real menus will come from the UC Dining scraper. Timestamps are
 * generated relative to "now" so freshness labels always look realistic, and
 * one hall is deliberately stale to show the out-of-date warning.
 */
import type { DiningHall, MealPeriod, MenuItem } from '../schemas';

/**
 * NOTE: building names and hours below are placeholders for the demo. The
 * scraper should replace them with UC Dining's published data, so verify
 * them before treating any of this as accurate.
 */
const TUC = 'Tangeman University Center';

/** Shorthand for building hall fixtures. */
function hall(
  id: string,
  name: string,
  kind: DiningHall['kind'],
  location: string,
  hours: [string, string] | null,
  mealPeriods: MealPeriod[],
  mapPosition: { x: number; y: number },
  concepts?: string[],
): DiningHall {
  return {
    id,
    name,
    kind,
    location,
    todayHours: hours ? { opensAt: hours[0], closesAt: hours[1] } : null,
    mealPeriods,
    mapPosition,
    ...(concepts && { concepts }),
  };
}

const ALL: MealPeriod[] = ['breakfast', 'lunch', 'dinner'];
const LUNCH_DINNER: MealPeriod[] = ['lunch', 'dinner'];
const DAYTIME: MealPeriod[] = ['breakfast', 'lunch'];

export const HALLS: DiningHall[] = [
  // All-you-care-to-eat dining halls
  hall('centercourt', 'CenterCourt', 'dining-hall', 'Center Village', ['07:00', '20:00'], ALL, {
    x: 46,
    y: 58,
  }),
  hall('marketpointe', 'MarketPointe', 'dining-hall', 'Siddall Hall', ['07:00', '21:00'], ALL, {
    x: 18,
    y: 26,
  }),
  hall(
    'on-the-green',
    'On the Green (OTG)',
    'dining-hall',
    'Campus Green',
    ['07:30', '19:30'],
    ALL,
    { x: 70, y: 20 },
  ),

  // Restaurants
  hall('chick-fil-a', 'Chick-fil-A', 'restaurant', TUC, ['10:30', '20:00'], LUNCH_DINNER, {
    x: 38,
    y: 40,
  }),
  hall('pei-wei', 'Pei Wei', 'restaurant', TUC, ['10:30', '20:00'], LUNCH_DINNER, { x: 30, y: 46 }),
  hall('halal-shack', 'Halal Shack', 'restaurant', TUC, ['11:00', '21:00'], LUNCH_DINNER, {
    x: 42,
    y: 34,
  }),
  hall('cincy-grill', 'Cincy Grill', 'restaurant', TUC, ['11:00', '21:00'], LUNCH_DINNER, {
    x: 34,
    y: 30,
  }),
  hall('subway', 'Subway', 'restaurant', TUC, ['10:00', '22:00'], LUNCH_DINNER, { x: 26, y: 36 }),
  hall(
    'bearcats-social',
    'Bearcats Social / Bearcats Cafe',
    'restaurant',
    'Main campus',
    ['08:00', '21:00'],
    ALL,
    { x: 58, y: 44 },
    ['Bowl Lab', 'Ibasho Sushi', 'BABB Breakfast Burritos'],
  ),

  // Cafés
  hall('daap-cafe', 'DAAP Café', 'cafe', 'DAAP', ['08:00', '15:00'], DAYTIME, { x: 14, y: 62 }),
  hall(
    'stadium-view-cafe',
    'Stadium View Café',
    'cafe',
    'Near Nippert Stadium',
    ['17:00', '23:00'],
    ['dinner'],
    { x: 62, y: 78 },
  ),
  hall('campus-view-cafe', 'Campus View Café', 'cafe', 'Main campus', ['08:00', '18:00'], ALL, {
    x: 80,
    y: 52,
  }),
  hall('shake-smart', 'Shake Smart', 'cafe', 'Campus Recreation Center', ['07:00', '19:00'], ALL, {
    x: 54,
    y: 68,
  }),
  hall(
    'starbucks-lindner',
    'Starbucks (Lindner College of Business)',
    'cafe',
    'Lindner Hall',
    ['07:30', '17:00'],
    DAYTIME,
    { x: 84, y: 30 },
  ),
  hall(
    'starbucks-msb',
    'Starbucks (Medical Science Building)',
    'cafe',
    'Medical Sciences Building',
    ['07:00', '16:00'],
    DAYTIME,
    { x: 88, y: 84 },
  ),

  // Convenience
  hall('mainstreet-expressmart', 'MainStreet ExpressMart', 'market', TUC, ['08:00', '23:00'], ALL, {
    x: 36,
    y: 50,
  }),
];

/** Locations whose sample menu was last scraped long ago (to demo the warning). */
export const STALE_HALL_IDS = new Set(['stadium-view-cafe']);

/** Fixture shape: a MenuItem minus timestamps, plus which periods serve it today. */
type ItemFixture = Omit<MenuItem, 'updatedAt' | 'ingredientsChangedAt'> & {
  /** Meal periods the item is on today's menu. Empty = not served today. */
  periods: MealPeriod[];
  /** Simulates a scrape that changed this item's ingredients today. */
  changedToday?: boolean;
};

const ALL_DAY = LUNCH_DINNER;

const DINING_HALL_ITEMS: ItemFixture[] = [
  // ---- CenterCourt -------------------------------------------------------
  {
    id: 'cc-grilled-chicken-bowl',
    hallId: 'centercourt',
    name: 'Grilled Chicken Bowl',
    station: 'Grill',
    category: 'Grill',
    periods: ['lunch'],
    description:
      'Herb-grilled chicken over brown rice with black beans, roasted peppers, corn salsa and cilantro-lime dressing.',
    servingSize: '1 bowl (14 oz)',
    nutrition: { calories: 540, proteinG: 42, carbsG: 48, fatG: 18, sodiumMg: 820, sugarG: 6 },
    ingredients:
      'Grilled chicken breast (chicken, olive oil, garlic, salt, black pepper), brown rice, roasted peppers, black beans, corn salsa, cilantro-lime dressing (canola oil, lime juice, vinegar, cilantro, sugar, salt).',
    allergens: {
      contains: [],
      mayContain: ['soy'],
      crossContactNote: 'Cooked on a shared grill with items that contain soy.',
    },
    dietaryTags: ['gluten-free', 'dairy-free', 'high-protein'],
  },
  {
    id: 'cc-herb-roasted-chicken',
    hallId: 'centercourt',
    name: 'Herb Roasted Chicken',
    station: 'Home Style',
    category: 'Entrées',
    periods: ALL_DAY,
    description: 'Bone-in chicken roasted with rosemary, thyme and garlic.',
    servingSize: '1 quarter chicken',
    nutrition: { calories: 460, proteinG: 48, carbsG: 2, fatG: 28, sodiumMg: 690, sugarG: 0 },
    ingredients: 'Chicken, olive oil, rosemary, thyme, garlic, salt, black pepper.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['gluten-free', 'dairy-free', 'high-protein'],
  },
  {
    id: 'cc-veggie-stir-fry',
    hallId: 'centercourt',
    name: 'Veggie Stir-Fry',
    station: 'Wok',
    category: 'Entrées',
    periods: ALL_DAY,
    description: 'Broccoli, snap peas, carrots and tofu tossed in a ginger-garlic sauce.',
    servingSize: '1 plate (12 oz)',
    nutrition: { calories: 420, proteinG: 18, carbsG: 52, fatG: 14, sodiumMg: 940, sugarG: 9 },
    ingredients:
      'Tofu, broccoli, snap peas, carrots, ginger-garlic sauce (soy sauce, ginger, garlic, rice vinegar, sesame oil, sugar), jasmine rice.',
    allergens: {
      contains: ['soy', 'sesame'],
      mayContain: ['peanuts'],
      crossContactNote: 'Prepared in a shared wok with dishes that contain peanuts.',
    },
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
  },
  {
    id: 'cc-thai-peanut-noodles',
    hallId: 'centercourt',
    name: 'Thai Peanut Noodles',
    station: 'Global',
    category: 'Entrées',
    periods: ['lunch'],
    description: 'Rice noodles with peanut sauce, cabbage, carrots and scallions.',
    servingSize: '1 bowl (12 oz)',
    nutrition: { calories: 610, proteinG: 16, carbsG: 78, fatG: 26, sodiumMg: 1020, sugarG: 14 },
    ingredients:
      'Wheat noodles, peanut sauce (peanuts, soy sauce, lime juice, brown sugar, chili), cabbage, carrots, scallions.',
    allergens: { contains: ['peanuts', 'soy', 'wheat'], mayContain: ['tree-nuts'] },
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
  },
  {
    id: 'cc-chicken-alfredo',
    hallId: 'centercourt',
    name: 'Chicken Alfredo',
    station: 'Pasta',
    category: 'Entrées',
    periods: ['lunch'],
    changedToday: true,
    description: 'Penne with grilled chicken in a parmesan cream sauce.',
    servingSize: '1 plate (14 oz)',
    nutrition: { calories: 780, proteinG: 44, carbsG: 70, fatG: 34, sodiumMg: 1180, sugarG: 5 },
    ingredients:
      'Penne pasta (wheat, egg), grilled chicken, cream, parmesan cheese, butter, garlic, black pepper.',
    allergens: { contains: ['milk', 'wheat', 'eggs'], mayContain: [] },
    dietaryTags: ['high-protein'],
  },
  {
    id: 'cc-roasted-sweet-potatoes',
    hallId: 'centercourt',
    name: 'Roasted Sweet Potatoes',
    station: 'Home Style',
    category: 'Sides',
    periods: ALL_DAY,
    servingSize: '1 cup',
    nutrition: { calories: 210, proteinG: 3, carbsG: 38, fatG: 6, sodiumMg: 240, sugarG: 11 },
    ingredients: 'Sweet potatoes, olive oil, salt, smoked paprika.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'cc-mac-and-cheese',
    hallId: 'centercourt',
    name: 'Mac & Cheese',
    station: 'Home Style',
    category: 'Sides',
    periods: ALL_DAY,
    servingSize: '1 cup',
    nutrition: { calories: 380, proteinG: 15, carbsG: 40, fatG: 18, sodiumMg: 720, sugarG: 4 },
    ingredients: 'Elbow macaroni (wheat), cheddar cheese, milk, butter, flour, salt.',
    allergens: { contains: ['milk', 'wheat'], mayContain: [] },
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'cc-brown-rice',
    hallId: 'centercourt',
    name: 'Brown Rice',
    station: 'Home Style',
    category: 'Sides',
    periods: ALL_DAY,
    servingSize: '1 cup',
    nutrition: { calories: 190, proteinG: 4, carbsG: 40, fatG: 2, sodiumMg: 10, sugarG: 0 },
    ingredients: 'Brown rice, water.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'cc-garden-salad',
    hallId: 'centercourt',
    name: 'Garden Salad',
    station: 'Salad Bar',
    category: 'Salads',
    periods: ALL_DAY,
    servingSize: '1 bowl',
    nutrition: { calories: 120, proteinG: 3, carbsG: 12, fatG: 7, sodiumMg: 180, sugarG: 5 },
    ingredients: 'Romaine, cucumber, tomato, carrots, red onion, balsamic vinaigrette.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  },
  {
    id: 'cc-almond-blondie',
    hallId: 'centercourt',
    name: 'Almond Blondie',
    station: 'Bakery',
    category: 'Desserts',
    periods: ALL_DAY,
    servingSize: '1 bar',
    nutrition: { calories: 320, proteinG: 4, carbsG: 42, fatG: 16, sodiumMg: 150, sugarG: 28 },
    ingredients: 'Flour (wheat), brown sugar, butter, eggs, almonds, vanilla.',
    allergens: { contains: ['tree-nuts', 'wheat', 'eggs', 'milk'], mayContain: ['peanuts'] },
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'cc-scrambled-eggs',
    hallId: 'centercourt',
    name: 'Scrambled Eggs',
    station: 'Breakfast',
    category: 'Entrées',
    periods: ['breakfast'],
    servingSize: '1 cup',
    nutrition: { calories: 220, proteinG: 14, carbsG: 2, fatG: 16, sodiumMg: 320, sugarG: 1 },
    ingredients: 'Eggs, butter, salt.',
    allergens: { contains: ['eggs', 'milk'], mayContain: [] },
    dietaryTags: ['vegetarian', 'gluten-free'],
  },
  {
    id: 'cc-oatmeal',
    hallId: 'centercourt',
    name: 'Steel-Cut Oatmeal',
    station: 'Breakfast',
    category: 'Entrées',
    periods: ['breakfast'],
    servingSize: '1 bowl',
    nutrition: { calories: 180, proteinG: 6, carbsG: 32, fatG: 3, sodiumMg: 5, sugarG: 1 },
    ingredients: 'Steel-cut oats, water, cinnamon.',
    allergens: { contains: [], mayContain: ['wheat'] },
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
  },

  // ---- MarketPointe ------------------------------------------------------
  {
    id: 'mp-black-bean-burger',
    hallId: 'marketpointe',
    name: 'Black Bean Burger',
    station: 'Grill',
    category: 'Grill',
    periods: ALL_DAY,
    description: 'House black bean patty on a whole wheat bun with lettuce, tomato and onion.',
    servingSize: '1 burger',
    nutrition: { calories: 490, proteinG: 21, carbsG: 64, fatG: 15, sodiumMg: 880, sugarG: 8 },
    ingredients:
      'Black beans, brown rice, onion, bread crumbs (wheat), soy protein, spices, whole wheat bun, lettuce, tomato.',
    allergens: { contains: ['wheat', 'soy'], mayContain: [] },
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free'],
  },
  {
    id: 'mp-herb-roasted-chicken',
    hallId: 'marketpointe',
    name: 'Herb Roasted Chicken',
    station: 'Home Style',
    category: 'Entrées',
    periods: ALL_DAY,
    servingSize: '1 quarter chicken',
    nutrition: { calories: 460, proteinG: 48, carbsG: 2, fatG: 28, sodiumMg: 690, sugarG: 0 },
    ingredients: 'Chicken, olive oil, rosemary, thyme, garlic, salt, black pepper.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['gluten-free', 'dairy-free', 'high-protein'],
  },
  {
    id: 'mp-lemon-herb-salmon',
    hallId: 'marketpointe',
    name: 'Lemon Herb Salmon',
    station: 'Home Style',
    category: 'Entrées',
    periods: [],
    servingSize: '6 oz fillet',
    nutrition: { calories: 410, proteinG: 38, carbsG: 3, fatG: 26, sodiumMg: 520, sugarG: 1 },
    ingredients: 'Atlantic salmon, lemon, dill, olive oil, salt.',
    allergens: { contains: ['fish'], mayContain: [] },
    dietaryTags: ['gluten-free', 'dairy-free', 'high-protein'],
  },
  {
    id: 'mp-cheese-pizza',
    hallId: 'marketpointe',
    name: 'Cheese Pizza',
    station: 'Pizza',
    category: 'Pizza',
    periods: ALL_DAY,
    servingSize: '2 slices',
    nutrition: { calories: 560, proteinG: 24, carbsG: 68, fatG: 20, sodiumMg: 1100, sugarG: 6 },
    ingredients: 'Pizza dough (wheat), tomato sauce, mozzarella cheese, oregano.',
    allergens: { contains: ['wheat', 'milk'], mayContain: [] },
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'mp-gluten-free-pizza',
    hallId: 'marketpointe',
    name: 'Gluten-Free Veggie Pizza',
    station: 'Pizza',
    category: 'Pizza',
    periods: ALL_DAY,
    servingSize: '2 slices',
    nutrition: { calories: 480, proteinG: 18, carbsG: 58, fatG: 18, sodiumMg: 940, sugarG: 7 },
    ingredients:
      'Gluten-free crust (rice flour, tapioca, eggs), tomato sauce, mozzarella cheese, peppers, mushrooms, onions.',
    allergens: {
      contains: ['milk', 'eggs'],
      mayContain: ['wheat'],
      crossContactNote: 'Baked in the same oven as wheat crusts.',
    },
    dietaryTags: ['vegetarian', 'gluten-free'],
  },
  {
    id: 'mp-shawarma-bowl',
    hallId: 'marketpointe',
    name: 'Chicken Shawarma Bowl',
    station: 'Global',
    category: 'Entrées',
    periods: ['dinner'],
    servingSize: '1 bowl',
    nutrition: { calories: 620, proteinG: 40, carbsG: 58, fatG: 24, sodiumMg: 1040, sugarG: 5 },
    ingredients:
      'Halal chicken thigh, shawarma spices, basmati rice, cucumber, tomato, tahini sauce (sesame, lemon, garlic).',
    allergens: { contains: ['sesame'], mayContain: [] },
    dietaryTags: ['halal', 'dairy-free', 'high-protein', 'gluten-free'],
  },
  {
    id: 'mp-fruit-cup',
    hallId: 'marketpointe',
    name: 'Fresh Fruit Cup',
    station: 'Grab & Go',
    category: 'Sides',
    periods: ['breakfast', 'lunch', 'dinner'],
    servingSize: '1 cup',
    nutrition: { calories: 90, proteinG: 1, carbsG: 22, fatG: 0, sodiumMg: 0, sugarG: 18 },
    ingredients: 'Cantaloupe, honeydew, pineapple, grapes.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  },

  // ---- On the Green -------------------------------------------------------
  {
    id: 'otg-chicken-satay',
    hallId: 'on-the-green',
    name: 'Chicken Satay, Peanut Sauce',
    station: 'Global',
    category: 'Entrées',
    periods: ALL_DAY,
    description:
      'Grilled chicken skewers with house peanut sauce, jasmine rice and cucumber salad.',
    servingSize: '3 skewers + rice',
    nutrition: { calories: 610, proteinG: 38, carbsG: 52, fatG: 26, sodiumMg: 980, sugarG: 12 },
    ingredients:
      'Chicken, peanut sauce (peanuts, soy sauce, coconut milk, curry paste, brown sugar), jasmine rice, cucumber, rice vinegar.',
    allergens: {
      contains: ['peanuts', 'soy'],
      mayContain: ['tree-nuts'],
      crossContactNote: 'Sauces prepared in a kitchen that handles peanuts and tree nuts.',
    },
    dietaryTags: ['high-protein', 'dairy-free'],
  },
  {
    id: 'otg-veggie-lo-mein',
    hallId: 'on-the-green',
    name: 'Veggie Lo Mein',
    station: 'Global',
    category: 'Entrées',
    periods: ALL_DAY,
    servingSize: '1 plate',
    nutrition: { calories: 520, proteinG: 14, carbsG: 82, fatG: 14, sodiumMg: 1120, sugarG: 10 },
    ingredients: 'Lo mein noodles (wheat, egg), cabbage, carrots, bok choy, soy sauce, garlic.',
    allergens: { contains: ['wheat', 'soy', 'eggs'], mayContain: [] },
    dietaryTags: ['vegetarian', 'dairy-free'],
  },
  {
    id: 'otg-teriyaki-bowl',
    hallId: 'on-the-green',
    name: 'Teriyaki Chicken Bowl',
    station: 'Global',
    category: 'Entrées',
    periods: ALL_DAY,
    servingSize: '1 bowl',
    nutrition: { calories: 590, proteinG: 36, carbsG: 74, fatG: 14, sodiumMg: 1300, sugarG: 18 },
    ingredients: 'Chicken, teriyaki sauce (soy sauce, wheat, sugar, ginger), white rice, broccoli.',
    allergens: { contains: ['soy', 'wheat'], mayContain: [] },
    dietaryTags: ['high-protein', 'dairy-free'],
  },
  {
    id: 'otg-pepperoni-pizza',
    hallId: 'on-the-green',
    name: 'Pepperoni Pizza',
    station: 'Pizza',
    category: 'Pizza',
    periods: ALL_DAY,
    servingSize: '2 slices',
    nutrition: { calories: 650, proteinG: 28, carbsG: 68, fatG: 28, sodiumMg: 1380, sugarG: 6 },
    ingredients: 'Pizza dough (wheat), tomato sauce, mozzarella cheese, pepperoni (pork, beef).',
    allergens: { contains: ['wheat', 'milk'], mayContain: [] },
    dietaryTags: [],
  },
  {
    id: 'otg-pancakes',
    hallId: 'on-the-green',
    name: 'Buttermilk Pancakes',
    station: 'Breakfast',
    category: 'Entrées',
    periods: ['breakfast'],
    servingSize: '3 pancakes',
    nutrition: { calories: 450, proteinG: 10, carbsG: 72, fatG: 14, sodiumMg: 820, sugarG: 16 },
    ingredients: 'Flour (wheat), buttermilk, eggs, sugar, baking powder, butter.',
    allergens: { contains: ['wheat', 'milk', 'eggs'], mayContain: [] },
    dietaryTags: ['vegetarian'],
  },
  {
    id: 'otg-iced-tea',
    hallId: 'on-the-green',
    name: 'Unsweetened Iced Tea',
    station: 'Beverages',
    category: 'Drinks',
    periods: ['breakfast', 'lunch', 'dinner'],
    servingSize: '16 oz',
    nutrition: { calories: 0 },
    ingredients: 'Brewed black tea, water.',
    allergens: { contains: [], mayContain: [] },
    dietaryTags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  },

  // ---- Campus View Café (includes a missing-data example) -------------------
  {
    id: 'cvc-chicken-wrap',
    hallId: 'campus-view-cafe',
    name: 'Buffalo Chicken Wrap',
    station: 'Grab & Go',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    servingSize: '1 wrap',
    nutrition: { calories: 580 },
    // Scraper couldn't find allergen data for this item. Shows the "unknown" state.
    allergens: null,
    dietaryTags: [],
  },
  // ---- Stadium View Café (stale menu example) -------------------------------
  {
    id: 'svc-chocolate-chip-cookie',
    hallId: 'stadium-view-cafe',
    name: 'Chocolate Chip Cookie',
    station: 'Bakery',
    category: 'Desserts',
    periods: ['dinner'],
    servingSize: '1 cookie',
    nutrition: { calories: 280 },
    ingredients: 'Flour (wheat), butter, sugar, eggs, chocolate chips (milk, soy lecithin).',
    allergens: { contains: ['wheat', 'milk', 'eggs', 'soy'], mayContain: ['peanuts', 'tree-nuts'] },
    dietaryTags: ['vegetarian'],
  },
];

/** Compact builder for the retail fixtures below. */
function quick(
  id: string,
  hallId: string,
  name: string,
  details: {
    station: string;
    category: string;
    periods: MealPeriod[];
    calories: number;
    proteinG?: number;
    contains?: string[];
    mayContain?: string[];
    crossContactNote?: string;
    tags?: MenuItem['dietaryTags'];
    description?: string;
    servingSize?: string;
    ingredients?: string;
  },
): ItemFixture {
  return {
    id,
    hallId,
    name,
    station: details.station,
    category: details.category,
    periods: details.periods,
    description: details.description,
    servingSize: details.servingSize,
    ingredients: details.ingredients,
    nutrition: { calories: details.calories, proteinG: details.proteinG },
    allergens: {
      contains: details.contains ?? [],
      mayContain: details.mayContain ?? [],
      crossContactNote: details.crossContactNote,
    },
    dietaryTags: details.tags ?? [],
  };
}

const RETAIL_ITEMS: ItemFixture[] = [
  // Chick-fil-A
  quick('cfa-chicken-sandwich', 'chick-fil-a', 'Chick-fil-A Chicken Sandwich', {
    station: 'Entrées',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 420,
    proteinG: 29,
    contains: ['wheat', 'milk', 'eggs', 'soy'],
    crossContactNote: 'Fried in refined peanut oil.',
    tags: ['high-protein'],
    ingredients:
      'Breaded chicken breast (wheat flour, milk, egg), bun (wheat, soy), pickles, butter.',
  }),
  quick('cfa-grilled-nuggets', 'chick-fil-a', 'Grilled Nuggets (8 ct)', {
    station: 'Entrées',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 130,
    proteinG: 25,
    tags: ['gluten-free', 'dairy-free', 'high-protein'],
    ingredients: 'Chicken breast, seasoning (salt, garlic, spices), canola oil.',
  }),
  quick('cfa-waffle-fries', 'chick-fil-a', 'Waffle Potato Fries', {
    station: 'Sides',
    category: 'Sides',
    periods: LUNCH_DINNER,
    calories: 420,
    crossContactNote: 'Cooked in canola oil; shared fryer area.',
    tags: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'],
  }),

  // Pei Wei
  quick('pw-kung-pao-chicken', 'pei-wei', 'Kung Pao Chicken', {
    station: 'Wok',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 710,
    proteinG: 44,
    contains: ['peanuts', 'soy', 'wheat'],
    tags: ['high-protein', 'dairy-free'],
    ingredients:
      'Chicken, peanuts, chili peppers, scallions, kung pao sauce (soy sauce, wheat, sugar, vinegar).',
  }),
  quick('pw-teriyaki-tofu-bowl', 'pei-wei', 'Teriyaki Tofu Bowl', {
    station: 'Wok',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 560,
    proteinG: 22,
    contains: ['soy', 'wheat'],
    mayContain: ['peanuts'],
    crossContactNote: 'Cooked in shared woks.',
    tags: ['vegan', 'vegetarian', 'dairy-free'],
  }),
  quick('pw-white-rice', 'pei-wei', 'Steamed White Rice', {
    station: 'Sides',
    category: 'Sides',
    periods: LUNCH_DINNER,
    calories: 380,
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),

  // Halal Shack
  quick('hs-chicken-bowl', 'halal-shack', 'Chicken Rice Bowl', {
    station: 'Bowls',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 650,
    proteinG: 42,
    contains: ['sesame'],
    tags: ['halal', 'gluten-free', 'dairy-free', 'high-protein'],
    ingredients: 'Halal chicken, basmati rice, lettuce, tomato, cucumber, tahini sauce (sesame).',
  }),
  quick('hs-falafel-wrap', 'halal-shack', 'Falafel Wrap', {
    station: 'Wraps',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 590,
    proteinG: 18,
    contains: ['wheat', 'sesame'],
    tags: ['halal', 'vegan', 'vegetarian', 'dairy-free'],
  }),
  quick('hs-lamb-gyro', 'halal-shack', 'Lamb Gyro Bowl', {
    station: 'Bowls',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 720,
    proteinG: 38,
    contains: ['milk'],
    tags: ['halal', 'gluten-free', 'high-protein'],
    ingredients: 'Halal lamb, rice, lettuce, onion, white sauce (yogurt, garlic).',
  }),

  // Cincy Grill
  quick('cg-cheeseburger', 'cincy-grill', 'Classic Cheeseburger', {
    station: 'Grill',
    category: 'Grill',
    periods: LUNCH_DINNER,
    calories: 780,
    proteinG: 38,
    contains: ['wheat', 'milk', 'soy', 'sesame'],
    tags: ['high-protein'],
  }),
  quick('cg-grilled-chicken-salad', 'cincy-grill', 'Grilled Chicken Salad', {
    station: 'Grill',
    category: 'Salads',
    periods: LUNCH_DINNER,
    calories: 360,
    proteinG: 34,
    contains: ['eggs'],
    tags: ['gluten-free', 'high-protein'],
  }),
  quick('cg-sweet-potato-fries', 'cincy-grill', 'Sweet Potato Fries', {
    station: 'Grill',
    category: 'Sides',
    periods: LUNCH_DINNER,
    calories: 340,
    mayContain: ['wheat'],
    crossContactNote: 'Shared fryer with breaded items.',
    tags: ['vegan', 'vegetarian', 'dairy-free'],
  }),

  // Subway
  quick('sub-turkey', 'subway', 'Oven Roasted Turkey (6")', {
    station: 'Sandwiches',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 270,
    proteinG: 18,
    contains: ['wheat', 'soy'],
    tags: ['dairy-free'],
  }),
  quick('sub-veggie-delite', 'subway', 'Veggie Delite (6")', {
    station: 'Sandwiches',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 200,
    contains: ['wheat', 'soy'],
    tags: ['vegan', 'vegetarian', 'dairy-free'],
  }),
  quick('sub-cookie', 'subway', 'Chocolate Chip Cookie', {
    station: 'Sides',
    category: 'Desserts',
    periods: LUNCH_DINNER,
    calories: 210,
    contains: ['wheat', 'milk', 'eggs', 'soy'],
    mayContain: ['peanuts', 'tree-nuts'],
    tags: ['vegetarian'],
  }),

  // Bearcats Social / Bearcats Cafe
  quick('bs-poke-bowl', 'bearcats-social', 'Spicy Salmon Poke Bowl', {
    station: 'Bowl Lab',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 640,
    proteinG: 32,
    contains: ['fish', 'soy', 'sesame', 'eggs'],
    tags: ['dairy-free', 'high-protein'],
  }),
  quick('bs-california-roll', 'bearcats-social', 'California Roll', {
    station: 'Ibasho Sushi',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 290,
    proteinG: 9,
    contains: ['shellfish', 'eggs', 'soy', 'sesame'],
    mayContain: ['fish'],
    tags: ['dairy-free'],
  }),
  quick('bs-veggie-roll', 'bearcats-social', 'Avocado Cucumber Roll', {
    station: 'Ibasho Sushi',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 240,
    contains: ['sesame'],
    mayContain: ['fish', 'shellfish'],
    crossContactNote: 'Prepared on shared sushi boards.',
    tags: ['vegan', 'vegetarian', 'dairy-free'],
  }),
  quick('bs-breakfast-burrito', 'bearcats-social', 'Chorizo Breakfast Burrito', {
    station: 'BABB Breakfast Burritos',
    category: 'Entrées',
    periods: ['breakfast'],
    calories: 710,
    proteinG: 30,
    contains: ['wheat', 'eggs', 'milk'],
    tags: ['high-protein'],
  }),

  // DAAP Café
  quick('daap-bagel', 'daap-cafe', 'Everything Bagel & Cream Cheese', {
    station: 'Bakery',
    category: 'Entrées',
    periods: DAYTIME,
    calories: 420,
    contains: ['wheat', 'milk', 'sesame'],
    tags: ['vegetarian'],
  }),
  quick('daap-hummus-box', 'daap-cafe', 'Hummus & Veggie Box', {
    station: 'Grab & Go',
    category: 'Entrées',
    periods: DAYTIME,
    calories: 320,
    contains: ['sesame'],
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),
  quick('daap-cold-brew', 'daap-cafe', 'Cold Brew Coffee', {
    station: 'Coffee',
    category: 'Drinks',
    periods: DAYTIME,
    calories: 5,
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),

  // Stadium View Café (stale menu)
  quick('svc-chicken-tenders', 'stadium-view-cafe', 'Chicken Tenders & Fries', {
    station: 'Grill',
    category: 'Entrées',
    periods: ['dinner'],
    calories: 860,
    proteinG: 36,
    contains: ['wheat', 'milk', 'eggs'],
    tags: ['high-protein'],
  }),

  // Campus View Café
  quick('cvc-turkey-pesto', 'campus-view-cafe', 'Turkey Pesto Panini', {
    station: 'Sandwiches',
    category: 'Entrées',
    periods: LUNCH_DINNER,
    calories: 610,
    proteinG: 34,
    contains: ['wheat', 'milk', 'tree-nuts'],
    tags: ['high-protein'],
    ingredients:
      'Ciabatta (wheat), turkey, provolone (milk), basil pesto (pine nuts, parmesan, basil, olive oil).',
  }),
  quick('cvc-yogurt-parfait', 'campus-view-cafe', 'Greek Yogurt Parfait', {
    station: 'Grab & Go',
    category: 'Entrées',
    periods: ['breakfast'],
    calories: 290,
    contains: ['milk'],
    mayContain: ['tree-nuts'],
    tags: ['vegetarian', 'gluten-free'],
  }),

  // Shake Smart
  quick('ss-pb-protein-shake', 'shake-smart', 'PB Protein Shake', {
    station: 'Shakes',
    category: 'Drinks',
    periods: ALL,
    calories: 480,
    proteinG: 34,
    contains: ['peanuts', 'milk'],
    tags: ['vegetarian', 'gluten-free', 'high-protein'],
  }),
  quick('ss-acai-bowl', 'shake-smart', 'Açaí Bowl', {
    station: 'Bowls',
    category: 'Entrées',
    periods: ALL,
    calories: 450,
    mayContain: ['tree-nuts', 'peanuts'],
    crossContactNote: 'Blended with equipment shared with nut butters.',
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),
  quick('ss-green-smoothie', 'shake-smart', 'Green Machine Smoothie', {
    station: 'Shakes',
    category: 'Drinks',
    periods: ALL,
    calories: 260,
    proteinG: 4,
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),

  // Starbucks (Lindner)
  quick('sbl-latte', 'starbucks-lindner', 'Caffè Latte (Grande)', {
    station: 'Espresso',
    category: 'Drinks',
    periods: DAYTIME,
    calories: 190,
    proteinG: 13,
    contains: ['milk'],
    tags: ['vegetarian', 'gluten-free'],
  }),
  quick('sbl-egg-bites', 'starbucks-lindner', 'Egg White & Red Pepper Egg Bites', {
    station: 'Food',
    category: 'Entrées',
    periods: DAYTIME,
    calories: 170,
    proteinG: 12,
    contains: ['eggs', 'milk'],
    tags: ['vegetarian', 'gluten-free'],
  }),
  quick('sbl-banana-bread', 'starbucks-lindner', 'Banana Walnut Bread', {
    station: 'Bakery',
    category: 'Desserts',
    periods: DAYTIME,
    calories: 420,
    contains: ['wheat', 'eggs', 'milk', 'tree-nuts'],
    tags: ['vegetarian'],
  }),

  // Starbucks (MSB)
  quick('sbm-cold-brew', 'starbucks-msb', 'Cold Brew (Grande)', {
    station: 'Coffee',
    category: 'Drinks',
    periods: DAYTIME,
    calories: 5,
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),
  quick('sbm-oatmeal', 'starbucks-msb', 'Rolled & Steel-Cut Oatmeal', {
    station: 'Food',
    category: 'Entrées',
    periods: DAYTIME,
    calories: 160,
    proteinG: 5,
    mayContain: ['wheat'],
    tags: ['vegan', 'vegetarian', 'dairy-free'],
  }),

  // MainStreet ExpressMart
  quick('mse-trail-mix', 'mainstreet-expressmart', 'Trail Mix', {
    station: 'Snacks',
    category: 'Snacks',
    periods: ALL,
    calories: 300,
    contains: ['peanuts', 'tree-nuts'],
    mayContain: ['milk', 'soy'],
    tags: ['vegetarian'],
  }),
  quick('mse-fruit-cup', 'mainstreet-expressmart', 'Fresh Fruit Cup', {
    station: 'Grab & Go',
    category: 'Snacks',
    periods: ALL,
    calories: 90,
    tags: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  }),
  quick('mse-turkey-wrap', 'mainstreet-expressmart', 'Turkey Club Wrap', {
    station: 'Grab & Go',
    category: 'Entrées',
    periods: ALL,
    calories: 520,
    proteinG: 28,
    contains: ['wheat', 'milk', 'eggs'],
    tags: ['high-protein'],
  }),
];

export const ITEM_FIXTURES: ItemFixture[] = [...DINING_HALL_ITEMS, ...RETAIL_ITEMS];
