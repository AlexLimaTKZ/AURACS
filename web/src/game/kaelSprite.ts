import Phaser from "phaser";

export type FacingDirection = "up" | "down" | "left" | "right";

export const FRAME_WIDTH = 36;
export const FRAME_HEIGHT = 50;
export const IDLE_FRAMES = 4;
export const WALK_FRAMES = 6;

const palette = {
  outline: 0x020b12,
  shadow: 0x071b26,
  suitDark: 0x093b48,
  suit: 0x0e7490,
  suitLight: 0x22d3ee,
  suitHighlight: 0x67e8f9,
  armorDark: 0x334155,
  armor: 0x94a3b8,
  armorLight: 0xe2e8f0,
  armorHighlight: 0xffffff,
  visorDark: 0x082f49,
  visor: 0x0284c7,
  visorGlow: 0x38bdf8,
  visorHighlight: 0xa5f3fc,
  visorGlint: 0xffffff,
  reactorCore: 0x06b6d4,
  reactorGlow: 0x67e8f9,
  reactorWhite: 0xffffff,
  tubeDark: 0x0f172a,
  tubeLight: 0x38bdf8,
  bootDark: 0x030712,
  boot: 0x0f172a,
  bootSole: 0x1e293b,
  warning: 0xf59e0b,
  warningGlow: 0xfef08a,
  antennaLed: 0x22c55e,
  antennaLedOff: 0x15803d,
};

type PixelDrawer = (x: number, y: number, width: number, height: number, color: number, alpha?: number) => void;

function idleTextureKey(direction: FacingDirection, frame: number) {
  return `kael-idle-${direction}-${frame}`;
}

function walkTextureKey(direction: FacingDirection, frame: number) {
  return `kael-walk-${direction}-${frame}`;
}

export function idleAnimationKey(direction: FacingDirection) {
  return `kael-anim-idle-${direction}`;
}

export function walkAnimationKey(direction: FacingDirection) {
  return `kael-anim-walk-${direction}`;
}

export function ensureKaelAssets(scene: Phaser.Scene) {
  if (scene.textures.exists(idleTextureKey("down", 0))) {
    return;
  }

  const directions: FacingDirection[] = ["down", "up", "left", "right"];

  // Gerar frames de Idle
  for (const direction of directions) {
    for (let frame = 0; frame < IDLE_FRAMES; frame += 1) {
      generateKaelFrame(scene, "idle", direction, frame);
    }
  }

  // Gerar frames de Walk
  for (const direction of directions) {
    for (let frame = 0; frame < WALK_FRAMES; frame += 1) {
      generateKaelFrame(scene, "walk", direction, frame);
    }
  }

  // Registrar animações de Idle
  for (const direction of directions) {
    const key = idleAnimationKey(direction);
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: Array.from({ length: IDLE_FRAMES }, (_, frame) => ({
          key: idleTextureKey(direction, frame),
        })),
        frameRate: 3.5,
        repeat: -1,
      });
    }
  }

  // Registrar animações de Walk
  for (const direction of directions) {
    const key = walkAnimationKey(direction);
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: Array.from({ length: WALK_FRAMES }, (_, frame) => ({
          key: walkTextureKey(direction, frame),
        })),
        frameRate: 10,
        repeat: -1,
      });
    }
  }
}

export function createKaelSprite(scene: Phaser.Scene, x: number, y: number) {
  ensureKaelAssets(scene);

  const sprite = scene.add
    .sprite(x, y, idleTextureKey("down", 0))
    .setOrigin(0.5, 0.82)
    .setScale(1.45)
    .setDepth(15);

  sprite.play(idleAnimationKey("down"));
  return sprite;
}

export function updateKaelAnimation(
  player: Phaser.GameObjects.Sprite,
  direction: FacingDirection,
  moving: boolean
) {
  const targetKey = moving ? walkAnimationKey(direction) : idleAnimationKey(direction);
  if (player.anims.currentAnim?.key !== targetKey || !player.anims.isPlaying) {
    player.play(targetKey, true);
  }
}

