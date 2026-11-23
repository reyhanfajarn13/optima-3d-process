import { CUSTOMER_HISTORY } from '../../data/dummy';
import { fmtNum, fmtPct, fmtRp } from '../../lib/format';
import { useOffer } from '../../lib/useOffer';
import { useApp } from '../../store';
import { BarChart, LineChart } from '../charts';
import { CustomerSelect } from './OptimaWidget';

export function AnalyticsWidget() {
  const { customer } = useOffer();
  const setTab = useApp((s) => s.setOptimaTab);
  const history = CUSTOMER_HISTORY[customer.id];
  const totalVol = history.reduce((s, p) => s + p.volumeKL, 0);
  const avgPrice = history.reduce((s, p) => s + p.priceRp * p.volumeKL, 0) / totalVol;
  const avgMargin = history.reduce((s, p) => s + p.marginPct * p.volumeKL, 0) / totalVol;
  const last = history[history.length - 1];

  return (
    <section className="widget analytics">
      <div className="analytics__bar">
        <span className="analytics__logo" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        OPTIMA · Dashboard Analytics
      </div>
      <CustomerSelect />
      <div className="stat-row">
        <div className="stat">
          <span>Volume 12 bln</span>
          <b>{fmtNum(totalVol)} KL</b>
        </div>
        <div className="stat">
          <span>Harga rata-rata</span>
          <b>{fmtRp(avgPrice)}</b>
        </div>
        <div className="stat">
          <span>Margin rata-rata</span>
          <b>{fmtPct(avgMargin)}</b>
        </div>
      </div>
      <BarChart title="Volume pengambilan HSD per bulan (KL)" data={history.map((p) => ({ label: p.label, value: p.volumeKL }))} format={(v) => `${fmtNum(v)} KL`} color="var(--series-4)" />
      <LineChart title="Harga jual TEM per bulan (Rp/L)" data={history.map((p) => ({ label: p.label, value: p.priceRp }))} format={fmtRp} color="var(--series-1)" />
      <p className="note">
        Harga terakhir {fmtRp(last.priceRp)}/L ({last.label}) dengan margin {fmtPct(last.marginPct)}. Gunakan sebagai pembanding angka penawaran baru.
      </p>
      <div className="actions">
        <button type="button" className="btn btn--ghost" onClick={() => setTab('calculator')}>
          Kembali ke kalkulator
        </button>
        <button type="button" className="btn" onClick={() => setTab('proposal')}>
          Buat proposal
        </button>
      </div>
    </section>
  );
}
