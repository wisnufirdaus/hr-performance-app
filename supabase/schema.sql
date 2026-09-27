-- ============================================================
-- SKEMA DATABASE - APLIKASI PENILAIAN KINERJA KARYAWAN
-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- 1. TABEL PROFIL USER (menghubungkan auth.users dengan role & divisi)
-- Supabase Auth sudah otomatis punya tabel auth.users untuk login.
-- Tabel ini menyimpan role tambahan tiap akun.
create table public.user_profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  role text not null check (role in (
    'superadmin', 'hrd', 'direksi',
    'head_sales_store', 'head_marketing', 'head_supermarket',
    'head_marketplace', 'head_produksi', 'head_pastry',
    'head_warehouse', 'head_packaging'
  )),
  division text, -- nama divisi jika role = head_xxx, kosong jika hrd/direksi
  created_at timestamptz default now()
);

-- 2. TABEL DATA KARYAWAN
create table public.employees (
  id uuid default gen_random_uuid() primary key,
  nik text unique not null,               -- Nomor Induk Karyawan
  full_name text not null,
  division text not null,                 -- Sales Store / Marketing / Supermarket / dst
  position text,                          -- jabatan
  join_date date,
  status text not null default 'aktif' check (status in ('aktif', 'resign')),
  resign_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABEL KRITERIA PENILAIAN (bisa umum atau khusus divisi)
create table public.evaluation_criteria (
  id uuid default gen_random_uuid() primary key,
  name text not null,                     -- contoh: "Kedisiplinan", "Target Penjualan"
  description text,
  category text not null default 'umum' check (category in ('umum', 'khusus')),
  division text,                          -- diisi jika category = 'khusus', null jika umum
  weight numeric not null default 10,      -- bobot dalam % (total semua kriteria harus 100)
  max_score integer not null default 100,  -- skala nilai maksimal, misal 100 atau 5
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. TABEL PERIODE PENILAIAN (per kuartal)
create table public.evaluation_periods (
  id uuid default gen_random_uuid() primary key,
  name text not null,                     -- contoh: "Q1 2026 (Jan-Mar)"
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now()
);

-- 5. TABEL HASIL PENILAIAN (header per karyawan per periode)
create table public.evaluations (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.employees(id) not null,
  period_id uuid references public.evaluation_periods(id) not null,
  evaluated_by uuid references public.user_profiles(id) not null,
  total_score numeric,                    -- hasil akhir setelah dihitung dengan bobot
  final_grade text,                       -- contoh: A/B/C/D atau "Sangat Baik/Baik/Cukup/Kurang"
  notes text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, period_id)
);

-- 6. TABEL DETAIL SKOR PER KRITERIA
create table public.evaluation_scores (
  id uuid default gen_random_uuid() primary key,
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  criteria_id uuid references public.evaluation_criteria(id) not null,
  score numeric not null,
  comment text
);

-- ============================================================
-- ROW LEVEL SECURITY (agar tiap role hanya lihat data yang berhak)
-- ============================================================
alter table public.employees enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_scores enable row level security;
alter table public.user_profiles enable row level security;

-- HRD & Superadmin: akses penuh ke semua data karyawan
create policy "hrd_full_access_employees" on public.employees
  for all using (
    exists (select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role in ('hrd', 'superadmin'))
  );

-- Direksi: hanya boleh membaca (SELECT), tidak boleh edit
create policy "direksi_read_employees" on public.employees
  for select using (
    exists (select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'direksi')
  );

-- Head Divisi: hanya lihat & nilai karyawan di divisinya sendiri
create policy "head_division_own_employees" on public.employees
  for select using (
    exists (select 1 from public.user_profiles up
      where up.id = auth.uid()
      and up.role like 'head_%'
      and up.division = employees.division)
  );

-- Kebijakan serupa diterapkan ke tabel evaluations & evaluation_scores
-- (disesuaikan lebih detail saat implementasi backend/API routes)

-- ============================================================
-- CONTOH DATA AWAL: 10 AKUN (dibuat manual lewat Supabase Auth,
-- lalu isi user_profiles sesuai id yang dihasilkan)
-- ============================================================
-- Setelah membuat user di Supabase Authentication > Users, jalankan:
-- insert into public.user_profiles (id, full_name, role, division) values
-- ('uuid-dari-auth-user', 'Nama HRD', 'hrd', null),
-- ('uuid-dari-auth-user', 'Nama Direksi', 'direksi', null),
-- ('uuid-dari-auth-user', 'Nama Head Sales', 'head_sales_store', 'Sales Store');

-- ============================================================
-- CONTOH KRITERIA UMUM (berlaku semua divisi)
-- ============================================================
insert into public.evaluation_criteria (name, description, category, division, weight, max_score) values
('Kedisiplinan', 'Ketepatan waktu masuk kerja dan kehadiran', 'umum', null, 15, 100),
('Kerjasama Tim', 'Kemampuan bekerja sama dengan rekan kerja', 'umum', null, 15, 100),
('Inisiatif', 'Kemampuan mengambil inisiatif tanpa diminta', 'umum', null, 10, 100),
('Sikap & Etika Kerja', 'Sopan santun dan profesionalisme', 'umum', null, 10, 100);

-- Contoh kriteria khusus per divisi (bisa ditambah/diubah lewat halaman admin)
insert into public.evaluation_criteria (name, description, category, division, weight, max_score) values
('Pencapaian Target Penjualan', 'Realisasi target penjualan bulanan', 'khusus', 'Sales Store', 30, 100),
('Kualitas Produksi', 'Tingkat reject/cacat produksi', 'khusus', 'Produksi', 30, 100),
('Ketepatan Pengiriman', 'Ketepatan waktu pengiriman barang dari warehouse', 'khusus', 'Warehouse', 30, 100);
