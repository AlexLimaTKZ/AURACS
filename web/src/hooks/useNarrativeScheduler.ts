"use client";

import { useCallback, useEffect, useRef } from "react";

export function useNarrativeScheduler() {
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const intervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current.clear();
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const repeat = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  const stopRepeat = useCallback((interval: ReturnType<typeof setInterval>) => {
    clearInterval(interval);
    intervalsRef.current.delete(interval);
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { schedule, repeat, stopRepeat, clearAll };
}
