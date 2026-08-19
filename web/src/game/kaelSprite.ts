import Phaser from "phaser";

export type FacingDirection = "up" | "down" | "left" | "right";

const FRAME_WIDTH = 32;
const FRAME_HEIGHT = 48;
const WALK_FRAMES = 4;

const palette = {
  outline: 0x03131d,
  shadow: 0x0b2533,
  suitDark: 0x0f4c5c,
  suit: 0x0e7490,
  suitLight: 0x22d3ee,
  armor: 0x94a3b8,
  armorLight: 0xe2e8f0,
  visor: 0x082f49,
  visorGlow: 0x67e8f9,
  skin: 0xd6a77a,
  boot: 0x07131f,
  warning: 0xf59e0b,
};

type PixelDrawer = (x: number, y: number, width: number, height: number, color: number, alpha?: number) => void;

function textureKey(direction: FacingDirection, frame: number) {
  return `kael-${direction}-${frame}`;
}

function animationKey(direction: FacingDirection) {
  return `kael-walk-${direction}`;
}

export function ensureKaelAssets(scene: Phaser.Scene) {
  if (!scene.textures.exists(textureKey("down", 0))) {
    for (const direction of ["down", "up", "left", "right"] as FacingDirection[]) {
      for (let frame = 0; frame < WALK_FRAMES; frame += 1) {
        generateKaelFrame(scene, direction, frame);
      }
    }
  }

  for (const direction of ["down", "up", "left", "right"] as FacingDirection[]) {
    const key = animationKey(direction);
    if (scene.anims.exists(key)) continue;

    scene.anims.create({
      key,
      frames: Array.from({ length: WALK_FRAMES }, (_, frame) => ({
        key: textureKey(direction, frame),
      })),
      frameRate: 9,
      repeat: -1,
    });
  }
}

export function createKaelSprite(scene: Phaser.Scene, x: number, y: number) {
  ensureKaelAssets(scene);

  return scene.add
    .sprite(x, y, textureKey("down", 0))
    .setOrigin(0.5, 0.82)
    .setScale(1.45)
    .setDepth(10);
}

export function updateKaelAnimation(
  player: Phaser.GameObjects.Sprite,
  direction: FacingDirection,
  moving: boolean
) {
  if (!moving) {
    player.anims.stop();
    player.setTexture(textureKey(direction, 0));
    return;
  }

  const key = animationKey(direction);
  if (player.anims.currentAnim?.key !== key || !player.anims.isPlaying) {
    player.play(key, true);
  }
}

function generateKaelFrame(scene: Phaser.Scene, direction: FacingDirection, frame: number) {
  const graphics = scene.add.graphics().setVisible(false);
  const px: PixelDrawer = (x, y, width, height, color, alpha = 1) => {
    graphics.fillStyle(color, alpha);
    graphics.fillRect(x, y, width, height);
  };

  const stride = frame === 1 ? -2 : frame === 3 ? 2 : 0;
  const bob = frame === 1 || frame === 3 ? 1 : 0;

  if (direction === "down") drawFront(px, stride, bob);
  if (direction === "up") drawBack(px, stride, bob);
  if (direction === "left") drawSide(px, stride, bob, false);
  if (direction === "right") drawSide(px, stride, bob, true);

  graphics.generateTexture(textureKey(direction, frame), FRAME_WIDTH, FRAME_HEIGHT);
  graphics.destroy();
}

function drawFront(px: PixelDrawer, stride: number, bob: number) {
  px(7, 17 + bob, 18, 17, palette.outline);
  px(8, 18 + bob, 16, 15, palette.shadow);

  px(9, 4 + bob, 14, 3, palette.outline);
  px(7, 7 + bob, 18, 12, palette.outline);
  px(8, 6 + bob, 16, 11, palette.armor);
  px(9, 7 + bob, 14, 4, palette.armorLight);
  px(9, 11 + bob, 14, 6, palette.visor);
  px(11, 12 + bob, 10, 3, palette.visorGlow, 0.82);
  px(12, 12 + bob, 3, 1, 0xffffff, 0.72);

  px(5, 19 + bob, 22, 5, palette.outline);
  px(6, 20 + bob, 20, 4, palette.suitDark);
  px(8, 23 + bob, 16, 14, palette.outline);
  px(9, 23 + bob, 14, 13, palette.suit);
  px(10, 24 + bob, 4, 10, palette.suitDark);
  px(15, 24 + bob, 7, 3, palette.suitLight);
  px(15, 28 + bob, 5, 2, palette.armorLight);
  px(9, 34 + bob, 14, 3, palette.outline);
  px(10, 34 + bob, 12, 2, palette.warning);

  px(4, 23 + bob, 5, 12, palette.outline);
  px(5, 24 + bob, 3, 9, palette.suitDark);
  px(23, 23 + bob, 5, 12, palette.outline);
  px(24, 24 + bob, 3, 9, palette.suitDark);
  px(5, 33 + bob, 3, 3, palette.armor);
  px(24, 33 + bob, 3, 3, palette.armor);

  px(9 + Math.min(stride, 0), 37, 7, 8, palette.outline);
  px(10 + Math.min(stride, 0), 37, 5, 6, palette.suitDark);
  px(16 + Math.max(stride, 0), 37, 7, 8, palette.outline);
  px(17 + Math.max(stride, 0), 37, 5, 6, palette.suitDark);
  px(8 + Math.min(stride, 0), 43, 8, 4, palette.boot);
  px(16 + Math.max(stride, 0), 43, 8, 4, palette.boot);
}

