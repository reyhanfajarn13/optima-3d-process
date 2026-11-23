import { create } from 'zustand';
import { CUSTOMERS } from './data/dummy';
import { STEP, STEPS, type OptimaTab, type StationId } from './data/process';
import { fmtRp } from './lib/format';
import { DELIVERY_DURATION_MS, LOADING_DURATION_MS, REVENUE_CAMERA_DELAY_MS, REVENUE_DURATION_MS, UNLOADING_DURATION_MS, type FuelDelivery, type RevenuePayment } from './lib/revenue';
import { calculateSalesOffer, snapshotProposal, type ProposalSnapshot } from './lib/offer';
import { emptyFollowUp, reviewReadiness, type FollowUpPlan } from './lib/dealPolicy';

export type ProposalStatus = 'draft' | 'generated' | 'sent' | 'approved' | 'rejected' | 'submitted' | 'delivering' | 'delivered' | 'paying' | 'paid';
export type CourierRoute = 'toGM' | 'toCustomer' | 'toSales' | 'revenue';

export interface Courier {
  id: number;
  route: CourierRoute;
}

export interface LogEntry {
  id: number;
  at: string;
  text: string;
  tone: 'info' | 'good' | 'bad';
}

interface AppState {
  activeStep: number; // 0 = ringkasan seluruh proses
  focusStation: StationId | null;
  cameraNonce: number;
  hovered: StationId | null;
  tour: boolean;
  animate: boolean;
  panelOpen: boolean;
  optimaTab: OptimaTab;

  customerId: string;
  volumeKL: number;
  termDays: number;
  adjustmentRp: number;

  proposalStatus: ProposalStatus;
  proposal: ProposalSnapshot | null;
  followUp: FollowUpPlan;
  gmReviewed: boolean;
  delivery: FuelDelivery | null;
  celebrationStartedAt: number | null;
  iteration: number;
  gmNote: string | null;
  couriers: Courier[];
  revenue: RevenuePayment | null;
  log: LogEntry[];

