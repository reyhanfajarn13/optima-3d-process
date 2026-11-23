/** Waktu untuk membuka ringkasan, lalu memperlihatkan pembayaran ke ERP. */
export const REVENUE_CAMERA_DELAY_MS = 2_000;
export const REVENUE_DURATION_MS = 8_500;
export const LOADING_DURATION_MS = 2_200;
export const DELIVERY_DURATION_MS = 10_000;
export const UNLOADING_DURATION_MS = 1_800;
export const CELEBRATION_DURATION_MS = 9_000;

export interface FuelDelivery {
  id: number;
  proposalId: number;
  customerName: string;
  volumeKL: number;
  startedAt: number;
  departedAt: number;
  arrivesAt: number;
  deliveredAt: number | null;
}

export interface RevenuePayment {
  id: number;
  customerName: string;
  amountRp: number;
  proposalId: number;
  grossProfitRp: number;
  startedAt: number;
}

export function deliveryProgress(delivery: FuelDelivery, at = Date.now()) {
  return Math.min(1, Math.max(0, (at - delivery.departedAt) / DELIVERY_DURATION_MS));
}

export function revenueProgress(payment: RevenuePayment, at = Date.now()) {
  return Math.min(1, Math.max(0, (at - payment.startedAt) / REVENUE_DURATION_MS));
}
