'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import { exportEvaluationToExcel } from '../../../lib/exportExcel';

const DIVISIONS = [
  'Sales Store', 'Marketing', 'Supermarket', 'Marketplace',
  'Produksi', 'Pastry', 'Warehouse', 'Packaging',
];

export default function HRDDashboard() {
  const supabase = createClient();
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

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1>Dashboard HRD</h1>
      <p style={{ color: '#666' }}>Kelola data karyawan & tarik rekap penilaian ke Excel</p>

      <div style={{ display: 'flex', gap: 10, margin: '16px 0' }}>
        <button onClick={() => setFilterStatus('aktif')} style={btn(filterStatus === 'aktif')}>Karyawan Aktif</button>
        <button onClick={() => setFilterStatus('resign')} style={btn(filterStatus === 'resign')}>Karyawan Resign</button>
        <button onClick={() => setShowForm(!showForm)} style={{ ...btn(false), marginLeft: 'auto' }}>+ Tambah Karyawan</button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowPeriodFilter(!showPeriodFilter)} style={{ ...btn(false), background: '#16a34a', color: '#fff' }}>
            Export Excel (Pilih Periode)
          </button>
          {showPeriodFilter && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #ddd',
              borderRadius: 10, padding: 14, width: 240, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 10,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#666', margin: '0 0 8px', textTransform: 'uppercase' }}>
                Pilih Periode yang Diekspor
              </p>
              {periods.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '5px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedPeriodIds.includes(p.id)}
                    onChange={() => togglePeriod(p.id)}
                  />
                  {p.name}
                </label>
              ))}
              <div style={{ display: 'flex', gap: 12, margin: '8px 0 4px' }}>
                <button onClick={() => setSelectedPeriodIds(periods.map((p) => p.id))} style={linkBtn}>Pilih Semua</button>
                <button onClick={() => setSelectedPeriodIds([])} style={linkBtn}>Kosongkan</button>
              </div>
              <button onClick={handleExportAll} style={{ ...btn(true), width: '100%', marginTop: 10 }}>
                Unduh Sekarang
              </button>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddEmployee} style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
          <input required placeholder="NIK" value={newEmployee.nik} onChange={(e) => setNewEmployee({ ...newEmployee, nik: e.target.value })} style={inputStyle} />
          <input required placeholder="Nama Lengkap" value={newEmployee.full_name} onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })} style={inputStyle} />
          <select value={newEmployee.division} onChange={(e) => setNewEmployee({ ...newEmployee, division: e.target.value })} style={inputStyle}>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input placeholder="Jabatan" value={newEmployee.position} onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} style={inputStyle} />
          <button type="submit" style={{ ...btn(true), marginTop: 8 }}>Simpan</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={th}>NIK</th><th style={th}>Nama</th><th style={th}>Divisi</th><th style={th}>Jabatan</th><th style={th}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={td}>{emp.nik}</td>
              <td style={td}>{emp.full_name}</td>
              <td style={td}>{emp.division}</td>
              <td style={td}>{emp.position}</td>
              <td style={td}>
                {filterStatus === 'aktif' && (
                  <button onClick={() => markAsResign(emp.id)} style={{ color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>
                    Tandai Resign
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const linkBtn = { background: 'none', border: 'none', color: '#2563eb', fontSize: 12, textDecoration: 'underline', cursor: 'pointer', padding: 0 };
const btn = (active) => ({
  padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
  background: active ? '#2563eb' : '#fff', color: active ? '#fff' : '#333', cursor: 'pointer',
});
const inputStyle = { display: 'block', width: '100%', maxWidth: 320, padding: 8, marginBottom: 8, borderRadius: 6, border: '1px solid #ddd' };
const th = { padding: '8px 6px', fontSize: 13, color: '#555' };
const td = { padding: '8px 6px', fontSize: 14 };