function generateKaelFrame(
  scene: Phaser.Scene,
  type: "idle" | "walk",
  direction: FacingDirection,
  frame: number
) {
  const graphics = scene.add.graphics().setVisible(false);
  const px: PixelDrawer = (x, y, width, height, color, alpha = 1) => {
    graphics.fillStyle(color, alpha);
    graphics.fillRect(x, y, width, height);
  };

  let stride = 0;
  let bob = 0;
  let breathBob = 0;
  let antennaBlink = false;

  if (type === "idle") {
    // Respiração suave de 1px nos frames 1 e 2
    breathBob = frame === 1 || frame === 2 ? -1 : 0;
    antennaBlink = frame === 2;
  } else {
    // Ciclo de caminhada de 6 frames: 0, 1, 2, 3, 4, 5
    // stride: perna esq frente, neutro, perna dir frente, etc.
    const strides = [0, -3, -1, 0, 3, 1];
    const bobs = [0, 1, 0, 0, 1, 0];
    stride = strides[frame] ?? 0;
    bob = bobs[frame] ?? 0;
    antennaBlink = frame % 3 === 0;
  }

  const effectiveBob = bob + breathBob;

  if (direction === "down") drawFront(px, stride, effectiveBob, antennaBlink, type === "idle" && frame >= 2);
  if (direction === "up") drawBack(px, stride, effectiveBob, antennaBlink);
  if (direction === "left") drawSide(px, stride, effectiveBob, true, antennaBlink);
  if (direction === "right") drawSide(px, stride, effectiveBob, false, antennaBlink);

  const textureName = type === "idle" ? idleTextureKey(direction, frame) : walkTextureKey(direction, frame);
  graphics.generateTexture(textureName, FRAME_WIDTH, FRAME_HEIGHT);
  graphics.destroy();
}

