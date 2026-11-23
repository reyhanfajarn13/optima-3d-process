import { useEffect, useRef, useState } from 'react';
import { STEP } from '../../data/process';
import { TEM_LOGO, TEM_LOGO_ALT } from '../../data/brands';
import { REGIONS } from '../../data/dummy';
import { fmtNum, fmtPct, fmtRp, fmtRpCompact } from '../../lib/format';
import { useOffer } from '../../lib/useOffer';
import { useApp } from '../../store';
import { TierBadge } from './DataWidgets';
import { RevenueReceipt } from '../Revenue';

const today = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function ProposalDoc() {
  const { customer, volumeKL, result } = useOffer();
  const iteration = useApp((s) => s.iteration);
  const d = new Date();
  const number = `TEM/SLS/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${customer.id.toUpperCase()}-R${iteration}`;
  return (
    <article className="proposal-doc" aria-label="Pratinjau proposal">
      <header>
        <div className="proposal-doc__brand">
          <img src={TEM_LOGO} alt={TEM_LOGO_ALT} />
          <div>
            <b>PT Triputra Energi Megatara</b>
            <small>Distributor High Speed Diesel</small>
          </div>
        </div>
        <div className="proposal-doc__meta">
          <small>No. {number}</small>
          <small>{today()}</small>
        </div>
      </header>
      <h3>Proposal Penawaran Harga HSD</h3>
      <p>
        Kepada Yth. <b>{customer.name}</b>, site {customer.site} ({REGIONS[customer.region]}). Dengan hormat, kami mengajukan penawaran pasokan High Speed Diesel sebagai berikut:
      </p>
      <table>
        <tbody>
          <tr><td>Produk</td><td>High Speed Diesel (HSD)</td></tr>
          <tr><td>Volume</td><td>{fmtNum(volumeKL)} KL / bulan</td></tr>
          <tr><td>Harga</td><td><b>{fmtRp(result.offerRp)} / liter</b> (franco site)</td></tr>
          <tr><td>Termin pembayaran</td><td>{result.effectiveTermDays === 0 ? 'Tunai' : `${result.effectiveTermDays} hari`}</td></tr>
          <tr><td>Masa berlaku</td><td>14 hari kalender</td></tr>
        </tbody>
      </table>
      <div className="proposal-doc__internal">
        <b>Lampiran internal untuk GM Sales</b>
        <span>Margin {fmtPct(result.marginPct)}</span>
        <span>Laba kotor {fmtRpCompact(result.grossProfitMonthlyRp)}/bln</span>
        <span>Peluang menang {Math.round(result.winProbabilityPct)}%</span>
        <span>Kompetitor termurah {fmtRp(result.competitorMinRp)}</span>
        <TierBadge tier={result.risk.tier} />
      </div>
      <footer>Dibuat otomatis oleh OPTIMA · revisi #{iteration}</footer>
    </article>
  );
}

export function ProposalWidget() {
  const status = useApp((s) => s.proposalStatus);
  const generate = useApp((s) => s.generateProposal);
  const send = useApp((s) => s.sendToGM);
  const setStep = useApp((s) => s.setStep);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onSend = () => {
    send();
    // beri waktu animasi amplop terbang sebelum kamera pindah ke GM
    timer.current = window.setTimeout(() => setStep(STEP.decision), 2400);
  };

  return (
    <section className="widget">
      {status === 'draft' && (
        <div className="empty">
          <p>Hasil kalkulasi OPTIMA siap dijadikan proposal. Satu klik — dokumen tersusun otomatis.</p>
          <div className="actions">
            <button type="button" className="btn btn--ghost" onClick={() => useApp.getState().openOptima('calculator')}>
              Ubah angka
            </button>
            <button type="button" className="btn" onClick={generate}>
              Generate proposal
            </button>
          </div>
        </div>
      )}
      {status !== 'draft' && <ProposalDoc />}
      {status === 'generated' && (
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
            Cetak / simpan PDF
          </button>
          <button type="button" className="btn" onClick={onSend}>
            Email ke GM Sales
          </button>
        </div>
      )}
      {status !== 'draft' && status !== 'generated' && (
        <div className="callout" role="status">
          Proposal sudah dikirim ke GM Sales.{' '}
          <button type="button" className="link" onClick={() => setStep(STEP.decision)}>
            Lihat keputusan →
          </button>
        </div>
      )}
      <ActivityLog />
    </section>
  );
}

const REASONS = ['Margin terlalu tipis', 'Harga di atas kompetitor', 'Termin terlalu panjang', 'Risiko customer tinggi'];

