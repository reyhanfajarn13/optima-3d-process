import { TEM_CONFIG } from '../data/dummy';
import type { RiskTier } from './pricing';

export type ProfitBand = 'High' | 'Medium' | 'Low';
export type ActionMode = 'proceed' | 'guarded' | 'protected' | 'improve' | 'negotiate' | 'renegotiate_protect' | 'grow' | 'revise' | 'decline';
export interface FollowUpPlan {
  submissionReason: string;
}

export const emptyFollowUp = (): FollowUpPlan => ({ submissionReason: '' });

interface Policy { mode: ActionMode; action: string; recommendation: string; }
export const DEAL_POLICIES: Record<`${ProfitBand}-${RiskTier}`, Policy> = {
  'High-A': { mode: 'proceed', action: 'Lanjutkan & prioritaskan', recommendation: 'Customer ideal. Lanjutkan dengan syarat penawaran saat ini dan prioritaskan hubungan bisnis.' },
  'High-B': { mode: 'guarded', action: 'Lanjut dengan pengamanan', recommendation: 'Penawaran menarik. Tetapkan limit kredit dan monitoring pembayaran berkala sebelum berkomitmen.' },
  'High-C': { mode: 'protected', action: 'Proteksi kuat & review manajemen', recommendation: 'Profit tinggi disertai eksposur tinggi. Gunakan prepayment, bank guarantee, atau termin lebih pendek, lalu ajukan review manajemen.' },
  'Medium-A': { mode: 'improve', action: 'Lanjut & rencanakan peningkatan', recommendation: 'Bisnis aman dan stabil. Lanjutkan sambil menyusun peluang peningkatan margin atau volume.' },
  'Medium-B': { mode: 'negotiate', action: 'Perbaiki margin atau termin', recommendation: 'Penawaran seimbang dengan bantalan profit tipis. Naikkan margin atau pendekkan termin, dan lanjutkan secara hati-hati dengan monitoring pembayaran.' },
  'Medium-C': { mode: 'renegotiate_protect', action: 'Negosiasi & mitigasi sebelum lanjut', recommendation: 'Profit belum sepadan dengan risiko. Perbaiki margin, prepayment, atau jaminan terlebih dahulu; ajukan review manajemen, atau tunda penawaran.' },
  'Low-A': { mode: 'grow', action: 'Negosiasi margin / volume', recommendation: 'Risiko rendah, imbal hasil terbatas. Negosiasikan margin atau tambah volume; jika belum dapat diperbaiki, tandai sebagai akun prioritas rendah untuk review GM.' },
  'Low-B': { mode: 'revise', action: 'Negosiasi syarat / ajukan pertimbangan', recommendation: 'Profit TEM rendah dengan risiko customer sedang. Negosiasikan margin dan termin, atau pertimbangkan tunda/tolak. Jika tetap diajukan, sertakan alasan dan pertimbangan Sales untuk review GM.' },
  'Low-C': { mode: 'decline', action: 'Evaluasi kelayakan / ajukan pertimbangan', recommendation: 'Profit TEM rendah dengan risiko customer tinggi. Rekomendasinya menolak atau mengubah syarat secara signifikan. Sales tetap dapat membuat proposal dengan alasan mengapa peluang ini diajukan dan layak dipertimbangkan GM.' },
};

export function assessDeal(marginPct: number, tier: RiskTier, thresholds = TEM_CONFIG.profitMarginThresholds) {
  if (!Number.isFinite(marginPct) || thresholds.medium >= thresholds.high) throw new Error('Margin / ambang profit tidak valid');
  const profit: ProfitBand = marginPct >= thresholds.high ? 'High' : marginPct >= thresholds.medium ? 'Medium' : 'Low';
  const risk = tier === 'A' ? 'Low' : tier === 'B' ? 'Medium' : 'High';
  const code: `${ProfitBand}-${RiskTier}` = `${profit}-${tier}`;
  return { ...DEAL_POLICIES[code], code, profit, risk, title: `${profit} profit, ${risk} risk`, marginPct };
}
export type DealAssessment = ReturnType<typeof assessDeal>;
export interface ReviewContext {
  volumeKL: number;
  assessment: DealAssessment;
}

/** Semua kategori dapat diajukan; Sales cukup melengkapi alasan melanjutkan. */
export function reviewReadiness(offer: ReviewContext, plan: FollowUpPlan) {
  const reasons: string[] = [];
  if (!Number.isFinite(offer.volumeKL) || offer.volumeKL <= 0) reasons.push('Volume penawaran harus lebih dari nol.');
  if (!plan.submissionReason.trim()) reasons.push('Isi alasan melanjutkan penawaran untuk review GM.');
  return { ready: reasons.length === 0, reasons };
}
