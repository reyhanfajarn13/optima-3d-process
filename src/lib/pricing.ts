import type { CompetitorQuote, Customer } from '../data/dummy';
import { TEM_CONFIG } from '../data/dummy';

export type RiskTier = 'A' | 'B' | 'C';
export type PricingConfig = typeof TEM_CONFIG;

export interface RiskAssessment {
  realizedCoalPriceUsd: number;
  coalMarginPct: number;
  tier: RiskTier;
  label: string;
}

/** Kalkulator coal Tim Risk: seberapa sehat bisnis batu bara customer pada harga NC saat ini */
export function assessCustomerRisk(customer: Customer, ncPriceUsd: number): RiskAssessment {
  const realized = ncPriceUsd * customer.coalPriceFactor;
  const coalMarginPct = ((realized - customer.coalCashCostUsd) / realized) * 100;
  const tier: RiskTier = coalMarginPct >= 30 ? 'A' : coalMarginPct >= 15 ? 'B' : 'C';
  const label = tier === 'A' ? 'Risiko rendah' : tier === 'B' ? 'Risiko sedang' : 'Risiko tinggi';
  return { realizedCoalPriceUsd: realized, coalMarginPct, tier, label };
}

export interface OfferInput {
  customer: Customer;
  volumeKL: number;
  termDays: number;
  ncPriceUsd: number;
  competitors: CompetitorQuote[];
  /** Penyesuaian manual Sales terhadap rekomendasi (Rp/L) */
  adjustmentRp?: number;
  config?: PricingConfig;
}

export interface OfferResult {
  risk: RiskAssessment;
  effectiveTermDays: number;
  costRp: number;
  floorRp: number;
  competitorMinRp: number;
  competitorAvgRp: number;
  recommendedRp: number;
  offerRp: number;
  marginPct: number;
  grossProfitMonthlyRp: number;
  winProbabilityPct: number;
  warnings: string[];
  needsAttention: boolean;
}

const round10 = (v: number) => Math.round(v / 10) * 10;

/** Mesin rekomendasi harga OPTIMA (semua parameter berasal dari Integrated Data Warehouse) */
export function computeOffer(input: OfferInput): OfferResult {
  const cfg = input.config ?? TEM_CONFIG;
  const { customer } = input;
  const warnings: string[] = [];

  const risk = assessCustomerRisk(customer, input.ncPriceUsd);
  const maxTerm = cfg.maxTermDays[risk.tier];
  const effectiveTermDays = Math.min(Math.max(0, input.termDays), maxTerm);
  if (input.termDays > maxTerm) {
    warnings.push(`Termin dibatasi ${maxTerm} hari untuk customer kategori ${risk.tier}.`);
  }

  const financing = cfg.baseCostRp * cfg.financingRatePa * (effectiveTermDays / 365);
  const costRp = cfg.baseCostRp + customer.logisticsCostRp + financing;
  const requiredMargin = (cfg.minMarginPct + cfg.riskPremiumPct[risk.tier]) / 100;
  const floorRp = round10(costRp / (1 - requiredMargin));

  const regional = input.competitors.filter((q) => q.region === customer.region);
  if (regional.length === 0) throw new Error(`Tidak ada data kompetitor untuk wilayah ${customer.region}`);
  const competitorMinRp = Math.min(...regional.map((q) => q.priceRp));
  const competitorAvgRp = regional.reduce((s, q) => s + q.priceRp, 0) / regional.length;

  let competitive = competitorMinRp * (1 - cfg.targetUndercutPct / 100);
  if (input.volumeKL >= cfg.volumeDiscountThresholdKL) competitive *= 1 - cfg.volumeDiscountPct / 100;

  const recommendedRp = round10(Math.max(floorRp, competitive));
  const offerRp = round10(recommendedRp + (input.adjustmentRp ?? 0));

  if (floorRp > competitorMinRp) {
    warnings.push('Harga minimum TEM berada di atas harga kompetitor termurah — peluang menang rendah.');
  }
  if (risk.tier === 'C') {
    warnings.push('Profitabilitas batu bara customer tipis: pertimbangkan jaminan pembayaran.');
  }
  if (offerRp < floorRp) {
    warnings.push('Harga penawaran di bawah batas margin minimum — wajib persetujuan khusus GM.');
  }

  const marginPct = ((offerRp - costRp) / offerRp) * 100;
  const grossProfitMonthlyRp = (offerRp - costRp) * input.volumeKL * 1000;
  const gapPct = ((offerRp - competitorMinRp) / competitorMinRp) * 100;
  const winProbabilityPct = Math.min(95, Math.max(5, 100 / (1 + Math.exp(1.2 * (gapPct + 0.2)))));

  return {
    risk,
    effectiveTermDays,
    costRp,
    floorRp,
    competitorMinRp,
    competitorAvgRp,
    recommendedRp,
    offerRp,
    marginPct,
    grossProfitMonthlyRp,
    winProbabilityPct,
    warnings,
    needsAttention: warnings.length > 0,
  };
}