function drawFront(
  px: PixelDrawer,
  stride: number,
  bob: number,
  antennaBlink: boolean,
  pulseReactor: boolean
) {
  const cx = 2; // Offset central para 36px

  // Sombra sob o capacete
  px(cx + 8, 17 + bob, 18, 2, palette.shadow, 0.8);

  // --- ANTENA DO CAPACETE ---
  px(cx + 21, 1 + bob, 1, 5, palette.outline);
  px(cx + 21, 2 + bob, 1, 3, palette.armorDark);
  px(cx + 20, 0 + bob, 3, 2, antennaBlink ? palette.antennaLed : palette.antennaLedOff);

  // --- CAPACETE CHANFRADO (Beveled Helmet) ---
  // Contorno chanfrado
  px(cx + 10, 4 + bob, 14, 1, palette.outline);
  px(cx + 8, 5 + bob, 18, 1, palette.outline);
  px(cx + 7, 6 + bob, 20, 12, palette.outline);
  px(cx + 8, 18 + bob, 18, 1, palette.outline);

  // Placa de blindagem do capacete (Armor Shell com chanfro e luz)
  px(cx + 10, 5 + bob, 14, 1, palette.armorLight);
  px(cx + 8, 6 + bob, 18, 2, palette.armor);
  px(cx + 8, 8 + bob, 18, 9, palette.armor);
  px(cx + 9, 6 + bob, 16, 1, palette.armorHighlight, 0.9); // Brilho superior
  px(cx + 8, 7 + bob, 2, 8, palette.armorLight); // Realce lateral esquerdo
  px(cx + 24, 7 + bob, 2, 8, palette.armorDark); // Sombra lateral direita

  // --- VISOR DE VIDRO CURVO & REFLEXO ESPECULAR ---
  px(cx + 9, 9 + bob, 16, 7, palette.visorDark);
  px(cx + 10, 10 + bob, 14, 5, palette.visor);
  px(cx + 11, 11 + bob, 12, 3, palette.visorGlow, 0.9);

  // Reflexo de Vidro Diagonal (Specular glint)
  px(cx + 11, 10 + bob, 2, 2, palette.visorGlint, 0.95);
  px(cx + 13, 11 + bob, 2, 2, palette.visorGlint, 0.75);
  px(cx + 15, 12 + bob, 2, 2, palette.visorHighlight, 0.6);
  px(cx + 21, 10 + bob, 2, 4, palette.visorGlow, 0.5); // Reflexo HUD direito

  // Faixa de respiração/queixo
  px(cx + 12, 16 + bob, 10, 1, palette.outline);
  px(cx + 13, 16 + bob, 8, 1, palette.armorDark);

  // --- OMBREIRAS E PESCOÇO ---
  px(cx + 6, 18 + bob, 22, 4, palette.outline);
  px(cx + 7, 19 + bob, 5, 3, palette.armorLight); // Ombreira Esq
  px(cx + 22, 19 + bob, 5, 3, palette.armor); // Ombreira Dir
  px(cx + 8, 19 + bob, 3, 1, palette.suitHighlight); // Friso neon ombreira

  // --- PEITORAL & REATOR ARC ---
  px(cx + 8, 22 + bob, 18, 13, palette.outline);
  px(cx + 9, 22 + bob, 16, 12, palette.suit);
  px(cx + 9, 22 + bob, 2, 11, palette.suitLight); // Luz lateral
  px(cx + 23, 22 + bob, 2, 11, palette.suitDark); // Sombra lateral

  // Reator Arc Central
  px(cx + 15, 23 + bob, 4, 4, palette.outline);
  px(cx + 15, 23 + bob, 4, 4, pulseReactor ? palette.reactorWhite : palette.reactorGlow);
  px(cx + 16, 24 + bob, 2, 2, palette.reactorWhite);

  // Placas de armadura no abdômen
  px(cx + 11, 28 + bob, 12, 3, palette.armorDark);
  px(cx + 12, 28 + bob, 10, 2, palette.armor);
  px(cx + 13, 28 + bob, 8, 1, palette.armorLight);

  // Cinto de utilidades com fivela de aviso
  px(cx + 8, 33 + bob, 18, 3, palette.outline);
  px(cx + 9, 34 + bob, 16, 2, palette.boot);
  px(cx + 15, 34 + bob, 4, 2, palette.warning);
  px(cx + 16, 34 + bob, 2, 1, palette.warningGlow);
  px(cx + 10, 34 + bob, 2, 2, palette.armorDark); // Bolsa utilitária Esq
  px(cx + 22, 34 + bob, 2, 2, palette.armorDark); // Bolsa utilitária Dir

  // --- BRAÇOS E LUVAS ---
  // Braço Esquerdo
  const leftArmSwing = stride > 0 ? -1 : stride < 0 ? 1 : 0;
  px(cx + 4, 22 + bob + leftArmSwing, 4, 12, palette.outline);
  px(cx + 5, 23 + bob + leftArmSwing, 2, 6, palette.suitDark);
  px(cx + 4, 28 + bob + leftArmSwing, 4, 4, palette.armor); // Braçadeira
  px(cx + 5, 29 + bob + leftArmSwing, 2, 1, palette.suitHighlight); // LED braçadeira
  px(cx + 4, 32 + bob + leftArmSwing, 4, 3, palette.boot); // Luva

  // Braço Direito
  const rightArmSwing = stride > 0 ? 1 : stride < 0 ? -1 : 0;
  px(cx + 26, 22 + bob + rightArmSwing, 4, 12, palette.outline);
  px(cx + 27, 23 + bob + rightArmSwing, 2, 6, palette.suitDark);
  px(cx + 26, 28 + bob + rightArmSwing, 4, 4, palette.armor);
  px(cx + 27, 29 + bob + rightArmSwing, 2, 1, palette.suitHighlight);
  px(cx + 26, 32 + bob + rightArmSwing, 4, 3, palette.boot);

  // --- PERNAS, JOELHEIRAS E BOTAS MAGNÉTICAS ---
  const leftLegOffset = Math.min(stride, 0);
  const rightLegOffset = Math.max(stride, 0);

  // Perna Esquerda
  px(cx + 9 + leftLegOffset, 36, 7, 8, palette.outline);
  px(cx + 10 + leftLegOffset, 36, 5, 4, palette.suitDark);
  px(cx + 10 + leftLegOffset, 39, 5, 3, palette.armor); // Joelheira
  px(cx + 11 + leftLegOffset, 39, 3, 1, palette.armorLight);
  px(cx + 8 + leftLegOffset, 43, 8, 5, palette.outline); // Bota
  px(cx + 9 + leftLegOffset, 43, 6, 4, palette.boot);
  px(cx + 8 + leftLegOffset, 46, 8, 2, palette.bootSole); // Sola magnética

  // Perna Direita
  px(cx + 18 + rightLegOffset, 36, 7, 8, palette.outline);
  px(cx + 19 + rightLegOffset, 36, 5, 4, palette.suitDark);
  px(cx + 19 + rightLegOffset, 39, 5, 3, palette.armor);
  px(cx + 20 + rightLegOffset, 39, 3, 1, palette.armorLight);
  px(cx + 18 + rightLegOffset, 43, 8, 5, palette.outline);
  px(cx + 19 + rightLegOffset, 43, 6, 4, palette.boot);
  px(cx + 18 + rightLegOffset, 46, 8, 2, palette.bootSole);
}

