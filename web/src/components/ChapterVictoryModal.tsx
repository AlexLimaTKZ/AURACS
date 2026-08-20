"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Zap,
  Shield,
  RotateCcw,
  Home,
  CheckCircle2,
  Compass,
  Swords,
  Lock,
} from "lucide-react";
import { Aura } from "./Aura";

interface ChapterVictoryModalProps {
  energy: number;
  integrity: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  hasKatana: boolean;
  onAdvanceToChapter2: () => void;
  onReplay: () => void;
  onGoToMenu: () => void;
  onClose: () => void;
}

export function ChapterVictoryModal({
  energy,
  integrity,
  unlockedAchievementsCount,
  totalAchievementsCount,
  hasKatana,
  onAdvanceToChapter2,
  onReplay,
  onGoToMenu,
  onClose,
}: ChapterVictoryModalProps) {
  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4">
      {/* Fundo escuro com blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-lg"
      />

      {/* Cartão de Vitória */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#040d1a]/95 p-6 text-center shadow-[0_0_80px_rgba(6,182,212,0.25)] backdrop-blur-2xl sm:p-8"
      >
        {/* Efeito luminoso de topo */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[60px]" />

        {/* Orbe da AURA em celebração */}
        <div className="relative mx-auto mb-3 flex items-center justify-center">
          <Aura state="speaking" />
        </div>

        {/* Tag de Conclusão */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Capítulo 1 Concluído
        </div>

        <h2 className="mt-3 bg-gradient-to-b from-white via-cyan-100 to-cyan-300/80 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
          Sistemas Estabilizados!
        </h2>
        <p className="mt-1 text-xs text-slate-300/80 leading-relaxed sm:text-sm">
          Excelente trabalho, Kael! Com seu código C#, você restaurou a energia auxiliar e salvou a tripulação da Nebulosa.
        </p>

        {/* Grade de Estatísticas da Missão */}
        <div className="my-5 grid grid-cols-3 gap-2.5 text-left">
          {/* Energia */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Zap className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Energia
              </span>
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-white sm:text-xl">
              {energy}%
            </p>
            <span className="text-[9px] text-cyan-300/60 font-mono">Preservada</span>
          </div>

          {/* Integridade */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Shield className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Casco
              </span>
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-white sm:text-xl">
              {integrity}%
            </p>
            <span className="text-[9px] text-emerald-300/60 font-mono">Intacto</span>
          </div>

          {/* Conquistas */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Trophy className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Medalhas
              </span>
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-white sm:text-xl">
              {unlockedAchievementsCount}/{totalAchievementsCount}
            </p>
            <span className="text-[9px] text-amber-300/60 font-mono">Desbloqueadas</span>
          </div>
        </div>

        {/* Status da Katana de Plasma */}
        {!hasKatana && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-left">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Lock className="h-4 w-4" />
              <span>Fase 2 Bloqueada — Encontre a Katana de Plasma</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
              Explore o <strong className="text-white">Setor B</strong> no Deck 01 para abrir o Baú de Suprimentos e coletar sua Katana antes de avançar para a Quarentena.
            </p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col gap-2.5">
          {/* Avançar para Fase 2 OU Ir até o Baú */}
          {hasKatana ? (
            <button
              type="button"
              onClick={onAdvanceToChapter2}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-950/90 to-blue-900/80 py-3.5 font-mono text-xs font-semibold tracking-wider text-cyan-100 shadow-[0_0_35px_rgba(6,182,212,0.3)] transition hover:border-cyan-300 hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] cursor-pointer"
            >
              <Swords className="h-4 w-4 text-cyan-300" />
              <span>AVANÇAR PARA A FASE 2: COMBATE</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/90 to-red-950/80 py-3.5 font-mono text-xs font-semibold tracking-wider text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.25)] transition hover:border-amber-400 hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] cursor-pointer"
            >
              <Compass className="h-4 w-4 text-amber-300" />
              <span>IR AO SETOR B PARA ABRIR O BAÚ DA KATANA</span>
            </button>
          )}

          {/* Jogar Novamente / Continuar Explorando */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 font-mono text-xs text-white/80 transition hover:border-white/20 hover:bg-white/5"
            >
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              Explorar Deck
            </button>
            <button
              type="button"
              onClick={onReplay}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 font-mono text-xs text-white/80 transition hover:border-white/20 hover:bg-white/5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              Rejogar Fase 1
            </button>
          </div>

          {/* Menu Principal */}
          <button
            type="button"
            onClick={onGoToMenu}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent py-2 font-mono text-xs text-white/40 transition hover:text-white/70"
          >
            <Home className="h-3.5 w-3.5" />
            Voltar ao Menu Principal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
