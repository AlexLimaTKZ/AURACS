import Phaser from "phaser";
import {
  createKaelSprite,
  updateKaelAnimation,
  type FacingDirection,
} from "@/game/kaelSprite";

export interface ShipGameSyncState {
  energy: number;
  stepId: string;
  terminalOpen: boolean;
}

export interface ShipGameOptions extends ShipGameSyncState {
  onTerminalInteract: () => void;
}

type Direction = "up" | "down" | "left" | "right";
type ActiveTerminal = "core" | "sector-b" | null;

type ControlKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const WORLD_WIDTH = 1920;
const PLAYER_SPEED = 185;

class NebulosaScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private facing: FacingDirection = "down";
  private controls?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private coreTerminal!: Phaser.GameObjects.Rectangle;
  private coreTerminalScreen!: Phaser.GameObjects.Rectangle;
  private sectorTerminal!: Phaser.GameObjects.Rectangle;
  private sectorTerminalScreen!: Phaser.GameObjects.Rectangle;
  private terminalPrompt!: Phaser.GameObjects.Text;
  private activeTerminal: ActiveTerminal = null;

  private missionText!: Phaser.GameObjects.Text;
  private zoneText!: Phaser.GameObjects.Text;
  private reactorGlow!: Phaser.GameObjects.Arc;
  private reactorCore!: Phaser.GameObjects.Arc;
  private roomLights: Phaser.GameObjects.Rectangle[] = [];
  private sectorLights: Phaser.GameObjects.Rectangle[] = [];
  private doorPanels: Phaser.GameObjects.Rectangle[] = [];
  private doorIndicator!: Phaser.GameObjects.Arc;
  private lifeSupportCore!: Phaser.GameObjects.Arc;
  private shieldEmitter!: Phaser.GameObjects.Arc;

  private terminalOpen = false;
  private auxiliaryPower = false;
  private sectorBUnlocked = false;
  private energy = 100;
  private stepId = "step-1";
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
    this.terminalOpen = options.terminalOpen;
    this.auxiliaryPower = this.hasAuxiliaryPower(options.stepId);
    this.sectorBUnlocked = this.isSectorBUnlocked(options.stepId);
  }

  create() {
    this.cameras.main.setBackgroundColor("#02050a");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    this.drawSpaceBackdrop();
    this.drawCoreRoom();
    this.drawConnector();
    this.drawSectorB();
    this.createReactor();
    this.createCoreTerminal();
    this.createSectorTerminal();
    this.createDoor();
    this.createSectorSystems();
    this.createPlayer();
    this.createHudLabels();
    this.setupControls();
    this.applyWorldState(false, false);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -70, 0);
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

  update(_time: number, delta: number) {
    if (!this.player || this.terminalOpen) return;

    let horizontal = 0;
    let vertical = 0;

    if (this.controls?.left.isDown || this.cursors?.left.isDown || this.virtualInput.left) horizontal -= 1;
    if (this.controls?.right.isDown || this.cursors?.right.isDown || this.virtualInput.right) horizontal += 1;
    if (this.controls?.up.isDown || this.cursors?.up.isDown || this.virtualInput.up) vertical -= 1;
    if (this.controls?.down.isDown || this.cursors?.down.isDown || this.virtualInput.down) vertical += 1;

    if (horizontal !== 0 && vertical !== 0) {
      horizontal *= Math.SQRT1_2;
      vertical *= Math.SQRT1_2;
    }

    const distance = PLAYER_SPEED * (delta / 1000);
    const nextX = Phaser.Math.Clamp(this.player.x + horizontal * distance, 72, WORLD_WIDTH - 72);
    const nextY = Phaser.Math.Clamp(this.player.y + vertical * distance, 116, GAME_HEIGHT - 76);

    if (!this.isBlocked(nextX, this.player.y)) this.player.x = nextX;
    if (!this.isBlocked(this.player.x, nextY)) this.player.y = nextY;

    const moving = horizontal !== 0 || vertical !== 0;
    if (moving) {
      if (Math.abs(horizontal) > Math.abs(vertical)) {
        this.facing = horizontal < 0 ? "left" : "right";
      } else if (vertical !== 0) {
        this.facing = vertical < 0 ? "up" : "down";
      }
    }

    updateKaelAnimation(this.player, this.facing, moving);
    this.playerShadow.setPosition(this.player.x, this.player.y + 16);
    this.playerShadow.setScale(moving ? 1.08 : 1, moving ? 0.92 : 1);

    this.updateNearbyTerminal();
    this.updateZoneLabel();
  }

  private drawSpaceBackdrop() {
    this.add.rectangle(WORLD_WIDTH / 2, GAME_HEIGHT / 2, WORLD_WIDTH, GAME_HEIGHT, 0x010409);

    for (let index = 0; index < 108; index += 1) {
      const x = 18 + ((index * 137) % (WORLD_WIDTH - 36));
      const y = 18 + ((index * 83) % 100);
      const size = index % 7 === 0 ? 2 : 1;
      this.add.circle(x, y, size, index % 5 === 0 ? 0x67e8f9 : 0xffffff, 0.55);
    }

    this.add.rectangle(480, 65, 760, 92, 0x020817, 0.98).setStrokeStyle(2, 0x0e7490, 0.25);
    this.add.rectangle(480, 65, 724, 62, 0x030712, 0.55).setStrokeStyle(1, 0x67e8f9, 0.12);

    this.add.rectangle(1440, 65, 760, 92, 0x020817, 0.98).setStrokeStyle(2, 0x7c2d12, 0.22);
    this.add.rectangle(1440, 65, 724, 62, 0x09090b, 0.7).setStrokeStyle(1, 0xf59e0b, 0.1);
  }

  private drawCoreRoom() {
    this.add.rectangle(480, 325, 850, 365, 0x07111c, 1).setStrokeStyle(3, 0x164e63, 0.8);
    this.add.rectangle(480, 327, 812, 327, 0x08131f, 1).setStrokeStyle(1, 0x22d3ee, 0.1);

    for (let x = 102; x <= 858; x += 54) {
      this.add.rectangle(x, 332, 1, 318, 0x164e63, 0.18);
    }
    for (let y = 176; y <= 466; y += 48) {
      this.add.rectangle(480, y, 812, 1, 0x164e63, 0.14);
    }

    this.add.rectangle(480, 482, 812, 22, 0x020617, 0.9).setStrokeStyle(1, 0x0e7490, 0.45);

    const lightPositions = [188, 360, 532, 704];
    this.roomLights = lightPositions.map((x) =>
      this.add.rectangle(x, 160, 94, 5, 0xef4444, 0.8)
    );

    this.add.text(93, 137, "NEBULOSA // DECK 01 // CORE", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#67e8f9",
    }).setAlpha(0.38);

    this.add.text(735, 448, "AURACS CORE LINK", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#64748b",
    }).setAlpha(0.55);
  }

  private drawConnector() {
    this.add.rectangle(960, 326, 120, 176, 0x050a12, 1).setStrokeStyle(2, 0x334155, 0.55);
    this.add.rectangle(960, 326, 106, 146, 0x0b1220, 0.95).setStrokeStyle(1, 0x475569, 0.32);
    this.add.rectangle(960, 252, 106, 5, 0xef4444, 0.55);
    this.add.rectangle(960, 400, 106, 5, 0xef4444, 0.55);
    this.add.text(932, 414, "BULKHEAD", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#64748b",
    });
  }

  private drawSectorB() {
    this.add.rectangle(1440, 325, 850, 365, 0x0b0d12, 1).setStrokeStyle(3, 0x7c2d12, 0.48);
    this.add.rectangle(1440, 327, 812, 327, 0x0f1117, 1).setStrokeStyle(1, 0xf59e0b, 0.08);

    for (let x = 1062; x <= 1818; x += 54) {
      this.add.rectangle(x, 332, 1, 318, 0x78350f, 0.12);
    }
    for (let y = 176; y <= 466; y += 48) {
      this.add.rectangle(1440, y, 812, 1, 0x78350f, 0.1);
    }

    this.add.rectangle(1440, 482, 812, 22, 0x030712, 0.9).setStrokeStyle(1, 0x92400e, 0.38);

    const lightPositions = [1148, 1320, 1492, 1664];
    this.sectorLights = lightPositions.map((x, index) =>
      this.add.rectangle(x, 160, 94, 5, index % 2 === 0 ? 0xf59e0b : 0xef4444, 0.45)
    );

    this.add.text(1052, 137, "NEBULOSA // DECK 01 // SETOR B", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#fbbf24",
    }).setAlpha(0.5);

    this.add.text(1074, 438, "LIFE SUPPORT", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#78716c",
    });
    this.add.text(1640, 438, "SHIELD CONTROL", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#78716c",
    });

    // Cabos e consoles danificados dão ao Setor B uma leitura visual distinta.
    this.add.rectangle(1230, 206, 92, 42, 0x09090b, 1).setStrokeStyle(1, 0x7c2d12, 0.5);
    this.add.rectangle(1230, 205, 62, 18, 0x1c1917, 1).setStrokeStyle(1, 0xef4444, 0.35);
    this.add.line(1212, 226, 0, 0, -22, 30, 0xf59e0b, 0.55).setLineWidth(2);
    this.add.line(1242, 226, 0, 0, 18, 36, 0xef4444, 0.5).setLineWidth(2);
  }

  private createReactor() {
    this.add.rectangle(166, 278, 128, 184, 0x030712, 0.88).setStrokeStyle(2, 0x164e63, 0.75);
    this.add.text(118, 206, "AUX POWER", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#94a3b8",
    });

    this.reactorGlow = this.add.circle(166, 300, 43, 0xef4444, 0.1).setStrokeStyle(2, 0xef4444, 0.18);
    this.reactorCore = this.add.circle(166, 300, 22, 0xef4444, 0.48).setStrokeStyle(2, 0xfca5a5, 0.55);
    this.add.circle(166, 300, 8, 0xffffff, 0.52);

    this.tweens.add({
      targets: this.reactorGlow,
      alpha: { from: 0.06, to: 0.2 },
      scale: { from: 0.92, to: 1.08 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createCoreTerminal() {
    this.coreTerminal = this.add.rectangle(704, 262, 142, 86, 0x06131f, 1).setStrokeStyle(2, 0x155e75, 0.75);
    this.add.rectangle(704, 307, 112, 14, 0x020617, 1).setStrokeStyle(1, 0x164e63, 0.7);
    this.coreTerminalScreen = this.add.rectangle(704, 251, 104, 48, 0x042f3e, 0.52).setStrokeStyle(2, 0x155e75, 0.65);
    this.add.text(669, 234, "AURACS", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#67e8f9",
    }).setAlpha(0.8);
    this.add.text(659, 257, "> CORE_TERMINAL", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#a5f3fc",
    }).setAlpha(0.55);

    this.tweens.add({
      targets: this.coreTerminalScreen,
      alpha: { from: 0.38, to: 0.68 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createSectorTerminal() {
    this.sectorTerminal = this.add.rectangle(1492, 274, 154, 94, 0x160d08, 1).setStrokeStyle(2, 0x92400e, 0.72);
    this.add.rectangle(1492, 324, 120, 14, 0x09090b, 1).setStrokeStyle(1, 0x78350f, 0.65);
    this.sectorTerminalScreen = this.add.rectangle(1492, 261, 114, 50, 0x451a03, 0.42).setStrokeStyle(2, 0xb45309, 0.6);
    this.add.text(1451, 242, "AURACS B-07", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#fbbf24",
    }).setAlpha(0.82);
    this.add.text(1444, 267, "> SYSTEM_ROUTER", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#fed7aa",
    }).setAlpha(0.58);

    this.tweens.add({
      targets: this.sectorTerminalScreen,
      alpha: { from: 0.32, to: 0.64 },
      duration: 1_180,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createDoor() {
    this.add.rectangle(930, 302, 116, 220, 0x020617, 1).setStrokeStyle(2, 0x164e63, 0.75);
    const left = this.add.rectangle(904, 302, 47, 182, 0x0f172a, 1).setStrokeStyle(1, 0x334155, 0.6);
    const right = this.add.rectangle(956, 302, 47, 182, 0x0f172a, 1).setStrokeStyle(1, 0x334155, 0.6);
    this.doorPanels = [left, right];
    this.doorIndicator = this.add.circle(930, 198, 5, 0xef4444, 0.9);
    this.add.text(900, 415, "SECTOR B", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#64748b",
    });
  }

  private createSectorSystems() {
    this.lifeSupportCore = this.add.circle(1140, 318, 28, 0x7f1d1d, 0.32).setStrokeStyle(2, 0xef4444, 0.42);
    this.add.circle(1140, 318, 11, 0xfef2f2, 0.28);
    this.add.rectangle(1140, 360, 96, 10, 0x1c1917, 1).setStrokeStyle(1, 0x7c2d12, 0.42);

    this.shieldEmitter = this.add.circle(1740, 304, 34, 0x172554, 0.18).setStrokeStyle(3, 0x1d4ed8, 0.32);
    this.add.circle(1740, 304, 14, 0x1e3a8a, 0.46).setStrokeStyle(2, 0x60a5fa, 0.42);

    this.tweens.add({
      targets: [this.lifeSupportCore, this.shieldEmitter],
      alpha: { from: 0.5, to: 0.9 },
      duration: 1_500,
      yoyo: true,
      repeat: -1,
    });
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(280, 386, 38, 13, 0x000000, 0.46).setDepth(4);
    this.player = createKaelSprite(this, 280, 370);
  }

  private createHudLabels() {
    this.missionText = this.add.text(480, 505, "LOCALIZE O TERMINAL AURACS", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#67e8f9",
      backgroundColor: "#020617dd",
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(80).setScrollFactor(0);

    this.zoneText = this.add.text(22, 22, "DECK 01 // CORE", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#94a3b8",
      backgroundColor: "#020617bb",
      padding: { x: 9, y: 6 },
    }).setDepth(80).setScrollFactor(0);

    this.terminalPrompt = this.add.text(480, 452, "[ E ] ACESSAR TERMINAL", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ecfeff",
      backgroundColor: "#083344dd",
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setVisible(false).setDepth(90).setScrollFactor(0);
  }

  private setupControls() {
    if (!this.input.keyboard) return;

    this.controls = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as ControlKeys;
    this.cursors = this.input.keyboard.createCursorKeys();
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
    if (this.player.x < 900) {
      this.zoneText.setText("DECK 01 // CORE").setColor("#94a3b8");
    } else if (this.player.x < 1030) {
      this.zoneText.setText("DECK 01 // BULKHEAD").setColor("#cbd5e1");
    } else {
      this.zoneText.setText("DECK 01 // SETOR B").setColor("#fbbf24");
    }
  }

  private tryInteract() {
    if (!this.activeTerminal || this.terminalOpen) return;

    if (this.activeTerminal === "sector-b" && !this.sectorBUnlocked) {
      this.showLocalMessage("ACESSO NEGADO // SETOR B BLOQUEADO", 0xef4444);
      return;
    }

    this.options.onTerminalInteract();
  }

  private handleVirtualInput(direction: Direction, active: boolean) {
    this.virtualInput[direction] = active;
  }

  private handleSync(state: ShipGameSyncState) {
    const hadPower = this.auxiliaryPower;
    const wasUnlocked = this.sectorBUnlocked;

    this.energy = state.energy;
    this.stepId = state.stepId;
    this.terminalOpen = state.terminalOpen;
    this.auxiliaryPower = this.hasAuxiliaryPower(state.stepId);
    this.sectorBUnlocked = this.isSectorBUnlocked(state.stepId);
    this.terminalPrompt.setVisible(Boolean(this.activeTerminal) && !this.terminalOpen);

    this.applyWorldState(!hadPower && this.auxiliaryPower, !wasUnlocked && this.sectorBUnlocked);
  }

  private applyWorldState(powerCameOnline: boolean, sectorUnlockedNow: boolean) {
    const activeColor = this.auxiliaryPower ? 0x22d3ee : 0xef4444;
    const activeCore = this.auxiliaryPower ? 0x06b6d4 : 0xef4444;

    this.roomLights.forEach((light) => light.setFillStyle(activeColor, this.auxiliaryPower ? 0.92 : 0.72));
    this.reactorCore.setFillStyle(activeCore, this.auxiliaryPower ? 0.78 : 0.42);
    this.reactorGlow.setFillStyle(activeCore, this.auxiliaryPower ? 0.16 : 0.08);

    this.doorIndicator.setFillStyle(this.sectorBUnlocked ? 0x22c55e : 0xef4444, 0.95);
    const openOffset = this.sectorBUnlocked ? 39 : 0;
    this.doorPanels[0].setX(904 - openOffset);
    this.doorPanels[1].setX(956 + openOffset);

    const branchChosen = ["step-4-shields", "step-4-life", "step-5", "step-end"].includes(this.stepId);
    const shieldsChosen = ["step-4-shields", "step-5", "step-end"].includes(this.stepId);
    const lifeChosen = this.stepId === "step-4-life";

    this.shieldEmitter.setFillStyle(shieldsChosen ? 0x1d4ed8 : 0x172554, shieldsChosen ? 0.52 : 0.18);
    this.shieldEmitter.setStrokeStyle(3, shieldsChosen ? 0x60a5fa : 0x1d4ed8, shieldsChosen ? 0.8 : 0.32);
    this.lifeSupportCore.setFillStyle(lifeChosen ? 0x16a34a : 0x7f1d1d, lifeChosen ? 0.55 : 0.32);
    this.lifeSupportCore.setStrokeStyle(2, lifeChosen ? 0x4ade80 : 0xef4444, lifeChosen ? 0.72 : 0.42);

    const sectorColor = branchChosen ? 0x22d3ee : this.sectorBUnlocked ? 0xf59e0b : 0xef4444;
    this.sectorLights.forEach((light, index) =>
      light.setFillStyle(index % 2 === 0 ? sectorColor : branchChosen ? 0x38bdf8 : sectorColor, branchChosen ? 0.7 : 0.42)
    );

    this.missionText.setText(this.getMissionText());

    if (powerCameOnline) {
      this.showLocalMessage("⚡ ENERGIA AUXILIAR ONLINE", 0x22d3ee);
      this.cameras.main.flash(260, 34, 211, 238, false);
    }

    if (sectorUnlockedNow) {
      this.showLocalMessage("✓ BULKHEAD B DESTRAVADO // EXPLORE O SETOR B", 0x22c55e);
      this.cameras.main.flash(340, 34, 197, 94, false);
    }
  }

  private getMissionText() {
    if (["step-1", "step-1-b", "step-2"].includes(this.stepId)) {
      return `ENERGIA ${this.energy}% // ACESSE O TERMINAL CENTRAL`;
    }
    if (this.stepId === "step-3") {
      return "CONFIRME A LEITURA NO TERMINAL CENTRAL";
    }
    if (this.stepId === "step-4") {
      return "SETOR B LIBERADO // ENCONTRE O TERMINAL B-07";
    }
    if (["step-4-shields", "step-4-life"].includes(this.stepId)) {
      return "ROTEAMENTO CONCLUÍDO // OBSERVE A RESPOSTA DOS SISTEMAS";
    }
    if (this.stepId === "step-5") {
      return "SETOR B // CALCULE A DISTÂNCIA SEGURA NO TERMINAL B-07";
    }
    return "CAPÍTULO 1 // SISTEMAS ESTABILIZADOS";
  }

  private showLocalMessage(message: string, color: number) {
    const banner = this.add.text(GAME_WIDTH / 2, 210, message, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      backgroundColor: "#020617ee",
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setDepth(100).setAlpha(0).setScrollFactor(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: { from: 226, to: 210 },
      duration: 320,
      yoyo: true,
      hold: 1_450,
      onComplete: () => banner.destroy(),
    });
  }

  private hasAuxiliaryPower(stepId: string) {
    return !["step-1", "step-1-b", "step-2"].includes(stepId);
  }

  private isSectorBUnlocked(stepId: string) {
    return !["step-1", "step-1-b", "step-2", "step-3"].includes(stepId);
  }

  private isBlocked(x: number, y: number) {
    const playerHalfWidth = 16;
    const playerHalfHeight = 25;

    const obstacles = [
      { left: 100, right: 230, top: 192, bottom: 382 },
      { left: 628, right: 780, top: 205, bottom: 315 },
      { left: 1068, right: 1212, top: 280, bottom: 386 },
      { left: 1410, right: 1570, top: 212, bottom: 328 },
      { left: 1696, right: 1784, top: 250, bottom: 356 },
    ];

    if (!this.sectorBUnlocked) {
      obstacles.push({ left: 884, right: 976, top: 208, bottom: 408 });
    }

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
    backgroundColor: "#02050a",
    pixelArt: true,
    antialias: false,
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
