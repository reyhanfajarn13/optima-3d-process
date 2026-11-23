import { expect, it } from 'vitest';
import { DELIVERY_DURATION_MS, REVENUE_DURATION_MS, deliveryProgress, revenueProgress } from './revenue';

it('keeps payment progress within the route, including delayed starts and background tabs', () => {
  const payment = { id: 1, proposalId: 2, amountRp: 100, grossProfitRp: 5, customerName: 'Customer', startedAt: 2000 };
  expect(revenueProgress(payment, 0)).toBe(0);
  expect(revenueProgress(payment, 2000)).toBe(0);
  expect(revenueProgress(payment, 2000 + REVENUE_DURATION_MS / 2)).toBe(0.5);
  expect(revenueProgress(payment, 2000 + REVENUE_DURATION_MS + 5000)).toBe(1);
});

it('keeps the truck parked during loading, then moves it to the customer before payment', () => {
  const delivery = { id: 1, proposalId: 2, customerName: 'Customer', volumeKL: 100, startedAt: 1000, departedAt: 3000, arrivesAt: 3000 + DELIVERY_DURATION_MS, deliveredAt: null };
  expect(deliveryProgress(delivery, 1000)).toBe(0);
  expect(deliveryProgress(delivery, 3000 + DELIVERY_DURATION_MS / 2)).toBe(0.5);
  expect(deliveryProgress(delivery, delivery.arrivesAt + 1000)).toBe(1);
});
