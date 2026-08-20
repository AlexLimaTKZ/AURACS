import Phaser from "phaser";
import {
  createKaelSprite,
  updateKaelAnimation,
  createVisorLightCone,
  updateVisorLightCone,
  type FacingDirection,
} from "@/game/kaelSprite";

export interface ShipGameSyncState {
  energy: number;
  stepId: string;
  terminalOpen: boolean;
  chapterId?: string;
  inventory?: string[];
}

export interface ShipGameOptions extends ShipGameSyncState {
  onTerminalInteract: () => void;
  onOpenChest?: () => void;
}

type Direction = "up" | "down" | "left" | "right";
type ActiveTerminal = "core" | "sector-b" | null;

type ControlKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

interface StarParticle {
  gameObj: Phaser.GameObjects.Arc;
  baseX: number;
  baseY: number;
  depthFactor: number;
}

interface ConduitPulse {
  arc: Phaser.GameObjects.Arc;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  active: boolean;
}

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const WORLD_WIDTH = 1920;
const PLAYER_SPEED = 185;

class NebulosaScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private visorLightCone!: Phaser.GameObjects.Graphics;
  private facing: FacingDirection = "down";
  private controls?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  // Terminais
  private coreTerminal!: Phaser.GameObjects.Rectangle;
  private coreTerminalScreen!: Phaser.GameObjects.Rectangle;
  private coreTerminalGlow!: Phaser.GameObjects.Rectangle;
  private sectorTerminal!: Phaser.GameObjects.Rectangle;
  private sectorTerminalScreen!: Phaser.GameObjects.Rectangle;
  private sectorTerminalGlow!: Phaser.GameObjects.Rectangle;
  private terminalPrompt!: Phaser.GameObjects.Text;
  private holoFloorRing!: Phaser.GameObjects.Graphics;
  private activeTerminal: ActiveTerminal = null;

  // Baú de Suprimentos (Katana de Plasma Vermelha)
  private chestGroup!: Phaser.GameObjects.Group;
  private chestLid!: Phaser.GameObjects.Rectangle;
  private chestGlow!: Phaser.GameObjects.Arc;
  private chestPrompt!: Phaser.GameObjects.Text;
  private chestBeacon!: Phaser.GameObjects.Text;
  private nearChest = false;
  private nearMonster = false;
  private hasKatana = false;

  // Inimigos do Capítulo 2 (Combate com Katana)
  private cyberMonsterContainer?: Phaser.GameObjects.Container;
  private monsterShadow?: Phaser.GameObjects.Ellipse;
  private monsterLegL?: Phaser.GameObjects.Rectangle;
  private monsterLegR?: Phaser.GameObjects.Rectangle;
  private monsterArmFront?: Phaser.GameObjects.Rectangle;
  private monsterShieldCircle?: Phaser.GameObjects.Arc;
  private monsterPromptContainer?: Phaser.GameObjects.Container;
  private monsterPromptText?: Phaser.GameObjects.Text;
  private monsterHpBarFill?: Phaser.GameObjects.Rectangle;
  private monsterHp = 100;
  private monsterWalkTime = 0;
  private monsterLastAttackTime = 0;
  private slashGraphics!: Phaser.GameObjects.Graphics;

  private zoneText!: Phaser.GameObjects.Text;
  private reactorGlow!: Phaser.GameObjects.Arc;
  private reactorGlowOuter!: Phaser.GameObjects.Arc;
  private reactorCore!: Phaser.GameObjects.Arc;
  private roomLights: Phaser.GameObjects.Rectangle[] = [];
  private sectorLights: Phaser.GameObjects.Rectangle[] = [];
  private doorPanels: Phaser.GameObjects.Rectangle[] = [];
  private doorIndicator!: Phaser.GameObjects.Arc;
  private doorGlow!: Phaser.GameObjects.Arc;
  private lifeSupportCore!: Phaser.GameObjects.Arc;
  private shieldEmitter!: Phaser.GameObjects.Arc;

  private stars: StarParticle[] = [];
  private nebulaLayer!: Phaser.GameObjects.Graphics;
  private conduitPulses: ConduitPulse[] = [];
  private stepDustParticles: Phaser.GameObjects.Arc[] = [];
  private sparkParticles: Phaser.GameObjects.Arc[] = [];
  private steamParticles: Phaser.GameObjects.Arc[] = [];
  private lastStepDustTime = 0;
  private lastSparkTime = 0;
  private lastSteamTime = 0;

  private terminalOpen = false;
  private auxiliaryPower = false;
  private sectorBUnlocked = false;
  private energy = 100;
  private stepId = "step-1";
  private chapterId = "chapter-1";
  private inventory: string[] = [];
  private virtualInput: Record<Direction, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  constructor(private readonly options: ShipGameOptions) {
    super("nebulosa-deck-01");
    this.energy = options.energy;
    this.stepId = options.stepId;
    this.chapterId = options.chapterId ?? "chapter-1";
    this.inventory = options.inventory ?? [];
    this.terminalOpen = options.terminalOpen;
    this.auxiliaryPower = this.hasAuxiliaryPower(options.stepId);
    this.sectorBUnlocked = this.isSectorBUnlocked(options.stepId);
    this.hasKatana = this.inventory.some((item) => item.toLowerCase().includes("katana"));
  }

  create() {
    this.cameras.main.setBackgroundColor("#010408");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    this.drawSpaceBackdrop();
    this.drawShipHull();
    this.drawConduits();
    this.createReactor();
    this.createCoreTerminal();
    this.createSectorTerminal();
    this.createDoor();
    this.createSectorSystems();
    this.createChest();
    this.createCyberMonster();
    this.createKatanaSlashEffect();
    this.createHoloRing();
    this.createPlayer();
    this.createParticlePools();
    this.createHudLabels();
    this.setupControls();
    this.applyWorldState(false, false);

    this.cameras.main.setZoom(1.15);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -50, 0);
    this.cameras.main.fadeIn(650, 2, 8, 15);

    this.game.events.on("auracs:sync", this.handleSync, this);
    this.game.events.on("auracs:virtual-input", this.handleVirtualInput, this);
    this.game.events.on("auracs:interact", this.tryInteract, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("auracs:sync", this.handleSync, this);
      this.game.events.off("auracs:virtual-input", this.handleVirtualInput, this);
      this.game.events.off("auracs:interact", this.tryInteract, this);
      this.input.keyboard?.off("keydown-E", this.tryInteract, this);
    });
  }

  update(time: number, delta: number) {
    this.updateParallax();
    this.updateConduitPulses(delta);
    this.updateParticleEffects(time);

    if (!this.player || this.terminalOpen) {
      updateVisorLightCone(this.visorLightCone, this.player?.x ?? 0, this.player?.y ?? 0, this.facing, false);
      return;
    }

    const up = Boolean(this.controls?.up.isDown || this.cursors?.up.isDown || this.virtualInput.up);
    const down = Boolean(this.controls?.down.isDown || this.cursors?.down.isDown || this.virtualInput.down);
    const left = Boolean(this.controls?.left.isDown || this.cursors?.left.isDown || this.virtualInput.left);
    const right = Boolean(this.controls?.right.isDown || this.cursors?.right.isDown || this.virtualInput.right);

    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    if (vx < 0) this.facing = "left";
    else if (vx > 0) this.facing = "right";
    else if (vy < 0) this.facing = "up";
    else if (vy > 0) this.facing = "down";

    const isMoving = vx !== 0 || vy !== 0;
    const dt = delta / 1000;
    const nextX = this.player.x + vx * PLAYER_SPEED * dt;
    const nextY = this.player.y + vy * PLAYER_SPEED * dt;

    if (!this.isBlocked(nextX, this.player.y)) {
      this.player.x = nextX;
    }
    if (!this.isBlocked(this.player.x, nextY)) {
      this.player.y = nextY;
    }

    this.playerShadow.setPosition(this.player.x, this.player.y + 20);

    updateKaelAnimation(this.player, this.facing, isMoving);
    updateVisorLightCone(this.visorLightCone, this.player.x, this.player.y, this.facing, true);

    if (isMoving && time - this.lastStepDustTime > 180) {
      this.lastStepDustTime = time;
      this.spawnStepDust(this.player.x, this.player.y + 18);
    }

    this.updateNearbyTerminal();
    this.updateNearbyChest();
    this.updateCyberMonster(time, delta);
    this.updateHoloRing(time);
    this.updateZoneLabel();
  }

  // --- FUNDO CÓSMICO COM PARALLAX E NEBULOSA ---
  private drawSpaceBackdrop() {
    this.stars = [];
    for (let i = 0; i < 90; i += 1) {
      const x = Phaser.Math.Between(0, WORLD_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const depthFactor = Phaser.Math.FloatBetween(0.15, 0.65);
      const radius = depthFactor > 0.45 ? 1.5 : 1;
      const color = i % 5 === 0 ? 0x67e8f9 : i % 7 === 0 ? 0xf472b6 : 0xffffff;
      const alpha = depthFactor > 0.45 ? 0.85 : 0.4;

      const star = this.add.circle(x, y, radius, color, alpha).setDepth(0).setScrollFactor(0);
      this.stars.push({ gameObj: star, baseX: x, baseY: y, depthFactor });
    }

    this.nebulaLayer = this.add.graphics().setDepth(1).setScrollFactor(0);
    this.drawNebulaGas();
  }

  private drawNebulaGas() {
    this.nebulaLayer.clear();
    this.nebulaLayer.fillStyle(0x083344, 0.22);
    this.nebulaLayer.fillCircle(240, 140, 180);
    this.nebulaLayer.fillStyle(0x3b0764, 0.18);
    this.nebulaLayer.fillCircle(720, 280, 240);
    this.nebulaLayer.fillStyle(0x0e7490, 0.15);
    this.nebulaLayer.fillCircle(1380, 160, 200);
  }

  private updateParallax() {
    const camX = this.cameras.main.scrollX;
    for (const star of this.stars) {
      const shiftedX = (star.baseX - camX * star.depthFactor) % GAME_WIDTH;
      star.gameObj.x = shiftedX < 0 ? shiftedX + GAME_WIDTH : shiftedX;
    }
  }

  // --- ESTRUTURA DO CASCO DA NAVE (DECK 01 E SETOR B) ---
  private drawShipHull() {
    const isQuarantine = this.chapterId === "chapter-2";
    const floorColor = isQuarantine ? 0x140505 : 0x07111e;
    const gridColor = isQuarantine ? 0xef4444 : 0x0891b2;
    const wallColor = isQuarantine ? 0x2a0808 : 0x0b1b2b;
    const wallBorder = isQuarantine ? 0x7f1d1d : 0x164e63;

    // 1. Piso da Sala Core (x: 60 até 860, y: 190 até 440) -> Centro: (460, 315)
    this.add.rectangle(460, 315, 800, 250, floorColor, 1).setStrokeStyle(3, gridColor, 0.35).setDepth(2);
    // Parede Superior Core
    this.add.rectangle(460, 155, 800, 70, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);
    // Parede Inferior Core (Visível)
    this.add.rectangle(460, 460, 800, 40, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);
    // Parede Esquerda Core
    this.add.rectangle(40, 315, 40, 330, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);

    // Luzes da Sala Core
    this.roomLights = [];
    for (let i = 0; i < 4; i += 1) {
      const light = this.add.rectangle(180 + i * 180, 185, 120, 6, isQuarantine ? 0xef4444 : 0x22d3ee, 0.9).setDepth(4);
      this.roomLights.push(light);
    }

    // 2. Corredor / Conector de Bulkhead (x: 860 até 1000, y: 240 até 390) -> Centro: (930, 315)
    this.add.rectangle(930, 315, 140, 150, floorColor, 1).setStrokeStyle(3, gridColor, 0.4).setDepth(2);
    // Paredes do Corredor
    this.add.rectangle(930, 205, 140, 70, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);
    this.add.rectangle(930, 425, 140, 70, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);

    // 3. Piso do Setor B (x: 1000 até 1820, y: 190 até 440) -> Centro: (1410, 315)
    const sectorFloorColor = isQuarantine ? 0x180505 : 0x0d1117;
    const sectorGridColor = isQuarantine ? 0xef4444 : 0xb45309;
    this.add.rectangle(1410, 315, 820, 250, sectorFloorColor, 1).setStrokeStyle(3, sectorGridColor, 0.4).setDepth(2);
    // Parede Superior Setor B
    this.add.rectangle(1410, 155, 820, 70, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);
    // Parede Inferior Setor B
    this.add.rectangle(1410, 460, 820, 40, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);
    // Parede Direita Setor B
    this.add.rectangle(1840, 315, 40, 330, wallColor, 1).setStrokeStyle(3, wallBorder, 0.8).setDepth(3);

    // Luzes do Setor B
    this.sectorLights = [];
    for (let i = 0; i < 4; i += 1) {
      const light = this.add.rectangle(1140 + i * 180, 185, 120, 6, isQuarantine ? 0xef4444 : 0xf59e0b, 0.75).setDepth(4);
      this.sectorLights.push(light);
    }

    // Linhas de Grade de Piso com Efeito Sci-Fi
    const floorGrid = this.add.graphics().setDepth(2);
    floorGrid.lineStyle(1, isQuarantine ? 0xef4444 : 0x0891b2, 0.15);
    for (let gx = 80; gx <= 1800; gx += 40) {
      floorGrid.lineBetween(gx, 190, gx, 440);
    }
    for (let gy = 200; gy <= 440; gy += 40) {
      floorGrid.lineBetween(80, gy, 1800, gy);
    }
  }

  private drawConduits() {
    this.conduitPulses = [
      { arc: this.add.circle(166, 290, 4, 0x22d3ee, 0.95).setDepth(6), startX: 166, startY: 290, endX: 704, endY: 290, progress: 0, speed: 0.55, active: true },
      { arc: this.add.circle(704, 290, 4, 0x22d3ee, 0.95).setDepth(6), startX: 704, startY: 290, endX: 930, endY: 290, progress: 0.3, speed: 0.55, active: true },
      { arc: this.add.circle(930, 290, 4, 0xf59e0b, 0.95).setDepth(6), startX: 930, startY: 290, endX: 1492, endY: 290, progress: 0.6, speed: 0.55, active: true },
    ];
  }

  private updateConduitPulses(delta: number) {
    const dt = delta / 1000;
    for (const pulse of this.conduitPulses) {
      pulse.progress = (pulse.progress + pulse.speed * dt) % 1;
      pulse.arc.x = Phaser.Math.Linear(pulse.startX, pulse.endX, pulse.progress);
      pulse.arc.y = Phaser.Math.Linear(pulse.startY, pulse.endY, pulse.progress);
    }
  }

  private createReactor() {
    this.add.rectangle(166, 275, 140, 130, 0x061524, 1).setStrokeStyle(3, 0x0e7490, 0.95).setDepth(10);
    this.reactorGlowOuter = this.add.circle(166, 275, 52, 0x22d3ee, 0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(10);
    this.reactorGlow = this.add.circle(166, 275, 36, 0x22d3ee, 0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(10);
    this.reactorCore = this.add.circle(166, 275, 24, 0x06b6d4, 0.95).setStrokeStyle(3, 0xe0f2fe, 1).setDepth(10);
    this.add.text(166, 325, "CORE REATOR", { fontFamily: "monospace", fontSize: "9px", color: "#67e8f9" }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: [this.reactorGlow, this.reactorGlowOuter],
      scale: { from: 0.92, to: 1.15 },
      alpha: { from: 0.15, to: 0.45 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // --- TERMINAIS COM TELEMETRIA ---
  private createCoreTerminal() {
    this.coreTerminal = this.add.rectangle(704, 255, 142, 80, 0x06131f, 1).setStrokeStyle(3, 0x155e75, 0.95).setDepth(10);
    this.add.rectangle(704, 298, 112, 12, 0x020617, 1).setStrokeStyle(1, 0x164e63, 0.9).setDepth(10);

    this.coreTerminalGlow = this.add.rectangle(704, 246, 116, 52, 0x22d3ee, 0.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(10);
    this.coreTerminalScreen = this.add.rectangle(704, 246, 104, 44, 0x042f3e, 0.95).setStrokeStyle(2, 0x22d3ee, 0.9).setDepth(10);

    this.add.text(666, 230, "AURACS TERMINAL", { fontFamily: "monospace", fontSize: "10px", color: "#67e8f9" }).setDepth(11);
    this.add.text(664, 246, "> CORE SYSTEM", { fontFamily: "monospace", fontSize: "8px", color: "#a5f3fc" }).setDepth(11);

    const telemetryBars = [0, 1, 2, 3, 4, 5].map((i) =>
      this.add.rectangle(665 + i * 14, 260, 8, 4, 0x22d3ee, 0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(11)
    );

    telemetryBars.forEach((bar, index) => {
      this.tweens.add({
        targets: bar,
        height: { from: 2, to: 8 },
        alpha: { from: 0.4, to: 0.95 },
        duration: 400 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.tweens.add({
      targets: [this.coreTerminalScreen, this.coreTerminalGlow],
      alpha: { from: 0.65, to: 1 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createSectorTerminal() {
    this.sectorTerminal = this.add.rectangle(1492, 260, 154, 86, 0x160d08, 1).setStrokeStyle(3, 0x92400e, 0.95).setDepth(10);
    this.add.rectangle(1492, 305, 120, 12, 0x09090b, 1).setStrokeStyle(1, 0x78350f, 0.9).setDepth(10);

    this.sectorTerminalGlow = this.add.rectangle(1492, 250, 126, 54, 0xf59e0b, 0.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(10);
    this.sectorTerminalScreen = this.add.rectangle(1492, 250, 114, 46, 0x451a03, 0.95).setStrokeStyle(2, 0xf59e0b, 0.9).setDepth(10);

    this.add.text(1448, 234, "ROUTER B-07", { fontFamily: "monospace", fontSize: "10px", color: "#fbbf24" }).setDepth(11);
    this.add.text(1444, 250, "> SUB-SYSTEM", { fontFamily: "monospace", fontSize: "8px", color: "#fed7aa" }).setDepth(11);

    const routerBars = [0, 1, 2, 3, 4, 5].map((i) =>
      this.add.rectangle(1450 + i * 14, 264, 8, 4, 0xf59e0b, 0.85).setBlendMode(Phaser.BlendModes.ADD).setDepth(11)
    );

    routerBars.forEach((bar, index) => {
      this.tweens.add({
        targets: bar,
        height: { from: 3, to: 7 },
        alpha: { from: 0.45, to: 0.95 },
        duration: 480 + index * 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    this.tweens.add({
      targets: [this.sectorTerminalScreen, this.sectorTerminalGlow],
      alpha: { from: 0.55, to: 0.95 },
      duration: 1180,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // --- BAÚ DE SUPRIMENTOS (KATANA DE PLASMA VERMELHA) ---
  private createChest() {
    const isCh2 = this.chapterId === "chapter-2";
    const chestX = isCh2 ? 480 : 1580;
    const chestY = 345;
    this.chestGroup = this.add.group();

    // Sombra do Baú
    const shadow = this.add.ellipse(chestX, 362, 54, 18, 0x000000, 0.6).setDepth(9);
    // Base do Baú Metálico
    const base = this.add.rectangle(chestX, chestY, 58, 32, 0x111827, 1).setStrokeStyle(2, 0xef4444, 0.9).setDepth(10);
    // Tampa do Baú
    this.chestLid = this.add.rectangle(chestX, chestY - 13, 62, 12, 0x1f2937, 1).setStrokeStyle(2, 0xf87171, 0.95).setDepth(11);
    // Fechadura de Plasma Vermelha
    const lock = this.add.circle(chestX, chestY, 6, 0xef4444, 1).setDepth(12);
    // Brilho pulsante do Baú
    this.chestGlow = this.add.circle(chestX, chestY, 28, 0xef4444, 0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(9);

    // Farol / Baliza Holográfica sobre o Baú
    this.chestBeacon = this.add
      .text(chestX, 305, "🗡️ [ BAÚ: KATANA ]", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#fca5a5",
        backgroundColor: "#450a0add",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.tweens.add({
      targets: [this.chestGlow, this.chestBeacon],
      y: { from: 305, to: 300 },
      scale: { from: 0.95, to: 1.08 },
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.chestPrompt = this.add
      .text(chestX, 275, "[ E ] ABRIR BAÚ DE SUPRIMENTOS", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fecaca",
        backgroundColor: "#7f1d1ddd",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(95)
      .setScrollFactor(0);

    this.chestGroup.addMultiple([shadow, base, this.chestLid, lock, this.chestGlow, this.chestBeacon]);
  }

  private updateNearbyChest() {
    const isCh2 = this.chapterId === "chapter-2";
    const chestX = isCh2 ? 480 : 1580;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, chestX, 345);
    this.nearChest = dist < 95 && (isCh2 || this.sectorBUnlocked);

    if (this.nearChest && !this.terminalOpen) {
      this.chestPrompt.setPosition(chestX, 275);
      this.chestPrompt.setVisible(true);
      this.chestPrompt.setText(this.hasKatana ? "✓ BAÚ ABERTO (KATANA EQUIPADA)" : "[ E ] ABRIR BAÚ DE SUPRIMENTOS");
    } else {
      this.chestPrompt.setVisible(false);
    }
  }

  // --- MONSTRO CIBERNÉTICO & COMBATE ATIVO (CAPÍTULO 2) ---
  private createCyberMonster() {
    if (this.chapterId !== "chapter-2") return;

    // Sombra do Monstro no Chão
    this.monsterShadow = this.add.ellipse(1350, 345, 60, 18, 0x000000, 0.6).setDepth(20);

    // Container do Monstro Cibernético
    const monster = this.add.container(1350, 320).setDepth(22);

    // Pernas robóticas articuladas que se movem ao andar
    this.monsterLegL = this.add.rectangle(-14, 16, 8, 22, 0x1e293b, 1).setStrokeStyle(1.5, 0xef4444, 0.9);
    this.monsterLegR = this.add.rectangle(14, 16, 8, 22, 0x1e293b, 1).setStrokeStyle(1.5, 0xef4444, 0.9);
    const clawL = this.add.rectangle(-14, 26, 14, 5, 0xef4444, 1);
    const clawR = this.add.rectangle(14, 26, 14, 5, 0xef4444, 1);

    // Torso blindado com placas metálicas e circuito de energia
    const torso = this.add.rectangle(0, 0, 50, 34, 0x090d16, 1).setStrokeStyle(2.5, 0xef4444, 0.95);
    const armorPlates = this.add.rectangle(0, -6, 42, 14, 0x1e293b, 1).setStrokeStyle(1, 0xf87171, 0.8);
    const coreGlow = this.add.circle(0, 2, 10, 0xd946ef, 0.35).setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.circle(0, 2, 5, 0xef4444, 1);

    // Cabeça cibernética ameaçadora com visor laser
    const head = this.add.rectangle(20, -10, 24, 20, 0x020617, 1).setStrokeStyle(2, 0xf43f5e, 0.95);
    const optic = this.add.rectangle(26, -10, 10, 5, 0xfde047, 1);
    const jaw = this.add.rectangle(22, -1, 18, 6, 0x334155, 1).setStrokeStyle(1, 0xef4444, 0.8);

    // Braço de Lâmina de Plasma
    this.monsterArmFront = this.add.rectangle(18, 6, 24, 7, 0x1e293b, 1).setStrokeStyle(1, 0xef4444, 0.9);
    const armBlade = this.add.rectangle(30, 6, 18, 4, 0xef4444, 1);

    // Escudo de Força Pulsante (Passo 3)
    this.monsterShieldCircle = this.add.circle(0, 0, 54, 0x06b6d4, 0.3).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);

    // Container do Código Holográfico e Barra de Vida acima do Monstro
    this.monsterPromptContainer = this.add.container(0, -52);
    const promptBg = this.add.rectangle(0, 0, 160, 28, 0x020617, 0.95).setStrokeStyle(1.5, 0xef4444, 0.95);
    this.monsterPromptText = this.add
      .text(0, 0, "[ ⚔️ katana.Cortar(); ]", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#67e8f9",
        align: "center",
      })
      .setOrigin(0.5);

    // Barra de Vida
    const hpBg = this.add.rectangle(0, -18, 90, 5, 0x1e293b, 0.9).setStrokeStyle(1, 0x475569, 0.8);
    this.monsterHpBarFill = this.add.rectangle(0, -18, 88, 3, 0x22c55e, 1);

    this.monsterPromptContainer.add([promptBg, this.monsterPromptText, hpBg, this.monsterHpBarFill]);

    monster.add([
      this.monsterLegL,
      this.monsterLegR,
      clawL,
      clawR,
      torso,
      armorPlates,
      coreGlow,
      core,
      head,
      optic,
      jaw,
      this.monsterArmFront,
      armBlade,
      this.monsterShieldCircle,
      this.monsterPromptContainer,
    ]);

    this.cyberMonsterContainer = monster;
    this.monsterHp = 100;
    this.updateMonsterTargetCode(this.stepId);
  }

  private updateCyberMonster(time: number, delta: number) {
    if (this.chapterId !== "chapter-2" || !this.cyberMonsterContainer || this.monsterHp <= 0) return;

    const monster = this.cyberMonsterContainer;
    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    const dist = Math.hypot(dx, dy);

    // Vira o monstro para olhar para o Kael
    const facingLeft = dx < 0;
    monster.setScale(facingLeft ? -1 : 1, 1);
    if (this.monsterPromptContainer) {
      this.monsterPromptContainer.setScale(facingLeft ? -1 : 1, 1);
    }

    this.nearMonster = dist < 140 && this.monsterHp > 0;

    // Caminhada contínua perseguindo o Kael
    if (dist > 52) {
      const speed = 36;
      const dt = delta / 1000;
      monster.x += (dx / dist) * speed * dt;
      monster.y += (dy / dist) * speed * dt;

      this.monsterWalkTime += delta * 0.008;
      const legOffset = Math.sin(this.monsterWalkTime) * 6;
      if (this.monsterLegL) this.monsterLegL.setY(16 + legOffset);
      if (this.monsterLegR) this.monsterLegR.setY(16 - legOffset);
      if (this.monsterArmFront) this.monsterArmFront.setRotation(Math.sin(this.monsterWalkTime) * 0.25);
      if (this.monsterShadow) this.monsterShadow.setPosition(monster.x, monster.y + 24);
    } else {
      // Alcance de ataque corpo a corpo
      if (time - this.monsterLastAttackTime > 2400) {
        this.monsterLastAttackTime = time;
        this.cameras.main.shake(180, 0.015);
        this.showLocalMessage("⚠️ HOSTIL ATACOU! DIGITE O CÓDIGO NO TERMINAL!", 0xef4444);

        this.tweens.add({
          targets: monster,
          x: monster.x + (facingLeft ? -25 : 25),
          duration: 120,
          yoyo: true,
          onComplete: () => {
            monster.x += facingLeft ? 45 : -45;
          },
        });
      }
    }
  }

  private updateMonsterTargetCode(stepId: string) {
    if (!this.monsterPromptText) return;

    if (stepId === "ch2-step-1") {
      this.monsterPromptText.setText("[ ⚠️ HOSTIL SE APROXIMANDO ]").setColor("#f87171");
      if (this.monsterHpBarFill) this.monsterHpBarFill.setSize(88, 3).setFillStyle(0x22c55e);
    } else if (stepId === "ch2-monster-1") {
      this.monsterPromptText.setText("[ ⚔️ katana.Cortar(); ]").setColor("#67e8f9");
      if (this.monsterHpBarFill) this.monsterHpBarFill.setSize(88, 3).setFillStyle(0x22c55e);
    } else if (stepId === "ch2-monster-2") {
      this.monsterPromptText.setText("[ ⚡ alvo.Vida -= 50; ]").setColor("#fde047");
      if (this.monsterHpBarFill) this.monsterHpBarFill.setSize(58, 3).setFillStyle(0xeab308);
    } else if (stepId === "ch2-monster-3") {
      this.monsterPromptText.setText("[ 🛡️ bool escudo = false; ]").setColor("#38bdf8");
      if (this.monsterShieldCircle) this.monsterShieldCircle.setVisible(true);
      if (this.monsterHpBarFill) this.monsterHpBarFill.setSize(28, 3).setFillStyle(0xef4444);
    } else if (stepId === "ch2-end") {
      this.monsterPromptText.setText("✓ HOSTIL ELIMINADO").setColor("#4ade80");
      if (this.monsterHpBarFill) this.monsterHpBarFill.setSize(0, 3);
    }
  }

  private destroyMonsterWithExplosion() {
    if (!this.cyberMonsterContainer) return;
    const mx = this.cyberMonsterContainer.x;
    const my = this.cyberMonsterContainer.y;

    this.cameras.main.shake(350, 0.025);

    for (let i = 0; i < 35; i += 1) {
      const p = this.add
        .circle(
          mx + Phaser.Math.Between(-25, 25),
          my + Phaser.Math.Between(-25, 25),
          Phaser.Math.Between(2, 5),
          i % 2 === 0 ? 0xef4444 : 0x22d3ee,
          1
        )
        .setDepth(30);
      p.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-120, 120),
        y: p.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(400, 750),
        onComplete: () => p.destroy(),
      });
    }

    this.cyberMonsterContainer.destroy();
    if (this.monsterShadow) this.monsterShadow.destroy();
  }

  private createKatanaSlashEffect() {
    this.slashGraphics = this.add.graphics().setDepth(35);
  }

  public triggerKatanaSlash(targetX: number, targetY: number) {
    this.cameras.main.shake(220, 0.018);
    this.slashGraphics.clear();
    this.slashGraphics.lineStyle(4, 0xef4444, 1);
    this.slashGraphics.lineBetween(targetX - 45, targetY - 40, targetX + 45, targetY + 40);
    this.slashGraphics.lineStyle(2, 0xffffff, 0.9);
    this.slashGraphics.lineBetween(targetX - 40, targetY - 35, targetX + 40, targetY + 35);

    for (let i = 0; i < 16; i += 1) {
      const p = this.add.circle(targetX + Phaser.Math.Between(-20, 20), targetY + Phaser.Math.Between(-20, 20), 2, 0xef4444, 1).setDepth(36);
      p.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-60, 60),
        y: p.y + Phaser.Math.Between(-60, 60),
        alpha: 0,
        scale: 0.2,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }

    this.time.delayedCall(160, () => {
      this.slashGraphics.clear();
    });
  }

  // --- PORTA DE BULKHEAD DO CORREDOR ---
  private createDoor() {
    this.add.rectangle(930, 315, 116, 150, 0x020617, 1).setStrokeStyle(2, 0x164e63, 0.95).setDepth(10);
    const left = this.add.rectangle(904, 315, 47, 140, 0x0f172a, 1).setStrokeStyle(1, 0x334155, 0.9).setDepth(10);
    const right = this.add.rectangle(956, 315, 47, 140, 0x0f172a, 1).setStrokeStyle(1, 0x334155, 0.9).setDepth(10);
    this.doorPanels = [left, right];

    this.doorGlow = this.add.circle(930, 240, 14, 0xef4444, 0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
    this.doorIndicator = this.add.circle(930, 240, 5, 0xef4444, 0.95).setDepth(11);

    this.add.text(905, 375, "SECTOR B", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#94a3b8",
    }).setDepth(11);
  }

  private createSectorSystems() {
    this.lifeSupportCore = this.add
      .circle(1140, 315, 28, 0x7f1d1d, 0.6)
      .setStrokeStyle(3, 0xef4444, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(10);
    this.add.circle(1140, 315, 11, 0xfef2f2, 0.8).setDepth(10);
    this.add.rectangle(1140, 355, 96, 10, 0x1c1917, 1).setStrokeStyle(1, 0x7c2d12, 0.8).setDepth(10);

    this.shieldEmitter = this.add
      .circle(1740, 305, 34, 0x172554, 0.5)
      .setStrokeStyle(3, 0x1d4ed8, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(10);
    this.add.circle(1740, 305, 14, 0x1e3a8a, 0.8).setStrokeStyle(2, 0x60a5fa, 0.9).setDepth(10);

    this.tweens.add({
      targets: [this.lifeSupportCore, this.shieldEmitter],
      alpha: { from: 0.5, to: 0.95 },
      scale: { from: 0.95, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });
  }

  private createHoloRing() {
    this.holoFloorRing = this.add.graphics().setDepth(7).setVisible(false);
    this.holoFloorRing.setBlendMode(Phaser.BlendModes.ADD);
  }

  private updateHoloRing(time: number) {
    if (!this.activeTerminal || this.terminalOpen) {
      this.holoFloorRing.setVisible(false);
      return;
    }

    this.holoFloorRing.setVisible(true);
    this.holoFloorRing.clear();

    const targetX = this.activeTerminal === "core" ? this.coreTerminal.x : this.sectorTerminal.x;
    const targetY = (this.activeTerminal === "core" ? this.coreTerminal.y : this.sectorTerminal.y) + 54;
    const color = this.activeTerminal === "core" ? 0x22d3ee : 0xfbbf24;
    const pulse = 0.5 + 0.5 * Math.sin(time / 200);

    this.holoFloorRing.lineStyle(2, color, 0.45 + 0.35 * pulse);
    this.holoFloorRing.strokeEllipse(targetX, targetY, 70 + 8 * pulse, 34 + 4 * pulse);

    this.holoFloorRing.lineStyle(1, color, 0.25);
    this.holoFloorRing.strokeEllipse(targetX, targetY, 86, 42);
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(300, 380, 42, 14, 0x000000, 0.55).setDepth(19);
    this.player = createKaelSprite(this, 300, 360);
    this.player.setDepth(20);
    this.visorLightCone = createVisorLightCone(this);
    this.visorLightCone.setDepth(25);
  }

  private createParticlePools() {
    this.stepDustParticles = Array.from({ length: 8 }, () => {
      const p = this.add.circle(0, 0, 2, 0x67e8f9, 0.6).setVisible(false).setDepth(21);
      p.setBlendMode(Phaser.BlendModes.ADD);
      return p;
    });

    this.sparkParticles = Array.from({ length: 6 }, () => {
      const p = this.add.circle(0, 0, 1.5, 0xffffff, 0.9).setVisible(false).setDepth(25);
      p.setBlendMode(Phaser.BlendModes.ADD);
      return p;
    });

    this.steamParticles = Array.from({ length: 10 }, () => {
      const p = this.add.circle(0, 0, 4, 0xfde047, 0.4).setVisible(false).setDepth(25);
      p.setBlendMode(Phaser.BlendModes.ADD);
      return p;
    });
  }

  private spawnStepDust(x: number, y: number) {
    const p = this.stepDustParticles.find((part) => !part.visible);
    if (!p) return;

    p.setPosition(x + Phaser.Math.Between(-4, 4), y);
    p.setScale(1);
    p.setAlpha(0.6);
    p.setVisible(true);

    this.tweens.add({
      targets: p,
      scale: 2.2,
      alpha: 0,
      y: y - 4,
      duration: 350,
      onComplete: () => p.setVisible(false),
    });
  }

  private updateParticleEffects(time: number) {
    if (time - this.lastSparkTime > Phaser.Math.Between(400, 900)) {
      this.lastSparkTime = time;
      const p = this.sparkParticles.find((part) => !part.visible);
      if (p) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(15, 30);
        const sx = 166 + Math.cos(angle) * dist;
        const sy = 280 + Math.sin(angle) * dist;
        p.setPosition(sx, sy);
        p.setFillStyle(this.auxiliaryPower ? 0x67e8f9 : 0xfca5a5, 0.95);
        p.setVisible(true);

        this.tweens.add({
          targets: p,
          y: sy + Phaser.Math.Between(8, 20),
          alpha: 0,
          scale: 0.2,
          duration: 320,
          onComplete: () => p.setVisible(false),
        });
      }
    }

    if (time - this.lastSteamTime > Phaser.Math.Between(600, 1400) && this.sectorBUnlocked) {
      this.lastSteamTime = time;
      const p = this.steamParticles.find((part) => !part.visible);
      if (p) {
        const sx = 1140 + Phaser.Math.Between(-15, 15);
        const sy = 330;
        p.setPosition(sx, sy);
        p.setAlpha(0.4);
        p.setScale(1);
        p.setVisible(true);

        this.tweens.add({
          targets: p,
          y: sy - Phaser.Math.Between(25, 45),
          x: sx + Phaser.Math.Between(-10, 10),
          scale: 2.8,
          alpha: 0,
          duration: 650,
          onComplete: () => p.setVisible(false),
        });
      }
    }
  }

  private createHudLabels() {
    this.zoneText = this.add
      .text(22, 22, "DECK 01 // CORE", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#94a3b8",
        backgroundColor: "#020617bb",
        padding: { x: 9, y: 6 },
      })
      .setDepth(80)
      .setScrollFactor(0);

    this.terminalPrompt = this.add
      .text(480, 452, "[ E ] ACESSAR TERMINAL", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ecfeff",
        backgroundColor: "#083344dd",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(90)
      .setScrollFactor(0);
  }

  private setupControls() {
    if (!this.input.keyboard) return;

    this.input.keyboard.disableGlobalCapture();
    this.input.keyboard.clearCaptures();

    this.controls = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }, false) as ControlKeys;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.clearCaptures();
    this.input.keyboard.disableGlobalCapture();

    this.input.keyboard.on("keydown-E", this.tryInteract, this);
  }

  private updateNearbyTerminal() {
    const coreDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.coreTerminal.x,
      this.coreTerminal.y + 54
    );
    const sectorDistance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.sectorTerminal.x,
      this.sectorTerminal.y + 56
    );

    const previous = this.activeTerminal;
    if (coreDistance < 112) {
      this.activeTerminal = "core";
    } else if (sectorDistance < 118) {
      this.activeTerminal = "sector-b";
    } else {
      this.activeTerminal = null;
    }

    if (previous !== this.activeTerminal) {
      this.terminalPrompt.setVisible(Boolean(this.activeTerminal) && !this.terminalOpen);
    }

    this.coreTerminalScreen.setStrokeStyle(
      2,
      this.activeTerminal === "core" ? 0x67e8f9 : 0x155e75,
      this.activeTerminal === "core" ? 1 : 0.65
    );
    this.sectorTerminalScreen.setStrokeStyle(
      2,
      this.activeTerminal === "sector-b" ? 0xfbbf24 : 0xb45309,
      this.activeTerminal === "sector-b" ? 1 : 0.6
    );
  }

  private updateZoneLabel() {
    if (this.chapterId === "chapter-2") {
      this.zoneText.setText("DECK 02 // QUARENTENA").setColor("#ef4444");
      return;
    }
    if (this.player.x < 870) {
      this.zoneText.setText("DECK 01 // CORE").setColor("#94a3b8");
    } else if (this.player.x < 1010) {
      this.zoneText.setText("DECK 01 // BULKHEAD").setColor("#cbd5e1");
    } else {
      this.zoneText.setText("DECK 01 // SETOR B").setColor("#fbbf24");
    }
  }

  private tryInteract() {
    if (this.terminalOpen) return;

    if (this.nearChest) {
      this.options.onOpenChest?.();
      this.hasKatana = true;
      this.chestBeacon.setText("✓ KATANA DE PLASMA OBTIDA").setColor("#4ade80");
      this.chestLid.setY(326); // Abre a tampa do baú
      this.showLocalMessage("⚔️ KATANA DE PLASMA VERMELHA OBTIDA!", 0xef4444);
      return;
    }

    if (this.chapterId === "chapter-2" && this.nearMonster) {
      if (!this.hasKatana) {
        this.showLocalMessage("⚠️ DESARMADO! ABRA O BAÚ PARA PEGAR A KATANA!", 0xef4444);
        return;
      }
      this.showLocalMessage("🎯 MIRA TRAVADA NO HOSTIL // DIGITE O CÓDIGO!", 0x22d3ee);
      this.options.onTerminalInteract();
      return;
    }

    if (this.activeTerminal === "sector-b" && !this.sectorBUnlocked) {
      this.showLocalMessage("ACESSO NEGADO // SETOR B BLOQUEADO", 0xef4444);
      return;
    }

    if (this.activeTerminal) {
      this.options.onTerminalInteract();
    }
  }

  private handleVirtualInput(direction: Direction, active: boolean) {
    this.virtualInput[direction] = active;
  }

  private handleSync(state: ShipGameSyncState) {
    const hadPower = this.auxiliaryPower;
    const wasUnlocked = this.sectorBUnlocked;
    const previousStep = this.stepId;

    this.energy = state.energy;
    this.stepId = state.stepId;
    this.chapterId = state.chapterId ?? "chapter-1";
    this.inventory = state.inventory ?? [];
    this.hasKatana = this.inventory.some((item) => item.toLowerCase().includes("katana"));
    this.terminalOpen = state.terminalOpen;

    if (this.input.keyboard) {
      this.input.keyboard.enabled = !state.terminalOpen;
      if (!state.terminalOpen) {
        this.input.keyboard.clearCaptures();
        this.input.keyboard.disableGlobalCapture();
      }
    }
    this.auxiliaryPower = this.hasAuxiliaryPower(state.stepId);
    this.sectorBUnlocked = this.isSectorBUnlocked(state.stepId);
    this.terminalPrompt.setVisible(Boolean(this.activeTerminal) && !this.terminalOpen);

    if (this.chapterId === "chapter-2") {
      if (!this.cyberMonsterContainer && state.stepId !== "ch2-end") {
        this.createCyberMonster();
      }

      if (previousStep !== state.stepId && this.cyberMonsterContainer) {
        this.updateMonsterTargetCode(state.stepId);
        this.triggerKatanaSlash(this.cyberMonsterContainer.x, this.cyberMonsterContainer.y);

        this.tweens.add({
          targets: this.cyberMonsterContainer,
          alpha: { from: 0.3, to: 1 },
          x: this.cyberMonsterContainer.x + (this.player.x < this.cyberMonsterContainer.x ? 70 : -70),
          duration: 250,
          ease: "Back.easeOut",
        });

        if (state.stepId === "ch2-end") {
          this.monsterHp = 0;
          this.destroyMonsterWithExplosion();
        }
      }
    }

    this.applyWorldState(!hadPower && this.auxiliaryPower, !wasUnlocked && this.sectorBUnlocked);
  }

  private applyWorldState(powerCameOnline: boolean, sectorUnlockedNow: boolean) {
    const isQuarantine = this.chapterId === "chapter-2";
    const activeColor = isQuarantine ? 0xef4444 : this.auxiliaryPower ? 0x22d3ee : 0xef4444;
    const activeCore = isQuarantine ? 0xdc2626 : this.auxiliaryPower ? 0x06b6d4 : 0xef4444;

    this.roomLights.forEach((light) => light.setFillStyle(activeColor, this.auxiliaryPower || isQuarantine ? 0.95 : 0.75));
    this.reactorCore.setFillStyle(activeCore, this.auxiliaryPower ? 0.85 : 0.5);
    this.reactorGlow.setFillStyle(activeCore, this.auxiliaryPower ? 0.25 : 0.12);
    this.reactorGlowOuter.setFillStyle(activeCore, this.auxiliaryPower ? 0.14 : 0.06);

    this.doorIndicator.setFillStyle(this.sectorBUnlocked ? 0x22c55e : 0xef4444, 0.95);
    this.doorGlow.setFillStyle(this.sectorBUnlocked ? 0x22c55e : 0xef4444, 0.35);

    const openOffset = this.sectorBUnlocked ? 44 : 0;
    this.doorPanels[0].setX(904 - openOffset);
    this.doorPanels[1].setX(956 + openOffset);

    const branchChosen = ["step-4-shields", "step-4-life", "step-5", "step-end"].includes(this.stepId);
    const shieldsChosen = ["step-4-shields", "step-5", "step-end"].includes(this.stepId);
    const lifeChosen = this.stepId === "step-4-life";

    this.shieldEmitter.setFillStyle(shieldsChosen ? 0x1d4ed8 : 0x172554, shieldsChosen ? 0.6 : 0.2);
    this.shieldEmitter.setStrokeStyle(3, shieldsChosen ? 0x60a5fa : 0x1d4ed8, shieldsChosen ? 0.85 : 0.35);
    this.lifeSupportCore.setFillStyle(lifeChosen ? 0x16a34a : 0x7f1d1d, lifeChosen ? 0.65 : 0.35);
    this.lifeSupportCore.setStrokeStyle(2, lifeChosen ? 0x4ade80 : 0xef4444, lifeChosen ? 0.8 : 0.45);

    const sectorColor = isQuarantine ? 0xef4444 : branchChosen ? 0x22d3ee : this.sectorBUnlocked ? 0xf59e0b : 0xef4444;
    this.sectorLights.forEach((light, index) =>
      light.setFillStyle(
        index % 2 === 0 ? sectorColor : branchChosen ? 0x38bdf8 : sectorColor,
        branchChosen ? 0.75 : 0.45
      )
    );

    if (powerCameOnline) {
      this.showLocalMessage("⚡ ENERGIA AUXILIAR ONLINE", 0x22d3ee);
      this.cameras.main.flash(260, 34, 211, 238, false);
    }

    if (sectorUnlockedNow) {
      this.showLocalMessage("✓ BULKHEAD B DESTRAVADO // EXPLORE O SETOR B", 0x22c55e);
      this.cameras.main.flash(340, 34, 197, 94, false);
    }
  }

  private showLocalMessage(message: string, color: number) {
    const banner = this.add
      .text(GAME_WIDTH / 2, 210, message, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: `#${color.toString(16).padStart(6, "0")}`,
        backgroundColor: "#020617ee",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0)
      .setScrollFactor(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: { from: 226, to: 210 },
      duration: 320,
      yoyo: true,
      hold: 1450,
      onComplete: () => banner.destroy(),
    });
  }

  private hasAuxiliaryPower(stepId: string) {
    return !["step-1", "step-1-b", "step-2"].includes(stepId);
  }

  private isSectorBUnlocked(stepId: string) {
    return !["step-1", "step-1-b", "step-2", "step-3"].includes(stepId);
  }

  // --- LIMITAÇÃO RIGOROSA DO JOGADOR DENTRO DA NAVE ---
  private isInsideShip(x: number, y: number): boolean {
    const pWidth = 10;
    const pHeight = 12;

    // 1. Sala Core (x: 60 até 870, y: 190 até 435)
    const inCore = (
      x - pWidth >= 60 &&
      x + pWidth <= 875 &&
      y - pHeight >= 190 &&
      y + pHeight <= 435
    );

    // 2. Corredor / Conector (x: 860 até 1010, y: 205 até 425)
    const inConnector = (
      x - pWidth >= 855 &&
      x + pWidth <= 1015 &&
      y - pHeight >= 205 &&
      y + pHeight <= 425
    );

    // 3. Sala Setor B (x: 1000 até 1820, y: 190 até 435)
    const inSectorB = (
      x - pWidth >= 995 &&
      x + pWidth <= 1820 &&
      y - pHeight >= 190 &&
      y + pHeight <= 435
    );

    // Se o Setor B ainda estiver bloqueado, Kael não pode passar do ponto x = 865
    if (!this.sectorBUnlocked) {
      if (x + pWidth > 865) return false;
      return inCore;
    }

    return inCore || inConnector || inSectorB;
  }

  private isBlocked(x: number, y: number): boolean {
    // 1. Deve estar rigorosamente dentro do piso da nave
    if (!this.isInsideShip(x, y)) {
      return true;
    }

    // 2. Obstáculos físicos e máquinas
    const playerHalfWidth = 14;
    const playerHalfHeight = 16;

    const obstacles = [
      // Reator Core
      { left: 95, right: 235, top: 210, bottom: 340 },
      // Terminal Core
      { left: 635, right: 775, top: 215, bottom: 290 },
      // Terminal Setor B
      { left: 1420, right: 1565, top: 220, bottom: 295 },
      // Suporte de Vida
      { left: 1090, right: 1190, top: 285, bottom: 350 },
      // Emissor de Escudos
      { left: 1700, right: 1780, top: 270, bottom: 340 },
      // Baú de Suprimentos
      { left: 1550, right: 1610, top: 325, bottom: 365 },
    ];

    return obstacles.some(
      (obstacle) =>
        x + playerHalfWidth > obstacle.left &&
        x - playerHalfWidth < obstacle.right &&
        y + playerHalfHeight > obstacle.top &&
        y - playerHalfHeight < obstacle.bottom
    );
  }
}

export function createShipGame(parent: HTMLElement, options: ShipGameOptions) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#010408",
    pixelArt: true,
    antialias: false,
    audio: {
      noAudio: true,
    },
    input: {
      keyboard: {
        capture: [],
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [new NebulosaScene(options)],
    render: {
      antialias: false,
      roundPixels: true,
    },
  });
}
