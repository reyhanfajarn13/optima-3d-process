import { describe, expect, it } from 'vitest';
import { CUSTOMERS } from '../data/dummy';
import { assessDeal, emptyFollowUp, reviewReadiness, type FollowUpPlan, type ReviewContext } from './dealPolicy';
import { calculateSalesOffer } from './offer';

describe('Kelompok Result from actual GP margin', () => {
  it('classifies all nine profit/risk combinations using the supplied matrix', () => {
    const modes = [['proceed','guarded','protected'],['improve','negotiate','renegotiate_protect'],['grow','revise','decline']];
    [6,4,2].forEach((margin,i) => (['A','B','C'] as const).forEach((risk,j) => {
      expect(assessDeal(margin,risk).mode).toBe(modes[i][j]);
    }));
  });
  it('uses the unrounded margin at exact thresholds and accepts configured limits', () => {
    expect(assessDeal(2.999999,'A').profit).toBe('Low');
    expect(assessDeal(3,'A').profit).toBe('Medium');
    expect(assessDeal(4.999999,'A').profit).toBe('Medium');
    expect(assessDeal(5,'A').profit).toBe('High');
    expect(assessDeal(4,'A',{medium:4,high:6}).profit).toBe('Medium');
    expect(()=>assessDeal(NaN,'A')).toThrow();
  });
  it('does not classify by nominal GP when only volume changes', () => {
    const input={customerId:'c1',termDays:30,adjustmentRp:100};
    const a=calculateSalesOffer({...input,volumeKL:1000});
    const b=calculateSalesOffer({...input,volumeKL:1500});
    expect(a.result.grossProfitMonthlyRp).not.toBe(b.result.grossProfitMonthlyRp);
    expect(a.assessment.title).toBe(b.assessment.title);
    expect(a.assessment.marginPct).toBe(b.assessment.marginPct);
  });
  it('keeps customer risk independent of changes to TEM GP and sales terms', () => {
    for (const customerId of ['c1','c2','c4']) {
      const low=calculateSalesOffer({customerId,volumeKL:1000,termDays:60,adjustmentRp:-300});
      const high=calculateSalesOffer({customerId,volumeKL:2500,termDays:0,adjustmentRp:300});
      expect(low.result.marginPct).not.toBe(high.result.marginPct);
      expect(low.assessment.profit).not.toBe(high.assessment.profit);
      expect(low.result.risk).toEqual(high.result.risk);
      expect(low.assessment.risk).toBe(high.assessment.risk);
    }
  });
  it('uses anonymized customers throughout the shared data source', () => {
    expect(CUSTOMERS.map((c)=>c.name)).toEqual(['PT A','PT B','PT C','PT D','PT E','PT F']);
  });
});

const context=(margin:number,risk:'A'|'B'|'C'):ReviewContext=>({volumeKL:1500,assessment:assessDeal(margin,risk)});
const plan=(patch:Partial<FollowUpPlan>={}):FollowUpPlan=>({...emptyFollowUp(),...patch});

describe('Recommended Action and Sales justification', () => {
  it.each([6,4,2].flatMap(margin=>(['A','B','C'] as const).map(risk=>({margin,risk}))))('permits proposal generation for margin $margin and customer risk $risk with a Sales reason', ({margin,risk}) => {
    const assessment=reviewReadiness(context(margin,risk),{...emptyFollowUp(),submissionReason:'Peluang bisnis strategis dengan pengiriman bertahap untuk dipertimbangkan GM.'});
    expect(assessment.ready).toBe(true);
    expect(assessment.reasons).toEqual([]);
    expect(reviewReadiness(context(margin,risk),emptyFollowUp()).ready).toBe(false);
  });
  it('rejects whitespace as a reason and permits a below-floor offer with only a Sales reason', () => {
    expect(reviewReadiness(context(2,'C'),plan({submissionReason:' \n\t '})).ready).toBe(false);
    const below=calculateSalesOffer({customerId:'c4',termDays:60,volumeKL:820,adjustmentRp:-300});
    expect(below.result.offerRp).toBeLessThan(below.result.floorRp);
    expect(reviewReadiness(below,plan({submissionReason:'Harga penetrasi untuk peluang volume baru, diajukan ke GM.'})).ready).toBe(true);
  });
  it('requires a valid volume independently of the Sales reason', () => {
    const p=plan({submissionReason:'Pengajuan peluang bisnis untuk dipertimbangkan GM.'});
    for (const volumeKL of [0,-1,NaN,Infinity]) expect(reviewReadiness({...context(2,'C'),volumeKL},p).ready).toBe(false);
  });
});
