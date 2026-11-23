import { STEPS } from '../data/process';
import { useApp } from '../store';
import { OverviewWidget } from './Overview';
import { WarehouseWidget, Step1Widget } from './widgets/DataWidgets';
import { OptimaWorkspace } from './widgets/OptimaWorkspace';
import { ApprovalWidget } from './widgets/ProposalWidgets';

const WIDGETS = [Step1Widget, WarehouseWidget, OptimaWorkspace, ApprovalWidget];

export function DetailPanel() {
  const step = useApp((s) => s.activeStep);
  const open = useApp((s) => s.panelOpen);
  const setOpen = useApp((s) => s.setPanelOpen);
  const setStep = useApp((s) => s.setStep);
  const info = step > 0 ? STEPS[step - 1] : null;
  const Widget = step > 0 ? WIDGETS[step - 1] : null;

  return (
    <aside className={`panel${open ? '' : ' panel--closed'}`} aria-label="Detail langkah" style={{ ['--c' as string]: info?.color ?? '#0f2a4a' }}>
      <button type="button" className="panel__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Tutup' : 'Detail'}
        <span aria-hidden>{open ? '›' : '‹'}</span>
      </button>
      <div className="panel__scroll">
        {info ? (
          <>
            <header className="panel__head">
              <span className="panel__num">{info.id}</span>
              <div>
                <small>Langkah {info.id} dari {STEPS.length}</small>
                <h2>{info.title}</h2>
                <p className="panel__actors">{info.actors}</p>
              </div>
            </header>
            <p className="panel__plain">{info.plain}</p>
            <div className="io">
              <div>
                <span>Masuk</span>
                {info.inputs.map((t) => (
                  <em key={t}>{t}</em>
                ))}
              </div>
              <div>
                <span>Keluar</span>
                {info.outputs.map((t) => (
                  <em key={t}>{t}</em>
                ))}
              </div>
            </div>
            {Widget && <Widget key={step} />}
            <nav className="panel__nav">
              <button type="button" className="btn btn--ghost" disabled={step <= 1} onClick={() => setStep(step - 1)}>
                ← Sebelumnya
              </button>
              {step < STEPS.length ? (
                <button type="button" className="btn btn--ghost" onClick={() => setStep(step + 1)}>
                  Berikutnya →
                </button>
              ) : (
                <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>
                  Lihat semua
                </button>
              )}
            </nav>
          </>
        ) : (
          <OverviewWidget />
        )}
      </div>
    </aside>
  );
}
