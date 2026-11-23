import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STEP } from './data/process';
import { useApp } from './store';
import { calculateSalesOffer } from './lib/offer';
import { REVENUE_DURATION_MS, UNLOADING_DURATION_MS } from './lib/revenue';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-23T00:00:00+07:00'));
  useApp.setState(useApp.getInitialState(), true);
});
afterEach(() => vi.useRealTimers());
const state = () => useApp.getState();
function completeSalesAction() {
  state().setFollowUp({submissionReason:'Potensi kontrak jangka panjang customer menjadi alasan melanjutkan penawaran untuk review GM.'});
}
function generate() { completeSalesAction(); state().generateProposal(); }
function approve() { state().setGMReviewed(true); state().decide(true); }
function dispatch() {
  generate(); state().sendToGM(); approve(); state().submitToCustomer(); state().winTender();
  return state().delivery!;
}
function arrive() {
  vi.setSystemTime(state().delivery!.arrivesAt);
  state().finishDelivery(state().delivery!.id);
}
function pay() {
  arrive();
  vi.setSystemTime(state().delivery!.deliveredAt! + UNLOADING_DURATION_MS);
  state().startRevenue(state().delivery!.id);
}

describe('OPTIMA Sales workflow', () => {
  it('keeps customer and calculator inputs across OPTIMA features and captures a proposal', () => {
    state().setCustomer('c2'); state().setCalc({ volumeKL: 1800, adjustmentRp: 50 });
    state().openOptima('analytics');
    expect(state().customerId).toBe('c2');
    state().openOptima('proposal'); generate();
    expect(state()).toMatchObject({ activeStep: STEP.optima, optimaTab: 'proposal', volumeKL: 1800, adjustmentRp: 50, proposalStatus: 'generated' });
    expect(state().proposal?.customer.id).toBe('c2');
  });

  it('locks the submitted offer through review, shipping, and payment', () => {
    generate(); state().sendToGM();
    const proposal = state().proposal;
    state().setCalc({ volumeKL: 9999 }); state().setCustomer('c4'); state().generateProposal();
    expect(state()).toMatchObject({ proposalStatus: 'sent', customerId: 'c1', volumeKL: 2600 });
    approve(); state().submitToCustomer(); state().winTender();
    state().setCalc({ adjustmentRp: -300 });
    pay();
    state().setCustomer('c3');
    expect(state().proposal).toBe(proposal);
    expect(state().adjustmentRp).toBe(0);
    expect(state().customerId).toBe('c1');
  });

  it('creates a fresh GP snapshot after a rejected offer is revised', () => {
    generate(); const first = state().proposal!;
    state().sendToGM(); state().decide(false, 'Margin terlalu tipis'); state().resetFlow();
    expect(state()).toMatchObject({ activeStep: STEP.optima, optimaTab: 'calculator', iteration: 2, proposalStatus: 'draft', proposal: null, gmNote: 'Margin terlalu tipis' });
    state().setCalc({ adjustmentRp: 100 }); generate();
    expect(state().proposal!.id).not.toBe(first.id);
    expect(state().proposal!.grossProfitRp).toBeGreaterThan(first.grossProfitRp);
    expect(first.result.offerRp).not.toBe(state().proposal!.result.offerRp);
  });

  it('discards a generated snapshot when Sales edits the draft inputs', () => {
    generate(); state().setCalc({ volumeKL: 1800 });
    expect(state()).toMatchObject({ proposalStatus: 'draft', proposal: null });
  });

  it('opens the proposal feature when Sales is selected', () => {
    state().setStep(STEP.optima, 'sales');
    expect(state()).toMatchObject({ activeStep: STEP.optima, focusStation: 'sales', optimaTab: 'proposal', panelOpen: true });
    state().setStep(6); expect(state().activeStep).toBe(STEP.decision);
  });
});

describe('WIN → HSD delivery → Revenue → realized GP', () => {
  it('dispatches once after customer WIN and does not start payment before delivery', () => {
    state().winTender(); expect(state().delivery).toBeNull();
    dispatch();
    const delivery = state().delivery!;
    expect(state()).toMatchObject({ proposalStatus: 'delivering', revenue: null, panelOpen: false, activeStep: 0 });
    state().winTender();
    expect(state().delivery).toBe(delivery);
    state().finishDelivery(delivery.id); state().startRevenue(delivery.id);
    expect(state()).toMatchObject({ proposalStatus: 'delivering', revenue: null });
    arrive();
    expect(state()).toMatchObject({ proposalStatus: 'delivered', revenue: null });
    state().startRevenue(delivery.id);
    expect(state().revenue).toBeNull();
    vi.setSystemTime(state().delivery!.deliveredAt! + UNLOADING_DURATION_MS);
    state().startRevenue(delivery.id);
    const payment = state().revenue;
    state().startRevenue(delivery.id);
    expect(state().revenue).toBe(payment);
    expect(state().proposalStatus).toBe('paying');
  });

  it('preserves the exact calculated GP through proposal, truck delivery, and customer payment', () => {
    state().setCustomer('c2'); state().setCalc({ volumeKL: 1800, adjustmentRp: 70 });
    const calculated = calculateSalesOffer(state()).result.grossProfitMonthlyRp;
    generate();
    const proposal = state().proposal!;
    expect(proposal.grossProfitRp).toBe(calculated);
    state().sendToGM(); approve(); state().submitToCustomer(); state().winTender();
    expect(state().delivery!.proposalId).toBe(proposal.id);
    pay();
    const payment = state().revenue!;
    expect(payment.grossProfitRp).toBe(calculated);
    expect(payment.amountRp).toBe(proposal.revenueRp);
    expect(payment.proposalId).toBe(proposal.id);
    expect(payment.amountRp).toBeGreaterThan(payment.grossProfitRp);
    state().finishCourier(payment.id);
    expect(state().proposalStatus).toBe('paying');
    vi.setSystemTime(payment.startedAt + REVENUE_DURATION_MS);
    state().finishCourier(payment.id);
    expect(state().proposalStatus).toBe('paid');
    expect(state().proposal).toBe(proposal);
    expect(state().revenue!.grossProfitRp).toBe(calculated);
    expect(state().celebrationStartedAt).toBe(Date.now());
    const logs = state().log.length;
    state().finishCourier(payment.id);
    expect(state().log).toHaveLength(logs);
  });

  it('ignores stale delivery/payment completion after reset and clears the celebration', () => {
    const old = dispatch(); state().resetFlow();
    vi.setSystemTime(old.arrivesAt + UNLOADING_DURATION_MS);
    state().finishDelivery(old.id); state().startRevenue(old.id);
    expect(state()).toMatchObject({ proposalStatus: 'draft', proposal: null, delivery: null, revenue: null, celebrationStartedAt: null });
    dispatch(); pay(); const payment = state().revenue!;
    state().resetFlow(); vi.setSystemTime(payment.startedAt + REVENUE_DURATION_MS); state().finishCourier(payment.id);
    expect(state()).toMatchObject({ proposalStatus: 'draft', revenue: null, couriers: [] });
  });
});

