export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const PLAYER_FOOTPRINT = { halfWidth: 10, halfHeight: 12 };
const COLLISION_FOOTPRINT = { halfWidth: 14, halfHeight: 16 };

export const SHIP_OBSTACLES: readonly Rect[] = [
  { left: 95, right: 235, top: 210, bottom: 340 },
  { left: 635, right: 775, top: 215, bottom: 290 },
  { left: 1420, right: 1565, top: 220, bottom: 295 },
  { left: 1090, right: 1190, top: 285, bottom: 350 },
  { left: 1700, right: 1780, top: 270, bottom: 340 },
  { left: 1550, right: 1610, top: 325, bottom: 365 },
];

function isInsideRect(x: number, y: number, rect: Rect, halfWidth: number, halfHeight: number): boolean {
  return (
    x - halfWidth >= rect.left &&
    x + halfWidth <= rect.right &&
    y - halfHeight >= rect.top &&
    y + halfHeight <= rect.bottom
  );
}

export function isInsideShip(x: number, y: number, sectorBUnlocked: boolean): boolean {
  const { halfWidth, halfHeight } = PLAYER_FOOTPRINT;
  const core = { left: 60, right: 875, top: 190, bottom: 435 };
  const connector = { left: 855, right: 1015, top: 205, bottom: 425 };
  const sectorB = { left: 995, right: 1820, top: 190, bottom: 435 };

  const inCore = isInsideRect(x, y, core, halfWidth, halfHeight);
  if (!sectorBUnlocked) {
    if (x + halfWidth > 865) return false;
    return inCore;
  }

  return (
    inCore ||
    isInsideRect(x, y, connector, halfWidth, halfHeight) ||
    isInsideRect(x, y, sectorB, halfWidth, halfHeight)
  );
}

export function isBlockedByShipGeometry(x: number, y: number, sectorBUnlocked: boolean): boolean {
  if (!isInsideShip(x, y, sectorBUnlocked)) {
    return true;
  }

  const { halfWidth, halfHeight } = COLLISION_FOOTPRINT;
  return SHIP_OBSTACLES.some(
    (obstacle) =>
      x + halfWidth > obstacle.left &&
      x - halfWidth < obstacle.right &&
      y + halfHeight > obstacle.top &&
      y - halfHeight < obstacle.bottom
  );
}
