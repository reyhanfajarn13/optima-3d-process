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
          <h2>Dari data pasar hingga Gross Profit Riil</h2>
        </div>
      </header>
      <p className="panel__plain">
        OPTIMA menghitung harga dan margin GP TEM, lalu menggabungkannya dengan hasil penilaian risiko customer menjadi Kelompok Result. Sales dapat mengajukan semua kategori dengan menuliskan alasan melanjutkan penawaran untuk ditinjau GM. Setelah disetujui dan WIN, HSD dikirim ke tambang. Saat customer membayar, Gross Profit Riil sama dengan GP proposal.
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
        <span><i style={{ background: COLORS.revenue }} />Uang & jalur emas = realisasi Gross Profit Riil</span>
        <span><i style={{ background: '#e5b43b' }} />Truk tangki = pengiriman HSD setelah WIN</span>
      </div>
    </div>
  );
}
