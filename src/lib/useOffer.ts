import { useMemo } from 'react';
import { COAL_PRICES } from '../data/dummy';
import { useApp } from '../store';
import { calculateSalesOffer } from './offer';

export const LATEST_NC = COAL_PRICES[COAL_PRICES.length - 1].usdPerTon;

/** Hasil kalkulasi OPTIMA untuk input Sales saat ini */
export function useOffer() {
  const customerId = useApp((s) => s.customerId);
  const volumeKL = useApp((s) => s.volumeKL);
  const termDays = useApp((s) => s.termDays);
  const adjustmentRp = useApp((s) => s.adjustmentRp);
  const proposal = useApp((s) => s.proposal);
  const offer = useMemo(
    () => calculateSalesOffer({ customerId, volumeKL, termDays, adjustmentRp }),
    [customerId, volumeKL, termDays, adjustmentRp],
  );
  return proposal ?? offer;
}
