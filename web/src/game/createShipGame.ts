import Phaser from "phaser";

export interface ShipGameSyncState {
  energy: number;
  stepId: string;
  terminalOpen: boolean;
}

export interface ShipGameOptions extends ShipGameSyncState {
  onTerminalInteract: () => void;
}

type Direction = "up" | "down" | "left" | "right";

type ControlKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const PLAYER_SPEED = 185;

class NebulosaScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private controls?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private terminal!: Phaser.GameObjects.Rectangle;
  private terminalScreen!: Phaser.GameObjects.Rectangle;
  private terminalPrompt!: Phaser.GameObjects.Text;
  private missionText!: Phaser.GameObjects.Text;
  private reactorGlow!: Phaser.GameObjects.Arc;
  private reactorCore!: Phaser.GameObjects.Arc;
  private roomLights: Phaser.GameObjects.Rectangle[] = [];
  private doorPanels: Phaser.GameObjects.Rectangle[] = [];
  private doorIndicator!: Phaser.GameObjects.Arc;
  private nearTerminal = false;
  private terminalOpen = false;
  private powerRestored = false;
  private energy = 100;
  private virtualInput: Record<Direction, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  constructor(private readonly options: ShipGameOptions) {
    super("nebulosa-bridge");
    this.energy = options.energy;
    this.terminalOpen = options.terminalOpen;
    this.powerRestored = this.isPowerRestored(options.stepId);
  }

  create() {
    this.cameras.main.setBackgroundColor("#02050a");
    this.drawSpaceBackdrop();
    this.drawShipRoom();
    this.createReactor();
    this.createTerminal();
    this.createDoor();
    this.createPlayer();
    this.createMissionLabel();
    this.setupControls();
    this.applyWorldState(false);

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
    const nextX = Phaser.Math.Clamp(this.player.x + horizontal * distance, 72, GAME_WIDTH - 72);
    const nextY = Phaser.Math.Clamp(this.player.y + vertical * distance, 116, GAME_HEIGHT - 76);

    if (!this.isBlocked(nextX, this.player.y)) this.player.x = nextX;
    if (!this.isBlocked(this.player.x, nextY)) this.player.y = nextY;

    const moving = horizontal !== 0 || vertical !== 0;
    this.player.setRotation(moving ? Math.sin(time / 85) * 0.018 : 0);
    this.playerShadow.setPosition(this.player.x, this.player.y + 22);
    this.playerShadow.setScale(moving ? 1.08 : 1, moving ? 0.92 : 1);

    if (horizontal < 0) this.player.setScale(-1, 1);
    if (horizontal > 0) this.player.setScale(1, 1);

    const wasNearTerminal = this.nearTerminal;
    this.nearTerminal = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.terminal.x,
      this.terminal.y + 54
    ) < 112;

    if (wasNearTerminal !== this.nearTerminal) {
      this.terminalPrompt.setVisible(this.nearTerminal && !this.terminalOpen);
      this.terminalScreen.setStrokeStyle(
        2,
        this.nearTerminal ? 0x67e8f9 : 0x155e75,
        this.nearTerminal ? 1 : 0.65
      );
    }
  }

  private drawSpaceBackdrop() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x010409);

    for (let index = 0; index < 54; index += 1) {
      const x = 18 + ((index * 137) % (GAME_WIDTH - 36));
      const y = 18 + ((index * 83) % 100);
      const size = index % 7 === 0 ? 2 : 1;
      this.add.circle(x, y, size, index % 5 === 0 ? 0x67e8f9 : 0xffffff, 0.55);
    }

    this.add.rectangle(GAME_WIDTH / 2, 65, 760, 92, 0x020817, 0.98).setStrokeStyle(2, 0x0e7490, 0.25);
    this.add.rectangle(GAME_WIDTH / 2, 65, 724, 62, 0x030712, 0.55).setStrokeStyle(1, 0x67e8f9, 0.12);
  }

  private drawShipRoom() {
    this.add.rectangle(GAME_WIDTH / 2, 325, 850, 365, 0x07111c, 1).setStrokeStyle(3, 0x164e63, 0.8);
    this.add.rectangle(GAME_WIDTH / 2, 327, 812, 327, 0x08131f, 1).setStrokeStyle(1, 0x22d3ee, 0.1);

    for (let x = 102; x <= 858; x += 54) {
      this.add.rectangle(x, 332, 1, 318, 0x164e63, 0.18);
    }
    for (let y = 176; y <= 466; y += 48) {
      this.add.rectangle(GAME_WIDTH / 2, y, 812, 1, 0x164e63, 0.14);
    }

    this.add.rectangle(480, 482, 812, 22, 0x020617, 0.9).setStrokeStyle(1, 0x0e7490, 0.45);

    const lightPositions = [188, 360, 532, 704];
    this.roomLights = lightPositions.map((x) =>
      this.add.rectangle(x, 160, 94, 5, 0xef4444, 0.8)
    );

    this.add.text(93, 137, "NEBULOSA // DECK 01", {
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

  private createTerminal() {
    this.terminal = this.add.rectangle(704, 262, 142, 86, 0x06131f, 1).setStrokeStyle(2, 0x155e75, 0.75);
    this.add.rectangle(704, 307, 112, 14, 0x020617, 1).setStrokeStyle(1, 0x164e63, 0.7);
    this.terminalScreen = this.add.rectangle(704, 251, 104, 48, 0x042f3e, 0.52).setStrokeStyle(2, 0x155e75, 0.65);
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

    this.terminalPrompt = this.add.text(704, 342, "[ E ] ACESSAR TERMINAL", {
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#ecfeff",
      backgroundColor: "#083344dd",
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setVisible(false).setDepth(20);

    this.tweens.add({
      targets: this.terminalScreen,
      alpha: { from: 0.38, to: 0.68 },
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createDoor() {
    this.add.rectangle(868, 302, 116, 220, 0x020617, 1).setStrokeStyle(2, 0x164e63, 0.75);
    const left = this.add.rectangle(842, 302, 47, 182, 0x0f172a, 1).setStrokeStyle(1, 0x334155, 0.6);
    const right = this.add.rectangle(894, 302, 47, 182, 0x0f172a, 1).setStrokeStyle(1, 0x334155, 0.6);
    this.doorPanels = [left, right];
    this.doorIndicator = this.add.circle(868, 198, 5, 0xef4444, 0.9);
    this.add.text(838, 415, "SECTOR B", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#64748b",
    });
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(280, 392, 34, 13, 0x000000, 0.42).setDepth(4);

    const legs = this.add.rectangle(0, 13, 19, 15, 0x0f766e, 1).setStrokeStyle(1, 0x5eead4, 0.35);
    const torso = this.add.rectangle(0, -2, 27, 28, 0x155e75, 1).setStrokeStyle(2, 0x67e8f9, 0.55);
    const shoulder = this.add.rectangle(0, -5, 34, 8, 0x083344, 1);
    const helmet = this.add.circle(0, -24, 14, 0xdbeafe, 1).setStrokeStyle(2, 0x67e8f9, 0.9);
    const visor = this.add.rectangle(4, -24, 15, 8, 0x0f172a, 1).setStrokeStyle(1, 0x22d3ee, 0.8);
    const backpack = this.add.rectangle(-15, -3, 7, 22, 0x020617, 1).setStrokeStyle(1, 0x475569, 0.8);

    this.player = this.add.container(280, 370, [backpack, legs, torso, shoulder, helmet, visor]).setDepth(10);
    this.player.setSize(36, 54);
  }

  private createMissionLabel() {
    this.missionText = this.add.text(480, 505, "LOCALIZE O TERMINAL AURACS", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#67e8f9",
      backgroundColor: "#020617cc",
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(30);
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

  private tryInteract() {
    if (this.nearTerminal && !this.terminalOpen) {
      this.options.onTerminalInteract();
    }
  }

  private handleVirtualInput(direction: Direction, active: boolean) {
    this.virtualInput[direction] = active;
  }

  private handleSync(state: ShipGameSyncState) {
    const restoredBefore = this.powerRestored;
    this.energy = state.energy;
    this.terminalOpen = state.terminalOpen;
    this.powerRestored = this.isPowerRestored(state.stepId);
    this.terminalPrompt.setVisible(this.nearTerminal && !this.terminalOpen);
    this.applyWorldState(!restoredBefore && this.powerRestored);
  }

  private applyWorldState(celebrate: boolean) {
    const activeColor = this.powerRestored ? 0x22d3ee : 0xef4444;
    const activeCore = this.powerRestored ? 0x06b6d4 : 0xef4444;

    this.roomLights.forEach((light) => light.setFillStyle(activeColor, this.powerRestored ? 0.92 : 0.72));
    this.reactorCore.setFillStyle(activeCore, this.powerRestored ? 0.78 : 0.42);
    this.reactorGlow.setFillStyle(activeCore, this.powerRestored ? 0.16 : 0.08);
    this.doorIndicator.setFillStyle(this.powerRestored ? 0x22c55e : 0xef4444, 0.95);

    const openOffset = this.powerRestored ? 24 : 0;
    this.doorPanels[0].setX(842 - openOffset);
    this.doorPanels[1].setX(894 + openOffset);

    this.missionText.setText(
      this.powerRestored
        ? "SISTEMA RESPONDEU AO SEU CÓDIGO // SETOR B LIBERADO"
        : `ENERGIA ${this.energy}% // ACESSE O TERMINAL AURACS`
    );

    if (!celebrate) return;

    const banner = this.add.text(GAME_WIDTH / 2, 214, "⚡ AUXILIARY SYSTEM ONLINE", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#cffafe",
      backgroundColor: "#083344ee",
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setDepth(60).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: { from: 230, to: 214 },
      duration: 350,
      yoyo: true,
      hold: 1450,
      onComplete: () => banner.destroy(),
    });

    this.cameras.main.flash(380, 34, 211, 238, false);
  }

  private isPowerRestored(stepId: string) {
    return !["step-1", "step-1-b", "step-2"].includes(stepId);
  }

  private isBlocked(x: number, y: number) {
    const playerHalfWidth = 16;
    const playerHalfHeight = 25;

    const obstacles = [
      { left: 100, right: 230, top: 192, bottom: 382 },
      { left: 628, right: 780, top: 205, bottom: 315 },
      { left: 810, right: 925, top: 192, bottom: 414 },
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
