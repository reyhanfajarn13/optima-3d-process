import { describe, expect, it } from 'vitest';
import { COMPETITOR_QUOTES, CUSTOMERS, TEM_CONFIG } from '../data/dummy';
import { assessCustomerRisk, computeOffer } from './pricing';

const byId = (id: string) => CUSTOMERS.find((c) => c.id === id)!;

describe('assessCustomerRisk', () => {
  it('classifies healthy, medium and thin-margin miners', () => {
    expect(assessCustomerRisk(byId('c1'), 121.5).tier).toBe('A');
    expect(assessCustomerRisk(byId('c2'), 121.5).tier).toBe('B');
    expect(assessCustomerRisk(byId('c4'), 121.5).tier).toBe('C');
  });

  it('gets riskier when coal price falls', () => {
    const high = assessCustomerRisk(byId('c3'), 130).coalMarginPct;
    const low = assessCustomerRisk(byId('c3'), 95).coalMarginPct;
    expect(low).toBeLessThan(high);
  });
});

describe('computeOffer', () => {
  const base = { ncPriceUsd: 121.5, competitors: COMPETITOR_QUOTES };

  it('never recommends below the margin floor', () => {
    for (const customer of CUSTOMERS) {
      const r = computeOffer({ ...base, customer, volumeKL: customer.avgMonthlyVolumeKL, termDays: customer.paymentTermDays });
      expect(r.recommendedRp).toBeGreaterThanOrEqual(r.floorRp);
      expect(r.recommendedRp % 10).toBe(0);
    }
  });

  it('caps payment term by risk tier', () => {
    const r = computeOffer({ ...base, customer: byId('c4'), volumeKL: 800, termDays: 90 });
    expect(r.effectiveTermDays).toBe(TEM_CONFIG.maxTermDays.C);
    expect(r.warnings.some((w) => w.includes('Termin'))).toBe(true);
  });

  it('applies the sales adjustment and flags under-floor offers', () => {
    const plain = computeOffer({ ...base, customer: byId('c1'), volumeKL: 1000, termDays: 30 });
    const cut = computeOffer({ ...base, customer: byId('c1'), volumeKL: 1000, termDays: 30, adjustmentRp: -2000 });
    expect(cut.offerRp).toBe(plain.recommendedRp - 2000);
    expect(cut.needsAttention).toBe(true);
    expect(cut.winProbabilityPct).toBeGreaterThan(plain.winProbabilityPct);
  });

  it('throws when the region has no competitor data', () => {
    expect(() => computeOffer({ ...base, competitors: [], customer: byId('c1'), volumeKL: 1, termDays: 0 })).toThrow();
  });
});
