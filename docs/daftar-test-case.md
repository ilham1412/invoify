# Daftar Test Case End-to-End (E2E) — Invoify

Dokumen ini merangkum test E2E yang terdeteksi Playwright pada suite saat ini.
Suite berisi **95 test case dalam 15 file spesifikasi**, pada satu project
Playwright (`desktop`, Chromium, viewport 1440 × 900). Daftar nama di bawah
mengikuti judul test di kode; jalankan `npx playwright test --list --project=desktop`
untuk menghasilkan daftar terkini.

## Cara membaca

- **Positif**: memverifikasi perilaku yang diharapkan berhasil.
- **Negatif**: memverifikasi input/kondisi tidak valid ditolak dengan benar.
- **Edge/Boundary**: memverifikasi kondisi batas, persistensi, atau perilaku khusus.
- **Belum diklasifikasikan**: judul atau assertion tidak cukup untuk menentukan jenis skenario tanpa meninjau isi test.

> Status positif/negatif pada tabel adalah klasifikasi skenario, bukan status lulus/gagal eksekusi.

## Katalog test aktif

| No. | File spesifikasi | Test case | Kategori |
|---:|---|---|---|
| 1 | `00-navigasi-wizard/navigasi-wizard.spec.ts` | WIZ-POS-01 — Lima langkah wizard tampil | Positif |
| 2 | `00-navigasi-wizard/navigasi-wizard.spec.ts` | WIZ-POS-02 — Pengguna dapat berpindah dengan Next dan Back | Positif |
| 3 | `00-navigasi-wizard/navigasi-wizard.spec.ts` | WIZ-EDGE-01 — Deep link membuka langkah yang dipilih | Edge |
| 4 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-POS-01 — Data pengirim dan penerima dapat diisi | Positif |
| 5 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-NEG-01 — Email pengirim yang salah ditolak | Negatif |
| 6 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-BLK-01 — Data kosong menandai langkah pertama bermasalah | Negatif |
| 7 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-EDG-01 — Huruf pada telepon tidak disimpan | Edge |
| 8 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-NEG-02 — Email penerima yang salah ditolak | Negatif |
| 9 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-POS-02 — Custom input dapat ditambahkan pada pengirim | Positif |
| 10 | `01-pengirim-penerima/pengirim-penerima.spec.ts` | P1-EDGE-01 — Nama dengan panjang minimum dapat diterima | Edge |
| 11 | `02-detail-invoice/detail-invoice.spec.ts` | P2-POS-01 — Nomor invoice dapat diisi | Positif |
| 12 | `02-detail-invoice/detail-invoice.spec.ts` | P2-POS-02 — Logo invoice dapat diunggah | Positif |
| 13 | `02-detail-invoice/detail-invoice.spec.ts` | P2-NEG-01 — Nomor invoice kosong menampilkan validasi | Negatif |
| 14 | `02-detail-invoice/detail-invoice.spec.ts` | P2-POS-03 — Tanggal terbit dapat dipilih dari kalender | Positif |
| 15 | `02-detail-invoice/detail-invoice.spec.ts` | P2-EDGE-01 — Logo dapat dihapus setelah diunggah | Edge |
| 16 | `03-item/item.spec.ts` | P3-POS-01 — Item dapat diisi | Positif |
| 17 | `03-item/item.spec.ts` | P3-POS-02 — Item kedua dapat ditambahkan | Positif |
| 18 | `03-item/item.spec.ts` | P3-NEG-01 — Jumlah nol menampilkan validasi | Negatif |
| 19 | `03-item/item.spec.ts` | P3-BLK-01 — Item kosong menandai langkah ketiga bermasalah | Negatif |
| 20 | `03-item/item.spec.ts` | P3-POS-03 — Total baris mengikuti jumlah dikali harga | Positif |
| 21 | `03-item/item.spec.ts` | P3-POS-04 — Item dapat dihapus setelah menambahkan baris kedua | Positif |
| 22 | `03-item/item.spec.ts` | P3-NEG-02 — Harga satuan nol menampilkan validasi | Negatif |
| 23 | `03-item/item.spec.ts` | P3-EDGE-01 — Jumlah desimal dapat dimasukkan | Edge |
| 24 | `04-pembayaran/pembayaran.spec.ts` | P4-POS-01 — Data pembayaran dapat diisi | Positif |
| 25 | `04-pembayaran/pembayaran.spec.ts` | P4-NEG-01 — Nama bank kosong menampilkan validasi | Negatif |
| 26 | `04-pembayaran/pembayaran.spec.ts` | P4-BLK-01 — Pembayaran kosong menandai langkah keempat bermasalah | Negatif |
| 27 | `04-pembayaran/pembayaran.spec.ts` | P4-EDG-01 — Satu karakter diterima pada setiap field | Edge |
| 28 | `04-pembayaran/pembayaran.spec.ts` | P4-NEG-02 — Nama pemilik rekening kosong menampilkan validasi | Negatif |
| 29 | `04-pembayaran/pembayaran.spec.ts` | P4-NEG-03 — Nomor rekening kosong menampilkan validasi | Negatif |
| 30 | `05-ringkasan/ringkasan.spec.ts` | P5-POS-01 — Syarat pembayaran dapat diisi | Positif |
| 31 | `05-ringkasan/ringkasan.spec.ts` | P5-POS-02 — Catatan tambahan dapat diisi | Positif |
| 32 | `05-ringkasan/ringkasan.spec.ts` | P5-NEG-01 — Syarat pembayaran kosong menampilkan validasi | Negatif |
| 33 | `05-ringkasan/ringkasan.spec.ts` | P5-BLK-01 — Ringkasan kosong menolak pembuatan invoice | Negatif |
| 34 | `05-ringkasan/ringkasan.spec.ts` | P5-POS-03 — Preset Net 30 mengisi syarat pembayaran | Positif |
| 35 | `05-ringkasan/ringkasan.spec.ts` | P5-POS-04 — Pajak dapat ditambahkan dan diisi | Positif |
| 36 | `05-ringkasan/ringkasan.spec.ts` | P5-POS-05 — Tanda tangan teks dapat ditambahkan | Positif |
| 37 | `05-ringkasan/ringkasan.spec.ts` | P5-EDGE-01 — Pajak di batas maksimum dapat diisi | Edge |
| 38 | `06-pratinjau/pratinjau.spec.ts` | PREV-POS-01 — Pratinjau live tampil | Positif |
| 39 | `06-pratinjau/pratinjau.spec.ts` | PREV-POS-02 — Klik field pratinjau membuka langkah yang sesuai | Positif |
| 40 | `06-pratinjau/pratinjau.spec.ts` | PREV-EDGE-01 — Mengubah form mengembalikan tampilan ke pratinjau live | Edge |
| 41 | `06-pratinjau/pratinjau.spec.ts` | PREV-BLK-01 — Pratinjau tetap tampil saat invoice masih kosong | Positif |
| 42 | `06-pratinjau/pratinjau.spec.ts` | PREV-EDGE-02 — Preview dapat membuka field pada langkah lain | Edge |
| 43 | `06-pratinjau/pratinjau.spec.ts` | PREV-EDGE-03 — Semua bagian preview memiliki target field yang dapat dipilih | Edge |
| 44 | `07-pdf/pdf.spec.ts` | PDF-POS-01 — Invoice valid menghasilkan PDF | Positif |
| 45 | `07-pdf/pdf.spec.ts` | PDF-POS-02 — PDF dapat diunduh | Positif |
| 46 | `07-pdf/pdf.spec.ts` | PDF-BLK-01 — Form kosong tidak menghasilkan PDF | Negatif |
| 47 | `07-pdf/pdf.spec.ts` | PDF-POS-03 — Hasil PDF dapat dibuka di tab baru | Positif |
| 48 | `07-pdf/pdf.spec.ts` | PDF-EDGE-01 — Tombol download tersedia setelah PDF dibuat | Edge |
| 49 | `07-pdf/pdf.spec.ts` | PDF-EDGE-02 — Dokumen PDF tampil pada viewer hasil generate | Edge |
| 50 | `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | SAVE-BLK-01 — Daftar invoice kosong menampilkan pesan | Negatif |
| 51 | `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | SAVE-POS-01 — Invoice hasil generate dapat disimpan | Positif |
| 52 | `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | SAVE-POS-02 — Invoice tersimpan dapat dibuka kembali | Positif |
| 53 | `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | SAVE-POS-04 — Data invoice yang dimuat kembali sama dengan yang disimpan | Positif |
| 54 | `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | SAVE-EDGE-01 — Modal daftar invoice menampilkan jumlah tersimpan | Edge |
| 55 | `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | SAVE-POS-03 — Invoice tersimpan dapat dihapus | Positif |
| 56 | `09-ekspor-impor/ekspor-impor.spec.ts` | EXPORT-POS-01 — Dialog ekspor menampilkan tiga format | Positif |
| 57 | `09-ekspor-impor/ekspor-impor.spec.ts` | EXPORT-EDGE-01 — Ekspor JSON menghasilkan file | Positif |
| 58 | `09-ekspor-impor/ekspor-impor.spec.ts` | EXPORT-POS-02 — Ekspor CSV menghasilkan file | Positif |
| 59 | `09-ekspor-impor/ekspor-impor.spec.ts` | EXPORT-POS-03 — Ekspor XML menghasilkan file | Positif |
| 60 | `09-ekspor-impor/ekspor-impor.spec.ts` | IMPORT-NEG-01 — File bukan JSON menampilkan pesan error | Negatif |
| 61 | `09-ekspor-impor/ekspor-impor.spec.ts` | IMPORT-POS-01 — File JSON invoice mengisi kembali form | Positif |
| 62 | `09-ekspor-impor/ekspor-impor.spec.ts` | IMPORT-EDGE-01 — JSON rusak menampilkan pesan error | Negatif |
| 63 | `10-email/email.spec.ts` | EMAIL-NEG-01 — Email kosong ditolak | Negatif |
| 64 | `10-email/email.spec.ts` | EMAIL-NEG-02 — Format email yang salah ditolak | Negatif |
| 65 | `10-email/email.spec.ts` | EMAIL-POS-01 — Modal pengiriman email dapat dibuka | Positif |
| 66 | `10-email/email.spec.ts` | EMAIL-EDGE-01 — Email dengan spasi di awal diterima | Edge |
| 67 | `10-email/email.spec.ts` | EMAIL-EDGE-02 — Modal email dapat ditutup tanpa mengirim | Edge |
| 68 | `11-bahasa/bahasa.spec.ts` | LANG-POS-01 — Daftar bahasa dapat dibuka | Positif |
| 69 | `11-bahasa/bahasa.spec.ts` | LANG-POS-02 — Memilih Bahasa Indonesia mengganti locale | Positif |
| 70 | `11-bahasa/bahasa.spec.ts` | LANG-EDGE-01 — Bahasa Arab mengatur arah halaman menjadi RTL | Edge |
| 71 | `11-bahasa/bahasa.spec.ts` | LANG-NEG-01 — Locale tidak dikenal tidak membuka halaman aplikasi | Negatif |
| 72 | `11-bahasa/bahasa.spec.ts` | LANG-EDGE-02 — Locale pada tautan langsung tetap menampilkan form | Edge |
| 73 | `11-bahasa/bahasa.spec.ts` | LANG-EDGE-03 — Daftar bahasa memuat 18 pilihan | Edge |
| 74 | `11-bahasa/bahasa.spec.ts` | LANG-POS-03 — Berpindah bahasa mempertahankan data yang sudah diketik | Positif |
| 75 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-POS-01 — Perubahan form memunculkan indikator tersimpan | Positif |
| 76 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-POS-02 — Draft tetap ada setelah halaman dimuat ulang | Positif |
| 77 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-NEG-01 — Reset memerlukan konfirmasi sebelum data dibersihkan | Negatif |
| 78 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-POS-03 — Konfirmasi reset mengosongkan data form | Positif |
| 79 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-EDGE-01 — New Invoice meminta konfirmasi saat draft berubah | Edge |
| 80 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-NEG-02 — Membatalkan New Invoice mempertahankan draft | Negatif |
| 81 | `12-penyimpanan/penyimpanan.spec.ts` | STORE-EDGE-02 — Draft yang disimpan bertahan setelah pindah locale | Edge |
| 82 | `13-beranda-seo/beranda-seo.spec.ts` | HOME-POS-01 — Beranda menampilkan judul utama dan navigasi | Positif |
| 83 | `13-beranda-seo/beranda-seo.spec.ts` | HOME-POS-02 — Halaman guide dapat dibuka | Positif |
| 84 | `13-beranda-seo/beranda-seo.spec.ts` | HOME-POS-03 — Beranda menampilkan konten FAQ | Positif |
| 85 | `13-beranda-seo/beranda-seo.spec.ts` | HOME-EDGE-01 — Halaman guide memiliki judul berbeda dari beranda | Edge |
| 86 | `13-beranda-seo/beranda-seo.spec.ts` | SEO-POS-01 — Beranda memiliki meta description | Positif |
| 87 | `13-beranda-seo/beranda-seo.spec.ts` | SEO-POS-02 — Berkas SEO utama dapat diakses | Positif |
| 88 | `13-beranda-seo/beranda-seo.spec.ts` | SEO-POS-03 — Beranda menyediakan structured data FAQ | Positif |
| 89 | `13-beranda-seo/beranda-seo.spec.ts` | SEO-NEG-01 — Rute guide yang tidak tersedia menghasilkan 404 | Negatif |
| 90 | `13-beranda-seo/beranda-seo.spec.ts` | SEO-EDGE-01 — Metadata halaman guide memiliki deskripsi | Edge |
| 91 | `14-alur-penuh/alur-penuh.spec.ts` | JOURNEY-POS-01 — Pengguna mengisi invoice dan menghasilkan PDF | Positif |
| 92 | `14-alur-penuh/alur-penuh.spec.ts` | JOURNEY-NEG-01 — Invoice kosong tidak bisa melewati validasi untuk dibuat PDF | Negatif |
| 93 | `14-alur-penuh/alur-penuh.spec.ts` | JOURNEY-EDGE-01 — Isi invoice tetap ada setelah berpindah langkah | Edge |
| 94 | `14-alur-penuh/alur-penuh.spec.ts` | JOURNEY-POS-02 — Invoice yang dibuat dapat diunduh | Positif |
| 95 | `14-alur-penuh/alur-penuh.spec.ts` | JOURNEY-EDGE-02 — Invoice yang dihasilkan dapat disimpan dan dimuat kembali | Edge |

