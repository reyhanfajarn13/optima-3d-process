/**
 * DATA DUMMY — mensimulasikan isi "Integrated Data Warehouse" (database historis + konfigurasi).
 * Ganti modul ini dengan adapter API ke PostgreSQL Data Warehouse.
 * tanpa mengubah komponen UI: semua komponen hanya membaca tipe di bawah.
 */

export type RegionId = 'kaltim' | 'kalsel' | 'sumsel';

export interface Customer {
  id: string;
  name: string;
  site: string;
  region: RegionId;
  /** Biaya tunai produksi batu bara (USD/ton) — input Tim Risk */
  coalCashCostUsd: number;
  /** Faktor harga realisasi terhadap NC Coal Price (kalori lebih rendah = faktor lebih kecil) */
  coalPriceFactor: number;
  productionMtPerYear: number;
  /** Rata-rata kebutuhan HSD per bulan (KL) */
  avgMonthlyVolumeKL: number;
  /** Ongkos angkut TEM ke site customer (Rp/L) — input Tim FAT */
  logisticsCostRp: number;
  /** Termin pembayaran yang biasa diminta (hari) */
  paymentTermDays: number;
}

export interface MonthPoint {
  month: string; // YYYY-MM
  label: string; // "Nov 25"
}

export interface CoalPricePoint extends MonthPoint {
  usdPerTon: number;
}

export interface CompetitorQuote {
  competitor: string;
  region: RegionId;
  priceRp: number; // Rp/L, harga penawaran HSD ke industri
  updatedAt: string;
}

export interface CustomerHistoryPoint extends MonthPoint {
  volumeKL: number;
  priceRp: number;
  marginPct: number;
}

export const REGIONS: Record<RegionId, string> = {
  kaltim: 'Kalimantan Timur',
  kalsel: 'Kalimantan Selatan',
  sumsel: 'Sumatera Selatan',
};

/** Konfigurasi biaya dasar TEM (tabel parameter di PostgreSQL Data Warehouse) */
export const TEM_CONFIG = {
  baseCostRp: 12_850, // harga beli HSD + pajak terkait (Rp/L)
  financingRatePa: 0.09, // biaya dana 9% per tahun
  minMarginPct: 2.5, // margin minimum kebijakan
  targetUndercutPct: 0.4, // rekomendasi sedikit di bawah kompetitor termurah
  volumeDiscountThresholdKL: 2_000,
  volumeDiscountPct: 0.3,
  riskPremiumPct: { A: 0, B: 0.8, C: 2.0 } as const,
  maxTermDays: { A: 60, B: 45, C: 30 } as const,
  lastSync: '2026-10-19T07:45:00+07:00',
};

const MONTHS: MonthPoint[] = (() => {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const out: MonthPoint[] = [];
  // 12 bulan terakhir: Nov 2025 – Okt 2026
  for (let i = 0; i < 12; i++) {
    const m = (10 + i) % 12;
    const y = 2025 + Math.floor((10 + i) / 12);
    out.push({ month: `${y}-${String(m + 1).padStart(2, '0')}`, label: `${names[m]} ${String(y).slice(2)}` });
  }
  return out;
})();

const NC_SERIES = [112.4, 108.1, 103.6, 109.8, 116.9, 121.3, 114.7, 108.9, 112.6, 118.8, 124.2, 121.5];

