import { useState } from 'react';
import { TEM_LOGO, TEM_LOGO_ALT } from '../data/brands';
import { STEPS } from '../data/process';
import { sceneApi } from '../sceneApi';
import { useApp } from '../store';

export function TopBar() {
  const tour = useApp((s) => s.tour);
  const setTour = useApp((s) => s.setTour);
  const animate = useApp((s) => s.animate);
  const setAnimate = useApp((s) => s.setAnimate);
  const setStep = useApp((s) => s.setStep);
  const step = useApp((s) => s.activeStep);

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => setStep(0)} aria-label="Kembali ke ringkasan">
        <img className="brand__logo" src={TEM_LOGO} alt={TEM_LOGO_ALT} />
        <span className="brand__text">
          <b>Peta Proses Penawaran HSD</b>
          <small>PT Triputra Energi Megatara</small>
        </span>
      </button>
      <div className="topbar__actions">
        <button
          type="button"
          className={`chip${tour ? ' chip--on' : ''}`}
          onClick={() => {
            if (!tour && step === 0) setStep(1);
            setTour(!tour);
          }}
          aria-pressed={tour}
        >
          {tour ? '❚❚ Jeda tur' : '▶ Tur otomatis'}
        </button>
        <button type="button" className={`chip${animate ? '' : ' chip--on'}`} onClick={() => setAnimate(!animate)} aria-pressed={!animate} title="Matikan animasi untuk menghemat baterai">
          {animate ? 'Mode hemat' : 'Animasi mati'}
        </button>
      </div>
    </header>
  );
}

export function Stepper() {
  const step = useApp((s) => s.activeStep);
  const setStep = useApp((s) => s.setStep);
  const setTour = useApp((s) => s.setTour);
  const go = (n: number) => {
    setTour(false);
    setStep(n);
  };
  return (
    <nav className="stepper" aria-label="Langkah proses">
      <button type="button" className={`stepper__item stepper__item--all${step === 0 ? ' is-active' : ''}`} onClick={() => go(0)}>
        <b>◎</b>
        <span>Semua langkah</span>
      </button>
      {STEPS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`stepper__item${step === s.id ? ' is-active' : ''}${step > s.id ? ' is-past' : ''}`}
          style={{ ['--c' as string]: s.color }}
          onClick={() => go(s.id)}
          aria-current={step === s.id ? 'step' : undefined}
        >
          <b>{s.id}</b>
          <span>
            {s.short}
            <small>{s.who}</small>
          </span>
        </button>
      ))}
    </nav>
  );
}

export function ControlsDock() {
  const recenter = useApp((s) => s.recenter);
  const [mode, setMode] = useState<'rotate' | 'pan'>('rotate');
  const toggle = () => {
    const next = mode === 'rotate' ? 'pan' : 'rotate';
    setMode(next);
    sceneApi.setDragMode(next);
  };
  return (
    <div className="dock" role="toolbar" aria-label="Kontrol kamera">
      <button type="button" onClick={() => sceneApi.zoom(1)} aria-label="Perbesar">
        +
      </button>
      <button type="button" onClick={() => sceneApi.zoom(-1)} aria-label="Perkecil">
        −
      </button>
      <button type="button" onClick={recenter} aria-label="Pusatkan kamera" title="Pusatkan kamera">
        ⌖
      </button>
      <button type="button" className="dock__mode" onClick={toggle} aria-pressed={mode === 'pan'} title="Ganti fungsi drag kiri / satu jari">
        Drag: {mode === 'rotate' ? 'Putar' : 'Geser'}
      </button>
      <span className="dock__hint">
        Drag {mode === 'rotate' ? 'untuk memutar · klik kanan/2 jari untuk menggeser' : 'untuk menggeser · klik kanan untuk memutar'} · scroll/pinch untuk zoom · klik objek untuk detail
      </span>
    </div>
  );
}
