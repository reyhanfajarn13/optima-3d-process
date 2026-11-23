const rp = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const fmtRp = (v: number) => `Rp ${rp.format(Math.round(v))}`;
export const fmtNum = (v: number) => rp.format(Math.round(v));
export const fmtPct = (v: number) => `${num1.format(v)}%`;
export const fmtUsd = (v: number) => `US$ ${num1.format(v)}`;

/** Rp dalam satuan juta/miliar untuk angka besar */
export function fmtRpCompact(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `Rp ${num1.format(v / 1e9)} M`;
  if (abs >= 1e6) return `Rp ${num1.format(v / 1e6)} jt`;
  return fmtRp(v);
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
