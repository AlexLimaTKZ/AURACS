"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";

type SoundType = "bgm" | "typing" | "success" | "error" | "glitch";

interface AudioContextType {
  playSfx: (type: SoundType) => void;
  toggleMute: () => void;
  isMuted: boolean;
  volume: number;
  setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within an AudioProvider");
  return context;
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const bgmRef = useRef<Howl | null>(null);

  // Sound instances
  const sounds = useRef<Record<string, Howl>>({});

  useEffect(() => {
    try {
      // Initialize standard SFX
      sounds.current = {
        typing: new Howl({ src: ["/sounds/type.mp3"], volume: 0.2, html5: false }),
        success: new Howl({ src: ["/sounds/success.mp3"], volume: 0.5, html5: false }),
        error: new Howl({ src: ["/sounds/error.mp3"], volume: 0.5, html5: false }),
        glitch: new Howl({ src: ["/sounds/glitch.mp3"], volume: 0.4, html5: false }),
      };

      // Initialize BGM
      bgmRef.current = new Howl({
        src: ["/sounds/ambient.mp3"],
        loop: true,
        volume: 0.3,
        autoplay: false,
        html5: true, // Use HTML5 Audio for BGM to avoid AudioContext suspension errors
      });
    } catch {
      // Fail silently if AudioContext is unsupported or blocked by browser policy
    }

    return () => {
      try {
        if (bgmRef.current) {
          bgmRef.current.unload();
        }
        Object.values(sounds.current).forEach((s) => {
          try {
            s.unload();
          } catch {
            // Ignorar erros de áudio no desmontar
          }
        });
      } catch {
        // Ignorar erros no ciclo de vida do AudioContext
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof Howler !== "undefined" && Howler.ctx && Howler.ctx.state !== "closed") {
        Howler.volume(isMuted ? 0 : volume);
      }
    } catch {
      // Ignorar caso o contexto do navegador esteja suspenso/fechado
    }
  }, [isMuted, volume]);

  const playSfx = (type: SoundType) => {
    try {
      if (type === "bgm") {
        if (bgmRef.current && !bgmRef.current.playing()) {
          bgmRef.current.play();
        }
        return;
      }
      sounds.current[type]?.play();
    } catch {
      // Ignorar caso o áudio esteja bloqueado antes da interação do usuário
    }
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  return (
    <AudioContext.Provider value={{ playSfx, toggleMute, isMuted, volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
}
