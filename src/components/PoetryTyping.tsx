import { useEffect, useRef } from 'react';
import Typed from 'typed.js';
import { poems } from '../data/poetry';

/**
 * Cycles through classical Chinese poems using typed.js.
 * Renders the poem text and its author attribution.
 */
export default function PoetryTyping() {
  const elRef = useRef<HTMLSpanElement>(null);
  const authorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!elRef.current) return;

    const typed = new Typed(elRef.current, {
      strings: poems.map((p) => p.poetry),
      typeSpeed: 60,
      backSpeed: 60,
      startDelay: 600,
      backDelay: 10000,
      shuffle: true,
      loop: true,
      preStringTyped: (arrayPos) => {
        // Update the author attribution when the poem changes
        const poemIndex = arrayPos % poems.length;
        if (authorRef.current) {
          authorRef.current.textContent = poems[poemIndex].author;
        }
      },
    });

    return () => typed.destroy();
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <span ref={elRef} className="leading-relaxed" />
      <span ref={authorRef} className="text-sm text-[var(--color-paper-dim)]" />
    </div>
  );
}
