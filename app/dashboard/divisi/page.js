'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, ROLE_CONFIG } from '../../../lib/supabaseClient';
import EvaluationForm from '../../../components/EvaluationForm';
import AppShell, { MainHead } from '../../../components/AppShell';
import { COLORS, card, cardTitle, button, th, td } from '../../../lib/theme';

export default function DivisiDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [period, setPeriod] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      // 1. Pastikan ada sesi login yang valid. Kalau tidak ada (misalnya
      //    halaman ini dibuka langsung tanpa login, atau sesi kadaluarsa),
      //    arahkan kembali ke halaman login alih-alih membiarkan error.
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        router.push('/login');
        return;
      }
      const user = userData.user;

      // 2. Ambil profil (role & divisi). maybeSingle() dipakai supaya
      //    tidak error kalau baris tidak ditemukan (bukan single()).
      const { data: prof, error: profError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profError) throw profError;
      if (!prof) {
        setLoadError('Profil akun ini belum terdaftar di sistem. Hubungi Admin untuk didaftarkan.');
        setLoading(false);
        return;
      }
      if (!prof.division) {
        setLoadError('Akun ini belum diatur divisinya. Hubungi Admin untuk melengkapi data.');
        setLoading(false);
        return;
      }
      setProfile(prof);

      // 3. Karyawan aktif di divisi ini saja (dijamin juga oleh RLS di database)
      const { data: emps, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('division', prof.division)
        .eq('status', 'aktif');
      if (empError) throw empError;
      setEmployees(emps || []);

      // 4. Kriteria: umum + khusus divisi ini.
      //    Nilai divisi dibungkus tanda kutip ganda di dalam filter .or()
      //    supaya aman walau nama divisinya mengandung spasi (mis. "Sales Store").
      const { data: crit, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .or(`category.eq.umum,division.eq."${prof.division}"`)
        .eq('is_active', true);
      if (critError) throw critError;
      setCriteria(crit || []);

      // 5. Periode aktif (status open) terbaru.
      //    maybeSingle() dipakai (bukan single()) supaya tidak error kalau
      //    hasilnya 0 baris atau tidak sengaja ada lebih dari 1 baris.
      const { data: per, error: perError } = await supabase
        .from('evaluation_periods')
        .select('*')
        .eq('status', 'open')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (perError) throw perError;
      setPeriod(per);

      setLoading(false);
    } catch (err) {
      console.error('Gagal memuat dashboard divisi:', err);
      setLoadError('Terjadi kesalahan saat memuat data: ' + (err.message || 'tidak diketahui'));
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.paper, color: COLORS.muted }}>
        Memuat...
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.paper, padding: 24 }}>
        <div style={{ maxWidth: 480, background: '#F7E7E5', border: '1px solid #E9C4C0', color: COLORS.rust, padding: '16px 20px', borderRadius: 10, fontSize: 14 }}>
          ⚠️ {loadError}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const roleLabel = ROLE_CONFIG[profile.role]?.label || profile.role;
  const initials = roleLabel.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <AppShell navLabel="Penilaian" userInitials={initials} userName={roleLabel} userSub={`Divisi: ${profile.division}`} onLogout={handleLogout}>
      <MainHead
        title={`Dashboard ${roleLabel}`}
        subtitle={`Divisi: ${profile.division} \u00b7 Periode aktif: ${period?.name || '-'}`}
      />

      {!period && (
        <div style={{ background: '#FBF1DD', border: '1px solid #E9DEC2', color: '#7A5E22', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13.5 }}>
          ⚠️ Belum ada periode penilaian yang aktif. Hubungi HRD/Admin untuk membuka periode penilaian terlebih dahulu sebelum bisa menilai karyawan.
        </div>
      )}

      {!selectedEmployee ? (
        <div style={card}>
          <h3 style={cardTitle}>Daftar Karyawan Divisi {profile.division}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr><th style={th}>Nama</th><th style={th}>Jabatan</th><th style={th}>Aksi</th></tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={td}>{emp.full_name}</td>
                  <td style={td}>{emp.position}</td>
                  <td style={td}>
                    <button
                      onClick={() => setSelectedEmployee(emp)}
                      disabled={!period}
                      style={period ? button('gold') : { ...button('gold'), background: '#E4E7E8', color: COLORS.muted, cursor: 'not-allowed' }}
                    >
                      Nilai Kinerja
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td style={td} colSpan={3}>Belum ada karyawan aktif di divisi ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={card}>
          <button onClick={() => setSelectedEmployee(null)} style={{ ...button('link'), marginBottom: 18, fontSize: 13 }}>
            ← Kembali ke daftar karyawan
          </button>
          <EvaluationForm
            employee={selectedEmployee}
            period={period}
            criteriaList={criteria}
            evaluatorId={profile.id}
            onSaved={() => {
              alert('Penilaian berhasil disimpan.');
              setSelectedEmployee(null);
            }}
          />
        </div>
      )}
    </AppShell>
  );
}
