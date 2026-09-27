'use client';

import { useState, useMemo } from 'react';
import { createClient } from '../lib/supabaseClient';

/**
 * Form penilaian kinerja.
 * @param {object} employee - { id, full_name, division, position }
 * @param {object} period - { id, name }
 * @param {Array} criteriaList - gabungan kriteria umum + khusus divisi ybs
 * @param {string} evaluatorId - id user_profiles yang login (head divisi/HRD)
 */
export default function EvaluationForm({ employee, period, criteriaList, evaluatorId, onSaved }) {
  const [scores, setScores] = useState(
    Object.fromEntries(criteriaList.map((c) => [c.id, '']))
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const totalScore = useMemo(() => {
    let sum = 0;
    let totalWeight = 0;
    criteriaList.forEach((c) => {
      const val = parseFloat(scores[c.id]);
      if (!isNaN(val)) {
        sum += (val * c.weight) / 100;
        totalWeight += c.weight;
      }
    });
    return totalWeight > 0 ? Number(sum.toFixed(2)) : 0;
  }, [scores, criteriaList]);

  function gradeFromScore(score) {
    if (score >= 85) return 'Sangat Baik';
    if (score >= 70) return 'Baik';
    if (score >= 55) return 'Cukup';
    return 'Kurang';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    // 1. Simpan header evaluations
    const { data: evalRow, error: evalError } = await supabase
      .from('evaluations')
      .upsert({
        employee_id: employee.id,
        period_id: period.id,
        evaluated_by: evaluatorId,
        total_score: totalScore,
        final_grade: gradeFromScore(totalScore),
        notes,
        status: 'submitted',
      }, { onConflict: 'employee_id,period_id' })
      .select()
      .single();

    if (evalError) {
      alert('Gagal menyimpan penilaian: ' + evalError.message);
      setSaving(false);
      return;
    }

    // 2. Simpan detail skor per kriteria
    const detailRows = criteriaList.map((c) => ({
      evaluation_id: evalRow.id,
      criteria_id: c.id,
      score: parseFloat(scores[c.id]) || 0,
    }));

    const { error: scoreError } = await supabase
      .from('evaluation_scores')
      .upsert(detailRows, { onConflict: 'evaluation_id,criteria_id' });

    setSaving(false);
    if (scoreError) {
      alert('Gagal menyimpan detail skor: ' + scoreError.message);
      return;
    }

    onSaved && onSaved(evalRow);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      <h2 style={{ marginBottom: 4 }}>{employee.full_name}</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        {employee.division} · {employee.position} · Periode: {period.name}
      </p>

      {criteriaList.map((c) => (
        <div key={c.id} style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{c.name}</strong>
            <span style={{ fontSize: 12, color: '#888' }}>
              Bobot {c.weight}% · {c.category === 'umum' ? 'Kriteria Umum' : 'Kriteria Divisi'}
            </span>
          </div>
          {c.description && <p style={{ fontSize: 13, color: '#666', margin: '4px 0' }}>{c.description}</p>}
          <input
            type="number"
            min={0}
            max={c.max_score}
            required
            value={scores[c.id]}
            onChange={(e) => setScores({ ...scores, [c.id]: e.target.value })}
            placeholder={`Skor 0 - ${c.max_score}`}
            style={{ width: 140, padding: 8, borderRadius: 6, border: '1px solid #ddd', marginTop: 6 }}
          />
        </div>
      ))}

      <div style={{ margin: '20px 0', padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
        <strong>Total Skor (terbobot): {totalScore} → Predikat: {gradeFromScore(totalScore)}</strong>
      </div>

      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Catatan Tambahan</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box' }}
      />

      <button
        type="submit"
        disabled={saving}
        style={{ marginTop: 16, padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
      >
        {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
      </button>
    </form>
  );
}
