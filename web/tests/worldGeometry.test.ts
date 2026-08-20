import test from "node:test";
import assert from "node:assert/strict";
import { isBlockedByShipGeometry, isInsideShip } from "../src/game/worldGeometry.ts";

test("keeps the player inside the Core while Sector B is locked", () => {
  assert.equal(isInsideShip(800, 300, false), true);
  assert.equal(isInsideShip(900, 300, false), false);
});

test("allows the connector and Sector B after unlock", () => {
  assert.equal(isInsideShip(900, 300, true), true);
  assert.equal(isInsideShip(1500, 300, true), true);
});

test("blocks known machinery collision areas", () => {
  assert.equal(isBlockedByShipGeometry(160, 270, true), true);
  assert.equal(isBlockedByShipGeometry(500, 350, true), false);
});
