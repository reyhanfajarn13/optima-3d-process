import { expect, it } from 'vitest';
import { REVENUE_DURATION_MS, revenueProgress } from './revenue';

it('keeps payment progress within the route, including delayed starts and background tabs', () => {
  const payment = { id: 1, amountRp: 100, customerName: 'Customer', startedAt: 2000 };
  expect(revenueProgress(payment, 0)).toBe(0);
  expect(revenueProgress(payment, 2000)).toBe(0);
  expect(revenueProgress(payment, 2000 + REVENUE_DURATION_MS / 2)).toBe(0.5);
  expect(revenueProgress(payment, 2000 + REVENUE_DURATION_MS + 5000)).toBe(1);
});
