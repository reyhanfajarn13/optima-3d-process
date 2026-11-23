import { COLORS, STEPS } from '../data/process';
import { useApp } from '../store';

export function OverviewWidget() {
  const setStep = useApp((s) => s.setStep);
  const setTour = useApp((s) => s.setTour);
  return (
    <div className="overview">
      <header className="panel__head">
        <span className="panel__num" aria-hidden>
          ⛽
        </span>
        <div>
          <small>Ringkasan proses</small>
          <h2>Dari data pasar hingga Revenue</h2>
        </div>
      </header>
      <p className="panel__plain">
        Peta ini menunjukkan bagaimana TEM menentukan harga penawaran High Speed Diesel (HSD) untuk customer tambang batu bara. Ikuti 4 langkah — dari sumber data dan OPTIMA, hingga keputusan GM, tender, dan customer setuju (WIN). Pembayaran Revenue kemudian kembali ke Data Transaksi TEM di Oracle NetSuite.
      </p>
      <button type="button" className="btn btn--wide" onClick={() => { setStep(1); setTour(true); }}>
        ▶ Putar tur otomatis
      </button>
      <ol className="overview__list">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => setStep(s.id)} style={{ ['--c' as string]: s.color }}>
              <b>{s.id}</b>
              <span>
                <strong>{s.title}</strong>
                <small>{s.actors}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="legend">
        <b>Cara membaca peta</b>
        <span><i style={{ background: COLORS.optima }} className="legend__dash" />Garis putus bergerak = aliran data</span>
        <span><i className="legend__env" />Amplop = proposal / email</span>
        <span><i style={{ background: COLORS.approve }} />Hijau = disetujui → tender</span>
        <span><i style={{ background: COLORS.reject }} />Merah = ditolak → iterasi</span>
        <span><i style={{ background: COLORS.revenue }} />Uang & jalur emas = pembayaran Revenue ke ERP</span>
      </div>
    </div>
  );
}
