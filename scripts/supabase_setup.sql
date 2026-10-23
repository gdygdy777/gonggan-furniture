-- 공간가구연구소 Supabase 복구용 스키마 (SQL Editor 에 통째로 붙여넣고 Run)
-- 테이블 2개 + 스토리지 버킷 1개 + 보안정책(RLS) 설정

-- ───────────────────────── 1) 고객 문의 테이블 ─────────────────────────
create table if not exists public.inquiries (
  id         bigint generated always as identity primary key,
  name       text,
  phone      text,
  area       text,
  work_type  text,
  message    text,
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;

-- 누구나(홈페이지 방문자=익명) 문의 접수 가능
drop policy if exists "anon_insert_inquiries" on public.inquiries;
create policy "anon_insert_inquiries" on public.inquiries
  for insert to anon with check (true);

-- 로그인한 관리자만 조회 가능 (고객 연락처 보호)
drop policy if exists "auth_select_inquiries" on public.inquiries;
create policy "auth_select_inquiries" on public.inquiries
  for select to authenticated using (true);

-- ──────────────────── 2) 사이트 데이터(제품 수정본) 테이블 ────────────────────
create table if not exists public.site_data (
  key        text primary key,
  data       jsonb,
  updated_at timestamptz
);
alter table public.site_data enable row level security;

-- 익명도 읽기 가능 (공개 페이지에 수정본 반영)
drop policy if exists "anon_select_site_data" on public.site_data;
create policy "anon_select_site_data" on public.site_data
  for select to anon using (true);

-- 로그인 관리자만 쓰기(업서트)
drop policy if exists "auth_write_site_data" on public.site_data;
create policy "auth_write_site_data" on public.site_data
  for all to authenticated using (true) with check (true);

-- ───────────────────── 3) 문의 사진 스토리지 버킷 ─────────────────────
insert into storage.buckets (id, name, public)
values ('inquiry-photos', 'inquiry-photos', true)
on conflict (id) do update set public = true;

-- 익명 업로드 허용(문의 폼에서 사진 첨부)
drop policy if exists "anon_upload_inquiry_photos" on storage.objects;
create policy "anon_upload_inquiry_photos" on storage.objects
  for insert to anon with check (bucket_id = 'inquiry-photos');

-- 누구나 사진 보기 가능(이메일/관리자에서 링크로 열람)
drop policy if exists "public_read_inquiry_photos" on storage.objects;
create policy "public_read_inquiry_photos" on storage.objects
  for select to public using (bucket_id = 'inquiry-photos');
