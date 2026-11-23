import { COAL_PRICES, COMPETITOR_QUOTES, CUSTOMERS } from '../data/dummy';
import { computeOffer } from './pricing';
import { assessDeal, type FollowUpPlan } from './dealPolicy';

export interface SalesInputs {
  customerId: string;
  volumeKL: number;
  termDays: number;
  adjustmentRp: number;
}

export function calculateSalesOffer(input: SalesInputs) {
  const customer = CUSTOMERS.find((c) => c.id === input.customerId) ?? CUSTOMERS[0];
  const result = computeOffer({ ...input, customer, ncPriceUsd: COAL_PRICES.at(-1)!.usdPerTon, competitors: COMPETITOR_QUOTES });
  return { customer, volumeKL: input.volumeKL, termDays: input.termDays, adjustmentRp: input.adjustmentRp, result, assessment: assessDeal(result.marginPct, result.risk.tier) };
}

/** Satu hasil penawaran untuk proposal, pengiriman, hingga realisasi GP. */
export interface ProposalSnapshot extends ReturnType<typeof calculateSalesOffer> {
  id: number;
  iteration: number;
  generatedAt: number;
  revenueRp: number;
  grossProfitRp: number;
  salesAction: FollowUpPlan;
}

export function snapshotProposal(input: SalesInputs, id: number, iteration: number, salesAction: FollowUpPlan): ProposalSnapshot {
  const offer = calculateSalesOffer(input);
  return { ...offer, id, iteration, generatedAt: Date.now(), revenueRp: offer.result.offerRp * offer.volumeKL * 1000, grossProfitRp: offer.result.grossProfitMonthlyRp, salesAction: { ...salesAction, submissionReason: salesAction.submissionReason.trim() } };
}
