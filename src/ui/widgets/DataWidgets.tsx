import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store';
import { COAL_PRICES, COMPETITOR_QUOTES, CUSTOMER_HISTORY, CUSTOMERS, REGIONS, TEM_CONFIG, type RegionId } from '../../data/dummy';
import { fmtDate, fmtNum, fmtPct, fmtRp, fmtRpCompact, fmtUsd } from '../../lib/format';
import { assessCustomerRisk, type RiskTier } from '../../lib/pricing';
import { LATEST_NC } from '../../lib/useOffer';
import { BarChart, LineChart } from '../charts';
import { RevenueReceipt } from '../Revenue';

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" type="button" aria-selected={value === t.id} className={value === t.id ? 'is-active' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TierBadge({ tier }: { tier: RiskTier }) {
  const text = tier === 'A' ? 'Rendah' : tier === 'B' ? 'Sedang' : 'Tinggi';
  const icon = tier === 'A' ? '●' : tier === 'B' ? '▲' : '■';
  return (
    <span className={`badge badge--${tier}`}>
      <i aria-hidden>{icon}</i> {tier} · {text}
    </span>
  );
}

/** Profitabilitas TEM 12 bulan terakhir per customer (hasil Tim FAT) */
export function temProfitability() {
  return CUSTOMERS.map((c) => {
    const h = CUSTOMER_HISTORY[c.id];
    const volume = h.reduce((s, p) => s + p.volumeKL, 0);
    const gp = h.reduce((s, p) => s + (p.priceRp * p.marginPct) / 100 * p.volumeKL * 1000, 0);
    const margin = h.reduce((s, p) => s + p.marginPct * p.volumeKL, 0) / volume;
    return { customer: c, volume, gp, margin };
  });
}

