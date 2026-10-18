import { useEffect, useRef, useState, type Dispatch } from "react";
import type { Action, GameState } from "./game";

let audio: AudioContext | null = null;

export const unlockAudio = async (): Promise<boolean> => {
  try {
    audio ??= new AudioContext();
    await audio.resume();
    return audio.state === "running";
  } catch {
    return false;
  }
};

const playSignal = (finished: boolean) => {
  if (!audio || audio.state !== "running") return;
  const notes = finished ? [660, 520, 390] : [880];
  for (const [index, frequency] of notes.entries()) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + index * 0.18;
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.18);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
};

export const useTurnTimer = (state: GameState, dispatch: Dispatch<Action>) => {
  const [remainingMs, setRemainingMs] = useState(
    state.settings.duration * 1000,
  );
  const previousSignal = useRef("");
  const deadline = state.turn?.deadline;
  const pausedMs = state.turn?.remainingMs;
  const active = state.stage === "playing";
  const sound = state.settings.sound;

  useEffect(() => {
    if (!active || deadline === null || deadline === undefined) {
      setRemainingMs(pausedMs ?? 0);
      return;
    }
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, deadline - now);
      const seconds = Math.ceil(remaining / 1000);
      setRemainingMs(remaining);
      const key = `${deadline}:${seconds}`;
      if (seconds <= 10 && previousSignal.current !== key) {
        if (sound) playSignal(seconds === 0);
        previousSignal.current = key;
      }
      if (remaining === 0) dispatch({ type: "EXPIRE", now });
    };
    update();
    const interval = window.setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pageshow", update);
    };
  }, [active, deadline, dispatch, pausedMs, sound]);

  return { remainingMs, seconds: Math.ceil(remainingMs / 1000) };
};
