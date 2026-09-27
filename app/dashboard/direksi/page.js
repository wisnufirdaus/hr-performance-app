'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AppShell, { MainHead } from '../../../components/AppShell';
import { COLORS, card, cardTitle, input, statCard, statLabel, statValue } from '../../../lib/theme';

export default function DireksiDashboard() {
  const supabase = createClient();
  const router = useRouter();
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const periodName = periods.find((p) => p.id === selectedPeriod)?.name || '-';
  const overallAvg = summary.length
    ? (summary.reduce((s, d) => s + d.rataRata, 0) / summary.length).toFixed(1)
    : '-';
  const topDivision = summary.length
    ? summary.reduce((a, b) => (b.rataRata > a.rataRata ? b : a)).division
    : '-';

  return (
    <AppShell navLabel="Ringkasan" userInitials="DR" userName="Owner / Direksi" userSub="Read-only" onLogout={handleLogout}>
      <MainHead
        title="Dashboard Owner / Direksi"
        subtitle={`Perkembangan kinerja karyawan per divisi \u00b7 ${periodName}`}
        right={
          <select
            value={selectedPeriod || ''}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ ...input, width: 'auto' }}
          >
            {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 22 }}>
        <div style={statCard}>
          <div style={statLabel}>Rata-rata Skor Seluruh Divisi</div>
          <div style={{ ...statValue, color: COLORS.goldDark }}>{overallAvg}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Divisi Skor Tertinggi</div>
          <div style={{ ...statValue, color: COLORS.green, fontSize: 20 }}>{topDivision}</div>
        </div>
      </div>

      <div style={card}>
        <h3 style={cardTitle}>Rata-rata Skor per Divisi</h3>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} />
              <XAxis dataKey="division" tick={{ fontSize: 12, fill: COLORS.muted }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.muted }} />
              <Tooltip />
              <Bar dataKey="rataRata" fill={COLORS.teal} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ fontSize: 13, color: COLORS.muted, marginTop: 12, marginBottom: 0 }}>
          Grafik menampilkan rata-rata skor kinerja tiap divisi pada periode yang dipilih.
          Untuk melihat rincian per karyawan, hubungi HRD untuk laporan Excel lengkap.
        </p>
      </div>
    </AppShell>
  );
}
