import * as XLSX from 'xlsx';

/**
 * Export rekap penilaian kinerja ke file Excel.
 * @param {Array} data - array hasil query, contoh tiap baris:
 *   { nik, nama, divisi, jabatan, periode, total_score, final_grade, catatan }
 * @param {string} fileName - nama file, contoh "Rekap-Penilaian-Q1-2026.xlsx"
 */
export function exportEvaluationToExcel(data, fileName = 'Rekap-Penilaian.xlsx') {
  const rows = data.map((d) => ({
    'NIK': d.nik,
    'Nama Karyawan': d.nama,
    'Divisi': d.divisi,
    'Jabatan': d.jabatan || '-',
    'Periode': d.periode,
    'Total Skor': d.total_score,
    'Predikat': d.final_grade,
    'Catatan': d.catatan || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Lebar kolom otomatis biar rapi
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 18 },
    { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Penilaian');

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export detail skor per kriteria untuk satu karyawan (opsional, lebih rinci)
 */
export function exportDetailToExcel(employeeInfo, scores, fileName) {
  const rows = scores.map((s) => ({
    'Kriteria': s.criteria_name,
    'Kategori': s.category, // umum / khusus
    'Bobot (%)': s.weight,
    'Skor': s.score,
    'Skor Terbobot': ((s.score * s.weight) / 100).toFixed(2),
    'Komentar': s.comment || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.sheet_add_aoa(worksheet, [[`Detail Penilaian: ${employeeInfo.nama} (${employeeInfo.divisi})`]], { origin: -1 });
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail');
  XLSX.writeFile(workbook, fileName || `Detail-${employeeInfo.nama}.xlsx`);
}
