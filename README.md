# TEM · Peta Proses Penawaran HSD (3D)

Visualisasi interaktif proses penawaran High Speed Diesel (HSD) PT Triputra Energi Megatara. Aktivitas internal berada dalam gedung kantor TEM dengan tampilan cutaway; tangki penyimpanan HSD dan area pemuatan berada di luar kantor, lalu truk mengantar HSD ke tambang customer.

| Langkah | Aktor / sistem | Aktivitas |
|---|---|---|
| 1 · Observasi Data | Credit Risk · FAT · Marketing | NC Coal Price + Data Site Customer untuk Credit Risk; transaksi TEM dari ERP Oracle NetSuite untuk FAT; Competitor Benchmark untuk Marketing |
| 2 · Integrated Data Warehouse | PostgreSQL | Mengintegrasikan data historis, profitabilitas, benchmark, dan parameter harga |
| 3 · OPTIMA | Sales TEM | Kalkulator → Kelompok Result + Recommended Action → alasan Sales → Proposal; Dashboard Analytics tersedia dalam aplikasi yang sama |
| 4 · Keputusan GM | GM Sales · Sales · Customer | Review Result dan alasan Sales → approve → tender → WIN → muat dari tangki TEM → kirim HSD dengan truk → bongkar di tambang → pembayaran dan Gross Profit Riil tercatat di Oracle NetSuite → customer dan Sales merayakan; tolak → revisi di OPTIMA |

## Perilaku aplikasi

- Klik langkah, objek, atau label untuk membuka detail dan memfokuskan kamera. Klik Sales membuka fitur Proposal di OPTIMA.
- Kalkulator dan Dashboard Analytics berbagi customer terpilih. Generate proposal menyimpan satu snapshot harga, volume, biaya, Revenue, dan GP. Snapshot tersebut dipakai untuk proposal, pengiriman, dan pembayaran agar GP tidak berubah. Mengedit input sebelum dikirim membatalkan snapshot; revisi membuat snapshot baru.
- **Kelompok Result** memiliki dua dimensi: profit TEM dari margin GP aktual sebelum pembulatan (`(harga − biaya) / harga × 100%`) dan risiko customer dari hasil Credit Risk A/B/C (Low/Medium/High risk). Risiko customer dihitung dari NC Coal Price dan Data Site Customer; perubahan margin GP TEM tidak mengubah kategori risiko customer. Ambang profit ilustratif: Low <3%, Medium 3–<5%, High ≥5%; ubah `TEM_CONFIG.profitMarginThresholds` di `src/data/dummy.ts` sesuai kebijakan perusahaan. Nama customer disamarkan menjadi PT A sampai PT F.
- Sembilan kombinasi Result tetap menampilkan Recommended Action sebagai informasi. **Semua kategori dapat membuat proposal**, termasuk Low profit / High customer risk. Sales cukup mengisi satu kolom **Alasan melanjutkan penawaran**; tidak ada form rencana tindak lanjut, checklist Sales, pilihan proteksi, atau tombol ubah syarat tambahan. Alasan wajib untuk semua kategori dan dapat diisi pada kalkulator maupun tab Proposal.
- Perubahan harga, volume, customer, atau termin menghapus alasan lama agar Sales meninjau ulang pengajuan. Result, Recommended Action, dan alasan disimpan bersama snapshot proposal lalu ditampilkan pada lampiran internal dan panel GM. GM menandai bahwa Result, risiko customer, dan alasan sudah ditinjau sebelum approve.
- Status proposal: `draft → generated → sent → approved → submitted → delivering → delivered → paying → paid`; penolakan GM membuka revisi baru melalui kalkulator OPTIMA.
- Setelah tender, tombol **WIN · Customer setuju** membuka seluruh peta, memperlihatkan pemuatan dari tangki di luar kantor, lalu menjalankan truk HSD ke tambang. Truk mewakili pengiriman bertahap untuk volume penawaran bulanan.
- Pembayaran baru dimulai setelah truk tiba dan bongkar muatan selesai. **Gross Profit Riil** menjadi angka utama pada animasi uang, banner proses, dan panel FAT; nilainya sama dengan GP snapshot proposal. Total pembayaran customer (harga penawaran × volume KL × 1.000, termasuk biaya dan GP) tersedia sebagai rincian tambahan.
- Angka GP mengikuti animasi proposal, truk, dan uang. Setelah pembayaran diterima, kamera menampilkan customer dan Sales yang tersenyum, melompat, dan mengangkat tangan; label **Customer happy** dan **Sales happy** menandai keberhasilan kesepakatan.
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

