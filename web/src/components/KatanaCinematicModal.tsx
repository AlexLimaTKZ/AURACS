"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, Swords, Zap, CheckCircle2, Shield } from "lucide-react";

interface KatanaCinematicModalProps {
  onClose: () => void;
}

export function KatanaCinematicModal({ onClose }: KatanaCinematicModalProps) {
  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Fundo de Vignette Escuro com Blur Profundo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/92 backdrop-blur-2xl"
      />

      {/* Raios de Luz e Partículas Holográficas ao estilo Zelda Master Sword */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25)_0%,rgba(6,182,212,0.15)_40%,transparent_75%)]" />

      {/* Cartão Cinemático Principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 30 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[32px] border border-red-500/40 bg-[#090408]/95 shadow-[0_0_100px_rgba(239,68,68,0.4),0_0_50px_rgba(34,211,238,0.2)] backdrop-blur-3xl"
      >
        {/* Imagem Cinemática com Efeito de Luz e Zoom Suave */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3.5, ease: "easeOut" }}
            className="relative h-full w-full"
          >
            <Image
              src="/images/katana_cinematic.jpg"
              alt="Kael empunhando a Katana de Plasma"
              fill
              priority
              className="object-cover object-center"
            />
          </motion.div>

          {/* Gradientes de sobreposição cinemática */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090408] via-transparent to-black/40" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

          {/* Efeito de Feixe de Luz Vermelha no Topo */}
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-red-500/50 bg-red-950/80 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.6)] backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-red-400 animate-spin" />
            <span>ITEM LENDÁRIO ENCONTRADO</span>
            <Sparkles className="h-3.5 w-3.5 text-red-400 animate-spin" />
          </motion.div>
        </div>

        {/* Informações e Detalhes da Katana no Estilo Zelda */}
        <div className="p-6 sm:p-8 text-center relative -mt-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h2 className="bg-gradient-to-r from-red-400 via-white to-cyan-300 bg-clip-text text-2xl sm:text-4xl font-black tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              KATANA DE PLASMA RUBRO
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Lâmina de alta frequência forjada com liga de nanotubos e núcleo de plasma instável. Canaliza instruções e métodos C# diretamente através de seus fios neurais.
            </p>
          </motion.div>

          {/* Atributos da Arma */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="my-5 grid grid-cols-3 gap-3 max-w-xl mx-auto text-left font-mono text-xs"
          >
            <div className="rounded-xl border border-red-500/20 bg-red-950/30 p-3">
              <div className="flex items-center gap-1.5 text-red-400 text-[10px] uppercase">
                <Swords className="h-3.5 w-3.5" />
                <span>Tipo de Dano</span>
              </div>
              <p className="mt-1 font-bold text-white text-sm sm:text-base">Plasma 100%</p>
              <span className="text-[9px] text-red-300/60">Corte Quântico</span>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] uppercase">
                <Zap className="h-3.5 w-3.5" />
                <span>Sintaxe C#</span>
              </div>
              <p className="mt-1 font-bold text-white text-sm sm:text-base">Ativação</p>
              <span className="text-[9px] text-cyan-300/60">Via Terminal</span>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] uppercase">
                <Shield className="h-3.5 w-3.5" />
                <span>Efeito</span>
              </div>
              <p className="mt-1 font-bold text-white text-sm sm:text-base">Anti-Escudo</p>
              <span className="text-[9px] text-amber-300/60">Golpe Fatal</span>
            </div>
          </motion.div>

          {/* Botão de Conclusão da Cinemática */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="max-w-md mx-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/60 bg-gradient-to-r from-red-600 via-rose-700 to-red-900 py-4 font-mono text-xs sm:text-sm font-bold tracking-widest text-white shadow-[0_0_50px_rgba(239,68,68,0.5)] transition hover:scale-[1.02] hover:border-red-400 hover:shadow-[0_0_70px_rgba(239,68,68,0.7)] active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="h-5 w-5 text-red-200" />
              <span>EMPUNHAR A KATANA & CONTINUAR</span>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
