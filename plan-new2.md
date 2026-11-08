TUJUAN
Menambahkan kemampuan merekam coverage per spec Playwright dan membuat
coverage-map.json otomatis (spec -> file sumber sisi klien), lalu menyatukan
skrip seleksi TIA agar pemetaan manual dan pemetaan coverage memakai logika
yang sama. Kerjakan bertahap per gerbang. Berhenti di gerbang yang gagal.

FAKTA REPO (jangan diasumsikan berubah)
- 95 test, 15 spec, 1 proyek desktop 1440x900, 1 worker.
- playwright.config.ts: retries = CI ? 1 : 0, tidak ada webServer.
- .next tidak punya file .map; chunk dev memakai eval + inline source map.
- Working tree kotor (package.json, playwright.config.ts, .gitignore,
  lib/pdfStyles.generated.ts modified; e2e/*, mini-tia.ps1, tia-mapping.json
  untracked).

BATASAN (WAJIB)
1. Jangan ubah source aplikasi dan jangan ubah isi, jumlah, atau perilaku test.
2. Jangan ubah atau hapus mini-tia.ps1 dan tia-mapping.json. Keduanya tetap
   sebagai "current practice". Skrip baru dibuat sebagai berkas terpisah.
3. Jangan melakukan git commit, tag, reset, atau stash. Cukup laporkan.
4. Perekaman coverage hanya aktif jika variabel lingkungan COVERAGE=1.
   Tanpa variabel itu, run Playwright harus identik dengan sebelumnya.
5. Hanya Chromium, 1 worker, retries 0 untuk run perekaman dan pengukuran.
6. Perubahan konfigurasi (misalnya baseURL atau server) harus lewat variabel
   lingkungan, tidak mengubah perilaku default.
7. Hasil mentah dan olahan disimpan di folder terpisah yang masuk .gitignore,
   kecuali coverage-map.json final.
8. Ruang lingkup: hanya kode sisi klien (JS/TSX yang dieksekusi browser).
   Kode server, file non-JS (JSON locale, CSS, aset), dan e2e infrastructure
   di luar cakupan coverage. Jangan coba merekam coverage server.

GATE 1: COVERAGE SATU SPEC (spec 06-pratinjau)
Tujuan: membuktikan path sumber nyata bisa didapat.
a. Pasang monocart-coverage-reports sebagai devDependency, catat versi persis.
b. Tambahkan fixture otomatis pada e2e/support/test.ts yang aktif hanya jika
   COVERAGE=1: mulai JS coverage Playwright sebelum tiap test dengan opsi
   TIDAK mereset coverage saat navigasi (wajib), hentikan setelah test, simpan
   hasil mentah per spec, satu berkas per test.
c. Sediakan cara menjalankan aplikasi dari PRODUCTION BUILD dengan source map
   browser aktif (productionBrowserSourceMaps: true, lewat variabel lingkungan
   atau konfigurasi terpisah yang tidak mengubah default), lalu next start pada
   port tertentu, dan arahkan Playwright ke sana lewat variabel lingkungan.
   Ini percobaan PERTAMA, bukan fallback.
d. Jalankan hanya spec 06-pratinjau dengan COVERAGE=1, olah dengan Monocart,
   petakan ke file sumber via source map, saring hanya path aplikasi
   (app/, components/, contexts/, hooks/, i18n/, lib/, services/, actions/);
   buang node_modules, .next, webpack, file test. Normalisasi path ke relatif
   root repo dengan "/" sebagai pemisah.
LULUS jika daftar hasil memuat path seperti app/components/...tsx (bukan hanya
_next/static/chunks/*.js atau webpack-internal:///).
GAGAL: jika dalam 2-3 jam tetap tidak ada path sumber nyata, BERHENTI.
Jangan lanjut ke gerbang berikutnya. Laporkan: langkah yang dicoba, pesan
error, dan contoh 20 path pertama yang muncul.

GATE 2: PETA 15 SPEC (hanya jika Gate 1 lulus)
a. Runner (PowerShell) yang menjalankan 15 spec satu per satu dengan
   COVERAGE=1, membersihkan folder mentah sebelum tiap spec, lalu memanggil
   pengolah. Terima parameter nomor build agar peta bisa dibangun dua kali.
b. Ambang "tercover": file dengan minimal satu fungsi yang tereksekusi dan
   BUKAN sekadar fungsi top-level pembungkus modul. Jika ambang ini ternyata
   terlalu longgar (hampir semua file masuk semua spec), laporkan, jangan
   ubah diam-diam. Catat ambang yang dipakai di metadata.
c. Keluarkan coverage-map.json: kunci = path spec, nilai = daftar file sumber
   terurut. Metadata: tanggal, ringkasan git (HEAD dan status), versi Monocart,
   ambang, nomor build, mode (production build).
d. Keluarkan ringkasan: jumlah file per spec, dan daftar file yang muncul di
   >= 12 dari 15 spec (penanda barrel/layout).
e. Bangun dua kali, hitung Jaccard per spec dan rata-ratanya (hanya untuk
   kestabilan; bukan ukuran kebenaran), plus daftar file yang berbeda.
f. Catat durasi tiap run perekaman.

GATE 3: SKRIP SELEKSI TERSATU (hanya jika Gate 2 lulus)
Buat mini-tia-select.ps1 sebagai berkas BARU dengan parameter -Strategy M|CD
dan -ListOnly. Logika sama untuk kedua strategi, yang berbeda hanya sumber
peta:
- M: pola regex dari tia-mapping.json (ubah ke bentuk file -> spec).
- CD: coverage-map.json (dibalik menjadi file -> spec).
Aturan bersama:
1. Spec yang berubah selalu dipilih.
2. Untuk setiap file berubah: jika ada di peta, pilih spec terkait. Jika tidak
   ada, hitung reverse dependency TRANSITIF UNTUK FILE ITU SAJA (bukan gabungan
   global semua file berubah) dari dep-graph.json, lalu pilih spec dari modul
   hasil traversal yang ada di peta.
3. Pada strategi M, jika beberapa pola cocok, gabungkan SEMUA yang cocok
   (jangan hanya yang pertama).
4. File di e2e/pages, e2e/support, e2e/data: beri label kategori
   "e2e-infrastructure", dan fallback full suite dengan label jelas.
5. Fallback full suite (dengan alasan tercatat) jika: tidak ada file berubah,
   pembentukan graph gagal, file source tidak ada di graph, spec target tidak
   ada, atau seleksi kosong untuk perubahan source. File di luar cakupan
   coverage (server, non-JS) yang tidak menghasilkan spec diberi label
   "outside-coverage-scope", bukan dianggap kegagalan metode.
6. Setiap spec terpilih dicatat sumbernya: "peta langsung" atau
   "via dependency". (Dipakai nanti untuk menurunkan strategi coverage-saja
   secara offline tanpa run tambahan.)
7. Ukur waktu analisis (depcruise + pencocokan) terpisah dari waktu eksekusi.
   Tulis ringkasan per run ke berkas log: file berubah, jumlah affected,
   spec terpilih, jumlah test, status/alasan fallback, waktu analisis.
8. Normalisasi path agar kelak bisa jalan di Ubuntu.
Periksa juga bahwa semua folder yang muncul di peta coverage ada dalam cakupan
pemindaian depcruise; jika ada yang belum, laporkan (jangan ubah diam-diam).
Aktifkan reporter JSON Playwright (via variabel lingkungan) agar durasi dan
status tiap test tercatat per run.

KRITERIA LULUS AKHIR
1. Gate 1: path .tsx nyata muncul untuk 06-pratinjau.
2. Gate 2: peta 15 spec terbentuk dua kali, Jaccard rata-rata dilaporkan.
3. Gate 3: -ListOnly untuk 3 file contoh (satu komponen klien, satu barrel
   atau layout, satu file server) memberi seleksi untuk strategi M dan CD.
4. Run tanpa COVERAGE=1 berperilaku identik dengan sebelumnya.
5. git status: mini-tia.ps1 dan tia-mapping.json tidak berubah.

YANG HARUS DILAPORKAN
- Hasil tiap gerbang (lulus/gagal), alasan jika gagal.
- 20 path pertama dari Gate 1.
- Jumlah file per spec, file yang muncul di >= 12 spec, Jaccard dua build.
- Contoh seleksi M vs CD untuk 3 file.
- Daftar berkas yang dibuat/diubah.
- Hal yang tidak pasti atau asumsi yang diambil.


catatan dari claude:
Tempel brief ke agent-mu. Karena ia bekerja di tia-coverage, baseline aman.
Awasi Gate 1 saja (spec 06-pratinjau). Jangan biarkan lanjut ke Gate 2 sebelum path .tsx nyata muncul.
Setelah selesai, jalankan git status dan git diff --stat, lalu pastikan mini-tia.ps1 dan tia-mapping.json tidak berubah.
Kirim ke saya: 20 path pertama dari Gate 1 (atau pesan error jika gagal).
