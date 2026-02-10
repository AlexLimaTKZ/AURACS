"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("auracs_tutorial_seen");
    if (!hasSeen) {
      setTimeout(() => setIsOpen(true), 1500);
    }
  }, []);

  const close = () => {
    setIsOpen(false);
    localStorage.setItem("auracs_tutorial_seen", "true");
  };

  return (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#0c0c0c] border border-emerald-500/30 w-full max-w-lg p-6 rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] relative"
                >
                    <button 
                        onClick={close}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-xl text-emerald-400 font-mono tracking-wider mb-4 border-b border-white/10 pb-2">
                        INITIALIZATION GUIDE
                    </h2>

                    <div className="space-y-4 text-sm text-white/80 leading-relaxed font-sans">
                        <p>
                            Welcome, <span className="text-cyan-400 font-bold">Operator</span>.
                        </p>
                        <ul className="space-y-2 list-disc list-inside text-white/70">
                            <li>Your mission is to guide AURA through the system.</li>
                            <li>Write valid <span className="text-yellow-400 font-mono">C# code</span> to solve puzzles.</li>
                            <li>Monitor your <span className="text-emerald-400">Energy</span> and <span className="text-red-400">System Integrity</span>.</li>
                            <li>Use <span className="bg-white/10 px-1 rounded font-mono text-xs">help</span> or <span className="bg-white/10 px-1 rounded font-mono text-xs">hint</span> if you get stuck.</li>
                        </ul>
                        <div className="pt-4 flex justify-end">
                             <button
                                onClick={close}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded font-mono text-xs tracking-widest uppercase transition-all hover:scale-105 active:scale-95"
                            >
                                Acknowledge
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
  );
}
