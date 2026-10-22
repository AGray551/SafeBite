import type { DiningHall } from '@/api/schemas';
import blueAshCafeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/UC Blue Ash Cafe.png';
import bearcatsSocialLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Bearcats Social.png';
import campusViewCafeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Campus View Cafe.png';
import chickfilaLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Chick-fil-A.png';
import cincyGrillLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Cincy Grill.png';
import clermontCafeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Clermont Cougar Cafe.png';
import daapCafeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/DAAP Cafe.png';
import halalShackLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/The Halal Shack.png';
import marketOnMainLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Market on Main.png';
import mainStreetExpressLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Main Street Express.png';
import peiWeiLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Pei Wei.png';
import shakeSmartLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Shake Smart.png';
import stadiumViewCafeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Stadium View Cafe.png';
import starbucksLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Starbucks.png';
import teachersCafeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/Teachers Cafe.png';
import coffee86Logo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Cafes & Restaurants/The 86 Coffee Shop.png';
import centerCourtLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Dining Halls/Center Court.png';
import marketPointeLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Dining Halls/MarketPointe.png';
import onTheGreenLogo from '@/assets/dining-logos/supplied-transparent/UC_Dining_Logos_Transparent/Dining Halls/On The Green.png';

const logosByHallId: Record<string, string> = {
  '86-coffee': coffee86Logo,
  'bearcats-social': bearcatsSocialLogo,
  'blue-ash-cafe': blueAshCafeLogo,
  'campus-view': campusViewCafeLogo,
  'center-court': centerCourtLogo,
  chickfila: chickfilaLogo,
  'cincy-grill': cincyGrillLogo,
  clermont: clermontCafeLogo,
  daap: daapCafeLogo,
  'halal-shack': halalShackLogo,
  mainstreet: mainStreetExpressLogo,
  market: marketOnMainLogo,
  marketpointe: marketPointeLogo,
  'on-the-green': onTheGreenLogo,
  'pei-wei': peiWeiLogo,
  shakesmart: shakeSmartLogo,
  'stadium-view': stadiumViewCafeLogo,
  'starbucks-langsam': starbucksLogo,
  'starbucks-lindner': starbucksLogo,
  'starbucks-msb': starbucksLogo,
  teachers: teachersCafeLogo,
};

export function hasHallBrandMark(hall: DiningHall) {
  return Boolean(logosByHallId[hall.id]);
}

export function HallBrandMark({
  hall,
  size = 'card',
}: {
  hall: DiningHall;
  size?: 'card' | 'featured' | 'hero';
}) {
  const src = logosByHallId[hall.id];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${hall.name} logo`}
      className={
        size === 'hero'
          ? 'h-24 w-44 object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]'
          : size === 'featured'
            ? 'h-16 w-40 max-w-full object-contain object-left drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]'
            : 'h-11 w-20 object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]'
      }
    />
  );
}
