# TEM · Peta Proses Penawaran HSD (3D)

Visualisasi interaktif proses penawaran High Speed Diesel (HSD) PT Triputra Energi Megatara. Aktivitas internal berada dalam gedung kantor TEM dengan tampilan cutaway; customer berada di area tambang batu bara di luar kantor.

| Langkah | Aktor / sistem | Aktivitas |
|---|---|---|
| 1 · Observasi Data | Credit Risk · FAT · Marketing | NC Coal Price + Data Site Customer untuk Credit Risk; transaksi TEM dari ERP Oracle NetSuite untuk FAT; Competitor Benchmark untuk Marketing |
| 2 · Integrated Data Warehouse | PostgreSQL | Mengintegrasikan data historis, profitabilitas, benchmark, dan parameter harga |
| 3 · OPTIMA | Sales TEM | Satu aplikasi dengan Kalkulator, Dashboard Analytics, dan Proposal; Sales mengoperasikan aplikasi dan menerima hasil harga/proposal |
| 4 · Keputusan GM | GM Sales · Sales · Customer | Approve → tender → WIN (customer setuju) → pembayaran Revenue ke Data Transaksi TEM / Oracle NetSuite; tolak → Sales merevisi penawaran di OPTIMA |

## Perilaku aplikasi

- Klik langkah, objek, atau label untuk membuka detail dan memfokuskan kamera. Klik Sales membuka fitur Proposal di OPTIMA.
- Kalkulator dan Dashboard Analytics berbagi customer terpilih. Proposal menggunakan hasil kalkulasi yang sama.
- Status proposal: `draft → generated → sent → approved → submitted → won → paid`; penolakan GM membuka revisi baru melalui kalkulator OPTIMA.
- Setelah tender, tombol **WIN · Customer setuju** membuka seluruh peta dan memicu animasi uang dari tambang ke Data Transaksi TEM. Nilai Revenue disimulasikan untuk satu bulan: harga penawaran × volume KL × 1.000. Setelah tiba, penerimaan tercatat pada panel FAT dan riwayat aktivitas. Nilai ini adalah Revenue, bukan laba kotor.
- Input customer dan harga dikunci selama proposal sedang diproses GM, disetujui, atau diajukan ke tender.
- Proposal dapat dicetak/disimpan PDF melalui dialog cetak browser. Lampiran internal GM disembunyikan saat dicetak.
- Tur otomatis mengikuti empat langkah. Keyboard: panah kiri/kanan untuk langkah, Escape untuk ringkasan.
- Mode hemat mematikan animasi ambient. Perpindahan kamera dan animasi tindakan tetap berjalan. Panel tetap dapat dipakai jika WebGL tidak tersedia.
- Layout desktop memakai panel samping; tablet/ponsel memakai bottom sheet.

## Menjalankan

Gunakan Node.js yang kompatibel dengan versi Vite di `package.json` (Docker menggunakan Node 24).

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm test` mencakup mesin harga dan alur OPTIMA/GM. Build menjalankan TypeScript lalu menghasilkan aset statis dalam `dist/`.

```bash
docker build -t tem-process-3d .
docker run -p 8080:8080 tem-process-3d
```

Nginx menyajikan aplikasi di port 8080 dan health check di `/healthz`.

## Deploy ke Netlify

Konfigurasi `netlify.toml` memakai Node 24, build command `npm run build`, dan publish directory `dist`. File `public/_headers` serta `public/_redirects` ikut disalin ke hasil build agar header keamanan, cache, dan fallback halaman berlaku pada deploy CLI maupun Netlify Drop. Hosting statis di Netlify tidak memakai Docker/nginx.

Untuk deploy manual:

```bash
npm run build
netlify deploy --dir=dist --no-build
```

Setelah login dan memilih/membuat proyek, perintah tersebut menghasilkan URL preview. Untuk menerbitkan ke alamat utama proyek:

```bash
netlify deploy --dir=dist --no-build --prod
```

Alternatif tanpa CLI: unggah folder `dist` ke [Netlify Drop](https://app.netlify.com/drop). Untuk integrasi Git, pilih folder proyek ini sebagai base directory (`tem-process-3d` jika berada di dalam repo induk); Netlify membaca build command dan publish directory dari `netlify.toml`.

## Struktur

```text
src/data/process.ts          Langkah, aktor, posisi, kamera, dan aliran data
src/data/dummy.ts            Data simulasi warehouse dan konfigurasi harga
src/store.ts                 State navigasi, fitur OPTIMA, proposal, dan aktivitas
src/lib/pricing.ts           Perhitungan risiko dan rekomendasi harga
src/ui/widgets/OptimaWorkspace.tsx  Kalkulator + Dashboard Analytics + Proposal
src/scene/World.tsx          Kantor TEM dan lingkungan
src/scene/assets/Stations.tsx  Representasi sumber data, sistem, dan aktor
src/scene/assets/Mining.tsx  Tambang batu bara customer
src/scene/assets/Signs.tsx   Papan identitas dan logo
public/brands/              Logo OPTIMA dan Oracle NetSuite
```

Aset 3D dibuat dari geometri primitif dengan material bersama; grafik monitor dirender ke canvas dan di-cache. Logo menggunakan aset lokal, termasuk logo Triputra Energi yang diberikan pengguna pada header, kantor, dan proposal (asal aset dicatat di `public/brands/SOURCES.md`). Scene dimuat terpisah dari UI; DPR adaptif dibatasi 1,75.

## Data simulasi dan integrasi nyata

PostgreSQL dan Oracle NetSuite saat ini **direpresentasikan dalam alur**, belum merupakan koneksi database/ERP aktif. Dashboard Analytics adalah komponen React lokal. Pengiriman email, review GM, tender, WIN, dan pembayaran Revenue merupakan simulasi state di browser; tidak ada email atau pembayaran nyata yang dikirim. State akan direset saat reload. Penyelesaian pembayaran simulasi tetap berjalan tanpa WebGL.

Untuk integrasi nyata, sediakan backend API yang membaca PostgreSQL Data Warehouse dan mengembalikan kontrak data dalam `src/data/dummy.ts`. Ingesti NetSuite, data site, NC Coal Price, dan benchmark dilakukan di backend. Jangan meletakkan kredensial database/ERP di browser. Jika API berada di domain lain, sesuaikan `connect-src` pada `nginx.conf`.

Rumus rekomendasi dan peluang menang di `src/lib/pricing.ts` bersifat ilustratif. Sesuaikan dengan kebijakan dan formula OPTIMA sebenarnya sebelum digunakan secara operasional.