function RiskTable() {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th className="num">Margin coal</th>
            <th>Risiko</th>
          </tr>
        </thead>
        <tbody>
          {CUSTOMERS.map((c) => {
            const r = assessCustomerRisk(c, LATEST_NC);
            return (
              <tr key={c.id}>
                <td>
                  {c.name}
                  <small>{c.site}</small>
                </td>
                <td className="num">{fmtPct(r.coalMarginPct)}</td>
                <td>
                  <TierBadge tier={r.tier} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FatTable() {
  const rows = useMemo(temProfitability, []);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th className="num">Volume 12 bln</th>
            <th className="num">Margin</th>
            <th className="num">Laba kotor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.customer.id}>
              <td>{r.customer.name}</td>
              <td className="num">{fmtNum(r.volume)} KL</td>
              <td className="num">{fmtPct(r.margin)}</td>
              <td className="num">{fmtRpCompact(r.gp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompetitorView() {
  const [region, setRegion] = useState<RegionId>('kaltim');
  const quotes = COMPETITOR_QUOTES.filter((q) => q.region === region).sort((a, b) => a.priceRp - b.priceRp);
  return (
    <>
      <Tabs tabs={(Object.keys(REGIONS) as RegionId[]).map((id) => ({ id, label: REGIONS[id].replace('Kalimantan', 'Kal.').replace('Sumatera', 'Sum.') }))} value={region} onChange={setRegion} />
      <BarChart title={`Harga HSD kompetitor · ${REGIONS[region]} (Rp/L)`} data={quotes.map((q) => ({ label: q.competitor, value: q.priceRp }))} format={fmtRp} baselineZero={false} />
      <p className="note">Sumber: Competitor Benchmark · update terakhir {fmtDate(quotes[0].updatedAt)}</p>
    </>
  );
}

type Step1Tab = 'nc' | 'site' | 'risk' | 'fat' | 'comp';

function SiteDataTable() {
  return (
    <>
      <p className="note">Data Site Customer memasok biaya produksi, faktor harga realisasi, dan volume produksi untuk analisis Credit Risk bersama NC Coal Price.</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Customer / site</th><th className="num">Biaya coal</th><th className="num">Faktor NC</th><th className="num">Produksi</th></tr></thead>
        <tbody>{CUSTOMERS.map((c) => <tr key={c.id}>
          <td>{c.name}<small>{c.site}</small></td>
          <td className="num">{fmtUsd(c.coalCashCostUsd)}/t</td>
          <td className="num">{fmtPct(c.coalPriceFactor * 100)}</td>
          <td className="num">{c.productionMtPerYear} Mt/thn</td>
        </tr>)}</tbody>
      </table></div>
    </>
  );
}

export function Step1Widget() {
  const [tab, setTab] = useState<Step1Tab>('nc');
  const focus = useApp((s) => s.focusStation);
  useEffect(() => {
    if (focus === 'src-site') setTab('site');
    else if (focus === 'risk') setTab('risk');
    else if (focus === 'fat' || focus === 'src-internal') setTab('fat');
    else if (focus === 'marketing' || focus === 'src-comp') setTab('comp');
    else if (focus === 'src-nc') setTab('nc');
  }, [focus]);
  const last = COAL_PRICES[COAL_PRICES.length - 1].usdPerTon;
  const prev = COAL_PRICES[COAL_PRICES.length - 2].usdPerTon;
  return (
    <section className="widget">
      <Tabs
        tabs={[
          { id: 'nc', label: 'NC Coal' },
          { id: 'site', label: 'Data Site' },
          { id: 'risk', label: 'Credit Risk' },
          { id: 'fat', label: 'FAT' },
          { id: 'comp', label: 'Benchmark' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'nc' && (
        <>
          <div className="stat-row">
            <div className="stat">
              <span>NC Coal Price</span>
              <b>{fmtUsd(last)}</b>
              <small className={last >= prev ? 'up' : 'down'}>
                {last >= prev ? '▲' : '▼'} {fmtPct(((last - prev) / prev) * 100)} vs bulan lalu
              </small>
            </div>
          </div>
          <LineChart title="NC Coal Price, 12 bulan (US$/ton)" data={COAL_PRICES.map((p) => ({ label: p.label, value: p.usdPerTon }))} format={fmtUsd} color="var(--series-2)" />
          <p className="note">Harga lebih tinggi → tambang customer lebih untung → risiko gagal bayar turun.</p>
        </>
      )}
      {tab === 'risk' && (
        <>
          <p className="note">Credit Risk · NC Coal Price + Data Site Customer: margin tambang = (harga realisasi − biaya tunai) ÷ harga realisasi, pada NC {fmtUsd(LATEST_NC)}.</p>
          <RiskTable />
        </>
      )}
      {tab === 'site' && <SiteDataTable />}
      {tab === 'fat' && (
        <>
          <div className="source-brand"><img src="/brands/oracle-netsuite.svg" alt="Oracle NetSuite" /><div><b>Data Transaksi TEM</b><span>Sumber: ERP perusahaan · Oracle NetSuite</span></div></div>
          <RevenueReceipt />
          <p className="note">Tim FAT menghitung keuntungan TEM per customer menggunakan transaksi ERP Oracle NetSuite (biaya dasar {fmtRp(TEM_CONFIG.baseCostRp)}/L + ongkos angkut).</p>
          <FatTable />
        </>
      )}
      {tab === 'comp' && <CompetitorView />}
    </section>
  );
}

type SheetTab = 'coal' | 'profit' | 'comp' | 'param';

export function WarehouseWidget() {
  const [tab, setTab] = useState<SheetTab>('coal');
  return (
    <section className="widget">
      <div className="sheet-head">
        <span className="database-icon" aria-hidden>PG</span>
        <div>
          <b>Integrated Data Warehouse</b>
          <small>PostgreSQL · 12 bulan histori · {CUSTOMERS.length} customer · {COMPETITOR_QUOTES.length} kutipan harga</small>
        </div>
      </div>
      <Tabs
        tabs={[
          { id: 'coal', label: 'Credit Risk' },
          { id: 'profit', label: 'Profitabilitas' },
          { id: 'comp', label: 'Benchmark' },
          { id: 'param', label: 'Parameter' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'coal' && <RiskTable />}
      {tab === 'profit' && <FatTable />}
      {tab === 'comp' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kompetitor</th>
                <th>Wilayah</th>
                <th className="num">Harga</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITOR_QUOTES.map((q) => (
                <tr key={q.competitor + q.region}>
                  <td>{q.competitor}</td>
                  <td>{REGIONS[q.region]}</td>
                  <td className="num">{fmtRp(q.priceRp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'param' && (
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td>Biaya dasar HSD</td><td className="num">{fmtRp(TEM_CONFIG.baseCostRp)}/L</td></tr>
              <tr><td>Biaya dana</td><td className="num">{fmtPct(TEM_CONFIG.financingRatePa * 100)} p.a.</td></tr>
              <tr><td>Margin minimum</td><td className="num">{fmtPct(TEM_CONFIG.minMarginPct)}</td></tr>
              <tr><td>Kelompok profit (margin GP)</td><td className="num">Low &lt;{TEM_CONFIG.profitMarginThresholds.medium}% · Medium {TEM_CONFIG.profitMarginThresholds.medium}–&lt;{TEM_CONFIG.profitMarginThresholds.high}% · High ≥{TEM_CONFIG.profitMarginThresholds.high}%</td></tr>
              <tr><td>Premi risiko A / B / C</td><td className="num">{TEM_CONFIG.riskPremiumPct.A}% / {TEM_CONFIG.riskPremiumPct.B}% / {TEM_CONFIG.riskPremiumPct.C}%</td></tr>
              <tr><td>Termin maks. A / B / C</td><td className="num">{TEM_CONFIG.maxTermDays.A} / {TEM_CONFIG.maxTermDays.B} / {TEM_CONFIG.maxTermDays.C} hari</td></tr>
              <tr><td>Diskon volume ≥ {fmtNum(TEM_CONFIG.volumeDiscountThresholdKL)} KL</td><td className="num">{fmtPct(TEM_CONFIG.volumeDiscountPct)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="note">PostgreSQL menyatukan data Credit Risk, ERP Oracle NetSuite, dan Competitor Benchmark untuk Kalkulator, Dashboard Analytics, serta Proposal di OPTIMA.</p>
    </section>
  );
}
