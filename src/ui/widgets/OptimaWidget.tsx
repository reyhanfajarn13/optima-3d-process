import { CUSTOMERS, REGIONS, TEM_CONFIG } from '../../data/dummy';
import { fmtDate, fmtNum, fmtPct, fmtRp, fmtRpCompact } from '../../lib/format';
import { useOffer } from '../../lib/useOffer';
import { isLocked, useApp } from '../../store';
import { TierBadge } from './DataWidgets';

export function CustomerSelect() {
  const customerId = useApp((s) => s.customerId);
  const setCustomer = useApp((s) => s.setCustomer);
  const locked = useApp((s) => isLocked(s.proposalStatus));
  return (
    <label className="field">
      <span>Customer</span>
      <select aria-label="Customer" value={customerId} disabled={locked} onChange={(e) => setCustomer(e.target.value)}>
        {CUSTOMERS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} — {c.site}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Posisi harga penawaran di antara batas bawah TEM dan harga kompetitor */
function PriceScale({ floor, min, avg, offer }: { floor: number; min: number; avg: number; offer: number }) {
  const lo = Math.min(floor, min, offer) - 120;
  const hi = Math.max(avg, offer, min) + 120;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <div className="pscale" aria-hidden>
      <div className="pscale__track">
        <span className="pscale__zone" style={{ left: pos(floor), width: `calc(${pos(min)} - ${pos(floor)})` }} />
        <i className="pscale__mark pscale__mark--floor" style={{ left: pos(floor) }} />
        <i className="pscale__mark pscale__mark--comp" style={{ left: pos(min) }} />
        <i className="pscale__mark pscale__mark--avg" style={{ left: pos(avg) }} />
        <b className="pscale__offer" style={{ left: pos(offer) }} />
      </div>
      <div className="pscale__legend">
        <span><i className="k k--floor" />Batas bawah TEM</span>
        <span><i className="k k--comp" />Kompetitor termurah</span>
        <span><i className="k k--avg" />Rata-rata pesaing</span>
        <span><i className="k k--offer" />Penawaran</span>
      </div>
    </div>
  );
}

export function OptimaWidget() {
  const { customer, volumeKL, termDays, adjustmentRp, result } = useOffer();
  const setCalc = useApp((s) => s.setCalc);
  const setTab = useApp((s) => s.setOptimaTab);
  const iteration = useApp((s) => s.iteration);
  const gmNote = useApp((s) => s.gmNote);
  const locked = useApp((s) => isLocked(s.proposalStatus));

  return (
    <section className="widget optima">
      <div className="sync">
        <span className="sync__dot" aria-hidden />
        Sumber: PostgreSQL Data Warehouse · {fmtDate(TEM_CONFIG.lastSync)}
      </div>
      {iteration > 1 && gmNote && (
        <div className="callout callout--bad" role="status">
          <b>Revisi #{iteration}</b> — catatan GM: “{gmNote}”. Sesuaikan angka lalu buat proposal ulang.
        </div>
      )}
      {locked && (
        <div className="callout" role="status">
          Input dikunci karena proposal sedang diproses GM Sales / tender.
        </div>
      )}
      <fieldset className="fieldset" disabled={locked}>
      <CustomerSelect />
      <div className="field-row">
        <label className="field">
          <span>Volume (KL/bulan)</span>
          <input type="number" min={100} max={10000} step={50} value={volumeKL} onChange={(e) => setCalc({ volumeKL: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        <label className="field">
          <span>Termin (hari)</span>
          <select value={termDays} onChange={(e) => setCalc({ termDays: Number(e.target.value) })}>
            {[0, 14, 30, 45, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d === 0 ? 'Tunai' : `${d} hari`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>
          Penyesuaian Sales <b>{adjustmentRp > 0 ? '+' : ''}{fmtRp(adjustmentRp)}/L</b>
        </span>
        <input type="range" min={-300} max={300} step={10} value={adjustmentRp} onChange={(e) => setCalc({ adjustmentRp: Number(e.target.value) })} />
      </label>
      </fieldset>

      <div className="reco">
        <div className="reco__main">
          <span>Harga penawaran</span>
          <b>{fmtRp(result.offerRp)}</b>
          <small>per liter · rekomendasi sistem {fmtRp(result.recommendedRp)}</small>
        </div>
        <div className="reco__grid">
          <div><span>Margin</span><b>{fmtPct(result.marginPct)}</b></div>
          <div><span>Laba kotor/bln</span><b>{fmtRpCompact(result.grossProfitMonthlyRp)}</b></div>
          <div><span>Peluang menang</span><b>{Math.round(result.winProbabilityPct)}%</b></div>
          <div><span>Risiko customer</span><TierBadge tier={result.risk.tier} /></div>
        </div>
        <PriceScale floor={result.floorRp} min={result.competitorMinRp} avg={result.competitorAvgRp} offer={result.offerRp} />
      </div>

      <details className="breakdown">
        <summary>Rincian perhitungan</summary>
        <table>
          <tbody>
            <tr><td>Biaya dasar HSD</td><td className="num">{fmtRp(TEM_CONFIG.baseCostRp)}</td></tr>
            <tr><td>Ongkos angkut ke {customer.site}</td><td className="num">{fmtRp(customer.logisticsCostRp)}</td></tr>
            <tr><td>Biaya dana termin {result.effectiveTermDays} hari</td><td className="num">{fmtRp(result.costRp - TEM_CONFIG.baseCostRp - customer.logisticsCostRp)}</td></tr>
            <tr><th>Total biaya TEM</th><th className="num">{fmtRp(result.costRp)}</th></tr>
            <tr><td>Batas bawah (margin min. + premi risiko {result.risk.tier})</td><td className="num">{fmtRp(result.floorRp)}</td></tr>
            <tr><td>Kompetitor termurah · {REGIONS[customer.region]}</td><td className="num">{fmtRp(result.competitorMinRp)}</td></tr>
            <tr><td>Volume</td><td className="num">{fmtNum(volumeKL)} KL/bln</td></tr>
          </tbody>
        </table>
      </details>

      {result.warnings.length > 0 && (
        <ul className="warnings">
          {result.warnings.map((w) => (
            <li key={w}>
              <i aria-hidden>!</i>
              {w}
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button type="button" className="btn btn--ghost" onClick={() => setTab('analytics')}>
          Buka Dashboard Analytics
        </button>
        <button type="button" className="btn" onClick={() => setTab('proposal')}>
          Buat proposal
        </button>
      </div>
      {termDays !== result.effectiveTermDays && <p className="note">Termin efektif: {result.effectiveTermDays} hari.</p>}
    </section>
  );
}
