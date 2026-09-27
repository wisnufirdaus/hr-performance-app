'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DireksiDashboard() {
  const supabase = createClient();
  const [summary, setSummary] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) loadSummary();
  }, [selectedPeriod]);

  async function loadPeriods() {
    const { data } = await supabase.from('evaluation_periods').select('*').order('start_date', { ascending: false });
    setPeriods(data || []);
    if (data && data.length) setSelectedPeriod(data[0].id);
  }

  async function loadSummary() {
    // Rata-rata skor per divisi untuk periode terpilih (read-only, sesuai RLS role direksi)
    const { data } = await supabase
      .from('evaluations')
      .select('total_score, employees(division)')
      .eq('period_id', selectedPeriod);

    const grouped = {};
    (data || []).forEach((row) => {
      const div = row.employees?.division;
      if (!div) return;
      if (!grouped[div]) grouped[div] = { total: 0, count: 0 };
      grouped[div].total += row.total_score || 0;
      grouped[div].count += 1;
    });

    setSummary(
      Object.entries(grouped).map(([division, v]) => ({
        division,
        rataRata: Number((v.total / v.count).toFixed(1)),
      }))
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Dashboard Owner / Direksi</h1>
      <p style={{ color: '#666' }}>Perkembangan kinerja karyawan per divisi (read-only)</p>

      <select
        value={selectedPeriod || ''}
        onChange={(e) => setSelectedPeriod(e.target.value)}
        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', margin: '16px 0' }}
      >
        {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="division" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="rataRata" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
        Grafik menampilkan rata-rata skor kinerja tiap divisi pada periode yang dipilih.
        Untuk melihat rincian per karyawan, hubungi HRD untuk laporan Excel lengkap.
      </p>
    </div>
  );
}
