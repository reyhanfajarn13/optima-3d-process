import { TEM_CONFIG } from '../../data/dummy';
import type { DealAssessment, FollowUpPlan, ReviewContext } from '../../lib/dealPolicy';
import { useOffer } from '../../lib/useOffer';
import { useApp } from '../../store';

function ResultDimensions({ assessment }: { assessment: DealAssessment }) {
  return <div className="result-dimensions" aria-label="Profit TEM dan risiko customer">
    <div><small>Profit TEM</small><b>{assessment.profit} profit</b></div>
    <div><small>Risiko customer</small><b>{assessment.risk} risk</b></div>
  </div>;
}

export function SubmissionReasonWidget({ plan }: { plan: FollowUpPlan }) {
  const setPlan = useApp((s) => s.setFollowUp);
  return <section className="submission-reason" aria-label="Alasan melanjutkan penawaran">
    <label className="field"><span>Alasan melanjutkan penawaran (wajib)</span>
      <textarea aria-label="Alasan melanjutkan penawaran" required rows={4} value={plan.submissionReason} onChange={(e) => setPlan({ submissionReason:e.target.value })} placeholder="Tuliskan alasan mengapa penawaran ini ingin dilanjutkan." />
    </label>
    <small>Alasan disertakan pada lampiran internal proposal untuk ditinjau GM.</small>
  </section>;
}

function SalesReasonSummary({ plan }: { plan: FollowUpPlan }) {
  if (!plan.submissionReason.trim()) return null;
  return <div className="submission-reason-summary"><b>Alasan melanjutkan penawaran</b><p>{plan.submissionReason}</p></div>;
}

export function DealActionSummary({ offer, plan, showSubmissionDetails = true }: { offer: ReviewContext; plan: FollowUpPlan; showSubmissionDetails?: boolean }) {
  const { assessment } = offer;
  return <section className="deal-action-summary" aria-label="Result dan alasan Sales">
    <small>KELOMPOK RESULT</small>
    <strong data-result={assessment.code}>{assessment.title}</strong>
    <ResultDimensions assessment={assessment} />
    <p>Risiko customer bersumber dari penilaian Credit Risk atas NC Coal Price dan Data Site Customer.</p>
    <p><b>Recommended Action:</b> {assessment.recommendation}</p>
    {showSubmissionDetails && <SalesReasonSummary plan={plan} />}
  </section>;
}

export function DealActionWidget() {
  const offer = useOffer();
  const plan = useApp((s) => s.proposal?.salesAction ?? s.followUp);
  const readonly = useApp((s) => s.proposalStatus !== 'draft');
  const { assessment } = offer;

  return <section className={`deal-result deal-result--${assessment.profit.toLowerCase()}`} id="sales-action" aria-label="Kelompok Result dan Recommended Action">
    <div className="deal-result__head"><div><small>HASIL KALKULATOR</small><h3>Kelompok Result</h3></div><span>{new Intl.NumberFormat('id-ID',{maximumFractionDigits:3}).format(offer.result.marginPct)}% margin GP</span></div>
    <strong className="deal-result__group" data-result={assessment.code}>{assessment.title}</strong>
    <ResultDimensions assessment={assessment} />
    <p className="deal-result__basis">Profit TEM berdasarkan margin GP penawaran. Risiko customer berasal dari penilaian Credit Risk atas NC Coal Price dan Data Site Customer.</p>
    <div className="deal-recommendation"><b>Recommended Action · {assessment.action}</b><p>{assessment.recommendation}</p></div>
    <ol className="action-path" aria-label="Proses sebelum proposal"><li>Kalkulasi</li><li>Result</li><li className={readonly ? '' : 'is-active'}>Alasan Sales</li><li className={readonly ? 'is-active' : ''}>Proposal</li></ol>
    {readonly ? <SalesReasonSummary plan={plan} /> : <SubmissionReasonWidget plan={plan} />}
    <details className="result-thresholds"><summary>Ambang klasifikasi profit (dummy)</summary><p>Low: &lt;{TEM_CONFIG.profitMarginThresholds.medium}%. Medium: {TEM_CONFIG.profitMarginThresholds.medium}%–&lt;{TEM_CONFIG.profitMarginThresholds.high}%. High: ≥{TEM_CONFIG.profitMarginThresholds.high}%. Ambang tersimpan di parameter Data Warehouse.</p></details>
  </section>;
}
