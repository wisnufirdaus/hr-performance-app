// Design tokens & style helper bersama, diambil dari mockup/preview.html
// supaya semua halaman punya tampilan yang konsisten.

export const COLORS = {
  ink: '#1B2A3A',
  ink2: '#233648',
  ink3: '#2C4258',
  paper: '#F1F4F3',
  paper2: '#FFFFFF',
  gold: '#D9A441',
  goldDark: '#B9832E',
  green: '#3E7D5A',
  rust: '#B8483E',
  teal: '#2F6F72',
  slateblue: '#3B587A',
  slate: '#7C8798',
  line: '#DCE2E5',
  muted: '#6B7680',
};

export const fontDisplay = "'Sora', sans-serif";
export const fontBody = "'IBM Plex Sans', sans-serif";
export const fontMono = "'IBM Plex Mono', monospace";

export const card = {
  background: COLORS.paper2,
  borderRadius: 12,
  padding: 22,
  border: `1px solid ${COLORS.line}`,
};

export const cardTitle = {
  fontSize: 14,
  margin: '0 0 18px',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  color: COLORS.ink2,
  fontFamily: fontDisplay,
  fontWeight: 600,
};

export function badge(variant) {
  const map = {
    green: { bg: '#E5F0EA', color: COLORS.green },
    gold: { bg: '#FBF1DD', color: COLORS.goldDark },
    rust: { bg: '#F7E7E5', color: COLORS.rust },
  };
  const c = map[variant] || map.gold;
  return {
    display: 'inline-block', padding: '3px 9px', borderRadius: 99,
    fontSize: 11, fontWeight: 600, background: c.bg, color: c.color,
  };
}

// Predikat penilaian -> warna badge
export function gradeVariant(grade) {
  if (grade === 'Sangat Baik') return 'green';
  if (grade === 'Baik') return 'gold';
  if (grade === 'Cukup') return 'gold';
  return 'rust';
}

// Status karyawan -> warna badge
export function statusVariant(status) {
  return status === 'aktif' ? 'green' : 'rust';
}

export function button(variant = 'primary') {
  const base = {
    padding: '11px 18px', borderRadius: 8, border: 'none', fontWeight: 600,
    fontSize: 13.5, cursor: 'pointer', fontFamily: fontBody, transition: '.15s',
  };
  if (variant === 'primary') return { ...base, background: COLORS.ink, color: '#fff' };
  if (variant === 'gold') return { ...base, background: COLORS.gold, color: COLORS.ink };
  if (variant === 'green') return { ...base, background: COLORS.green, color: '#fff' };
  if (variant === 'ghost') return { ...base, background: 'transparent', color: COLORS.ink2, border: `1.5px solid ${COLORS.line}` };
  if (variant === 'ink-outline') return { ...base, background: '#fff', color: COLORS.ink2, border: `1.5px solid ${COLORS.line}` };
  if (variant === 'link') return { ...base, background: 'none', border: 'none', color: COLORS.slateblue, textDecoration: 'underline', padding: 0, fontWeight: 500, fontSize: 12.5 };
  return base;
}

export const input = {
  width: '100%', padding: '11px 13px', borderRadius: 8, border: `1.5px solid ${COLORS.line}`,
  fontSize: 14, fontFamily: fontBody, background: '#fbfcfc', boxSizing: 'border-box',
};

export const label = {
  display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.ink2,
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em',
};

export const th = {
  textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
  color: COLORS.muted, padding: '8px 10px', borderBottom: `2px solid ${COLORS.line}`,
};
export const td = { padding: '10px 10px', borderBottom: '1px solid #F0F2F3', fontSize: 13, verticalAlign: 'middle' };

export const statCard = { background: COLORS.paper2, borderRadius: 12, padding: '18px 20px', border: `1px solid ${COLORS.line}` };
export const statLabel = { fontSize: 12, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 };
export const statValue = { fontSize: 26, fontWeight: 700, fontFamily: fontMono };
