'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, ROLE_CONFIG } from '../../lib/supabaseClient';

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
    <div style={styles.wrapper}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>Sistem Penilaian Kinerja Karyawan</h1>
        <p style={styles.subtitle}>Login menggunakan akun yang telah didaftarkan oleh Admin</p>

        <label style={styles.label}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          placeholder="nama@perusahaan.com"
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          placeholder="••••••••"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>

        <p style={styles.footnote}>
          Belum punya akun? Hubungi Admin untuk pendaftaran.
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' },
  card: { background: '#fff', padding: '2.5rem', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: 380 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: 600, color: '#333', display: 'block', marginTop: 12, marginBottom: 4 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  button: { width: '100%', marginTop: 20, padding: '12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 13, marginTop: 10 },
  footnote: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center' },
};