function drawBack(
  px: PixelDrawer,
  stride: number,
  bob: number,
  antennaBlink: boolean
) {
  const cx = 2;

  // --- ANTENA DO CAPACETE ---
  px(cx + 13, 1 + bob, 1, 5, palette.outline);
  px(cx + 13, 2 + bob, 1, 3, palette.armorDark);
  px(cx + 12, 0 + bob, 3, 2, antennaBlink ? palette.antennaLed : palette.antennaLedOff);

  // --- CAPACETE TRASEIRO ---
  px(cx + 10, 4 + bob, 14, 1, palette.outline);
  px(cx + 8, 5 + bob, 18, 1, palette.outline);
  px(cx + 7, 6 + bob, 20, 12, palette.outline);
  px(cx + 8, 18 + bob, 18, 1, palette.outline);

  px(cx + 10, 5 + bob, 14, 1, palette.armorLight);
  px(cx + 8, 6 + bob, 18, 11, palette.armor);
  px(cx + 11, 7 + bob, 12, 4, palette.armorLight);
  px(cx + 11, 12 + bob, 12, 3, palette.shadow);
  px(cx + 14, 13 + bob, 6, 2, palette.visorGlow, 0.7); // Barra de status traseira do capacete

  // Tubos de conexão pescoço -> mochila
  px(cx + 9, 17 + bob, 3, 4, palette.tubeDark);
  px(cx + 22, 17 + bob, 3, 4, palette.tubeDark);

  // --- MOCHILA DE SUPORTE DE VIDA (Jetpack / O2 Tanks) ---
  px(cx + 7, 20 + bob, 20, 15, palette.outline);
  px(cx + 8, 21 + bob, 18, 13, palette.boot);

  // Tanque Esquerdo
  px(cx + 9, 22 + bob, 6, 10, palette.armorDark);
  px(cx + 10, 23 + bob, 4, 8, palette.suit);
  px(cx + 11, 24 + bob, 2, 5, palette.suitLight);
  px(cx + 11, 23 + bob, 2, 1, palette.suitHighlight); // LED Tanque O2

  // Tanque Direito
  px(cx + 19, 22 + bob, 6, 10, palette.armorDark);
  px(cx + 20, 23 + bob, 4, 8, palette.suit);
  px(cx + 21, 24 + bob, 2, 5, palette.suitLight);
  px(cx + 21, 23 + bob, 2, 1, palette.suitHighlight);

  // Núcleo de exaustão central
  px(cx + 16, 23 + bob, 2, 7, palette.shadow);
  px(cx + 16, 29 + bob, 2, 3, palette.warning);

  // Cinto e faixas
  px(cx + 8, 33 + bob, 18, 3, palette.outline);
  px(cx + 9, 34 + bob, 16, 2, palette.armor);
  px(cx + 11, 34 + bob, 12, 1, palette.armorLight);

  // Braços
  const leftArmSwing = stride > 0 ? -1 : stride < 0 ? 1 : 0;
  px(cx + 4, 22 + bob + leftArmSwing, 4, 12, palette.outline);
  px(cx + 5, 23 + bob + leftArmSwing, 2, 9, palette.suitDark);
  px(cx + 4, 32 + bob + leftArmSwing, 4, 3, palette.boot);

  const rightArmSwing = stride > 0 ? 1 : stride < 0 ? -1 : 0;
  px(cx + 26, 22 + bob + rightArmSwing, 4, 12, palette.outline);
  px(cx + 27, 23 + bob + rightArmSwing, 2, 9, palette.suitDark);
  px(cx + 26, 32 + bob + rightArmSwing, 4, 3, palette.boot);

  // Pernas
  const leftLegOffset = Math.min(stride, 0);
  const rightLegOffset = Math.max(stride, 0);

  px(cx + 9 + leftLegOffset, 36, 7, 8, palette.outline);
  px(cx + 10 + leftLegOffset, 36, 5, 6, palette.suitDark);
  px(cx + 8 + leftLegOffset, 43, 8, 5, palette.outline);
  px(cx + 9 + leftLegOffset, 43, 6, 4, palette.boot);
  px(cx + 8 + leftLegOffset, 46, 8, 2, palette.bootSole);

  px(cx + 18 + rightLegOffset, 36, 7, 8, palette.outline);
  px(cx + 19 + rightLegOffset, 36, 5, 6, palette.suitDark);
  px(cx + 18 + rightLegOffset, 43, 8, 5, palette.outline);
  px(cx + 19 + rightLegOffset, 43, 6, 4, palette.boot);
  px(cx + 18 + rightLegOffset, 46, 8, 2, palette.bootSole);
}

