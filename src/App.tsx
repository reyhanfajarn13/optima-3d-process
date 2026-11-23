import { lazy, Suspense, useEffect, useState } from 'react';
import { STEPS } from './data/process';
import { hasWebGL } from './lib/webgl';
import { useApp } from './store';
import { ControlsDock, Stepper, TopBar } from './ui/Chrome';
import { DetailPanel } from './ui/DetailPanel';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { RevenueStatus } from './ui/Revenue';

// Scene 3D (three.js) dimuat terpisah: UI langsung tampil, 3D menyusul
const Experience = lazy(() => import('./scene/Experience'));

const TOUR_INTERVAL_MS = 11_000;

function useTour() {
  const tour = useApp((s) => s.tour);
  const step = useApp((s) => s.activeStep);
  useEffect(() => {
    if (!tour) return;
    const id = window.setTimeout(() => {
      const { activeStep, setStep, setTour } = useApp.getState();
      if (activeStep >= STEPS.length) setTour(false);
      else setStep(activeStep + 1);
    }, TOUR_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [tour, step]);
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea')) return;
      const { activeStep, setStep, setTour } = useApp.getState();
      if (e.key === 'ArrowRight' && activeStep < STEPS.length) setStep(activeStep + 1);
      else if (e.key === 'ArrowLeft' && activeStep > 0) setStep(activeStep - 1);
      else if (e.key === 'Escape') {
        setTour(false);
        setStep(0);
      } else return;
      setTour(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function SceneFallback({ reason }: { reason: string }) {
  return (
    <div className="scene-fallback">
      <div>
        <b>Tampilan 3D tidak tersedia</b>
        <p>{reason} Semua informasi proses tetap dapat dibuka melalui daftar langkah dan panel detail.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL);
  const tour = useApp((s) => s.tour);
  const step = useApp((s) => s.activeStep);
  useTour();
  useKeyboard();

  return (
    <div className={`app${tour ? ' app--tour' : ''}`}>
      <main className="scene" aria-label="Visualisasi 3D proses bisnis">
        {webgl ? (
          <ErrorBoundary fallback={<SceneFallback reason="Terjadi kesalahan saat merender grafis 3D." />}>
            <Suspense fallback={null}>
              <Experience onReady={() => setReady(true)} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <SceneFallback reason="Browser atau perangkat ini tidak mendukung WebGL." />
        )}
        {webgl && !ready && (
          <div className="loader" role="status">
            <div className="loader__ring" />
            <span>Menyiapkan peta 3D…</span>
          </div>
        )}
      </main>
      <TopBar />
      <div className="scene-caption">Kantor TEM · alur internal hingga persetujuan GM</div>
      <Stepper />
      <DetailPanel />
      <RevenueStatus />
      {webgl && <ControlsDock />}
      {tour && <div className="tour-bar" aria-hidden><i key={step} style={{ animationDuration: `${TOUR_INTERVAL_MS}ms` }} /></div>}
    </div>
  );
}
