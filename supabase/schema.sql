-- =============================================================
-- 2026 대림절 묵상 웹앱 Supabase 스키마
-- Supabase SQL Editor에 그대로 복사하여 실행하면 테이블이 생성됩니다.
-- =============================================================

-- 1) 묵상 나눔(댓글) 테이블
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- YYYY-MM-DD 형식의 묵상 날짜 (예: '2026-11-30')
  devotion_date TEXT NOT NULL,
  author_name TEXT NOT NULL CHECK (char_length(trim(author_name)) BETWEEN 1 AND 30),
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  amen_count INTEGER NOT NULL DEFAULT 0 CHECK (amen_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 테이블이 이미 있는 경우 amen_count 컬럼을 안전하게 추가합니다.
ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS amen_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_reflections_date_created
  ON public.reflections (devotion_date, created_at DESC);

-- 아멘(공감) 카운트를 동시 클릭에도 안전하게 1 증가시키는 함수
CREATE OR REPLACE FUNCTION public.increment_reflection_amen(target_id UUID)
RETURNS TABLE (
  id UUID,
  devotion_date TEXT,
  author_name TEXT,
  content TEXT,
  amen_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.reflections
  SET amen_count = amen_count + 1
  WHERE public.reflections.id = target_id
  RETURNING
    public.reflections.id,
    public.reflections.devotion_date,
    public.reflections.author_name,
    public.reflections.content,
    public.reflections.amen_count,
    public.reflections.created_at;
$$;

-- 2) 성경 본문 캐시 테이블 (외부 사이트 반복 요청 방지 및 빠른 로딩용)
-- 저작권 보호를 위해 GitHub 저장소에는 커밋하지 않고 운영 DB에만 캐시합니다.
CREATE TABLE IF NOT EXISTS public.bible_cache (
  cache_key TEXT PRIMARY KEY,
  translation TEXT NOT NULL,
  book_code TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verses JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_cache ENABLE ROW LEVEL SECURITY;

-- 누구나 묵상 조회, 등록 및 아멘 공감 가능 (수정/삭제 없음)
DROP POLICY IF EXISTS "Allow public read reflections" ON public.reflections;
CREATE POLICY "Allow public read reflections"
  ON public.reflections FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert reflections" ON public.reflections;
CREATE POLICY "Allow public insert reflections"
  ON public.reflections FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update amen reflections" ON public.reflections;
CREATE POLICY "Allow public update amen reflections"
  ON public.reflections FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 성경 본문 캐시는 서버 API를 통해 읽고 쓸 수 있도록 허용
DROP POLICY IF EXISTS "Allow public read bible_cache" ON public.bible_cache;
CREATE POLICY "Allow public read bible_cache"
  ON public.bible_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public upsert bible_cache" ON public.bible_cache;
CREATE POLICY "Allow public upsert bible_cache"
  ON public.bible_cache FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update bible_cache" ON public.bible_cache;
CREATE POLICY "Allow public update bible_cache"
  ON public.bible_cache FOR UPDATE
  USING (true);

-- 3) 아침 7시 웹 푸시 알림 구독 테이블
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public manage push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public manage push_subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);
