/** Waktu untuk membuka ringkasan, lalu memperlihatkan pembayaran ke ERP. */
export const REVENUE_CAMERA_DELAY_MS = 2_000;
export const REVENUE_DURATION_MS = 8_500;

export interface RevenuePayment {
  id: number;
  customerName: string;
  amountRp: number;
  startedAt: number;
}

export function revenueProgress(payment: RevenuePayment, at = Date.now()) {
  return Math.min(1, Math.max(0, (at - payment.startedAt) / REVENUE_DURATION_MS));
}
