// Animates a number from its previous value to `target` with an ease-out curve, so a changed total
// visibly rolls to its new value. Only the very first readout of a session rolls up from 0; later
// mounts (switching tabs back and forth) show the number straight away.
import { useEffect, useRef, useState } from "react";

let introPlayed = false;

export function useCountUp(target: number, durationMs = 450): number {
  const [intro] = useState(() => !introPlayed);
  const [value, setValue] = useState(intro ? 0 : target);
  // What is on screen right now; an interrupted roll continues from here instead of jumping.
  const shown = useRef(intro ? 0 : target);

  useEffect(() => {
    introPlayed = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = shown.current;

    if (reduceMotion || from === target) {
      shown.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      shown.current = from + (target - from) * eased;
      setValue(shown.current);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
