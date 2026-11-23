import { beforeEach, describe, expect, it } from 'vitest';
import { STEP } from './data/process';
import { useApp } from './store';
import { COMPETITOR_QUOTES, COAL_PRICES, CUSTOMERS } from './data/dummy';
import { computeOffer } from './lib/pricing';

beforeEach(() => useApp.setState(useApp.getInitialState(), true));
const state = () => useApp.getState();

describe('OPTIMA Sales workflow', () => {
  it('keeps customer and calculator inputs across all three OPTIMA features', () => {
    state().setCustomer('c2');
    state().setCalc({ volumeKL: 1800, adjustmentRp: 50 });
    state().openOptima('analytics');
    expect(state().customerId).toBe('c2');
    state().openOptima('proposal');
    state().generateProposal();
    expect(state()).toMatchObject({ activeStep: STEP.optima, optimaTab: 'proposal', volumeKL: 1800, adjustmentRp: 50, proposalStatus: 'generated' });
  });

  it('locks the submitted price through GM approval and tender', () => {
    state().generateProposal();
    state().sendToGM();
    state().setCalc({ volumeKL: 9999 });
    state().setCustomer('c4');
    state().generateProposal();
    expect(state()).toMatchObject({ proposalStatus: 'sent', customerId: 'c1', volumeKL: 2600 });
    state().decide(true);
    state().submitToCustomer();
    expect(state().proposalStatus).toBe('submitted');
    expect(state().couriers.map((c) => c.route)).toEqual(['toGM', 'toCustomer']);
  });

  it('returns a rejected proposal to the OPTIMA calculator for revision', () => {
    state().generateProposal();
    state().sendToGM();
    state().setStep(STEP.decision);
    state().decide(false, 'Margin terlalu tipis');
    state().resetFlow();
    expect(state()).toMatchObject({ activeStep: STEP.optima, optimaTab: 'calculator', iteration: 2, proposalStatus: 'draft', gmNote: 'Margin terlalu tipis' });
    state().setCalc({ adjustmentRp: 100 });
    state().openOptima('proposal');
    state().generateProposal();
    state().sendToGM();
    expect(state()).toMatchObject({ proposalStatus: 'sent', iteration: 2, adjustmentRp: 100 });
  });

  it('opens the proposal feature when Sales is selected in the 3D scene', () => {
    state().setStep(STEP.optima, 'sales');
    expect(state()).toMatchObject({ activeStep: STEP.optima, focusStation: 'sales', optimaTab: 'proposal', panelOpen: true });
    state().setStep(6);
    expect(state().activeStep).toBe(STEP.decision);
  });

  it('starts Revenue only after customer WIN, snapshots the amount and prevents duplicate payments', () => {
    state().winTender();
    expect(state().revenue).toBeNull();
    state().setCalc({ volumeKL: 1800, adjustmentRp: 70 });
    state().generateProposal();
    state().sendToGM();
    state().decide(true);
    state().winTender();
    expect(state().revenue).toBeNull();
    state().submitToCustomer();
    state().winTender();
    const payment = state().revenue!;
    const offer = computeOffer({ customer: CUSTOMERS[0], volumeKL: 1800, termDays: 45, adjustmentRp: 70, competitors: COMPETITOR_QUOTES, ncPriceUsd: COAL_PRICES.at(-1)!.usdPerTon });
    expect(payment.amountRp).toBe(offer.offerRp * 1800 * 1000);
    expect(state()).toMatchObject({ proposalStatus: 'won', activeStep: 0, panelOpen: false });
    state().winTender();
    state().setCustomer('c4');
    state().setCalc({ volumeKL: 9000 });
    expect(state().revenue).toBe(payment);
    expect(state().volumeKL).toBe(1800);
    expect(state().couriers.filter((c) => c.route === 'revenue')).toHaveLength(1);
  });

  it('records one ERP receipt when the payment arrives and keeps the winning offer locked', () => {
    state().generateProposal(); state().sendToGM(); state().decide(true); state().submitToCustomer(); state().winTender();
    const payment = state().revenue!;
    state().finishCourier(payment.id + 999);
    expect(state().proposalStatus).toBe('won');
    state().finishCourier(payment.id);
    const logs = state().log.length;
    expect(state().proposalStatus).toBe('paid');
    expect(state().log[0].text).toContain('diterima di Data Transaksi TEM');
    expect(state().couriers.some((c) => c.route === 'revenue')).toBe(false);
    state().finishCourier(payment.id);
    state().setCalc({ volumeKL: 9000 });
    expect(state().log).toHaveLength(logs);
    expect(state().volumeKL).toBe(2600);
  });

  it('clears an in-flight payment on reset so its stale completion cannot credit a new offer', () => {
    state().generateProposal(); state().sendToGM(); state().decide(true); state().submitToCustomer(); state().winTender();
    const oldId = state().revenue!.id;
    state().resetFlow();
    state().finishCourier(oldId);
    expect(state()).toMatchObject({ proposalStatus: 'draft', revenue: null, couriers: [], activeStep: STEP.optima });
    expect(state().log.some((l) => l.text.includes('diterima di Data Transaksi'))).toBe(false);
  });
});