export const COAL_PRICES: CoalPricePoint[] = MONTHS.map((m, i) => ({ ...m, usdPerTon: NC_SERIES[i] }));

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'PT Bara Mahakam Lestari', site: 'Kutai Kartanegara', region: 'kaltim', coalCashCostUsd: 58, coalPriceFactor: 0.82, productionMtPerYear: 9.5, avgMonthlyVolumeKL: 2_600, logisticsCostRp: 310, paymentTermDays: 45 },
  { id: 'c2', name: 'PT Sinar Batu Hitam', site: 'Berau', region: 'kaltim', coalCashCostUsd: 71, coalPriceFactor: 0.74, productionMtPerYear: 4.2, avgMonthlyVolumeKL: 1_350, logisticsCostRp: 420, paymentTermDays: 60 },
  { id: 'c3', name: 'PT Karya Tambang Banua', site: 'Tanah Bumbu', region: 'kalsel', coalCashCostUsd: 64, coalPriceFactor: 0.7, productionMtPerYear: 6.8, avgMonthlyVolumeKL: 1_900, logisticsCostRp: 275, paymentTermDays: 30 },
  { id: 'c4', name: 'PT Energi Barito Raya', site: 'Tabalong', region: 'kalsel', coalCashCostUsd: 79, coalPriceFactor: 0.68, productionMtPerYear: 2.9, avgMonthlyVolumeKL: 820, logisticsCostRp: 465, paymentTermDays: 60 },
  { id: 'c5', name: 'PT Musi Coal Prima', site: 'Muara Enim', region: 'sumsel', coalCashCostUsd: 42, coalPriceFactor: 0.55, productionMtPerYear: 12.1, avgMonthlyVolumeKL: 3_150, logisticsCostRp: 340, paymentTermDays: 45 },
  { id: 'c6', name: 'PT Lahat Bara Sentosa', site: 'Lahat', region: 'sumsel', coalCashCostUsd: 61, coalPriceFactor: 0.52, productionMtPerYear: 3.4, avgMonthlyVolumeKL: 1_050, logisticsCostRp: 390, paymentTermDays: 30 },
];

/** Data Competitor Benchmark (input Tim Marketing) */
export const COMPETITOR_QUOTES: CompetitorQuote[] = [
  { competitor: 'Kompetitor A', region: 'kaltim', priceRp: 13_720, updatedAt: '2026-10-14' },
  { competitor: 'Kompetitor B', region: 'kaltim', priceRp: 13_890, updatedAt: '2026-10-12' },
  { competitor: 'Kompetitor C', region: 'kaltim', priceRp: 14_050, updatedAt: '2026-10-09' },
  { competitor: 'Kompetitor A', region: 'kalsel', priceRp: 13_640, updatedAt: '2026-10-15' },
  { competitor: 'Kompetitor D', region: 'kalsel', priceRp: 13_810, updatedAt: '2026-10-11' },
  { competitor: 'Kompetitor C', region: 'kalsel', priceRp: 13_980, updatedAt: '2026-10-08' },
  { competitor: 'Kompetitor B', region: 'sumsel', priceRp: 13_760, updatedAt: '2026-10-13' },
  { competitor: 'Kompetitor E', region: 'sumsel', priceRp: 13_930, updatedAt: '2026-10-10' },
  { competitor: 'Kompetitor D', region: 'sumsel', priceRp: 14_120, updatedAt: '2026-10-07' },
];

/** PRNG deterministik agar data dummy stabil antar render & build */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Riwayat transaksi per customer (sumber Dashboard Analytics di OPTIMA) */
export const CUSTOMER_HISTORY: Record<string, CustomerHistoryPoint[]> = Object.fromEntries(
  CUSTOMERS.map((c, ci) => {
    const rand = mulberry32(1000 + ci * 97);
    const points = MONTHS.map((m, i) => {
      const seasonal = 1 + 0.08 * Math.sin((i / 12) * Math.PI * 2 + ci);
      const volumeKL = Math.round(c.avgMonthlyVolumeKL * seasonal * (0.9 + rand() * 0.2));
      const priceRp = Math.round((13_550 + c.logisticsCostRp * 0.6 + (rand() - 0.5) * 240) / 10) * 10;
      const cost = TEM_CONFIG.baseCostRp + c.logisticsCostRp;
      const marginPct = Math.round(((priceRp - cost) / priceRp) * 1000) / 10;
      return { ...m, volumeKL, priceRp, marginPct };
    });
    return [c.id, points];
  }),
);

export const MONTH_LABELS = MONTHS.map((m) => m.label);
