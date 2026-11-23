import { useEffect, useRef, useState } from 'react';
import { fmtRp, fmtRpCompact } from '../lib/format';

export function GPValue({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const current = useRef(amount);
  const [display, setDisplay] = useState(amount);
  useEffect(() => {
    const from = current.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === amount) {
      current.current = amount; setDisplay(amount); return;
    }
    const start = performance.now();
    let frame = 0;
    const update = (at: number) => {
      const t = Math.min(1, (at - start) / 650);
      current.current = from + (amount - from) * (1 - Math.pow(1 - t, 3));
      setDisplay(current.current);
      if (t < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [amount]);
  return <span className="gp-value" data-gp={amount} title={fmtRp(amount)}>{compact ? fmtRpCompact(display) : fmtRp(display)}</span>;
}
