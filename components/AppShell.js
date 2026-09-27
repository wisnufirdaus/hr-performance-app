'use client';

import { COLORS, fontDisplay, fontBody } from '../lib/theme';

/**
 * Kerangka aplikasi (sidebar + area konten), dipakai oleh semua halaman
 * dashboard supaya tampilannya konsisten mengikuti mockup/preview.html.
 *
 * @param {string} navLabel - label menu yang sedang aktif di sidebar
 * @param {string} userInitials - inisial untuk avatar bulat (mis. "HD")
 * @param {string} userName - nama/peran user yang ditampilkan di sidebar
 * @param {string} [userSub] - baris kedua kecil di bawah userName (mis. nama divisi)
 * @param {Function} onLogout - handler tombol "Keluar"
 */
export default function AppShell({ navLabel, userInitials, userName, userSub, onLogout, children }) {
  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brandRow}>
          <div style={styles.brandMark} />
          <div style={styles.brandName}>KINERJA</div>
        </div>

        <div style={styles.navItemActive}>
          <span style={styles.dot} />
          {navLabel}
        </div>

        <div style={styles.sidebarFoot}>
          <div style={styles.userChip}>
            <div style={styles.avatar}>{userInitials}</div>
            <div>
              {userName}
              {userSub && (
                <>
                  <br />
                  <span style={{ color: '#6B7680' }}>{userSub}</span>
                </>
              )}
            </div>
          </div>
          <div style={styles.logout} onClick={onLogout}>← Keluar</div>
        </div>
      </aside>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

/** Header judul halaman + slot opsional di kanan (mis. dropdown periode) */
export function MainHead({ title, subtitle, right }) {
  return (
    <div style={styles.mainHead}>
      <div>
        <h1 style={styles.mainHeadTitle}>{title}</h1>
        {subtitle && <div style={styles.mainHeadSub}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

const styles = {
  shell: {
    minHeight: '100vh', display: 'flex', background: COLORS.paper,
    fontFamily: fontBody, color: COLORS.ink,
  },
  sidebar: {
    width: 230, background: COLORS.ink, color: '#fff', padding: '22px 16px',
    flexShrink: 0, display: 'flex', flexDirection: 'column',
  },
  brandRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 6px 22px', borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 16,
  },
  brandMark: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: `conic-gradient(${COLORS.gold} 0 15%, ${COLORS.goldDark} 15% 25%, ${COLORS.green} 25% 35%, ${COLORS.teal} 35% 70%, ${COLORS.slateblue} 70% 85%, ${COLORS.rust} 85% 95%, ${COLORS.slate} 95% 100%)`,
  },
  brandName: { fontFamily: fontDisplay, fontWeight: 700, fontSize: 13, letterSpacing: '.02em' },
  navItemActive: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
    background: COLORS.gold, color: COLORS.ink, fontSize: 13.5, fontWeight: 600, marginBottom: 2,
  },
  dot: { width: 6, height: 6, borderRadius: '50%', background: 'currentColor' },
  sidebarFoot: {
    marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)',
    fontSize: 12, color: '#8695A3',
  },
  userChip: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%', background: COLORS.slateblue,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  logout: { cursor: 'pointer' },
  main: { flex: 1, padding: '30px 34px', overflow: 'auto' },
  mainHead: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24, flexWrap: 'wrap', gap: 12,
  },
  mainHeadTitle: { fontFamily: fontDisplay, fontSize: 21, margin: '0 0 4px' },
  mainHeadSub: { color: COLORS.muted, fontSize: 13 },
};