export function ApprovalWidget() {
  const status = useApp((s) => s.proposalStatus);
  const decide = useApp((s) => s.decide);
  const submit = useApp((s) => s.submitToCustomer);
  const win = useApp((s) => s.winTender);
  const resetFlow = useApp((s) => s.resetFlow);
  const iteration = useApp((s) => s.iteration);
  const { customer, result } = useOffer();
  const hasApproval = ['approved', 'submitted', 'won', 'paid'].includes(status);
  const hasTender = ['submitted', 'won', 'paid'].includes(status);
  const suggested = result.marginPct < 3 ? REASONS[0] : result.offerRp > result.competitorMinRp ? REASONS[1] : result.risk.tier === 'C' ? REASONS[3] : REASONS[0];
  const [reason, setReason] = useState(suggested);
  useEffect(() => setReason(suggested), [suggested]);

  return (
    <section className="widget">
      <ol className="decision">
        <li className={status === 'sent' ? 'is-now' : hasApproval || status === 'rejected' ? 'is-done' : ''}>Proposal diterima GM</li>
        <li className={hasApproval ? 'is-good' : status === 'rejected' ? 'is-bad' : ''}>
          {status === 'rejected' ? 'Ditolak → iterasi' : 'Approve / Tolak'}
        </li>
        <li className={hasTender ? 'is-good' : ''}>Tender ke customer</li>
      </ol>

      {(status === 'draft' || status === 'generated') && (
        <div className="empty">
          <p>Belum ada proposal di inbox GM Sales.</p>
          <button type="button" className="btn" onClick={() => useApp.getState().openOptima('proposal')}>
            Buka proposal di OPTIMA
          </button>
        </div>
      )}

      {status === 'sent' && (
        <>
          <div className="summary">
            <div><span>Customer</span><b>{customer.name}</b></div>
            <div><span>Harga</span><b>{fmtRp(result.offerRp)}/L</b></div>
            <div><span>Margin</span><b>{fmtPct(result.marginPct)}</b></div>
            <div><span>Peluang menang</span><b>{Math.round(result.winProbabilityPct)}%</b></div>
          </div>
          <p className="note">Simulasikan keputusan GM Sales (revisi #{iteration}):</p>
          <label className="field">
            <span>Alasan bila ditolak</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="actions">
            <button type="button" className="btn btn--bad" onClick={() => decide(false, reason)}>
              ✕ Tolak
            </button>
            <button type="button" className="btn btn--good" onClick={() => decide(true)}>
              ✓ Approve
            </button>
          </div>
        </>
      )}

      {status === 'approved' && (
        <div className="callout callout--good" role="status">
          <p>
            <b>Disetujui GM Sales.</b> Sales kini mengajukan proposal resmi ke {customer.name} untuk mengikuti tender.
          </p>
          <button type="button" className="btn btn--good" onClick={submit}>
            Ajukan ke tender customer
          </button>
        </div>
      )}

      {status === 'submitted' && (
        <div className="callout callout--good" role="status">
          <p>
            <b>Proposal sudah diajukan ke tender.</b> Menunggu hasil tender dari {customer.name}. Simulasikan customer menyetujui penawaran untuk melihat pembayaran Revenue ke Data Transaksi TEM.
          </p>
          <div className="actions">
            <button type="button" className="btn btn--ghost" onClick={resetFlow}>Mulai penawaran baru</button>
            <button type="button" className="btn btn--good" onClick={win}>WIN · Customer setuju</button>
          </div>
        </div>
      )}

      {(status === 'won' || status === 'paid') && <>
        <RevenueReceipt />
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={() => useApp.getState().setStep(0)}>Lihat alur Revenue</button>
          {status === 'paid' && <button type="button" className="btn" onClick={resetFlow}>Mulai penawaran baru</button>}
        </div>
      </>}

      {status === 'rejected' && (
        <div className="callout callout--bad" role="status">
          <p>
            <b>Ditolak.</b> Proposal kembali ke Sales untuk iterasi: hitung ulang di OPTIMA, buat proposal baru, lalu kirim lagi.
          </p>
          <button type="button" className="btn" onClick={resetFlow}>
            Iterasi: hitung ulang di OPTIMA
          </button>
        </div>
      )}
      <ActivityLog />
    </section>
  );
}

function ActivityLog() {
  const log = useApp((s) => s.log);
  if (log.length === 0) return null;
  return (
    <div className="log">
      <b>Riwayat aktivitas</b>
      <ul>
        {log.slice(0, 6).map((e) => (
          <li key={e.id} className={`log--${e.tone}`}>
            <time>{e.at}</time>
            {e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
