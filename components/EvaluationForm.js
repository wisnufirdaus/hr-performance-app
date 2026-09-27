'use client';

import { useState, useMemo } from 'react';
import { createClient } from '../lib/supabaseClient';
import { COLORS, fontDisplay, badge, gradeVariant, button, input } from '../lib/theme';

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

  const grade = gradeFromScore(totalScore);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      <h2 style={{ marginBottom: 4, fontFamily: fontDisplay, fontSize: 19 }}>{employee.full_name}</h2>
      <p style={{ color: COLORS.muted, marginBottom: 20, fontSize: 13.5 }}>
        {employee.division} &middot; {employee.position} &middot; Periode: {period?.name || '(periode belum diatur)'}
      </p>

      {criteriaList.map((c) => (
        <div key={c.id} style={{ marginBottom: 12, padding: '12px 14px', border: `1px solid ${COLORS.line}`, borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 13.5, color: COLORS.ink2 }}>{c.name}</strong>
            <span style={badge(c.category === 'umum' ? 'gold' : 'green')}>
              Bobot {c.weight}% &middot; {c.category === 'umum' ? 'Umum' : 'Divisi'}
            </span>
          </div>
          {c.description && <p style={{ fontSize: 12.5, color: COLORS.muted, margin: '6px 0 0' }}>{c.description}</p>}
          <input
            type="number"
            min={0}
            max={c.max_score}
            required
            value={scores[c.id]}
            onChange={(e) => setScores({ ...scores, [c.id]: e.target.value })}
            placeholder={`Skor 0 - ${c.max_score}`}
            style={{ ...input, width: 160, marginTop: 10 }}
          />
        </div>
      ))}

      <div style={{ ...badge(gradeVariant(grade)), display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box', padding: '14px 18px', borderRadius: 10, fontSize: 13.5, margin: '20px 0' }}>
        <span>Total Skor (terbobot): <strong style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{totalScore}</strong></span>
        <span>Predikat: <strong>{grade}</strong></span>
      </div>

      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: COLORS.ink2 }}>Catatan Tambahan</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        style={{ ...input, width: '100%' }}
      />

      <button type="submit" disabled={saving} style={{ ...button('gold'), marginTop: 16 }}>
        {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
      </button>
    </form>
  );
}
