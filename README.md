# Aplikasi Penilaian Kinerja Karyawan

Sistem penilaian kinerja karyawan dengan 11 akun (1 Super Admin + 10 akun operasional):
HRD, Owner/Direksi, dan 8 Head Divisi (Sales Store, Marketing, Supermarket, Marketplace,
Produksi, Pastry, Warehouse, Packaging).

## Struktur Fitur
1. **Login berbasis role** — hanya Anda (Super Admin) yang bisa membuat akun lewat Supabase Dashboard.
2. **Penilaian kinerja per kuartal** — kriteria umum (berlaku semua divisi) + kriteria khusus per divisi.
3. **Export Excel** — HRD bisa menarik rekap semua divisi ke file `.xlsx` untuk presentasi ke direksi.

## Langkah Setup (± 30–45 menit, tanpa perlu server sendiri)

### 1. Buat akun Supabase (gratis)
1. Daftar di https://supabase.com → buat project baru (pilih region Singapore agar cepat).
2. Buka **SQL Editor** → copy-paste isi file `supabase/schema.sql` → klik Run.
   Ini akan membuat semua tabel: user_profiles, employees, evaluation_criteria,
   evaluation_periods, evaluations, evaluation_scores — beserta contoh kriteria penilaian.
3. Buka **Authentication > Users** → klik "Add user" untuk membuat 10 akun (email + password),
   satu per satu untuk: HRD, Direksi, dan 8 Head Divisi.
4. Setelah tiap user dibuat, copy `id` (UUID)-nya, lalu jalankan di SQL Editor:
   ```sql
   insert into public.user_profiles (id, full_name, role, division) values
   ('paste-uuid-hrd', 'Nama HRD', 'hrd', null),
   ('paste-uuid-direksi', 'Nama Direksi', 'direksi', null),
   ('paste-uuid-sales', 'Nama Head Sales', 'head_sales_store', 'Sales Store'),
   ('paste-uuid-marketing', 'Nama Head Marketing', 'head_marketing', 'Marketing'),
   ('paste-uuid-supermarket', 'Nama Head Supermarket', 'head_supermarket', 'Supermarket'),
   ('paste-uuid-marketplace', 'Nama Head Marketplace', 'head_marketplace', 'Marketplace'),
   ('paste-uuid-produksi', 'Nama Head Produksi', 'head_produksi', 'Produksi'),
   ('paste-uuid-pastry', 'Nama Head Pastry', 'head_pastry', 'Pastry'),
   ('paste-uuid-warehouse', 'Nama Head Warehouse', 'head_warehouse', 'Warehouse'),
   ('paste-uuid-packaging', 'Nama Head Packaging', 'head_packaging', 'Packaging');
   ```
5. Buka **Project Settings > API** → catat `Project URL` dan `anon public key`.

### 2. Jalankan aplikasi secara lokal (untuk uji coba)
```bash
npm install
cp .env.local.example .env.local
# isi .env.local dengan Project URL & anon key dari langkah 1.5
npm run dev
```
Buka http://localhost:3000/login

### 3. Deploy ke internet (gratis, via Vercel)
1. Push folder project ini ke GitHub repository.
2. Daftar di https://vercel.com → "Add New Project" → import repo GitHub tadi.
3. Saat konfigurasi, masukkan Environment Variables yang sama seperti `.env.local`.
4. Klik Deploy. Dalam ± 1 menit, aplikasi sudah online dengan URL seperti
   `https://nama-app-anda.vercel.app`.
5. Bagikan URL & akun login ke masing-masing user.

## Menambah/Mengubah Kriteria Penilaian
Kriteria disimpan di tabel `evaluation_criteria` — bisa diedit langsung lewat
Supabase Table Editor (tanpa perlu ubah kode):
- `category`: `umum` (berlaku semua divisi) atau `khusus` (isi kolom `division`)
- `weight`: bobot dalam % — total seluruh kriteria yang aktif per divisi sebaiknya = 100
- `max_score`: skala nilai maksimal (biasanya 100)

## Menambah Periode Penilaian Baru (tiap kuartal)
Tambah baris baru di tabel `evaluation_periods`, contoh:
```sql
insert into public.evaluation_periods (name, start_date, end_date, status) values
('Q2 2026 (Apr-Jun)', '2026-04-01', '2026-06-30', 'open');
```
Set periode sebelumnya jadi `status = 'closed'` agar tidak bisa dinilai ulang.

## Catatan Keamanan
- Row Level Security (RLS) sudah diaktifkan: Head Divisi hanya bisa melihat/menilai
  karyawan di divisinya sendiri; Direksi hanya bisa membaca (read-only).
- Jangan bagikan `service_role key` Supabase ke siapa pun — hanya `anon key` yang dipakai di aplikasi ini.

## Struktur Folder
```
app/
  login/page.js              -> halaman login
  dashboard/hrd/page.js      -> kelola karyawan + export Excel
  dashboard/direksi/page.js  -> grafik kinerja read-only
  dashboard/divisi/page.js   -> daftar karyawan + form penilaian per divisi
components/
  EvaluationForm.js          -> form input skor per kriteria
lib/
  supabaseClient.js          -> koneksi database & mapping role
  exportExcel.js             -> fungsi export ke .xlsx
supabase/
  schema.sql                 -> skema database lengkap + contoh data
```

## Masih Perlu Dilengkapi (langkah selanjutnya)
- Halaman Super Admin untuk kelola kriteria & periode lewat UI (saat ini via Supabase Table Editor)
- Notifikasi email saat penilaian baru masuk / periode dibuka
- Riwayat tren skor per karyawan lintas periode (grafik garis)
