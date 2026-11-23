export type Vec3 = [number, number, number];

export const STEP = { observation: 1, warehouse: 2, optima: 3, decision: 4 } as const;
export type OptimaTab = 'calculator' | 'analytics' | 'proposal';

export const COLORS = {
  risk: '#db713f', fat: '#2a78d6', marketing: '#bd5e85', warehouse: '#336791',
  optima: '#087cb1', analytics: '#087cb1', sales: '#316cad', gm: '#173a63',
  customer: '#806044', approve: '#14a44d', reject: '#d03b3b', external: '#647b82', revenue: '#c89013',
} as const;

export interface ProcessStep {
  id: number;
  short: string;
  who: string;
  title: string;
  actors: string;
  plain: string;
  inputs: string[];
  outputs: string[];
  color: string;
  camera: { position: Vec3; target: Vec3 };
}

export const STEPS: ProcessStep[] = [
  {
    id: STEP.observation, short: 'Observasi Data', who: 'Credit Risk · FAT · Marketing',
    title: 'Observasi & Analisis Data', actors: 'Tim Credit Risk · Tim FAT · Tim Marketing',
    plain: 'Tim Credit Risk menggabungkan NC Coal Price dan Data Site Customer untuk menilai profitabilitas serta risiko customer. Tim FAT menganalisis data transaksi TEM dari ERP Oracle NetSuite. Tim Marketing mengumpulkan Competitor Benchmark untuk membandingkan harga HSD di pasar.',
    inputs: ['NC Coal Price', 'Data Site Customer', 'Data transaksi TEM · Oracle NetSuite', 'Competitor Benchmark'],
    outputs: ['Analisis credit risk', 'Profitabilitas TEM per customer', 'Benchmark harga HSD'],
    color: COLORS.risk, camera: { position: [-25, 23, 31], target: [-32, 0, 1] },
  },
  {
    id: STEP.warehouse, short: 'Data Warehouse', who: 'PostgreSQL',
    title: 'Integrated Data Warehouse', actors: 'Tim Credit Risk · Tim FAT · Tim Marketing',
    plain: 'Data site customer, harga batu bara, transaksi ERP Oracle NetSuite, dan Competitor Benchmark dihimpun ke Integrated Data Warehouse dalam PostgreSQL. Data historis dan parameter harga menjadi satu sumber data untuk seluruh fitur OPTIMA.',
    inputs: ['Analisis Credit Risk', 'Transaksi & profitabilitas TEM', 'Competitor Benchmark'],
    outputs: ['Data historis terintegrasi', 'Parameter & konfigurasi harga'],
    color: COLORS.warehouse, camera: { position: [-4, 12, 17], target: [-13, 1.5, 1] },
  },
  {
    id: STEP.optima, short: 'OPTIMA', who: 'Digunakan oleh Sales',
    title: 'OPTIMA', actors: 'Sales TEM · Pengguna OPTIMA',
    plain: 'Sales menggunakan OPTIMA untuk menghitung harga dan GP TEM, lalu melihat Kelompok Result dengan risiko customer dari Credit Risk. Semua kategori dapat diajukan sebagai proposal. Sales cukup menuliskan alasan melanjutkan penawaran untuk ditinjau GM. Recommended Action tetap tersedia sebagai informasi. Dashboard Analytics memakai sumber data PostgreSQL yang sama.',
    inputs: ['Data & parameter dari PostgreSQL', 'Input Sales: customer, volume, termin'],
    outputs: ['Harga & margin GP TEM', 'Kelompok Result + Risiko customer', 'Recommended Action & alasan melanjutkan penawaran'],
    color: COLORS.optima, camera: { position: [12, 24, 39], target: [7, 1, 1] },
  },
  {
    id: STEP.decision, short: 'Keputusan GM', who: 'WIN · Pengiriman · GP Riil',
    title: 'Keputusan GM Sales', actors: 'GM Sales · Sales TEM · Customer Tambang',
    plain: 'GM meninjau profit TEM, risiko customer, Recommended Action, dan alasan melanjutkan penawaran dari Sales sebelum approve atau tolak. Setelah WIN, truk mengirim HSD dari tangki TEM. Ketika HSD diterima dan customer membayar, Gross Profit Riil tercatat di Oracle NetSuite dengan GP yang sama seperti proposal.',
    inputs: ['Proposal, Result & alasan Sales'], outputs: ['WIN → Pengiriman HSD → Gross Profit Riil', 'GP proposal = Gross Profit Riil', 'Tolak → revisi di OPTIMA'],
    color: COLORS.gm, camera: { position: [40, 33, 52], target: [37, 1, 2] },
  },
];

export const OVERVIEW_CAMERA = { position: [2, 72, 85] as Vec3, target: [2, 0, 6] as Vec3 };

export type StationId = 'src-site' | 'src-nc' | 'src-internal' | 'src-comp' | 'risk' | 'fat' | 'marketing' | 'warehouse' | 'optima' | 'sales' | 'gm' | 'customer';

export interface Station {
  id: StationId;
  label: string;
  sub?: string;
  step: number;
  position: Vec3;
  port: Vec3;
  color: string;
}

