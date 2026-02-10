"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

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
    // Initialize standard SFX
    sounds.current = {
      typing: new Howl({ src: ["/sounds/type.mp3"], volume: 0.2 }),
      success: new Howl({ src: ["/sounds/success.mp3"], volume: 0.5 }),
      error: new Howl({ src: ["/sounds/error.mp3"], volume: 0.5 }),
      glitch: new Howl({ src: ["/sounds/glitch.mp3"], volume: 0.4 }),
    };

    // Initialize BGM
    bgmRef.current = new Howl({
      src: ["/sounds/ambient.mp3"],
      loop: true,
      volume: 0.3,
      autoplay: false, // Browser policy requires interaction
    });

    return () => {
      bgmRef.current?.unload();
      Object.values(sounds.current).forEach(s => s.unload());
    };
  }, []);

  useEffect(() => {
    Howler.volume(isMuted ? 0 : volume);
  }, [isMuted, volume]);

  const playSfx = (type: SoundType) => {
    if (type === "bgm") {
      if (!bgmRef.current?.playing()) {
         bgmRef.current?.play();
      }
      return;
    }
    sounds.current[type]?.play();
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <AudioContext.Provider value={{ playSfx, toggleMute, isMuted, volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
}
