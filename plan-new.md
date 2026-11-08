Draft ini dibagi dua: **Bagian 1** untuk perubahan proposal (kamu pakai setelah percobaan), dan **Bagian 2** brief implementasi yang bisa kamu salin utuh ke MCP/agent. Bagian 2 sengaja tanpa kode dan memuat batasan supaya agent tidak merusak yang sudah jalan.

---

# BAGIAN 1: Perubahan Proposal

Tiga strategi inti: **F** (full suite tanpa TIA), **M** (TIA + `tia-mapping.json` manual), **C+D** (TIA + peta coverage + reverse dependency). Strategi C saja dan N hanya opsional.

| Bagian | Status | Perubahan |
|---|---|---|
| Judul, Intisari, Abstract | Ganti | Tambah "Coverage dan Dependency"; jelaskan tiga strategi dan tujuan mengukur dampak bias pemetaan manual |
| 1.1 Latar belakang | Ubah | Ganti alinea kesenjangan dari "static dependency" menjadi "evaluasi terkontrol pemetaan otomatis vs manual pada E2E Playwright" |
| 1.2 Rumusan masalah | Tambah | RQ1–RQ3 tetap; **RQ4**: kontribusi tiap komponen dan selisih pemetaan otomatis vs manual |
| 1.3 Batasan | Ubah | Poin 3, 5, 7 diganti: peta otomatis level file, dibekukan sebelum skenario, kestabilan diuji; tambah: skenario acak berstrata dengan seed tercatat; pengukuran utama di lokal, CI untuk validasi kelayakan |
| 1.4 Tujuan, 1.5 Manfaat | Tambah | Tujuan membedah kontribusi komponen dan bias; manfaat praktis berupa biaya dan titik impas peta |
| 2.6 Pemetaan test ke kode | Ganti | Traceability manual vs otomatis, coverage-based RTS (Gligoric 2015), trace E2E (Elsner 2022a) |
| 2.x baru | Tambah | Subbab code coverage V8 dan source map (sitasi dokumentasi resmi) |
| 2.9 Evaluasi RTS | Tambah | Catatan bahwa safety pada coverage-based hampir terjamin secara desain, sehingga retensi dibaca bersama reduksi |
| 2.11 Kesenjangan, kontribusi | Ganti | Lepas klaim "static belum pernah dievaluasi"; kontribusi: evaluasi terkontrol dan pra-registrasi, analisis komponen, kuantifikasi bias manual |
| 3.1 Deskripsi umum, Gambar 3.1 | Ubah | Alur: baseline → bangun peta → bekukan → skenario → eksekusi F/M/C+D → analisis → validasi CI |
| 3.2 Objek dan lingkungan | Tambah | Monocart (coverage), runner Ubuntu untuk CI, mode dev/build untuk perekaman |
| 3.3 Variabel | Ubah | Independen: strategi (F, M, C+D); dependen tambah biaya analisis dan biaya peta |
| 3.4 Baseline | Cek | Jumlah test (94/95), durasi ±27 menit, 1 worker, mode dev |
| 3.5 Mekanisme TIA | Ganti | Prosedur pembentukan peta coverage, dibangun dua kali, Jaccard, dibekukan di satu commit |
| 3.6 Pemetaan manual | Pindah | Jadi strategi M (pembanding), validasi tiga lapis lama diringkas |
| 3.7 Aturan seleksi | Ubah | Aturan C+D (peta → reverse dependency per file → fallback); aturan spec berubah dan page object |
| 3.8 Skenario | Ganti | 24 skenario (6 sempit, 6 luas, 12 fault-inducing), acak berstrata, ditetapkan sebelum eksperimen, operator mutasi tetap |
| 3.9 Protokol dan metrik | Tambah | Waktu total = analisis + eksekusi; 3 pengulangan; metrik: rasio fallback, selisih C+D vs M (Jaccard spec terpilih), kestabilan peta, titik impas |
| 3.10 Validitas | Tambah | Over-approximation barrel/layout, peta usang, retensi tinggi by design, satu aplikasi |
| Klausa kontingensi | **Wajib** | Jika coverage server gagal → coverage klien + dependency; jika coverage klien gagal dipetakan → pemetaan manual tervalidasi dibanding pemetaan otomatis berbasis konvensi |
| Bab IV Jadwal | Ganti | Tambah tahap uji kelayakan, bangun peta, pra-registrasi, validasi CI; samakan teks dan tabel |
| Rapikan umum | Perbaiki | Nama (MUHAMMAD), judul 3.6.1, langkah duplikat 3.6.2, format sitasi Elsner, daftar pustaka, konsistensi angka |

