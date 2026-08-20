"use client";

import { motion } from "framer-motion";
import { BookOpen, Lock, Play, Zap, CheckCircle2, X, ChevronRight } from "lucide-react";

export interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  deck: string;
  mechanics: string[];
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface ChaptersModalProps {
  isOpen: boolean;
  unlockedChapters: string[];
  currentChapterId: string;
  hasKatana: boolean;
  onClose: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export function ChaptersModal({
  isOpen,
  unlockedChapters,
  currentChapterId,
  hasKatana,
  onClose,
  onSelectChapter,
}: ChaptersModalProps) {
  if (!isOpen) return null;

  const chapter2Unlocked = unlockedChapters.includes("chapter-2") || hasKatana;

  const chapters: ChapterInfo[] = [
    {
      id: "chapter-1",
      number: 1,
      title: "O Despertar",
      subtitle: "Inicialização de Sistemas & Sintaxe Básica",
      description: "Acorde na cabine da Nebulosa, restaure a energia auxiliar com variáveis inteiras, controle de console e encontre a Katana de Plasma no Setor B.",
      deck: "Deck 01 // Core & Setor B",
      mechanics: ["Variáveis int", "Console.WriteLine", "Condicionais if/else", "Exploração de Baú"],
      isUnlocked: true,
      isCompleted: chapter2Unlocked,
    },
    {
      id: "chapter-2",
      number: 2,
      title: "Setor de Quarentena",
      subtitle: "Combate C# por Digitação & Katana de Plasma",
      description: "Entidades cibernéticas hostis invadiram o Deck 02. Digite os códigos C# para desferir golpes de Katana, sobreviva com 3 vidas e elimine a Besta Blindada Alfa.",
      deck: "Deck 02 // Quarentena",
      mechanics: ["Chamadas de Métodos", "Operadores Compostos -=", "Variáveis bool", "Sistema de 3 Vidas"],
      isUnlocked: chapter2Unlocked,
      isCompleted: false,
    },
    {
      id: "chapter-3",
      number: 3,
      title: "Ponte de Comando",
      subtitle: "Navegação Estelar & Estruturas de Repetição",
      description: "Acesse a ponte de navegação principal, configure as rotas interestelares através de loops while/for e restaure as comunicações com a frota.",
      deck: "Deck 03 // Ponte Principal",
      mechanics: ["Estruturas de Loop", "Arrays & Listas", "Comunicações", "Em Breve"],
      isUnlocked: false,
      isCompleted: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-cyan-400/25 bg-[#030914]/95 shadow-[0_0_80px_rgba(6,182,212,0.2)] backdrop-blur-2xl"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5 sm:px-8 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <BookOpen className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Seleção de Capítulos
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/60">
                AURACS // Linha do Tempo da Missão
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Capítulos */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4">
          {chapters.map((chapter) => {
            const isCurrent = chapter.id === currentChapterId;

            return (
              <div
                key={chapter.id}
                className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                  chapter.isUnlocked
                    ? isCurrent
                      ? "border-cyan-400/50 bg-gradient-to-r from-cyan-950/40 via-[#061628]/80 to-[#020a14] shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                      : "border-white/10 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-white/[0.04]"
                    : "border-white/5 bg-white/[0.01] opacity-60"
                }`}
              >
                {/* Indicador de Topo */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                    <span className="text-cyan-400/80 font-bold">CAPÍTULO 0{chapter.number}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/40">{chapter.deck}</span>
                  </div>

                  {/* Status Badge */}
                  {chapter.isUnlocked ? (
                    chapter.isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Concluído
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300">
                        <Zap className="h-3 w-3" />
                        Disponível
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
                      <Lock className="h-3 w-3" />
                      Bloqueado
                    </span>
                  )}
                </div>

                {/* Título & Descrição */}
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {chapter.title}
                  <span className="block sm:inline sm:ml-2 text-xs font-normal text-slate-400 font-sans">
                    — {chapter.subtitle}
                  </span>
                </h3>
                <p className="mt-2 text-xs text-slate-300/80 leading-relaxed max-w-2xl">
                  {chapter.description}
                </p>

                {/* Tags de Mecânicas */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {chapter.mechanics.map((mech) => (
                    <span
                      key={mech}
                      className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] text-white/50"
                    >
                      {mech}
                    </span>
                  ))}
                </div>

                {/* Botão de Ação para Jogar */}
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                  <div className="text-[11px] text-white/40">
                    {!chapter.isUnlocked && "🔒 Requer conclusão da fase anterior"}
                  </div>

                  {chapter.isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectChapter(chapter.id);
                        onClose();
                      }}
                      className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/80 to-blue-900/60 px-5 py-2.5 font-mono text-xs font-semibold tracking-wider text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.2)] transition hover:border-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5 fill-current text-cyan-300" />
                      <span>{chapter.isCompleted ? "REJOGAR DO INÍCIO" : "INICIAR DO INÍCIO"}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 font-mono text-xs text-white/20 cursor-not-allowed"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>BLOQUEADO</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