function drawSide(
  px: PixelDrawer,
  stride: number,
  bob: number,
  mirrorLeft: boolean,
  antennaBlink: boolean
) {
  const mirror = (x: number, width: number) => (mirrorLeft ? FRAME_WIDTH - x - width : x);
  const rect: PixelDrawer = (x, y, width, height, color, alpha = 1) =>
    px(mirror(x, width), y, width, height, color, alpha);

  const cx = 2;

  // --- ANTENA ---
  rect(cx + 16, 1 + bob, 1, 5, palette.outline);
  rect(cx + 16, 2 + bob, 1, 3, palette.armorDark);
  rect(cx + 15, 0 + bob, 3, 2, antennaBlink ? palette.antennaLed : palette.antennaLedOff);

  // --- MOCHILA LATERAL (Backpack Silhouette) ---
  rect(cx + 6, 17 + bob, 8, 17, palette.outline);
  rect(cx + 7, 18 + bob, 6, 15, palette.boot);
  rect(cx + 8, 19 + bob, 4, 11, palette.suitDark);
  rect(cx + 9, 21 + bob, 2, 5, palette.suitLight); // Luz do tanque O2

  // Tubo do capacete para a mochila
  rect(cx + 10, 15 + bob, 4, 4, palette.tubeDark);
  rect(cx + 11, 16 + bob, 2, 2, palette.tubeLight);

  // --- CAPACETE LATERAL ---
  rect(cx + 10, 4 + bob, 16, 1, palette.outline);
  rect(cx + 9, 5 + bob, 18, 1, palette.outline);
  rect(cx + 8, 6 + bob, 20, 12, palette.outline);
  rect(cx + 9, 18 + bob, 18, 1, palette.outline);

  rect(cx + 10, 5 + bob, 16, 1, palette.armorLight);
  rect(cx + 9, 6 + bob, 18, 11, palette.armor);
  rect(cx + 10, 7 + bob, 12, 2, palette.armorHighlight, 0.85);

  // Visor Lateral Curvo
  rect(cx + 18, 9 + bob, 9, 7, palette.visorDark);
  rect(cx + 19, 10 + bob, 7, 5, palette.visor);
  rect(cx + 20, 11 + bob, 5, 3, palette.visorGlow, 0.95);
  rect(cx + 21, 10 + bob, 2, 2, palette.visorGlint); // Glint diagonal
  rect(cx + 22, 12 + bob, 2, 2, palette.visorHighlight, 0.7);

  // --- TRONCO LATERAL ---
  rect(cx + 11, 19 + bob, 15, 15, palette.outline);
  rect(cx + 12, 20 + bob, 13, 13, palette.suit);
  rect(cx + 19, 21 + bob, 5, 3, palette.suitLight); // Friso no peito
  rect(cx + 22, 22 + bob, 2, 2, palette.reactorGlow); // Borda do reator

  // Cinto
  rect(cx + 11, 33 + bob, 15, 3, palette.outline);
  rect(cx + 12, 34 + bob, 13, 2, palette.warning);
  rect(cx + 18, 34 + bob, 3, 2, palette.warningGlow);

  // --- BRAÇO LATERAL COM BALANÇO ---
  const armSwing = stride === 0 ? 0 : stride > 0 ? -3 : 3;
  rect(cx + 16 + armSwing, 21 + bob, 6, 14, palette.outline);
  rect(cx + 17 + armSwing, 22 + bob, 4, 6, palette.suitDark);
  rect(cx + 16 + armSwing, 27 + bob, 6, 4, palette.armor); // Braçadeira lateral
  rect(cx + 18 + armSwing, 28 + bob, 2, 1, palette.suitHighlight);
  rect(cx + 16 + armSwing, 31 + bob, 6, 3, palette.boot); // Luva fechada

  // --- PERNAS LATERAIS ---
  const frontLeg = stride;
  const backLeg = -stride;

  // Perna Traseira
  rect(cx + 10 + backLeg, 36, 7, 9, palette.outline);
  rect(cx + 11 + backLeg, 37, 5, 6, palette.shadow);
  rect(cx + 9 + backLeg, 43, 8, 5, palette.outline);
  rect(cx + 10 + backLeg, 43, 6, 4, palette.bootDark);
  rect(cx + 9 + backLeg, 46, 8, 2, palette.bootSole);

  // Perna Frontal
  rect(cx + 17 + frontLeg, 36, 7, 9, palette.outline);
  rect(cx + 18 + frontLeg, 37, 5, 6, palette.suitDark);
  rect(cx + 19 + frontLeg, 38, 4, 3, palette.armor); // Joelheira lateral
  rect(cx + 17 + frontLeg, 43, 8, 5, palette.outline);
  rect(cx + 18 + frontLeg, 43, 6, 4, palette.boot);
  rect(cx + 17 + frontLeg, 46, 8, 2, palette.bootSole);
}

