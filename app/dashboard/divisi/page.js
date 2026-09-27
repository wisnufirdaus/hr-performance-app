'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabaseClient';
import EvaluationForm from '../../../components/EvaluationForm';

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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        router.push('/login');
        return;
      }
      const user = userData.user;

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

      const { data: emps, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('division', prof.division)
        .eq('status', 'aktif');
      if (empError) throw empError;
      setEmployees(emps || []);

      const { data: crit, error: critError } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .or(`category.eq.umum,division.eq."${prof.division}"`)
        .eq('is_active', true);
      if (critError) throw critError;
      setCriteria(crit || []);

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

  if (loading) return <p style={{ padding: 24 }}>Memuat...</p>;

  if (loadError) {
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '14px 18px', borderRadius: 8, fontSize: 14 }}>
          ⚠️ {loadError}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Dashboard {profile.role.replace('head_', 'Head ').replace('_', ' ')}</h1>
      <p style={{ color: '#666' }}>Divisi: {profile.division} · Periode aktif: {period?.name || '-'}</p>

      {!period && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          ⚠️ Belum ada periode penilaian yang aktif. Hubungi HRD/Admin untuk membuka periode penilaian terlebih dahulu sebelum bisa menilai karyawan.
        </div>
      )}

      {!selectedEmployee ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: 8 }}>Nama</th><th style={{ padding: 8 }}>Jabatan</th><th style={{ padding: 8 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 8 }}>{emp.full_name}</td>
                <td style={{ padding: 8 }}>{emp.position}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => setSelectedEmployee(emp)}
                    disabled={!period}
                    style={{
                      padding: '6px 14px', border: 'none', borderRadius: 6,
                      background: period ? '#2563eb' : '#ccc',
                      color: '#fff', cursor: period ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Nilai Kinerja
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setSelectedEmployee(null)} style={{ marginBottom: 16, background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
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
    </div>
  );
}