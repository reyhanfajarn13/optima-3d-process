import { useEffect, useState } from 'react';
import { STEP } from '../data/process';
import { fmtRp, fmtRpCompact } from '../lib/format';
import { REVENUE_DURATION_MS, revenueProgress } from '../lib/revenue';
import { useApp } from '../store';

export function RevenueReceipt() {
  const payment = useApp((s) => s.revenue);
  const paid = useApp((s) => s.proposalStatus === 'paid');
  if (!payment) return null;
  return <section className={`revenue-receipt${paid ? ' revenue-receipt--paid' : ''}`} aria-label="Pembayaran Revenue">
    <span>{paid ? 'REVENUE DITERIMA' : 'WIN · CUSTOMER SETUJU'}</span>
    <strong>{fmtRp(payment.amountRp)}</strong>
    <p>{payment.customerName}</p>
    <small>{paid ? 'Tercatat di Data Transaksi TEM · Oracle NetSuite' : 'Pembayaran menuju Data Transaksi TEM · Oracle NetSuite'}</small>
    <small>Simulasi 1 bulan: harga penawaran × volume KL × 1.000 liter</small>
  </section>;
}

/** Penyelesaian tetap berjalan ketika WebGL tidak tersedia atau tab tidak aktif. */
export function RevenueStatus() {
  const payment = useApp((s) => s.revenue);
  const status = useApp((s) => s.proposalStatus);
  const setStep = useApp((s) => s.setStep);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!payment || status !== 'won') return;
    const update = () => setProgress(revenueProgress(payment));
    update();
    const interval = window.setInterval(update, 100);
    const timer = window.setTimeout(() => useApp.getState().finishCourier(payment.id), Math.max(0, payment.startedAt + REVENUE_DURATION_MS - Date.now()));
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  }, [payment, status]);

  if (!payment || (status !== 'won' && status !== 'paid')) return null;
  const paid = status === 'paid';
  return <div className={`revenue-banner${paid ? ' revenue-banner--paid' : ''}`}>
    <div className="revenue-banner__heading" role="status">
      <span className="revenue-banner__icon" aria-hidden>Rp</span>
      <div><b>{paid ? 'Revenue diterima di ERP' : 'WIN · Customer setuju'}</b><span>{paid ? 'Pembayaran tercatat' : 'Pembayaran Revenue'} · {fmtRpCompact(payment.amountRp)}</span></div>
      {paid && <button type="button" className="link" onClick={() => setStep(STEP.observation, 'src-internal')}>Lihat transaksi</button>}
    </div>
    {!paid && <>
      <div className="revenue-banner__route"><span>Customer tambang</span><span aria-hidden>→</span><span>Data Transaksi TEM · NetSuite</span></div>
      <progress value={progress} max={1} aria-label="Progress pembayaran Revenue" />
    </>}
  </div>;
}
