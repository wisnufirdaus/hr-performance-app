'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, ROLE_CONFIG } from '../../lib/supabaseClient';
import { COLORS, fontDisplay, input, label, button } from '../../lib/theme';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email atau password salah.');
      setLoading(false);
      return;
    }

    // Ambil role user untuk diarahkan ke dashboard yang sesuai
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, division')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      setError('Akun belum terdaftar sebagai user aplikasi. Hubungi Admin.');
      setLoading(false);
      return;
    }

    const target = ROLE_CONFIG[profile.role]?.home || '/dashboard';
    router.push(target);
  }

  return (
    <div style={styles.wrap}>
      {/* Panel kiri */}
      <div style={styles.left}>
        <div style={styles.decorCircle} />
        <div style={styles.brandRow}>
          <div style={styles.brandMark} />
          <div style={styles.brandName}>KINERJA &middot; Sistem Penilaian Karyawan</div>
        </div>
        <div style={styles.quote}>
          <h2 style={styles.quoteTitle}>Satu skor, tujuh sudut pandang tentang kinerja.</h2>
          <p style={styles.quoteText}>
            Kehadiran, ketepatan waktu, disiplin, produktivitas, kualitas kerja,
            kepatuhan SOP, dan alpha &mdash; dinilai tiap kuartal, dibaca dalam satu dashboard.
          </p>
        </div>
        <div style={styles.foot}>&copy; {new Date().getFullYear()} &mdash; Akses hanya untuk akun terdaftar perusahaan.</div>
      </div>

      {/* Panel kanan: form */}
      <div style={styles.right}>
        <form onSubmit={handleLogin} style={styles.form}>
          <h1 style={styles.title}>Masuk ke akun Anda</h1>
          <p style={styles.sub}>Gunakan email &amp; kata sandi yang diberikan oleh Admin.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={input}
              placeholder="nama@perusahaan.com"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
              placeholder="••••••••"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={{ ...button('primary'), width: '100%', padding: 12, marginTop: 8 }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <div style={styles.roleHint}>
            Akun tersedia untuk: HRD, Owner/Direksi, dan 8 Head Divisi. Belum punya akun? Hubungi Admin.
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', flexWrap: 'wrap' },
  left: {
    flex: '1 1 420px', background: `linear-gradient(160deg, ${COLORS.ink} 0%, ${COLORS.ink3} 100%)`,
    color: '#fff', padding: '56px 48px', display: 'flex', flexDirection: 'column',
    justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
  },
  decorCircle: {
    content: '""', position: 'absolute', right: -90, bottom: -90, width: 320, height: 320,
    borderRadius: '50%', opacity: 0.16,
    background: `conic-gradient(${COLORS.gold} 0 15%, ${COLORS.goldDark} 15% 25%, ${COLORS.green} 25% 35%, ${COLORS.teal} 35% 70%, ${COLORS.slateblue} 70% 85%, ${COLORS.rust} 85% 95%, ${COLORS.slate} 95% 100%)`,
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
    background: `conic-gradient(${COLORS.gold} 0 15%, ${COLORS.goldDark} 15% 25%, ${COLORS.green} 25% 35%, ${COLORS.teal} 35% 70%, ${COLORS.slateblue} 70% 85%, ${COLORS.rust} 85% 95%, ${COLORS.slate} 95% 100%)`,
  },
  brandName: { fontSize: 15, fontWeight: 700, letterSpacing: '.02em', fontFamily: fontDisplay },
  quote: { maxWidth: 340 },
  quoteTitle: { fontSize: 28, lineHeight: 1.3, fontWeight: 700, marginBottom: 14, fontFamily: fontDisplay },
  quoteText: { color: '#B9C4CE', fontSize: 14, lineHeight: 1.6 },
  foot: { fontSize: 12, color: '#8695A3', position: 'relative' },
  right: {
    flex: '1 1 420px', background: COLORS.paper2, padding: '56px', display: 'flex',
    flexDirection: 'column', justifyContent: 'center',
  },
  form: { maxWidth: 340, margin: '0 auto', width: '100%' },
  title: { fontSize: 22, margin: '0 0 6px', fontFamily: fontDisplay },
  sub: { color: COLORS.muted, fontSize: 13, marginBottom: 28 },
  error: { color: COLORS.rust, fontSize: 13, marginTop: 4, marginBottom: 4 },
  roleHint: {
    marginTop: 22, padding: '12px 14px', background: '#F5F2E9', border: '1px solid #E9DEC2',
    borderRadius: 8, fontSize: 12, color: '#7A5E22',
  },
};
