import { useApp } from '../../store';
import { OptimaWidget } from './OptimaWidget';
import { AnalyticsWidget } from './AnalyticsWidget';
import { ProposalWidget } from './ProposalWidgets';

const TABS = [
  { id: 'calculator', label: 'Kalkulator' },
  { id: 'analytics', label: 'Dashboard Analytics' },
  { id: 'proposal', label: 'Proposal' },
] as const;

export function OptimaWorkspace() {
  const tab = useApp((s) => s.optimaTab);
  const setTab = useApp((s) => s.setOptimaTab);
  return (
    <section className="optima-workspace" aria-label="Aplikasi OPTIMA untuk Sales">
      <div className="optima-brand">
        <img src="/brands/optima.jpeg" alt="OPTIMA — Integrate, Analyze, Optimize, Grow" />
        <div><b>Ruang kerja Sales</b><span>Kalkulasi harga, analisis, dan proposal dalam satu aplikasi.</span></div>
      </div>
      <nav className="optima-tabs" aria-label="Fitur OPTIMA">
        {TABS.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} aria-controls="optima-content" onClick={() => setTab(item.id)}>{item.label}</button>)}
      </nav>
      <div id="optima-content">
        {tab === 'calculator' && <OptimaWidget />}
        {tab === 'analytics' && <AnalyticsWidget />}
        {tab === 'proposal' && <ProposalWidget />}
      </div>
    </section>
  );
}
