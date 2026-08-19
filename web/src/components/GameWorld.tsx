"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, TerminalSquare } from "lucide-react";

interface GameWorldProps {
  energy: number;
  stepId: string;
  terminalOpen: boolean;
  onTerminalInteract: () => void;
}

type Direction = "up" | "down" | "left" | "right";

type GameBridge = {
  destroy: (removeCanvas?: boolean, noReturn?: boolean) => void;
  events: {
    emit: (event: string, ...args: unknown[]) => boolean;
  };
};

export function GameWorld({
  energy,
  stepId,
  terminalOpen,
  onTerminalInteract,
}: GameWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameBridge | null>(null);
  const onTerminalInteractRef = useRef(onTerminalInteract);

  useEffect(() => {
    onTerminalInteractRef.current = onTerminalInteract;
  }, [onTerminalInteract]);

  useEffect(() => {
    let cancelled = false;

    async function mountGame() {
      if (!mountRef.current || gameRef.current) return;

      const { createShipGame } = await import("@/game/createShipGame");
      if (cancelled || !mountRef.current) return;

      const game = createShipGame(mountRef.current, {
        energy,
        stepId,
        terminalOpen,
        onTerminalInteract: () => onTerminalInteractRef.current(),
      });

      gameRef.current = game;
    }

    void mountGame();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // A cena é criada uma vez; estado posterior é sincronizado pelo event bus do Phaser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    gameRef.current?.events.emit("auracs:sync", {
      energy,
      stepId,
      terminalOpen,
    });
  }, [energy, stepId, terminalOpen]);

  const setVirtualDirection = (direction: Direction, active: boolean) => {
    gameRef.current?.events.emit("auracs:virtual-input", direction, active);
  };

  const interact = () => {
    gameRef.current?.events.emit("auracs:interact");
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-cyan-400/15 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.65),0_0_80px_rgba(8,145,178,0.08)]">
      <div ref={mountRef} className="h-full w-full [&>canvas]:!h-full [&>canvas]:!w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_92%,rgba(0,0,0,0.2)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_3px)]" />

      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1.5 md:hidden">
        <div />
        <TouchButton
          label="Cima"
          onStart={() => setVirtualDirection("up", true)}
          onEnd={() => setVirtualDirection("up", false)}
        >
          <ChevronUp className="h-5 w-5" />
        </TouchButton>
        <div />
        <TouchButton
          label="Esquerda"
          onStart={() => setVirtualDirection("left", true)}
          onEnd={() => setVirtualDirection("left", false)}
        >
          <ChevronLeft className="h-5 w-5" />
        </TouchButton>
        <TouchButton
          label="Baixo"
          onStart={() => setVirtualDirection("down", true)}
          onEnd={() => setVirtualDirection("down", false)}
        >
          <ChevronDown className="h-5 w-5" />
        </TouchButton>
        <TouchButton
          label="Direita"
          onStart={() => setVirtualDirection("right", true)}
          onEnd={() => setVirtualDirection("right", false)}
        >
          <ChevronRight className="h-5 w-5" />
        </TouchButton>
      </div>

      <button
        type="button"
        onPointerDown={interact}
        aria-label="Interagir com terminal"
        className="absolute right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-950/80 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.18)] backdrop-blur md:hidden"
      >
        <TerminalSquare className="h-5 w-5" />
      </button>

      <div className="pointer-events-none absolute right-5 bottom-4 hidden rounded-lg border border-white/10 bg-black/45 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35 backdrop-blur md:block">
        WASD / SETAS · E INTERAGIR
      </div>
    </div>
  );
}

interface TouchButtonProps {
  label: string;
  onStart: () => void;
  onEnd: () => void;
  children: React.ReactNode;
}

function TouchButton({ label, onStart, onEnd, children }: TouchButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart();
      }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onPointerLeave={onEnd}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/60 text-white/70 backdrop-blur active:border-cyan-300/30 active:bg-cyan-950/70 active:text-cyan-100"
    >
      {children}
    </button>
  );
}
