'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import EvaluationForm from '../../../components/EvaluationForm';

export default function DivisiDashboard() {
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [period, setPeriod] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    setProfile(prof);

    // Karyawan aktif di divisi ini saja (dijamin juga oleh RLS di database)
    const { data: emps } = await supabase
      .from('employees')
      .select('*')
      .eq('division', prof.division)
      .eq('status', 'aktif');
    setEmployees(emps || []);

    // Kriteria: umum + khusus divisi ini
    const { data: crit } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .or(`category.eq.umum,division.eq.${prof.division}`)
      .eq('is_active', true);
    setCriteria(crit || []);

    // Periode aktif (status open) terbaru
    const { data: per } = await supabase
      .from('evaluation_periods')
      .select('*')
      .eq('status', 'open')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
    setPeriod(per);
  }

  if (!profile) return <p style={{ padding: 24 }}>Memuat...</p>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Dashboard {profile.role.replace('head_', 'Head ').replace('_', ' ')}</h1>
      <p style={{ color: '#666' }}>Divisi: {profile.division} · Periode aktif: {period?.name || '-'}</p>

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
                    style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
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