`npm test` mencakup mesin harga, pemisahan risiko customer dari GP TEM, sembilan Kelompok Result, batas margin sebelum pembulatan, pengajuan dengan satu alasan Sales untuk semua kategori, review GM, snapshot GP/alasan, urutan pengiriman sebelum pembayaran, pencegahan pembayaran ganda, dan reset alur. Build menjalankan TypeScript lalu menghasilkan aset statis dalam `dist/`.

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
src/lib/dealPolicy.ts        Kelompok Result, matriks tindakan, dan pertimbangan pengajuan
src/lib/offer.ts             Snapshot hasil kalkulasi dan GP proposal
src/lib/revenue.ts           Jadwal pemuatan, pengiriman, pembayaran, dan perayaan
src/ui/Revenue.tsx           Pemantauan GP, pengiriman, pembayaran, dan penerimaan
src/ui/widgets/OptimaWorkspace.tsx  Kalkulator + Dashboard Analytics + Proposal
src/scene/World.tsx          Kantor TEM dan lingkungan
src/scene/assets/Stations.tsx  Representasi sumber data, sistem, dan aktor
src/scene/assets/Mining.tsx  Tambang batu bara customer
src/scene/assets/FuelDepot.tsx  Tangki dan pipa pemuatan di luar kantor
src/scene/Delivery.tsx       Jalan pengiriman dan truk tangki yang bergerak
src/scene/assets/Signs.tsx   Papan identitas dan logo
public/brands/              Logo OPTIMA dan Oracle NetSuite
```

Aset 3D dibuat dari geometri primitif dengan material bersama; grafik monitor dirender ke canvas dan di-cache. Logo menggunakan aset lokal, termasuk logo Triputra Energi yang diberikan pengguna pada header, kantor, dan proposal (asal aset dicatat di `public/brands/SOURCES.md`). Scene dimuat terpisah dari UI; DPR adaptif dibatasi 1,75.

## Data simulasi dan integrasi nyata

PostgreSQL dan Oracle NetSuite saat ini **direpresentasikan dalam alur**, belum merupakan koneksi database/ERP aktif. Dashboard Analytics adalah komponen React lokal. Pengiriman email, review GM, tender, WIN, pengiriman HSD, dan pembayaran merupakan simulasi state di browser; tidak ada email, pengiriman, atau pembayaran nyata yang dikirim. State akan direset saat reload. Urutan pengiriman dan pembayaran simulasi tetap berjalan tanpa WebGL. Gross Profit Riil memakai biaya dan harga snapshot; simulasi ini mengasumsikan biaya tetap serta pasokan dan pembayaran sesuai proposal yang disetujui. Recommended Action menjadi informasi untuk Sales dan GM, sementara alasan melanjutkan penawaran adalah penjelasan yang ditulis Sales.

Untuk integrasi nyata, sediakan backend API yang membaca PostgreSQL Data Warehouse dan mengembalikan kontrak data dalam `src/data/dummy.ts`. Ingesti NetSuite, data site, NC Coal Price, dan benchmark dilakukan di backend. Jangan meletakkan kredensial database/ERP di browser. Jika API berada di domain lain, sesuaikan `connect-src` pada `nginx.conf`.

Rumus rekomendasi dan peluang menang di `src/lib/pricing.ts` bersifat ilustratif. Sesuaikan dengan kebijakan dan formula OPTIMA sebenarnya sebelum digunakan secara operasional.
