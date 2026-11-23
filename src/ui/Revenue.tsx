import { useEffect, useState } from 'react';
import { STEP } from '../data/process';
import { fmtNum, fmtRp, fmtPct } from '../lib/format';
import { REVENUE_DURATION_MS, UNLOADING_DURATION_MS, deliveryProgress, revenueProgress } from '../lib/revenue';
import { useApp } from '../store';
import { GPValue } from './GPValue';

export function RevenueReceipt() {
  const proposal = useApp((s) => s.proposal);
  const status = useApp((s) => s.proposalStatus);
  if (!proposal || !['delivering', 'delivered', 'paying', 'paid'].includes(status)) return null;
  const paid = status === 'paid';
  return <section className={`revenue-receipt${paid ? ' revenue-receipt--paid' : ''}`} aria-label="Gross Profit Riil">
    <span>{paid || status === 'paying' ? 'Gross Profit Riil' : status === 'delivering' ? 'WIN · PENGIRIMAN HSD' : 'HSD TIBA · BONGKAR MUATAN'}</span>
    <strong><GPValue amount={proposal.grossProfitRp} /></strong>
    <p>{proposal.customer.name}</p>
    <div className="gp-receipt"><span>{paid ? 'Gross Profit Riil sama dengan GP proposal' : 'GP mengikuti penawaran yang disetujui'}</span><b>Margin GP {fmtPct(proposal.result.marginPct)}</b></div>
    <small>{paid ? 'Tercatat di Data Transaksi TEM · Oracle NetSuite' : 'Pembayaran dilakukan setelah HSD diterima customer.'}</small>
    <small>Simulasi 1 bulan · realisasi GP setelah HSD diterima dan customer membayar.</small>
    <details><summary>Rincian pembayaran customer</summary><small>Total pembayaran {fmtRp(proposal.revenueRp)} · termasuk biaya dan GP penawaran.</small></details>
    {paid && <div className="happy-pair"><span>Customer happy</span><span>Sales happy</span></div>}
  </section>;
}

/** Jadwal bisnis terpisah dari render 3D agar pengiriman tidak macet tanpa WebGL. */
export function RevenueStatus() {
  const proposal = useApp((s) => s.proposal);
  const delivery = useApp((s) => s.delivery);
  const payment = useApp((s) => s.revenue);
  const status = useApp((s) => s.proposalStatus);
  const setStep = useApp((s) => s.setStep);
  const [at, setAt] = useState(Date.now);

  useEffect(() => {
    if (!['delivering', 'delivered', 'paying'].includes(status)) return;
    setAt(Date.now());
    const id = window.setInterval(() => setAt(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [status, delivery?.id, payment?.id]);

  useEffect(() => {
    if (status !== 'delivering' || !delivery) return;
    const id = window.setTimeout(() => useApp.getState().finishDelivery(delivery.id), Math.max(0, delivery.arrivesAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [delivery, status]);

  useEffect(() => {
    if (status !== 'delivered' || !delivery || delivery.deliveredAt === null) return;
    const id = window.setTimeout(() => useApp.getState().startRevenue(delivery.id), Math.max(0, delivery.deliveredAt + UNLOADING_DURATION_MS - Date.now()));
    return () => window.clearTimeout(id);
  }, [delivery, status]);

  useEffect(() => {
    if (!payment || status !== 'paying') return;
    const id = window.setTimeout(() => useApp.getState().finishCourier(payment.id), Math.max(0, payment.startedAt + REVENUE_DURATION_MS - Date.now()));
    return () => window.clearTimeout(id);
  }, [payment, status]);

  if (!proposal || status === 'draft') return null;
  const shipping = status === 'delivering';
  const delivered = status === 'delivered';
  const paying = status === 'paying';
  const paid = status === 'paid';
  const loading = shipping && delivery && at < delivery.departedAt;
  const stage = paid ? 3 : paying || delivered ? 2 : shipping ? 2 : 1;
  const title = paid ? 'Gross Profit Riil tercatat di ERP' : paying ? 'Pembayaran customer · Gross Profit Riil' : delivered ? 'HSD tiba · bongkar muatan' : loading ? 'WIN · Muat HSD dari tangki TEM' : shipping ? 'Truk HSD menuju customer' : status === 'rejected' ? 'GP proposal · menunggu revisi' : 'GP OPTIMA mengikuti proposal';
  return <div className={`revenue-banner deal-banner${paid ? ' revenue-banner--paid' : ''}`} data-stage={status}>
    <div className="deal-gp">
      <div><small>{paid || paying ? 'Gross Profit Riil' : 'GP PENAWARAN / BULAN'}</small><b><GPValue amount={proposal.grossProfitRp} /></b></div>
      <span className="gp-continuity" key={status}>{paid ? 'Sama dengan kalkulasi & proposal' : `Proposal revisi #${proposal.iteration}`}</span>
    </div>
    <div className="gp-stages" aria-label="Konsistensi GP sepanjang proses">
      {['Kalkulasi', 'Proposal', 'Pengiriman', 'Pembayaran'].map((label, i) => <span key={label} className={i <= stage ? 'is-reached' : ''}>{label}</span>)}
    </div>
    <div className="deal-phase" role="status" key={`phase-${status}`}><b>{title}</b></div>
    {(shipping || delivered) && <>
      <div className="revenue-banner__route"><span>Tangki TEM</span><span aria-hidden>→</span><span>Customer tambang</span></div>
      <progress value={delivered ? 1 : delivery ? deliveryProgress(delivery, at) : 0} max={1} aria-label="Progress pengiriman HSD" />
      <small className="deal-volume">{fmtNum(proposal.volumeKL)} KL/bulan · ilustrasi pengiriman bertahap</small>
    </>}
    {(paying || paid) && <>
      <div className="deal-revenue">Margin GP <b>{fmtPct(proposal.result.marginPct)}</b></div>
      {!paid && <>
        <div className="revenue-banner__route"><span>Customer tambang</span><span aria-hidden>→</span><span>Data Transaksi TEM · NetSuite</span></div>
        <progress value={payment ? revenueProgress(payment, at) : 0} max={1} aria-label="Progress realisasi Gross Profit Riil" />
      </>}
    </>}
    {paid && <>
      <div className="happy-pair"><span>Customer happy</span><span>Sales happy</span></div>
      <button type="button" className="link deal-transactions" onClick={() => setStep(STEP.observation, 'src-internal')}>Lihat transaksi & GP</button>
    </>}
  </div>;
}