describe('Sales reason before proposal and GM review', () => {
  it('requires only a Sales reason to generate and still requires GM review before approval', () => {
    state().setCalc({termDays:0,adjustmentRp:300});
    state().generateProposal(); expect(state().proposal).toBeNull();
    completeSalesAction(); state().generateProposal();
    expect(state().proposal?.assessment.title).toBe('High profit, Low risk');
    state().sendToGM(); state().decide(true);
    expect(state().proposalStatus).toBe('sent');
    approve(); expect(state().proposalStatus).toBe('approved');
  });

  it('keeps the exact Result and Sales reason attached to a proposal and clears the reason when terms change', () => {
    state().setCustomer('c2'); state().setCalc({adjustmentRp:50}); generate();
    const proposal = state().proposal!;
    const reason = proposal.salesAction.submissionReason;
    state().setFollowUp({submissionReason:'Diubah setelah generate'});
    expect(state().proposal!.salesAction.submissionReason).toBe(reason);
    state().setCalc({adjustmentRp:100});
    expect(state()).toMatchObject({proposal:null,gmReviewed:false,followUp:{submissionReason:''}});
  });

  it('generates a Low profit / High customer risk offer with a Sales reason without changing price, GP, or customer risk', () => {
    state().setCustomer('c4'); state().setCalc({adjustmentRp:-300});
    const offer=calculateSalesOffer(state());
    state().generateProposal();
    expect(offer.assessment.title).toBe('Low profit, High risk');
    expect(state().proposal).toBeNull();
    state().setFollowUp({submissionReason:'  Peluang volume jangka panjang diajukan untuk pertimbangan GM, dengan negosiasi pembayaran bertahap.  '});
    state().generateProposal();
    const proposal=state().proposal!;
    expect(proposal.assessment.title).toBe('Low profit, High risk');
    expect(proposal.result.offerRp).toBe(offer.result.offerRp);
    expect(proposal.grossProfitRp).toBe(offer.result.grossProfitMonthlyRp);
    expect(proposal.result.risk).toEqual(offer.result.risk);
    expect(proposal.salesAction.submissionReason).toBe('Peluang volume jangka panjang diajukan untuk pertimbangan GM, dengan negosiasi pembayaran bertahap.');
    state().setFollowUp({submissionReason:'Diubah setelah generate'});
    expect(state().proposal!.salesAction.submissionReason).toBe(proposal.salesAction.submissionReason);
    state().sendToGM(); state().decide(true);
    expect(state().proposalStatus).toBe('sent');
    approve(); expect(state().proposalStatus).toBe('approved');
    expect(state().proposal!.salesAction.submissionReason).toBe(proposal.salesAction.submissionReason);
    state().submitToCustomer(); state().winTender(); pay();
    expect(state().revenue!.grossProfitRp).toBe(proposal.grossProfitRp);
  });

  it('uses a single Sales reason with no additional plan fields and clears it after terms change', () => {
    state().setCustomer('c2');
    state().setFollowUp({submissionReason:'Syarat awal diajukan untuk negosiasi dan evaluasi GM.'});
    state().generateProposal();
    expect(state().proposalStatus).toBe('generated');
    expect(state().proposal!.salesAction).toEqual({submissionReason:'Syarat awal diajukan untuk negosiasi dan evaluasi GM.'});
    state().setCalc({adjustmentRp:10});
    expect(state().followUp.submissionReason).toBe('');
    state().generateProposal(); expect(state().proposal).toBeNull();
  });

  it('requires a fresh Sales reason after GM rejects the offer or a new offer is started', () => {
    generate(); state().sendToGM(); state().decide(false,'Risiko customer tinggi');
    state().resetFlow();
    expect(state().followUp).toEqual({submissionReason:''});
    state().generateProposal(); expect(state().proposal).toBeNull();
    generate(); expect(state().proposalStatus).toBe('generated');
    state().resetFlow(); expect(state().followUp).toEqual({submissionReason:''});
  });
});