/**
 * Cria o feixe de luz dinâmico emitido pelo capacete do Kael.
 */
export function createVisorLightCone(scene: Phaser.Scene) {
  const cone = scene.add.graphics().setDepth(12);
  cone.setBlendMode(Phaser.BlendModes.ADD);
  return cone;
}

/**
 * Atualiza a posição, orientação e intensidade do cone de luz volumétrico do visor.
 */
export function updateVisorLightCone(
  cone: Phaser.GameObjects.Graphics,
  playerX: number,
  playerY: number,
  direction: FacingDirection,
  visible = true
) {
  cone.clear();
  if (!visible) return;

  const headY = playerY - 34; // Posição aproximada do visor na tela
  const headX = playerX;

  // Desenhar feixes volumétricos com múltiplos arcos aditivos
  const drawBeam = (angleDeg: number, length: number, fovDeg: number, mainColor: number) => {
    const halfFov = (fovDeg * Math.PI) / 360;
    const rad = (angleDeg * Math.PI) / 180;

    // Núcleo intenso do visor
    cone.fillStyle(0x67e8f9, 0.45);
    cone.fillCircle(headX, headY, 6);

    // Feixe volumétrico em camadas
    const layers = [
      { reach: length * 0.4, spread: halfFov * 1.2, alpha: 0.22 },
      { reach: length * 0.7, spread: halfFov * 1.0, alpha: 0.14 },
      { reach: length * 1.0, spread: halfFov * 0.8, alpha: 0.08 },
    ];

    for (const { reach, spread, alpha } of layers) {
      cone.fillStyle(mainColor, alpha);
      cone.beginPath();
      cone.moveTo(headX, headY);
      cone.arc(headX, headY, reach, rad - spread, rad + spread);
      cone.closePath();
      cone.fillPath();
    }
  };

  switch (direction) {
    case "down":
      drawBeam(90, 140, 65, 0x22d3ee);
      break;
    case "up":
      drawBeam(270, 110, 55, 0x0891b2);
      break;
    case "left":
      drawBeam(180, 160, 60, 0x22d3ee);
      break;
    case "right":
      drawBeam(0, 160, 60, 0x22d3ee);
      break;
  }
}
