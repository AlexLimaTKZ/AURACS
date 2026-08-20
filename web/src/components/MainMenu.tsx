"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  BookOpen,
  Sliders,
  LogOut,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  X,
  Radio,
  Shield,
  Activity,
  Cpu,
} from "lucide-react";
import { Aura } from "./Aura";
import { useAudio } from "./AudioProvider";
import { CHAPTER_1 } from "@/lib/chapters";

interface MainMenuProps {
  hasSave: boolean;
  savedStepId: string;
  savedEnergy: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenChapters: () => void;
  onOpenAchievements: () => void;
  onResetSave: () => void;
  onExit: () => void;
}

export function MainMenu({
  hasSave,
  savedStepId,
  savedEnergy,
  unlockedAchievementsCount,
  totalAchievementsCount,
  onNewGame,
  onContinue,
  onOpenChapters,
  onOpenAchievements,
  onResetSave,
  onExit,
}: MainMenuProps) {
  const { playSfx, isMuted, toggleMute, volume, setVolume } = useAudio();
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [screenShakeEnabled, setScreenShakeEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);

  const stepInfo = CHAPTER_1.steps[savedStepId];
  const stepName = stepInfo ? `Missão ${savedStepId.replace(/^step-/, "").toUpperCase()}` : savedStepId;

  const handleButtonClick = (action: () => void) => {
    playSfx("typing");
    action();
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#02050a] px-4 py-8 text-white select-none">
      {/* Luzes cósmicas e gradientes de fundo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.14)_0%,_rgba(2,5,10,0.9)_70%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[450px] w-[450px] rounded-full bg-violet-600/10 blur-[130px]" />

      {/* Grade sutil sci-fi */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#082f4918_1px,transparent_1px),linear-gradient(to_bottom,#082f4918_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Grid Principal Responsivo com 2 Colunas */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        
        {/* COLUNA ESQUERDA: Menu de Opções & AURA (7 Colunas) */}
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left"
        >
          {/* Orbe da AURA & Badge Online */}
          <div className="mb-3 flex items-center gap-4">
            <div className="scale-90 lg:scale-100">
              <Aura state="speaking" />
            </div>
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-3 py-1 font-mono text-[11px] text-cyan-300/80 backdrop-blur-md">
                <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
                SISTEMA AURACS v1.0 ONLINE
              </div>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-white/30">
                IA de Bordo da Nebulosa
              </span>
            </div>
          </div>

          {/* Título & Logotipo */}
          <div className="mb-6">
            <h1 className="bg-gradient-to-b from-white via-cyan-100 to-cyan-400/70 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl drop-shadow-[0_0_40px_rgba(34,211,238,0.35)]">
              AURACS
            </h1>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.35em] text-cyan-300/70 sm:text-xs">
              Crônicas da Nebulosa // C# Odyssey
            </p>
          </div>

          {/* Card de Save Detectado */}
          {hasSave && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 w-full rounded-2xl border border-cyan-500/25 bg-[#061424]/85 p-4 text-left backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/80">
                  Progresso Salvo no Navegador
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                  <Zap className="h-3 w-3" />
                  {savedEnergy}% Energia
                </span>
              </div>
              <p className="mt-1.5 font-semibold text-white/90 text-sm">
                Capítulo 1 · {stepName}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                <span>Deck 01 · Nave Nebulosa</span>
                <span className="flex items-center gap-1 text-amber-400/90 font-mono">
                  <Trophy className="h-3 w-3" />
                  {unlockedAchievementsCount}/{totalAchievementsCount} Conquistas
                </span>
              </div>
            </motion.div>
          )}

          {/* Botões do Menu */}
          <div className="flex w-full flex-col gap-3">
            {/* Continuar Jogo */}
            {hasSave && (
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleButtonClick(onContinue)}
                className="group relative flex w-full items-center justify-between rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/80 to-cyan-900/60 px-6 py-4 font-mono text-sm font-semibold tracking-wider text-cyan-100 shadow-[0_0_35px_rgba(6,182,212,0.25)] backdrop-blur transition hover:border-cyan-300 hover:shadow-[0_0_50px_rgba(34,211,238,0.45)]"
              >
                <div className="flex items-center gap-3">
                  <Play className="h-4 w-4 text-cyan-300 fill-cyan-300 group-hover:animate-pulse" />
                  <span>CONTINUAR JOGO</span>
                </div>
                <span className="text-[10px] text-cyan-300/60 uppercase tracking-widest">
                  [ Retomar ]
                </span>
              </motion.button>
            )}

            {/* Novo Jogo */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                if (hasSave) {
                  setShowConfirmNewGame(true);
                } else {
                  handleButtonClick(onNewGame);
                }
              }}
              className={`group flex w-full items-center justify-between rounded-xl border px-6 py-3.5 font-mono text-sm font-semibold tracking-wider transition ${
                hasSave
                  ? "border-white/10 bg-white/[0.03] text-white/80 hover:border-cyan-400/30 hover:bg-cyan-950/30 hover:text-white"
                  : "border-cyan-400/40 bg-gradient-to-r from-cyan-950/80 to-cyan-900/60 text-cyan-100 shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:border-cyan-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 text-cyan-400" />
                <span>NOVO JOGO</span>
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                Iniciar do Zero
              </span>
            </motion.button>

            {/* Seleção de Capítulos */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleButtonClick(onOpenChapters)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-mono text-sm tracking-wider text-white/80 transition hover:border-cyan-400/30 hover:bg-cyan-950/20 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-cyan-300" />
                <span>CAPÍTULOS</span>
              </div>
              <span className="text-[10px] text-cyan-300/60 uppercase tracking-widest font-mono">
                Seleção de Fases
              </span>
            </motion.button>

            {/* Conquistas */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleButtonClick(onOpenAchievements)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-mono text-sm tracking-wider text-white/70 transition hover:border-amber-400/30 hover:bg-amber-950/20 hover:text-amber-200"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>CONQUISTAS</span>
              </div>
              <span className="text-[10px] text-amber-400/70 uppercase tracking-widest font-mono">
                {unlockedAchievementsCount}/{totalAchievementsCount} Desbloqueadas
              </span>
            </motion.button>

            {/* Configurações */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleButtonClick(() => setShowSettings(true))}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-mono text-sm tracking-wider text-white/70 transition hover:border-cyan-400/30 hover:bg-cyan-950/20 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>CONFIGURAÇÕES</span>
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                Áudio & Vídeo
              </span>
            </motion.button>

            {/* Sair */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleButtonClick(onExit)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 font-mono text-sm tracking-wider text-white/50 transition hover:border-red-400/30 hover:bg-red-950/20 hover:text-red-300"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-red-400" />
                <span>SAIR DO JOGO</span>
              </div>
              <span className="text-[10px] text-white/20 uppercase tracking-widest">
                Encerrar Sessão
              </span>
            </motion.button>
          </div>

          {/* Rodapé */}
          <div className="mt-8 flex flex-col items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 lg:items-start">
            <span>AURACS Engine · Next.js 16 · Phaser 4</span>
            <span>Aprenda C# em uma jornada de ficção científica</span>
          </div>
        </motion.div>

        {/* COLUNA DIREITA: Retrato em Alta Definição do Kael com HUD Holográfico (5 Colunas) */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
          className="relative hidden flex-col items-center justify-center lg:col-span-5 lg:flex"
        >
          {/* Brilho e aura do card */}
          <div className="pointer-events-none absolute -inset-1.5 rounded-3xl bg-gradient-to-b from-cyan-500/20 via-cyan-500/5 to-transparent blur-xl" />

          {/* Moldura do Retrato do Kael */}
          <div className="relative w-full overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#040d1a]/90 shadow-[0_0_60px_rgba(6,182,212,0.18)] backdrop-blur-2xl">
            
            {/* Imagem do Personagem Kael */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src="/images/kael_hero.jpg"
                alt="Engenheiro Kael - Oficial de Sistemas"
                fill
                priority
                className="object-cover object-center transition duration-700 hover:scale-105"
              />

              {/* Vinheta escura no rodapé da imagem para leitura perfeita */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040d1a] via-[#040d1a]/30 to-transparent" />
              
              {/* Efeito de Scanlines sutil */}
              <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,#000_3px)]" />

              {/* Tag de identificação no topo */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-black/60 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-cyan-300 backdrop-blur-md">
                  <Activity className="h-3 w-3 text-cyan-400 animate-pulse" />
                  TELEMETRIA VITAL
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-emerald-300 backdrop-blur-md">
                  <Shield className="h-2.5 w-2.5" />
                  EVA ATIVO
                </div>
              </div>
            </div>

            {/* Painel de Biometria e Ficha Técnica do Kael */}
            <div className="relative z-10 -mt-12 p-5 pt-0">
              <div className="rounded-2xl border border-cyan-400/20 bg-[#061426]/90 p-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Engenheiro Kael
                    </h3>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70">
                      Deck 01 · Oficial de Sistemas
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <Cpu className="h-4 w-4 text-cyan-300" />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 font-mono text-[9px]">
                  <div className="rounded-lg bg-black/40 p-2 text-white/60">
                    <span className="block text-[8px] text-white/30 uppercase">Reator de Peito</span>
                    <span className="text-cyan-300 font-semibold">ARC MK-IV (98%)</span>
                  </div>
                  <div className="rounded-lg bg-black/40 p-2 text-white/60">
                    <span className="block text-[8px] text-white/30 uppercase">Link Neural AURA</span>
                    <span className="text-emerald-400 font-semibold">SINCRONIZADO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* MODAL: Configurações */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-cyan-500/20 bg-[#06101c]/95 p-6 shadow-2xl backdrop-blur-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Configurações do Sistema
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-5">
                {/* Seção Áudio */}
                <div>
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-cyan-400/80">
                    Áudio & Efeitos Sonoros
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2.5">
                        {isMuted ? (
                          <VolumeX className="h-4 w-4 text-red-400" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-cyan-400" />
                        )}
                        <span className="text-xs text-white/80">Som & Música</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleMute}
                        className={`rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                          isMuted
                            ? "border border-red-500/30 bg-red-500/20 text-red-300"
                            : "border border-cyan-500/30 bg-cyan-500/20 text-cyan-200"
                        }`}
                      >
                        {isMuted ? "Mutado" : "Ativo"}
                      </button>
                    </div>

                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="mb-2 flex items-center justify-between text-xs text-white/80">
                        <span>Volume Principal</span>
                        <span className="font-mono text-cyan-400">
                          {Math.round(volume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="h-1.5 w-full appearance-none rounded-full bg-white/10 accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção Vídeo & Acessibilidade */}
                <div>
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-cyan-400/80">
                    Vídeo & Acessibilidade
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <span className="text-xs text-white/80">Tremor de Tela (Screen Shake)</span>
                      <button
                        type="button"
                        onClick={() => setScreenShakeEnabled((prev) => !prev)}
                        className={`rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                          screenShakeEnabled
                            ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                            : "border border-white/10 bg-white/5 text-white/40"
                        }`}
                      >
                        {screenShakeEnabled ? "Ligado" : "Desligado"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <span className="text-xs text-white/80">Linhas de Scanline (CRT)</span>
                      <button
                        type="button"
                        onClick={() => setScanlinesEnabled((prev) => !prev)}
                        className={`rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${
                          scanlinesEnabled
                            ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                            : "border border-white/10 bg-white/5 text-white/40"
                        }`}
                      >
                        {scanlinesEnabled ? "Ligado" : "Desligado"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seção Gerenciamento de Dados */}
                <div>
                  <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-red-400/80">
                    Dados Locais
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 py-2.5 font-mono text-xs text-red-300 hover:border-red-500/40 hover:bg-red-950/40 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Apagar Todo o Progresso Local
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-right">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl border border-cyan-400/30 bg-cyan-950/50 px-5 py-2 font-mono text-xs font-semibold text-cyan-200 hover:bg-cyan-900/60 transition"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Confirmação Novo Jogo */}
      <AnimatePresence>
        {showConfirmNewGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmNewGame(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#0f0d06]/95 p-6 shadow-2xl backdrop-blur-2xl text-left"
            >
              <h3 className="text-base font-bold text-amber-300">
                Iniciar Novo Jogo?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Você já possui um save no{" "}
                <span className="font-semibold text-white">Capítulo 1 ({stepName})</span>. Iniciar um novo jogo redefinirá a posição e a energia para o início.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmNewGame(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-white/70 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmNewGame(false);
                    onNewGame();
                  }}
                  className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 font-mono text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
                >
                  Confirmar Novo Jogo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Confirmação Reset Total */}
      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmReset(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#160606]/95 p-6 shadow-2xl backdrop-blur-2xl text-left"
            >
              <h3 className="text-base font-bold text-red-300">
                Apagar todo o progresso?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Esta ação apagará permanentemente seu progresso local e todas as conquistas desbloqueadas.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-white/70 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmReset(false);
                    setShowSettings(false);
                    onResetSave();
                  }}
                  className="rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 font-mono text-xs font-semibold text-red-200 hover:bg-red-500/30"
                >
                  Apagar Tudo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
