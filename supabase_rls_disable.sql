-- ================================================================
-- RLS DISABLE untuk Development / Hackathon
-- Jalankan ini di Supabase SQL Editor SETELAH main schema SQL
--
-- Kenapa perlu ini?
-- App ini pakai custom auth (bukan Supabase Auth bawaan),
-- jadi semua request datang sebagai role 'anon'.
-- Policy yang kita buat sebelumnya butuh role 'authenticated'.
-- Solusi hackathon: matikan RLS dulu biar semua bisa akses.
-- ================================================================

ALTER TABLE public.users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_symptoms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_records  DISABLE ROW LEVEL SECURITY;

-- Verifikasi RLS sudah mati
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Semua kolom rowsecurity harus FALSE