  setStep: (step: number, focus?: StationId | null) => void;
  openOptima: (tab: OptimaTab) => void;
  setOptimaTab: (tab: OptimaTab) => void;
  recenter: () => void;
  setHovered: (id: StationId | null) => void;
  setTour: (on: boolean) => void;
  setAnimate: (on: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  setCustomer: (id: string) => void;
  setCalc: (patch: Partial<Pick<AppState, 'volumeKL' | 'termDays' | 'adjustmentRp'>>) => void;
  generateProposal: () => void;
  setFollowUp: (patch: Partial<FollowUpPlan>) => void;
  setGMReviewed: (reviewed: boolean) => void;
  sendToGM: () => void;
  decide: (approve: boolean, note?: string) => void;
  submitToCustomer: () => void;
  winTender: () => void;
  finishDelivery: (id: number) => void;
  startRevenue: (deliveryId: number) => void;
  finishCourier: (id: number) => void;
  resetFlow: () => void;
}

/** Input kalkulator dikunci selama proposal diproses GM / tender */
export const isLocked = (s: ProposalStatus) => !['draft', 'generated', 'rejected'].includes(s);

/** Mengubah input setelah ditolak GM otomatis membuka revisi baru */
const reopen = (s: { proposalStatus: ProposalStatus; iteration: number }) => ({
  proposalStatus: 'draft' as const,
  proposal: null,
  followUp: emptyFollowUp(),
  gmReviewed: false,
  iteration: s.proposalStatus === 'rejected' ? s.iteration + 1 : s.iteration,
});

let seq = 1;
const now = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const entry = (text: string, tone: LogEntry['tone'] = 'info'): LogEntry => ({ id: seq++, at: now(), text, tone });

const first = CUSTOMERS[0];

export const useApp = create<AppState>((set, get) => ({
  activeStep: 0,
  focusStation: null,
  cameraNonce: 0,
  hovered: null,
  tour: false,
  animate: typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  // ponsel: panel (bottom sheet) tertutup di awal agar peta 3D terlihat
  panelOpen: typeof window === 'undefined' || window.innerWidth >= 1024,
  optimaTab: 'calculator',

  customerId: first.id,
  volumeKL: first.avgMonthlyVolumeKL,
  termDays: first.paymentTermDays,
  adjustmentRp: 0,

  proposalStatus: 'draft',
  proposal: null,
  followUp: emptyFollowUp(),
  gmReviewed: false,
  delivery: null,
  celebrationStartedAt: null,
  iteration: 1,
  gmNote: null,
  couriers: [],
  revenue: null,
  log: [],

  setStep: (step, focus = null) =>
    set((s) => ({ activeStep: Math.max(0, Math.min(STEPS.length, step)), focusStation: focus, cameraNonce: s.cameraNonce + 1, panelOpen: true, ...(focus === 'sales' ? { optimaTab: 'proposal' as const } : {}) })),
  openOptima: (tab) => set((s) => ({ activeStep: STEP.optima, optimaTab: tab, focusStation: null, cameraNonce: s.cameraNonce + 1, panelOpen: true, tour: false })),
  setOptimaTab: (tab) => set({ optimaTab: tab, tour: false }),
  recenter: () => set((s) => ({ cameraNonce: s.cameraNonce + 1 })),
  setHovered: (id) => set({ hovered: id }),
  setTour: (on) => set({ tour: on }),
  setAnimate: (on) => set({ animate: on }),
  setPanelOpen: (open) => set({ panelOpen: open }),

  setCustomer: (id) => {
    const c = CUSTOMERS.find((x) => x.id === id);
    if (!c || isLocked(get().proposalStatus)) return;
    set({ customerId: id, volumeKL: c.avgMonthlyVolumeKL, termDays: c.paymentTermDays, adjustmentRp: 0, ...reopen(get()) });
  },
  setCalc: (patch) => {
    if (isLocked(get().proposalStatus)) return;
    set({ ...patch, ...reopen(get()) });
  },

  generateProposal: () => {
    if (get().proposalStatus !== 'draft') return;
    const s = get();
    if (!reviewReadiness(calculateSalesOffer(s), s.followUp).ready) return;
    const proposal = snapshotProposal(s, seq++, s.iteration, s.followUp);
    set({ proposalStatus: 'generated', proposal, gmReviewed: false, log: [entry(`Proposal revisi #${s.iteration} · ${proposal.assessment.title} · GP ${fmtRp(proposal.grossProfitRp)}/bulan · alasan melanjutkan penawaran dari Sales terlampir untuk GM`), ...s.log] });
  },

  setFollowUp: (patch) => {
    if (get().proposalStatus !== 'draft') return;
    set((s) => ({ followUp: { ...s.followUp, ...patch }, tour: false }));
  },
  setGMReviewed: (reviewed) => {
    if (get().proposalStatus === 'sent') set({ gmReviewed: reviewed, tour: false });
  },

  sendToGM: () => {
    if (get().proposalStatus !== 'generated') return;
    set((s) => ({
      proposalStatus: 'sent',
      gmReviewed: false,
      couriers: [...s.couriers, { id: seq++, route: 'toGM' }],
      log: [entry('Proposal dikirim via email ke GM Sales'), ...s.log],
    }));
  },

  decide: (approve, note) => {
    if (get().proposalStatus !== 'sent') return;
    if (approve && !get().gmReviewed) return;
    if (approve) {
      set((s) => ({
        proposalStatus: 'approved',
        gmNote: null,
        log: [entry('GM Sales menyetujui proposal', 'good'), ...s.log],
      }));
    } else {
      set((s) => ({
        proposalStatus: 'rejected',
        gmNote: note ?? 'Perlu revisi',
        couriers: [...s.couriers, { id: seq++, route: 'toSales' }],
        log: [entry(`GM Sales menolak: ${note ?? 'perlu revisi'}`, 'bad'), ...s.log],
      }));
    }
  },

  submitToCustomer: () => {
    if (get().proposalStatus !== 'approved') return;
    set((s) => ({
      proposalStatus: 'submitted',
      couriers: [...s.couriers, { id: seq++, route: 'toCustomer' }],
      log: [entry('Proposal diajukan ke customer untuk tender', 'good'), ...s.log],
    }));
  },

  winTender: () => {
    const s = get();
    if (s.proposalStatus !== 'submitted' || !s.proposal) return;
    const proposal = s.proposal;
    const id = seq++;
    const startedAt = Date.now() + REVENUE_CAMERA_DELAY_MS;
    const departedAt = startedAt + LOADING_DURATION_MS;
    set({
      proposalStatus: 'delivering',
      delivery: { id, proposalId: proposal.id, customerName: proposal.customer.name, volumeKL: proposal.volumeKL, startedAt, departedAt, arrivesAt: departedAt + DELIVERY_DURATION_MS, deliveredAt: null },
      revenue: null, couriers: [], celebrationStartedAt: null,
      log: [entry(`WIN — ${proposal.customer.name} setuju. Muat HSD dari tangki TEM, lalu kirim dengan truk · GP tetap ${fmtRp(proposal.grossProfitRp)}`, 'good'), ...s.log],
      // Perlihatkan tangki di luar kantor dan seluruh jalan menuju tambang.
      activeStep: 0, focusStation: null, panelOpen: false, tour: false, cameraNonce: s.cameraNonce + 1,
    });
  },

  finishDelivery: (id) => {
    const s = get();
    if (s.proposalStatus !== 'delivering' || s.delivery?.id !== id || Date.now() < s.delivery.arrivesAt) return;
    set({ proposalStatus: 'delivered', delivery: { ...s.delivery, deliveredAt: Date.now() }, log: [entry('Truk tiba di tambang customer. HSD diterima; bongkar muatan sebelum pembayaran.', 'good'), ...s.log] });
  },

  startRevenue: (deliveryId) => {
    const s = get();
    if (s.proposalStatus !== 'delivered' || s.delivery?.id !== deliveryId || s.delivery.deliveredAt === null || !s.proposal || Date.now() < s.delivery.deliveredAt + UNLOADING_DURATION_MS) return;
    const id = seq++;
    set({
      proposalStatus: 'paying',
      revenue: { id, proposalId: s.proposal.id, customerName: s.proposal.customer.name, amountRp: s.proposal.revenueRp, grossProfitRp: s.proposal.grossProfitRp, startedAt: Date.now() },
      couriers: [{ id, route: 'revenue' }],
      log: [entry(`HSD selesai dibongkar. Pembayaran customer merealisasikan Gross Profit Riil ${fmtRp(s.proposal.grossProfitRp)}, sama dengan GP penawaran.`, 'good'), ...s.log],
    });
  },

  finishCourier: (id) => set((s) => {
    const couriers = s.couriers.filter((c) => c.id !== id);
    if (s.proposalStatus !== 'paying' || s.revenue?.id !== id) return { couriers };
    if (Date.now() < s.revenue.startedAt + REVENUE_DURATION_MS) return {};
    return {
      couriers, proposalStatus: 'paid', celebrationStartedAt: Date.now(), cameraNonce: s.cameraNonce + 1,
      log: [entry(`Gross Profit Riil ${fmtRp(s.revenue.grossProfitRp)} terealisasi di Data Transaksi TEM · Oracle NetSuite, sama dengan GP proposal. Pembayaran customer ${fmtRp(s.revenue.amountRp)} · Customer happy & Sales happy`, 'good'), ...s.log],
    };
  }),

  /** Mulai iterasi baru setelah ditolak, atau mulai penawaran baru setelah tender */
  resetFlow: () =>
    set((s) => ({
      proposalStatus: 'draft',
      iteration: s.proposalStatus === 'rejected' ? s.iteration + 1 : 1,
      gmNote: s.proposalStatus === 'rejected' ? s.gmNote : null,
      revenue: null,
      proposal: null,
      followUp: emptyFollowUp(),
      gmReviewed: false,
      delivery: null,
      celebrationStartedAt: null,
      couriers: [],
      activeStep: STEP.optima,
      optimaTab: 'calculator',
      panelOpen: true,
      tour: false,
      focusStation: null,
      cameraNonce: s.cameraNonce + 1,
    })),
}));
