
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Terminal as TerminalIcon, ChevronRight, CornerDownLeft } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { useAudio } from "./AudioProvider";
import { toast } from "sonner";

export interface Log {
  id: string;
  type: "info" | "success" | "error" | "warning" | "system" | "code";
  content: string;
  timestamp: string;
}

interface TerminalProps {
  logs: Log[];
  onCommand: (cmd: string) => void;
  isTyping?: boolean;
  onClear?: () => void;
  currentHint?: string;
}

export function Terminal({ logs, onCommand, isTyping = false, onClear, currentHint }: TerminalProps) {
  const [input, setInput] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { playSfx } = useAudio();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Toast notifications for new logs
    const lastLog = logs[logs.length - 1];
    if (lastLog) {
      if (lastLog.type === "success") {
        toast.success("Sistema Atualizado", { description: lastLog.content });
        playSfx("success");
      } else if (lastLog.type === "error") {
        toast.error("Erro de Sistema", { description: lastLog.content });
        playSfx("error");
      }
    }
  }, [logs, playSfx]);

  const handleTerminalClick = () => {
    if (isMultiline) {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  };

  // Toggle multi-line mode
  const toggleMultiline = useCallback(() => {
    setIsMultiline((prev) => !prev);
    // Transfer input between modes
    setTimeout(() => {
      if (isMultiline) {
        inputRef.current?.focus();
      } else {
        textareaRef.current?.focus();
      }
    }, 50);
  }, [isMultiline]);

  // Auto-resize textarea
  const autoResize = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  const submitCommand = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistoryIndex(-1);

    // Built-in commands
    const lower = trimmed.toLowerCase();
    if (lower === "clear") { onClear?.(); setInput(""); return; }
    if (lower === "help") { onCommand("__HELP__"); setInput(""); return; }
    if (lower === "hint") { onCommand("__HINT__"); setInput(""); return; }

    onCommand(trimmed);
    setInput("");
    playSfx("typing"); // Using typing sound as generic 'enter' sound for now, or could use success if response is positive
    if (isMultiline) setIsMultiline(false);
  }, [input, isMultiline, onClear, onCommand, playSfx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCommand();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // In single-line mode: arrow up/down for history
    if (!isMultiline) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        } else {
          setHistoryIndex(-1);
          setInput("");
        }
      }
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Shift+Enter to submit in multi-line mode
    if ((e.ctrlKey || e.shiftKey) && e.key === "Enter") {
      e.preventDefault();
      submitCommand();
    }
    // Tab inserts spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = input.substring(0, start) + "    " + input.substring(end);
      setInput(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
    // Escape exits multi-line mode
    if (e.key === "Escape") {
      setIsMultiline(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const getLogColor = (type: Log["type"]) => {
    switch (type) {
      case "error": return "text-red-400";
      case "success": return "text-emerald-400";
      case "warning": return "text-amber-400";
      case "system": return "text-cyan-400";
      case "code": return "text-violet-300 font-semibold";
      case "info": return "text-slate-300";
      default: return "text-slate-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto h-[400px] md:h-[600px] flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c0c0c]/90 backdrop-blur-2xl shadow-[0_0_80px_-20px_rgba(16,185,129,0.1)]"
      onClick={handleTerminalClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-500/70" />
          <span className="text-[11px] font-mono text-white/40 tracking-[0.2em] uppercase">
            AURACS :: Terminal Uplink
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Multi-line toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleMultiline(); }}
            className={cn(
              "text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded transition-all",
              isMultiline
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-white/30 hover:text-white/50 border border-transparent"
            )}
          >
            {isMultiline ? "Multi-linha ✓" : "Multi-linha"}
          </button>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Logs Area */}
      <div
        ref={scrollRef}
        className="flex-1 px-5 py-4 overflow-y-auto font-mono text-[13px] space-y-2 scroll-smooth"
      >
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "leading-relaxed flex gap-3",
                getLogColor(log.type)
              )}
            >
              <span className="opacity-25 select-none shrink-0 text-[11px] mt-[2px]">
                {log.timestamp}
              </span>
              <span className={cn(
                log.type === "code" && "bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]",
                "whitespace-pre-wrap break-words"
              )}>
                {log.content}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-cyan-400/80 text-xs ml-14 py-2 px-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 w-fit"
          >
            <div className="relative flex gap-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
              AURA Processando
            </span>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white/[0.02] border-t border-white/[0.06]">
        {isMultiline ? (
          /* Multi-line textarea */
          <div className="px-5 py-3">
            <div className="flex items-start gap-3 w-full">
              <ChevronRight className="text-emerald-500/70 w-4 h-4 shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <CodeEditor
                    value={input}
                    onChange={(code) => {
                        setInput(code);
                        playSfx("typing");
                    }}
                    onSubmit={submitCommand}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 text-[9px] text-white/20 font-mono uppercase tracking-widest">
                <span>Tab = Indentar</span>
                <span>Esc = Sair</span>
              </div>
              <button
                onClick={submitCommand}
                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400/70 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
              >
                <span>Executar</span>
                <CornerDownLeft className="w-3 h-3" />
                <span className="text-white/20">Ctrl+Enter</span>
              </button>
            </div>
          </div>
        ) : (
          /* Single-line input */
          <form
            onSubmit={handleSubmit}
            className="px-5 py-3.5 flex items-center gap-3"
          >
            <ChevronRight className="text-emerald-500/70 w-4 h-4 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                playSfx("typing");
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-white/90 placeholder-white/15 caret-emerald-500"
              placeholder="Digite seu comando C#..."
              spellCheck={false}
              autoFocus
              autoComplete="off"
            />
            <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-mono shrink-0">
              Terminal Ativo
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
