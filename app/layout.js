export const metadata = {
  title: 'Sistem Penilaian Kinerja Karyawan',
  description: 'Aplikasi penilaian kinerja karyawan per divisi, per kuartal.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, boxSizing: 'border-box' }}>{children}</body>
    </html>
  );
}
