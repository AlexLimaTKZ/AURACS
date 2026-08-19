"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, CornerDownLeft, Terminal as TerminalIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAudio } from "./AudioProvider";
import { CodeEditor } from "./CodeEditor";

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

export function Terminal({
  logs,
  onCommand,
  isTyping = false,
  onClear,
  currentHint,
}: TerminalProps) {
  const [input, setInput] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { playSfx } = useAudio();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    const lastLog = logs[logs.length - 1];
    if (lastLog?.type === "success") {
      toast.success("Sistema Atualizado", { description: lastLog.content });
      playSfx("success");
    } else if (lastLog?.type === "error") {
      toast.error("Erro de Sistema", { description: lastLog.content });
      playSfx("error");
    }
  }, [logs, playSfx]);

  const toggleMultiline = useCallback(() => {
    setIsMultiline((previous) => !previous);
  }, []);

  const submitCommand = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setCommandHistory((previous) => [trimmed, ...previous].slice(0, 50));
    setHistoryIndex(-1);

    const lower = trimmed.toLowerCase();
    if (lower === "clear") {
      onClear?.();
      setInput("");
      return;
    }
    if (lower === "help") {
      onCommand("__HELP__");
      setInput("");
      return;
    }
    if (lower === "hint") {
      onCommand("__HINT__");
      setInput("");
      return;
    }

    onCommand(trimmed);
    setInput("");
    playSfx("typing");
    if (isMultiline) setIsMultiline(false);
  }, [input, isMultiline, onClear, onCommand, playSfx]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitCommand();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const getLogColor = (type: Log["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "success":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "system":
        return "text-cyan-400";
      case "code":
        return "text-violet-300 font-semibold";
      case "info":
        return "text-slate-300";
      default:
        return "text-slate-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mx-auto flex h-[400px] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0c]/90 shadow-[0_0_80px_-20px_rgba(16,185,129,0.1)] backdrop-blur-2xl md:h-[600px]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 text-emerald-500/70" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            AURACS :: Terminal Uplink
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleMultiline();
            }}
            className={cn(
              "rounded px-2 py-1 font-mono text-[9px] uppercase tracking-widest transition-all",
              isMultiline
                ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                : "border border-transparent text-white/30 hover:text-white/50"
            )}
          >
            {isMultiline ? "Multi-linha ✓" : "Multi-linha"}
          </button>
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-5 py-4 font-mono text-[13px] scroll-smooth"
      >
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex gap-3 leading-relaxed", getLogColor(log.type))}
            >
              <span className="mt-[2px] shrink-0 select-none text-[11px] opacity-25">
                {log.timestamp}
              </span>
              <span
                className={cn(
                  log.type === "code" &&
                    "rounded border border-white/[0.06] bg-white/[0.04] px-2 py-0.5",
                  "break-words whitespace-pre-wrap"
                )}
              >
                {log.content}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-14 flex w-fit items-center gap-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-400/80"
          >
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-300">
              AURA Processando
            </span>
          </motion.div>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-white/[0.02]">
        {isMultiline ? (
          <div className="px-5 py-3" onClick={(event) => event.stopPropagation()}>
            <div className="flex w-full items-start gap-3">
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-emerald-500/70" />
              <div className="min-w-0 flex-1">
                <CodeEditor
                  value={input}
                  onChange={(code) => {
                    setInput(code);
                    playSfx("typing");
                  }}
                  onSubmit={submitCommand}
                  disabled={isTyping}
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/20">
                Ctrl+Enter para executar
              </span>
              <button
                type="button"
                onClick={submitCommand}
                disabled={isTyping}
                className="flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400/70 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400 disabled:opacity-40"
              >
                Executar
                <CornerDownLeft className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-3.5">
            <ChevronRight className="h-4 w-4 shrink-0 text-emerald-500/70" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                playSfx("typing");
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none bg-transparent font-mono text-[13px] text-white/90 caret-emerald-500 outline-none placeholder:text-white/15"
              placeholder={currentHint ? `Desafio atual: ${currentHint}` : "Digite seu comando C#..."}
              spellCheck={false}
              autoFocus
              autoComplete="off"
              disabled={isTyping}
            />
            <div className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
              Terminal Ativo
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
