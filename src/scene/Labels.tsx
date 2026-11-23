import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { RefObject } from 'react';
import { STATIONS, STEPS, ZONES, type StationId } from '../data/process';
import { useApp, type ProposalStatus } from '../store';

const LABEL_HEIGHT: Record<StationId, number> = {
  'src-site': 6.8,
  'src-nc': 4.4,
  'src-internal': 4.2,
  'src-comp': 3.8,
  risk: 2.7,
  fat: 2.7,
  marketing: 2.7,
  warehouse: 6.0,
  optima: 6.8,
  sales: 2.9,
  gm: 4.6,
  customer: 8.0,
};

export const STATUS_TEXT: Record<ProposalStatus, string> = {
  draft: 'Menunggu proposal',
  generated: 'Proposal siap dikirim',
  sent: 'Sedang direview',
  approved: 'Disetujui',
  rejected: 'Ditolak · revisi',
  submitted: 'Diajukan ke tender',
  won: 'WIN · Customer setuju',
  paid: 'WIN · Revenue diterima',
};

type LabelPortal = RefObject<HTMLDivElement>;

function StationLabel({ id, portal }: { id: StationId; portal: LabelPortal }) {
  const st = STATIONS[id];
  const step = useApp((s) => s.activeStep);
  const hovered = useApp((s) => s.hovered === id);
  const focused = useApp((s) => s.focusStation === id);
  const status = useApp((s) => s.proposalStatus);
  const inStep = step === st.step;
  const dim = step !== 0 && !inStep;
  const p = st.position;
  return (
    <Html portal={portal} position={[p[0] + (step === 0 && id.startsWith('src-') ? -5 : 0), LABEL_HEIGHT[id], p[2]]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <button
        type="button"
        className={`tag tag--${id}${step === 0 ? ' tag--overview' : ''}${hovered || focused ? ' tag--hot' : ''}${dim ? ' tag--dim' : ''}${inStep && step !== 0 ? ' tag--open' : ''}`}
        style={{ ['--c' as string]: st.color }}
        onClick={() => useApp.getState().setStep(st.step, id)}
        onPointerEnter={() => useApp.getState().setHovered(id)}
        onPointerLeave={() => useApp.getState().setHovered(null)}
      >
        {id === 'optima' ? <img className="tag__brand" src="/brands/optima.jpeg" alt="OPTIMA" /> : <span className="tag__dot" />}
        <span className="tag__text">
          <strong>{st.label}</strong>
          {st.sub && <small>{st.sub}</small>}
          {id === 'gm' && (step !== 0 || status !== 'draft') && <em className={`tag__status tag__status--${status}`}>{status === 'won' || status === 'paid' ? 'Disetujui' : STATUS_TEXT[status]}</em>}
          {id === 'customer' && (status === 'won' || status === 'paid') && <em className="tag__status tag__status--won">WIN · Customer setuju</em>}
          {id === 'src-internal' && status === 'paid' && <em className="tag__status tag__status--paid">Revenue diterima</em>}
        </span>
      </button>
    </Html>
  );
}

function ZoneLabel({ step, portal }: { step: number; portal: LabelPortal }) {
  const zone = ZONES.find((z) => z.step === step)!;
  const active = useApp((s) => s.activeStep === step);
  const overview = useApp((s) => s.activeStep === 0);
  const compact = useThree((s) => s.size.width < 768);
  const info = STEPS[step - 1];
  return (
    <Html portal={portal} position={[zone.center[0], 0.05, compact && overview ? zone.center[2] : zone.center[2] + zone.size[1] / 2 + 0.2]} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
      <button
        type="button"
        className={`zone-tag${active ? ' zone-tag--active' : ''}`}
        style={{ ['--c' as string]: info.color }}
        onClick={() => useApp.getState().setStep(step)}
      >
        <b>{step}</b>
        {info.short}
      </button>
    </Html>
  );
}

export function Labels({ portal }: { portal: LabelPortal }) {
  return (
    <>
      {(Object.keys(STATIONS) as StationId[]).map((id) => (
        <StationLabel key={id} id={id} portal={portal} />
      ))}
      {ZONES.map((z) => (
        <ZoneLabel key={z.step} step={z.step} portal={portal} />
      ))}
    </>
  );
}