---

# BAGIAN 2: Brief implementasi untuk MCP/agent

**Tujuan:** menambahkan kemampuan merekam coverage per spec Playwright dan membuat `coverage-map.json` otomatis, tanpa mengubah perilaku aplikasi, test, atau skrip TIA yang sudah ada.

## Batasan (jangan dilanggar)
1. Jangan ubah source aplikasi Invoify dan jangan ubah isi, jumlah, atau perilaku test case.
2. Jangan ubah atau hapus `mini-tia.ps1` dan `tia-mapping.json`. Keduanya adalah strategi M.
3. Perekaman coverage harus bisa dinyalakan dan dimatikan lewat satu variabel lingkungan, sehingga run biasa (pengukuran waktu) tidak terkena overhead coverage.
4. Hanya Chromium; konfigurasi tetap: satu proyek desktop 1440×900, satu worker, tanpa retry.
5. Hasil mentah dan hasil olahan disimpan di folder terpisah yang masuk `.gitignore`, kecuali `coverage-map.json` final.

## Langkah perubahan

**Langkah 1: Pasang dependensi dev.** Tambahkan `monocart-coverage-reports` (konversi V8 coverage ke file sumber via source map). Catat versi persisnya.

**Langkah 2: Fixture perekam coverage.** Pada berkas fixture tempat page object didaftarkan (`e2e/support/test.ts`), tambahkan fixture otomatis yang aktif hanya jika variabel lingkungan coverage menyala. Fixture memulai perekaman JS coverage Playwright sebelum tiap test dengan opsi **tidak mereset coverage saat navigasi** (wajib, karena wizard dan perpindahan halaman akan menghapus data), lalu menghentikannya setelah test dan menyimpan hasil mentah ke folder per spec (satu berkas per test, bernama dari ID test).

