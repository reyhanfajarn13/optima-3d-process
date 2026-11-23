import { create } from 'zustand';
import { COAL_PRICES, COMPETITOR_QUOTES, CUSTOMERS } from './data/dummy';
import { STEP, STEPS, type OptimaTab, type StationId } from './data/process';
import { computeOffer } from './lib/pricing';
import { fmtRp } from './lib/format';
import { REVENUE_CAMERA_DELAY_MS, type RevenuePayment } from './lib/revenue';

export type ProposalStatus = 'draft' | 'generated' | 'sent' | 'approved' | 'rejected' | 'submitted' | 'won' | 'paid';
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
  sendToGM: () => void;
  decide: (approve: boolean, note?: string) => void;
  submitToCustomer: () => void;
  winTender: () => void;
  finishCourier: (id: number) => void;
  resetFlow: () => void;
}

/** Input kalkulator dikunci selama proposal diproses GM / tender */
export const isLocked = (s: ProposalStatus) => s === 'sent' || s === 'approved' || s === 'submitted' || s === 'won' || s === 'paid';

/** Mengubah input setelah ditolak GM otomatis membuka revisi baru */
const reopen = (s: { proposalStatus: ProposalStatus; iteration: number }) => ({
  proposalStatus: 'draft' as const,
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
    set((s) => ({ proposalStatus: 'generated', log: [entry(`Proposal revisi #${s.iteration} dibuat otomatis dari OPTIMA`), ...s.log] }));
  },

  sendToGM: () => {
    if (get().proposalStatus !== 'generated') return;
    set((s) => ({
      proposalStatus: 'sent',
      couriers: [...s.couriers, { id: seq++, route: 'toGM' }],
      log: [entry('Proposal dikirim via email ke GM Sales'), ...s.log],
    }));
  },

  decide: (approve, note) => {
    if (get().proposalStatus !== 'sent') return;
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
    if (s.proposalStatus !== 'submitted') return;
    const customer = CUSTOMERS.find((c) => c.id === s.customerId)!;
    const offer = computeOffer({ customer, volumeKL: s.volumeKL, termDays: s.termDays, adjustmentRp: s.adjustmentRp, ncPriceUsd: COAL_PRICES[COAL_PRICES.length - 1].usdPerTon, competitors: COMPETITOR_QUOTES });
    const id = seq++;
    set({
      proposalStatus: 'won',
      revenue: { id, customerName: customer.name, amountRp: offer.offerRp * s.volumeKL * 1000, startedAt: Date.now() + REVENUE_CAMERA_DELAY_MS },
      couriers: [...s.couriers, { id, route: 'revenue' }],
      log: [entry(`WIN — ${customer.name} menyetujui penawaran; simulasi pembayaran Revenue dimulai`, 'good'), ...s.log],
      // Tampilkan seluruh jalur customer → ERP sebelum uang mulai bergerak.
      activeStep: 0, focusStation: null, panelOpen: false, tour: false, cameraNonce: s.cameraNonce + 1,
    });
  },

  finishCourier: (id) => set((s) => {
    const couriers = s.couriers.filter((c) => c.id !== id);
    if (s.proposalStatus !== 'won' || s.revenue?.id !== id) return { couriers };
    return {
      couriers, proposalStatus: 'paid',
      log: [entry(`Revenue ${fmtRp(s.revenue.amountRp)} dari ${s.revenue.customerName} diterima di Data Transaksi TEM · Oracle NetSuite (simulasi 1 bulan)`, 'good'), ...s.log],
    };
  }),

  /** Mulai iterasi baru setelah ditolak, atau mulai penawaran baru setelah tender */
  resetFlow: () =>
    set((s) => ({
      proposalStatus: 'draft',
      iteration: s.proposalStatus === 'rejected' ? s.iteration + 1 : 1,
      gmNote: s.proposalStatus === 'rejected' ? s.gmNote : null,
      revenue: null,
      couriers: [],
      activeStep: STEP.optima,
      optimaTab: 'calculator',
      panelOpen: true,
      tour: false,
      focusStation: null,
      cameraNonce: s.cameraNonce + 1,
    })),
}));