export const STATIONS: Record<StationId, Station> = {
  'src-site': { id: 'src-site', label: 'Data Site Customer', sub: 'Produksi · biaya · profitabilitas', step: 1, position: [-38, 0, -8], port: [-36, 2, -8], color: COLORS.risk },
  'src-nc': { id: 'src-nc', label: 'NC Coal Price', sub: 'Harga batu bara dunia', step: 1, position: [-38, 0, -2], port: [-37, 3, -2], color: COLORS.risk },
  'src-internal': { id: 'src-internal', label: 'Data Transaksi TEM', sub: 'Oracle NetSuite · ERP perusahaan', step: 1, position: [-38, 0, 4], port: [-36, 2, 4], color: COLORS.fat },
  'src-comp': { id: 'src-comp', label: 'Competitor Benchmark', sub: 'Perbandingan harga HSD', step: 1, position: [-38, 0, 10], port: [-36, 2, 10], color: COLORS.marketing },
  risk: { id: 'risk', label: 'Credit Risk', sub: 'NC Coal + Data Site Customer', step: 1, position: [-27, 0, -5], port: [-27, 2.2, -5], color: COLORS.risk },
  fat: { id: 'fat', label: 'Tim FAT', sub: 'Profitabilitas dari ERP', step: 1, position: [-27, 0, 1.5], port: [-27, 2.2, 1.5], color: COLORS.fat },
  marketing: { id: 'marketing', label: 'Tim Marketing', sub: 'Analisis Competitor Benchmark', step: 1, position: [-27, 0, 8], port: [-27, 2.2, 8], color: COLORS.marketing },
  warehouse: { id: 'warehouse', label: 'Integrated Data Warehouse', sub: 'PostgreSQL', step: 2, position: [-13, 0, 1], port: [-13, 2.6, 1], color: COLORS.warehouse },
  optima: { id: 'optima', label: 'OPTIMA', sub: 'Kalkulator · Analytics · Proposal', step: 3, position: [2, 0, 1], port: [2, 3, 1], color: COLORS.optima },
  sales: { id: 'sales', label: 'Sales TEM', sub: 'Pengguna OPTIMA · harga & proposal', step: 3, position: [14, 0, 1], port: [14, 2, 1], color: COLORS.sales },
  gm: { id: 'gm', label: 'GM Sales', sub: 'Approve / Tolak', step: 4, position: [26, 0, 1], port: [26, 2.2, 1], color: COLORS.gm },
  customer: { id: 'customer', label: 'Customer Tambang · Tender', sub: 'Operasional tambang batu bara', step: 4, position: [43, 0, 1], port: [37, 2, 3], color: COLORS.customer },
};

export interface Flow {
  id: string;
  from: StationId;
  to: StationId;
  color: string;
  step: number;
  label: string;
  kind: 'data' | 'doc' | 'revenue';
  arc?: number;
  conditional?: 'approve' | 'reject' | 'win';
}

export const FLOWS: Flow[] = [
  { id: 'site-risk', from: 'src-site', to: 'risk', color: COLORS.risk, step: 1, label: 'Data Site Customer', kind: 'data' },
  { id: 'nc-risk', from: 'src-nc', to: 'risk', color: COLORS.risk, step: 1, label: 'NC Coal Price', kind: 'data' },
  { id: 'int-fat', from: 'src-internal', to: 'fat', color: COLORS.fat, step: 1, label: 'Oracle NetSuite · transaksi TEM', kind: 'data' },
  { id: 'comp-mkt', from: 'src-comp', to: 'marketing', color: COLORS.marketing, step: 1, label: 'Competitor Benchmark', kind: 'data' },
  { id: 'risk-warehouse', from: 'risk', to: 'warehouse', color: COLORS.risk, step: 2, label: 'Credit Risk', kind: 'data', arc: 3 },
  { id: 'fat-warehouse', from: 'fat', to: 'warehouse', color: COLORS.fat, step: 2, label: 'Profitabilitas', kind: 'data', arc: 3 },
  { id: 'mkt-warehouse', from: 'marketing', to: 'warehouse', color: COLORS.marketing, step: 2, label: 'Benchmark', kind: 'data', arc: 3 },
  { id: 'warehouse-optima', from: 'warehouse', to: 'optima', color: COLORS.optima, step: 3, label: 'Data historis & parameter', kind: 'data', arc: 3 },
  { id: 'optima-sales', from: 'optima', to: 'sales', color: COLORS.optima, step: 3, label: 'Harga & proposal untuk Sales', kind: 'doc', arc: 2 },
  { id: 'sales-gm', from: 'sales', to: 'gm', color: COLORS.sales, step: 3, label: 'Email proposal', kind: 'doc', arc: 3 },
  { id: 'gm-customer', from: 'gm', to: 'customer', color: COLORS.approve, step: 4, label: 'Approve → tender', kind: 'doc', arc: 3, conditional: 'approve' },
  { id: 'gm-sales', from: 'gm', to: 'sales', color: COLORS.reject, step: 4, label: 'Tolak → revisi OPTIMA', kind: 'doc', arc: 7, conditional: 'reject' },
  { id: 'customer-revenue', from: 'customer', to: 'src-internal', color: COLORS.revenue, step: 4, label: 'Gross Profit Riil tercatat di Oracle NetSuite', kind: 'revenue', conditional: 'win' },
];

export const ZONES: { step: number; center: Vec3; size: [number, number]; label: string }[] = [
  { step: 1, center: [-32.5, 0, 1], size: [18, 25], label: 'Observasi Data' },
  { step: 2, center: [-13, 0, 1], size: [11, 14], label: 'PostgreSQL Data Warehouse' },
  { step: 3, center: [7, 0, 1], size: [24, 14], label: 'OPTIMA · Sales TEM' },
  { step: 4, center: [26, 0, 1], size: [9, 14], label: 'Keputusan GM' },
];
