'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabaseClient';
import { exportEvaluationToExcel } from '../../../lib/exportExcel';
import AppShell, { MainHead } from '../../../components/AppShell';
import {
  COLORS, card, cardTitle, badge, statusVariant, button, input, label,
  th, td, statCard, statLabel, statValue,
} from '../../../lib/theme';

const DIVISIONS = [
  'Sales Store', 'Marketing', 'Supermarket', 'Marketplace',
  'Produksi', 'Pastry', 'Warehouse', 'Packaging',
];

export default function HRDDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [filterStatus, setFilterStatus] = useState('aktif');
  const [showForm, setShowForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ nik: '', full_name: '', division: DIVISIONS[0], position: '' });
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState([]);
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [filterStatus]);

  useEffect(() => {
    loadPeriods();
  }, []);

  async function loadPeriods() {
    const { data } = await supabase
      .from('evaluation_periods')
      .select('id, name')
      .order('start_date', { ascending: false });
    setPeriods(data || []);
    setSelectedPeriodIds((data || []).map((p) => p.id)); // default: semua periode terpilih
  }

  function togglePeriod(id) {
    setSelectedPeriodIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function loadEmployees() {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('status', filterStatus)
      .order('full_name');
    setEmployees(data || []);
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    const { error } = await supabase.from('employees').insert({
      ...newEmployee,
      status: 'aktif',
      join_date: new Date().toISOString().slice(0, 10),
    });
    if (error) return alert('Gagal menambah karyawan: ' + error.message);
    setShowForm(false);
    setNewEmployee({ nik: '', full_name: '', division: DIVISIONS[0], position: '' });
    loadEmployees();
  }

  async function markAsResign(id) {
    if (!confirm('Tandai karyawan ini sebagai resign?')) return;
    await supabase.from('employees').update({
      status: 'resign',
      resign_date: new Date().toISOString().slice(0, 10),
    }).eq('id', id);
    loadEmployees();
  }

  async function handleExportAll() {
    if (selectedPeriodIds.length === 0) {
      alert('Pilih minimal satu periode terlebih dahulu.');
      return;
    }

    // Ambil rekap penilaian gabungan (join evaluations + employees + periods),
    // difilter hanya untuk periode yang dicentang di panel filter
    const { data, error } = await supabase
      .from('evaluations')
      .select(`
        total_score, final_grade, notes,
        employees ( nik, full_name, division, position ),
        evaluation_periods ( name )
      `)
      .in('period_id', selectedPeriodIds);

    if (error) return alert('Gagal mengambil data: ' + error.message);

    const formatted = (data || []).map((d) => ({
      nik: d.employees?.nik,
      nama: d.employees?.full_name,
      divisi: d.employees?.division,
      jabatan: d.employees?.position,
      periode: d.evaluation_periods?.name,
      total_score: d.total_score,
      final_grade: d.final_grade,
      catatan: d.notes,
    }));

    const periodLabel = periods
      .filter((p) => selectedPeriodIds.includes(p.id))
      .map((p) => p.name)
      .join('_')
      .replace(/\s+/g, '-');

    exportEvaluationToExcel(formatted, `Rekap-Penilaian-${periodLabel}.xlsx`);
    setShowPeriodFilter(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <AppShell navLabel="Data Karyawan" userInitials="HR" userName="HRD" onLogout={handleLogout}>
      <MainHead title="Data Karyawan & Rekap Penilaian" subtitle="Kelola data karyawan & tarik rekap penilaian ke Excel" />

      <div style={{ ...statCard, display: 'inline-flex', flexDirection: 'column', marginBottom: 22 }}>
        <div style={statLabel}>Karyawan {filterStatus === 'aktif' ? 'Aktif' : 'Resign'}</div>
        <div style={{ ...statValue, color: COLORS.goldDark }}>{employees.length}</div>
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: showForm ? 18 : 0 }}>
          <button onClick={() => setFilterStatus('aktif')} style={button(filterStatus === 'aktif' ? 'primary' : 'ink-outline')}>
            Karyawan Aktif
          </button>
          <button onClick={() => setFilterStatus('resign')} style={button(filterStatus === 'resign' ? 'primary' : 'ink-outline')}>
            Karyawan Resign
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ ...button('ink-outline'), marginLeft: 'auto' }}>
            + Tambah Karyawan
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowPeriodFilter(!showPeriodFilter)} style={button('green')}>
              Unduh Excel
            </button>
            {showPeriodFilter && (
              <div style={styles.periodFilter}>
                <div style={styles.pfTitle}>Pilih Periode yang Diekspor</div>
                {periods.map((p) => (
                  <label key={p.id} style={styles.pfItem}>
                    <input
                      type="checkbox"
                      checked={selectedPeriodIds.includes(p.id)}
                      onChange={() => togglePeriod(p.id)}
                    />
                    {p.name}
                  </label>
                ))}
                <div style={{ display: 'flex', gap: 14, margin: '6px 2px 2px' }}>
                  <button onClick={() => setSelectedPeriodIds(periods.map((p) => p.id))} style={button('link')}>Pilih Semua</button>
                  <button onClick={() => setSelectedPeriodIds([])} style={button('link')}>Kosongkan</button>
                </div>
                <button onClick={handleExportAll} style={{ ...button('green'), width: '100%', justifyContent: 'center', marginTop: 10 }}>
                  Unduh Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleAddEmployee} style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <div>
                <label style={label}>NIK</label>
                <input required placeholder="EMP-00231" value={newEmployee.nik}
                  onChange={(e) => setNewEmployee({ ...newEmployee, nik: e.target.value })} style={input} />
              </div>
              <div>
                <label style={label}>Nama Lengkap</label>
                <input required placeholder="Nama karyawan" value={newEmployee.full_name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })} style={input} />
              </div>
              <div>
                <label style={label}>Divisi</label>
                <select value={newEmployee.division}
                  onChange={(e) => setNewEmployee({ ...newEmployee, division: e.target.value })} style={input}>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Jabatan</label>
                <input placeholder="Operator Produksi" value={newEmployee.position}
                  onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} style={input} />
              </div>
            </div>
            <button type="submit" style={{ ...button('gold'), marginTop: 16, maxWidth: 200 }}>Simpan Karyawan</button>
          </form>
        )}
      </div>

      <div style={card}>
        <h3 style={cardTitle}>Daftar Karyawan</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>NIK</th><th style={th}>Nama</th><th style={th}>Divisi</th>
              <th style={th}>Jabatan</th><th style={th}>Status</th><th style={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td style={{ ...td, fontFamily: "'IBM Plex Mono', monospace" }}>{emp.nik}</td>
                <td style={td}>{emp.full_name}</td>
                <td style={td}>{emp.division}</td>
                <td style={td}>{emp.position}</td>
                <td style={td}><span style={badge(statusVariant(emp.status))}>{emp.status === 'aktif' ? 'Aktif' : 'Resign'}</span></td>
                <td style={td}>
                  {filterStatus === 'aktif' && (
                    <a href="#" onClick={(e) => { e.preventDefault(); markAsResign(emp.id); }} style={{ color: COLORS.rust }}>
                      Tandai Resign
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td style={td} colSpan={6}>Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

const styles = {
  periodFilter: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 20, width: 240,
    background: '#fff', border: `1px solid ${COLORS.line}`, borderRadius: 10,
    boxShadow: '0 12px 32px rgba(0,0,0,.14)', padding: 14,
  },
  pfTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: COLORS.muted, marginBottom: 10, fontWeight: 600 },
  pfItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 2px', cursor: 'pointer', color: COLORS.ink2 },
};