function drawBack(px: PixelDrawer, stride: number, bob: number) {
  px(8, 5 + bob, 16, 3, palette.outline);
  px(7, 8 + bob, 18, 11, palette.outline);
  px(8, 7 + bob, 16, 11, palette.armor);
  px(10, 8 + bob, 12, 3, palette.armorLight);
  px(10, 13 + bob, 12, 3, palette.shadow);
  px(14, 14 + bob, 4, 2, palette.visorGlow, 0.6);

  px(6, 19 + bob, 20, 17, palette.outline);
  px(7, 20 + bob, 18, 15, palette.shadow);
  px(9, 21 + bob, 14, 12, palette.suitDark);
  px(11, 23 + bob, 10, 6, palette.suit);
  px(12, 24 + bob, 3, 4, palette.suitLight);
  px(17, 24 + bob, 3, 4, palette.warning);
  px(10, 31 + bob, 12, 2, palette.armor);

  px(4, 22 + bob, 4, 13, palette.outline);
  px(5, 23 + bob, 3, 10, palette.suitDark);
  px(24, 22 + bob, 4, 13, palette.outline);
  px(24, 23 + bob, 3, 10, palette.suitDark);

  px(9 + Math.min(stride, 0), 35, 7, 10, palette.outline);
  px(10 + Math.min(stride, 0), 36, 5, 7, palette.suitDark);
  px(16 + Math.max(stride, 0), 35, 7, 10, palette.outline);
  px(17 + Math.max(stride, 0), 36, 5, 7, palette.suitDark);
  px(8 + Math.min(stride, 0), 43, 8, 4, palette.boot);
  px(16 + Math.max(stride, 0), 43, 8, 4, palette.boot);
}

function drawSide(px: PixelDrawer, stride: number, bob: number, faceRight: boolean) {
  const mirror = (x: number, width: number) => (faceRight ? FRAME_WIDTH - x - width : x);
  const rect: PixelDrawer = (x, y, width, height, color, alpha = 1) =>
    px(mirror(x, width), y, width, height, color, alpha);

  rect(7, 18 + bob, 8, 16, palette.outline);
  rect(8, 19 + bob, 6, 14, palette.shadow);
  rect(9, 5 + bob, 14, 3, palette.outline);
  rect(8, 8 + bob, 16, 11, palette.outline);
  rect(9, 7 + bob, 14, 11, palette.armor);
  rect(17, 10 + bob, 7, 6, palette.visor);
  rect(19, 11 + bob, 5, 3, palette.visorGlow, 0.88);

  rect(9, 20 + bob, 15, 16, palette.outline);
  rect(10, 21 + bob, 13, 14, palette.suit);
  rect(17, 23 + bob, 6, 3, palette.suitLight);
  rect(10, 33 + bob, 13, 3, palette.warning);

  const armSwing = stride === 0 ? 0 : stride > 0 ? -2 : 2;
  rect(20 + armSwing, 23 + bob, 5, 12, palette.outline);
  rect(21 + armSwing, 24 + bob, 3, 9, palette.suitDark);
  rect(21 + armSwing, 33 + bob, 3, 3, palette.armor);

  const frontLeg = stride;
  const backLeg = -stride;
  rect(16 + frontLeg, 36, 7, 9, palette.outline);
  rect(17 + frontLeg, 37, 5, 6, palette.suitDark);
  rect(9 + backLeg, 36, 7, 9, palette.outline);
  rect(10 + backLeg, 37, 5, 6, palette.shadow);
  rect(16 + frontLeg, 43, 8, 4, palette.boot);
  rect(8 + backLeg, 43, 8, 4, palette.boot);
}