## Ringkasan suite

| File spesifikasi | Jumlah test |
|---|---:|
| `00-navigasi-wizard/navigasi-wizard.spec.ts` | 3 |
| `01-pengirim-penerima/pengirim-penerima.spec.ts` | 7 |
| `02-detail-invoice/detail-invoice.spec.ts` | 5 |
| `03-item/item.spec.ts` | 8 |
| `04-pembayaran/pembayaran.spec.ts` | 6 |
| `05-ringkasan/ringkasan.spec.ts` | 8 |
| `06-pratinjau/pratinjau.spec.ts` | 6 |
| `07-pdf/pdf.spec.ts` | 6 |
| `08-invoice-tersimpan/invoice-tersimpan.spec.ts` | 6 |
| `09-ekspor-impor/ekspor-impor.spec.ts` | 7 |
| `10-email/email.spec.ts` | 5 |
| `11-bahasa/bahasa.spec.ts` | 7 |
| `12-penyimpanan/penyimpanan.spec.ts` | 7 |
| `13-beranda-seo/beranda-seo.spec.ts` | 9 |
| `14-alur-penuh/alur-penuh.spec.ts` | 5 |
| **Total** | **95** |

Jumlah kategori pada tabel: **51 positif, 22 negatif, dan 22 edge/boundary**.
Klasifikasi ini berdasarkan tujuan/assertion test; untuk analisis hasil penelitian,
status aktual lulus/gagal tetap harus diambil dari laporan eksekusi Playwright.

## Menjalankan dan memperbarui daftar

```powershell
# Menampilkan test yang terdaftar Playwright
npx playwright test --list --project=desktop

# Menjalankan seluruh E2E (server harus sudah berjalan di baseURL)
npm run test:e2e
```

Daftar di atas mencerminkan discovery pada **29 Oktober 2026**. Perbarui dokumentasi
setelah perubahan jumlah atau judul test; jangan gunakan angka historis 31 file / 83
test untuk menggambarkan suite yang sekarang.
