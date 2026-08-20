"use client";

import { motion } from "framer-motion";
import { Skull, RotateCcw, Home, ShieldAlert } from "lucide-react";

interface GameOverModalProps {
  onRestart: () => void;
  onGoToMenu: () => void;
}

export function GameOverModal({ onRestart, onGoToMenu }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      {/* Fundo escuro com vinheta vermelha */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl"
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25)_0%,transparent_70%)]" />

      {/* Cartão de Game Over */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-red-500/40 bg-[#120404]/95 p-6 text-center shadow-[0_0_80px_rgba(239,68,68,0.35)] backdrop-blur-2xl sm:p-8"
      >
        {/* Ícone de Alarme */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/40 bg-red-950/60 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse">
          <Skull className="h-8 w-8 text-red-400" />
        </div>

        {/* Tag de Alerta */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-300">
          <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
          SINAL VITAL PERDIDO
        </div>

        <h2 className="mt-3 bg-gradient-to-b from-white via-red-100 to-red-400/80 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
          GAME OVER
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
          Kael acumulou <span className="font-semibold text-red-400">3 danos críticos</span> ao errar a sintaxe dos comandos de combate. A AURA iniciou o protocolo de ressincronização de emergência.
        </p>

        {/* Estatísticas de Derrota */}
        <div className="my-5 rounded-2xl border border-red-500/20 bg-red-950/30 p-3.5 text-left font-mono text-xs">
          <div className="flex items-center justify-between text-red-300/80">
            <span>Danos Sofridos:</span>
            <span className="font-bold text-red-400">3 / 3 (Crítico)</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-white/50 text-[11px]">
            <span>Protocolo de Recuperação:</span>
            <span className="text-cyan-300">Deck 01 (Capítulo 1)</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-950/90 to-red-900/70 py-3.5 font-mono text-xs font-semibold tracking-wider text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.3)] transition hover:border-red-400 hover:shadow-[0_0_45px_rgba(239,68,68,0.5)]"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar no Deck 01 (Tentar Novamente)
          </button>

          <button
            type="button"
            onClick={onGoToMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 font-mono text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <Home className="h-3.5 w-3.5" />
            Voltar ao Menu Principal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
