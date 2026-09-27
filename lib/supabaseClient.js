import { createBrowserClient } from '@supabase/ssr';

// Dipakai di komponen sisi client (browser)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Pemetaan role -> label & halaman dashboard tujuan
export const ROLE_CONFIG = {
  superadmin:        { label: 'Super Admin',              home: '/dashboard/admin' },
  hrd:                { label: 'HRD',                      home: '/dashboard/hrd' },
  direksi:            { label: 'Owner / Direksi',          home: '/dashboard/direksi' },
  head_sales_store:   { label: 'Head Sales Store',         home: '/dashboard/divisi', division: 'Sales Store' },
  head_marketing:     { label: 'Head Marketing',           home: '/dashboard/divisi', division: 'Marketing' },
  head_supermarket:   { label: 'Head Supermarket',         home: '/dashboard/divisi', division: 'Supermarket' },
  head_marketplace:   { label: 'Head Marketplace',         home: '/dashboard/divisi', division: 'Marketplace' },
  head_produksi:      { label: 'Head Produksi',            home: '/dashboard/divisi', division: 'Produksi' },
  head_pastry:        { label: 'Head Pastry',              home: '/dashboard/divisi', division: 'Pastry' },
  head_warehouse:     { label: 'Head Warehouse',           home: '/dashboard/divisi', division: 'Warehouse' },
  head_packaging:     { label: 'Head Packaging',           home: '/dashboard/divisi', division: 'Packaging' },
};