**Langkah 3: Skrip pemroses.** Buat skrip Node terpisah yang, per spec, membaca seluruh berkas mentah, menggabungkannya lewat Monocart, memetakan balik ke file sumber via source map, lalu mengeluarkan daftar file yang tereksekusi. Saring: hanya path aplikasi (`app/`, `components/`, `contexts/`, `hooks/`, `i18n/`, `lib/`, `services/`, `actions/` bila ada); buang `node_modules`, `.next`, `webpack`, dan file test. Normalisasi path ke format relatif root repositori dengan `/` sebagai pemisah (Windows memakai `\`). Ambang "tercover": mulai dengan **file yang memiliki minimal satu fungsi tereksekusi**; ambang ini harus ditetapkan di sini dan tidak diubah setelah skenario dilihat.

**Langkah 4: Runner per spec.** Buat skrip (PowerShell) yang menjalankan 15 spec satu per satu dengan coverage menyala, membersihkan folder mentah sebelum tiap spec, lalu memanggil skrip pemroses. Skrip juga mencatat durasi tiap run dan menerima parameter "nomor build" agar peta bisa dibangun dua kali dan dibandingkan.

**Langkah 5: Format `coverage-map.json`.** Objek dengan kunci path spec dan nilai daftar file sumber terurut. Sertakan metadata: tanggal, commit hash baseline, versi Monocart, ambang yang dipakai, nomor build. Tambahkan berkas ringkasan (jumlah file per spec, file yang muncul di ≥ 12 dari 15 spec sebagai penanda barrel/layout).

**Langkah 6: Perbandingan dua build.** Skrip kecil yang menghitung indeks Jaccard antar dua peta per spec dan rata-ratanya, serta daftar file yang berbeda.

**Langkah 7: Skrip seleksi baru (salinan, bukan edit).** Buat `mini-tia-cov.ps1` dari `mini-tia.ps1` dengan perubahan:
- Parameter pilihan strategi: `M` (pakai `tia-mapping.json` seperti sekarang) dan `CD` (pakai `coverage-map.json`).
- Mode CD: balik peta menjadi file → spec. Jika file berubah ada di peta, pilih spec-nya. Jika tidak, hitung reverse dependency **untuk file itu saja** (bukan gabungan global semua file berubah), lalu pilih spec dari modul hasil traversal yang ada di peta.
- Perbaiki bug: affected modules dihitung per file berubah, bukan global.
- Perubahan pada page object atau fixture (`e2e/pages`, `e2e/support`, `e2e/data`) tidak boleh langsung memicu full suite tanpa catatan: tandai sebagai kategori tersendiri di log dan pilih spec yang memakainya (atau fallback dengan label jelas).
- Aturan lama dipertahankan: spec berubah selalu dijalankan; fallback full suite untuk graph gagal, file source tidak ada di graph, spec hilang, atau seleksi kosong untuk perubahan source; setiap fallback dicatat dengan alasan.
- Catat waktu analisis (depcruise + pencocokan) terpisah dari waktu eksekusi, dan tulis ringkasan seleksi (file berubah, jumlah affected, spec terpilih, jumlah test, status fallback) ke berkas log per run.
- Pastikan path di-normalisasi agar kelak bisa jalan di Ubuntu.

**Langkah 8: Cakupan graph.** Periksa bahwa semua folder yang muncul di peta coverage ada di cakupan pemindaian depcruise; tambahkan folder yang belum terjangkau pada perintah depcruise, lalu laporkan perubahan itu.

**Langkah 9: Reporter hasil.** Aktifkan reporter JSON Playwright agar durasi dan status tiap test tercatat per run (dipakai nanti untuk menghitung strategi lain tanpa menjalankan ulang).

**Langkah 10 (opsional, setelah klien berhasil): coverage server.** Rekam coverage proses Node untuk route handler dan service dengan mekanisme V8 coverage bawaan Node plus source map, lalu gabungkan ke peta per spec. Beri batas waktu; jika tidak berhasil, **lewati dan laporkan**, jangan dipaksakan.

## Kriteria lulus (acceptance)
1. Satu spec (`06-pratinjau`): hasil memuat path sumber nyata seperti `.tsx` di `app/components/...`, bukan hanya chunk `_next/static/...`.
2. Peta 15 spec terbentuk dua kali; Jaccard rata-rata dilaporkan (target ≥ 0,9).
3. `mini-tia-cov.ps1` dengan opsi list-only memberi seleksi masuk akal untuk 3 perubahan contoh, untuk strategi M dan CD pada file yang sama.
4. Run tanpa variabel coverage berperilaku identik dengan sebelumnya.

## Jika macet
- Hasil coverage berupa `webpack-internal:///` atau chunk tanpa path sumber: coba `next build` dengan source map browser produksi aktif lalu `next start`, dan rekam dari situ (peta level file tidak terpengaruh mode).
- Jika tetap gagal dalam 2–3 jam: berhenti, jangan lanjut ke langkah 4 dan seterusnya, laporkan pesan error dan contoh path yang muncul.

---

# Yang kamu laporkan balik ke saya

1. Jumlah test pasti (`--list`) dan durasi satu full run.
2. Gerbang 1: daftar 10–20 path pertama yang muncul untuk satu spec (atau pesan error).
3. Jika lanjut: jumlah file per spec, file yang muncul di ≥ 12 spec, dan Jaccard dua build.
4. Satu contoh seleksi: file berubah → spec terpilih di M dan CD.
5. Apa yang macet, jika ada.

Dengan itu saya bantu memutuskan Jalur A atau B dan menulis bab-bab yang berubah untuk pertemuan Selasa.

Satu saran: setelah agent selesai, **baca ringkasan perubahannya sebelum menjalankan Playwright**, dan cek bahwa `mini-tia.ps1` dan `tia-mapping.json` tidak berubah (`git status`), supaya jalur mundurmu tetap utuh.
