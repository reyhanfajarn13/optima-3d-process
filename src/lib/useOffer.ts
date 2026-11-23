import { useMemo } from 'react';
import { COAL_PRICES, COMPETITOR_QUOTES, CUSTOMERS } from '../data/dummy';
import { useApp } from '../store';
import { computeOffer } from './pricing';

export const LATEST_NC = COAL_PRICES[COAL_PRICES.length - 1].usdPerTon;

/** Hasil kalkulasi OPTIMA untuk input Sales saat ini */
export function useOffer() {
  const customerId = useApp((s) => s.customerId);
  const volumeKL = useApp((s) => s.volumeKL);
  const termDays = useApp((s) => s.termDays);
  const adjustmentRp = useApp((s) => s.adjustmentRp);
  const customer = CUSTOMERS.find((c) => c.id === customerId) ?? CUSTOMERS[0];
  const result = useMemo(
    () => computeOffer({ customer, volumeKL, termDays, adjustmentRp, ncPriceUsd: LATEST_NC, competitors: COMPETITOR_QUOTES }),
    [customer, volumeKL, termDays, adjustmentRp],
  );
  return { customer, volumeKL, termDays, adjustmentRp, result };
}
