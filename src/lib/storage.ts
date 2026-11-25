import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { BibleVerse, ReflectionItem, TranslationId } from '@/types/advent';

/**
 * 듀얼 스토리지 어댑터 (Supabase 우선 -> 미설정 시 로컬 .data/ JSON 파일 자동 폴백)
 *
 * 왜 이렇게 구성했나:
 * - 로컬 개발 중에는 Supabase 키를 아직 입력하지 않아도 묵상 댓글 작성과 성경 캐시를
 *   즉시 테스트할 수 있어야 합니다.
 * - 추후 .env.local 또는 Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_URL과 키를 넣기만 하면
 *   코드 수정 없이 곧바로 Supabase DB로 자동 전환됩니다.
 */

const DATA_DIR = path.join(process.cwd(), '.data');
const REFLECTIONS_FILE = path.join(DATA_DIR, 'reflections.json');
const BIBLE_CACHE_FILE = path.join(DATA_DIR, 'bible-cache.json');
const PUSH_SUBS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

// 서버리스 환경에서 파일 쓰기가 막혀 있을 때를 대비한 인메모리 안전 폴백
const memoryBibleCache = new Map<string, BibleVerse[]>();
const memoryReflections: ReflectionItem[] = [];
const memoryPushSubs = new Map<string, PushSubscriptionRecord>();

let cachedSupabaseClient: SupabaseClient | null | undefined;

function getSupabaseClient(): SupabaseClient | null {
  if (cachedSupabaseClient !== undefined) {
    return cachedSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (url && key) {
    cachedSupabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  } else {
    cachedSupabaseClient = null;
  }

  return cachedSupabaseClient;
}

export function getStorageMode(): 'supabase' | 'local' {
  return getSupabaseClient() ? 'supabase' : 'local';
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function makeBibleCacheKey(
  translation: TranslationId,
  bookCode: string,
  chapter: number
): string {
  return `${translation}:${bookCode.toLowerCase()}:${chapter}`;
}

/** 캐시된 성경 1장 본문을 조회합니다. (메모리 -> Supabase 또는 로컬 파일) */
export async function getCachedChapter(
  translation: TranslationId,
  bookCode: string,
  chapter: number
): Promise<BibleVerse[] | null> {
  const key = makeBibleCacheKey(translation, bookCode, chapter);

  const memHit = memoryBibleCache.get(key);
  if (memHit && memHit.length > 0) {
    return memHit;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bible_cache')
        .select('verses')
        .eq('cache_key', key)
        .maybeSingle();

      if (!error && data && Array.isArray(data.verses) && data.verses.length > 0) {
        const verses = data.verses as BibleVerse[];
        memoryBibleCache.set(key, verses);
        return verses;
      }
    } catch (err) {
      console.warn('[storage] Supabase bible_cache 조회 실패:', err);
    }
    return null;
  }

  // 로컬 JSON 파일 캐시 조회
  const cacheMap = await readJsonFile<Record<string, BibleVerse[]>>(BIBLE_CACHE_FILE, {});
  const fileHit = cacheMap[key];
  if (Array.isArray(fileHit) && fileHit.length > 0) {
    memoryBibleCache.set(key, fileHit);
    return fileHit;
  }

  return null;
}

/** 스크래핑한 성경 1장 본문을 캐시에 저장합니다. */
export async function saveCachedChapter(
  translation: TranslationId,
  bookCode: string,
  chapter: number,
  verses: BibleVerse[]
): Promise<void> {
  if (verses.length === 0) return;

  const key = makeBibleCacheKey(translation, bookCode, chapter);
  memoryBibleCache.set(key, verses);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('bible_cache').upsert({
        cache_key: key,
        translation,
        book_code: bookCode.toLowerCase(),
        chapter,
        verses,
        fetched_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('[storage] Supabase bible_cache 저장 오류:', error.message);
      }
    } catch (err) {
      console.warn('[storage] Supabase bible_cache 저장 예외:', err);
    }
    return;
  }

  try {
    const cacheMap = await readJsonFile<Record<string, BibleVerse[]>>(BIBLE_CACHE_FILE, {});
    cacheMap[key] = verses;
    await writeJsonFile(BIBLE_CACHE_FILE, cacheMap);
  } catch (err) {
    // 읽기 전용 환경이면 메모리 캐시만 유지
    console.warn('[storage] 로컬 bible_cache 저장 생략(메모리 캐시 유지):', err);
  }
}

function normalizeReflection(item: Partial<ReflectionItem> & { id: string }): ReflectionItem {
  return {
    id: String(item.id),
    devotionDate: String(item.devotionDate ?? ''),
    authorName: String(item.authorName ?? ''),
    content: String(item.content ?? ''),
    amenCount: typeof item.amenCount === 'number' && Number.isFinite(item.amenCount) ? item.amenCount : 0,
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  };
}

/** 특정 날짜의 묵상 댓글 목록을 최신순으로 조회합니다. */
export async function getReflectionsByDate(devotionDate: string): Promise<ReflectionItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('reflections')
      .select('id, devotion_date, author_name, content, amen_count, created_at')
      .eq('devotion_date', devotionDate)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`묵상 목록을 불러오지 못했습니다: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      devotionDate: String(row.devotion_date),
      authorName: String(row.author_name),
      content: String(row.content),
      amenCount: Number(row.amen_count ?? 0),
      createdAt: String(row.created_at),
    }));
  }

  const fileList = await readJsonFile<ReflectionItem[]>(REFLECTIONS_FILE, memoryReflections);
  return fileList
    .filter((item) => item.devotionDate === devotionDate)
    .map((item) => normalizeReflection(item))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** 대림절 전체 기간의 묵상 댓글을 날짜 오름차순(같은 날은 작성순)으로 모두 조회합니다. */
export async function getAllReflections(): Promise<ReflectionItem[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('reflections')
      .select('id, devotion_date, author_name, content, amen_count, created_at')
      .order('devotion_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`전체 묵상 목록을 불러오지 못했습니다: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      devotionDate: String(row.devotion_date),
      authorName: String(row.author_name),
      content: String(row.content),
      amenCount: Number(row.amen_count ?? 0),
      createdAt: String(row.created_at),
    }));
  }

  const fileList = await readJsonFile<ReflectionItem[]>(REFLECTIONS_FILE, memoryReflections);
  return fileList
    .map((item) => normalizeReflection(item))
    .sort((a, b) => {
      if (a.devotionDate !== b.devotionDate) {
        return a.devotionDate < b.devotionDate ? -1 : 1;
      }
      return a.createdAt < b.createdAt ? -1 : 1;
    });
}

/** 새 묵상 댓글 1건을 저장하고 반환합니다. */
export async function createReflection(
  devotionDate: string,
  authorName: string,
  content: string
): Promise<ReflectionItem> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('reflections')
      .insert({
        devotion_date: devotionDate,
        author_name: authorName,
        content,
        amen_count: 0,
      })
      .select('id, devotion_date, author_name, content, amen_count, created_at')
      .single();

    if (error || !data) {
      throw new Error(`묵상을 저장하지 못했습니다: ${error?.message ?? '알 수 없는 오류'}`);
    }

    return {
      id: String(data.id),
      devotionDate: String(data.devotion_date),
      authorName: String(data.author_name),
      content: String(data.content),
      amenCount: Number(data.amen_count ?? 0),
      createdAt: String(data.created_at),
    };
  }

  const newItem: ReflectionItem = {
    id: crypto.randomUUID(),
    devotionDate,
    authorName,
    content,
    amenCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const fileList = await readJsonFile<ReflectionItem[]>(REFLECTIONS_FILE, []);
    fileList.unshift(newItem);
    await writeJsonFile(REFLECTIONS_FILE, fileList);
  } catch (err) {
    console.warn('[storage] 로컬 reflections 파일 저장 실패, 메모리 폴백 사용:', err);
    memoryReflections.unshift(newItem);
  }

  return newItem;
}

/** 특정 묵상 댓글의 '아멘 ♥' 공감 수를 1 증가시키고 갱신된 항목을 반환합니다. */
export async function incrementReflectionAmen(id: string): Promise<ReflectionItem | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    // 1) RPC 함수가 있으면 동시성 안전한 원자적 증가 사용
    const rpcRes = await supabase.rpc('increment_reflection_amen', { target_id: id });
    if (!rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
      const row = rpcRes.data[0] as Record<string, unknown>;
      return {
        id: String(row.id),
        devotionDate: String(row.devotion_date),
        authorName: String(row.author_name),
        content: String(row.content),
        amenCount: Number(row.amen_count ?? 0),
        createdAt: String(row.created_at),
      };
    }

    // 2) RPC 미생성 시 일반 SELECT -> UPDATE 폴백
    const { data: existing, error: fetchErr } = await supabase
      .from('reflections')
      .select('id, devotion_date, author_name, content, amen_count, created_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) return null;

    const nextCount = Number(existing.amen_count ?? 0) + 1;
    const { data: updated, error: updateErr } = await supabase
      .from('reflections')
      .update({ amen_count: nextCount })
      .eq('id', id)
      .select('id, devotion_date, author_name, content, amen_count, created_at')
      .single();

    if (updateErr || !updated) {
      throw new Error(`아멘 공감을 저장하지 못했습니다: ${updateErr?.message ?? '알 수 없는 오류'}`);
    }

    return {
      id: String(updated.id),
      devotionDate: String(updated.devotion_date),
      authorName: String(updated.author_name),
      content: String(updated.content),
      amenCount: Number(updated.amen_count ?? nextCount),
      createdAt: String(updated.created_at),
    };
  }

  // 로컬 JSON 파일 모드
  const fileList = await readJsonFile<ReflectionItem[]>(REFLECTIONS_FILE, memoryReflections);
  const idx = fileList.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  const updatedItem = normalizeReflection({
    ...fileList[idx],
    amenCount: (fileList[idx].amenCount ?? 0) + 1,
  });
  fileList[idx] = updatedItem;

  try {
    await writeJsonFile(REFLECTIONS_FILE, fileList);
  } catch (err) {
    console.warn('[storage] 로컬 amen 업데이트 저장 실패, 메모리 폴백 사용:', err);
    const memIdx = memoryReflections.findIndex((item) => item.id === id);
    if (memIdx !== -1) memoryReflections[memIdx] = updatedItem;
  }

  return updatedItem;
}

/** 아침 7시 푸시 알림 구독 기기를 저장(또는 갱신)합니다. */
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<PushSubscriptionRecord> {
  const record: PushSubscriptionRecord = {
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    createdAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint: record.endpoint,
      p256dh: record.p256dh,
      auth: record.auth,
      created_at: record.createdAt,
    });
    if (error) {
      throw new Error(`푸시 구독 저장 실패: ${error.message}`);
    }
    return record;
  }

  memoryPushSubs.set(record.endpoint, record);
  try {
    const map = await readJsonFile<Record<string, PushSubscriptionRecord>>(PUSH_SUBS_FILE, {});
    map[record.endpoint] = record;
    await writeJsonFile(PUSH_SUBS_FILE, map);
  } catch (err) {
    console.warn('[storage] 로컬 push_subscriptions 저장 실패, 메모리 폴백 유지:', err);
  }
  return record;
}

/** 만료되었거나 사용자가 해제한 푸시 구독 기기를 삭제합니다. */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);
    if (error) {
      console.warn('[storage] Supabase push_subscriptions 삭제 오류:', error.message);
    }
    return;
  }

  memoryPushSubs.delete(endpoint);
  try {
    const map = await readJsonFile<Record<string, PushSubscriptionRecord>>(PUSH_SUBS_FILE, {});
    delete map[endpoint];
    await writeJsonFile(PUSH_SUBS_FILE, map);
  } catch (err) {
    console.warn('[storage] 로컬 push_subscriptions 삭제 생략:', err);
  }
}

/** 발송 대상인 전체 푸시 구독 목록을 조회합니다. */
export async function getAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, created_at');
    if (error) {
      throw new Error(`푸시 구독 목록 조회 실패: ${error.message}`);
    }
    return (data ?? []).map((row) => ({
      endpoint: String(row.endpoint),
      p256dh: String(row.p256dh),
      auth: String(row.auth),
      createdAt: String(row.created_at),
    }));
  }

  const map = await readJsonFile<Record<string, PushSubscriptionRecord>>(PUSH_SUBS_FILE, {});
  const merged = new Map<string, PushSubscriptionRecord>(memoryPushSubs);
  for (const [k, v] of Object.entries(map)) {
    merged.set(k, v);
  }
  return Array.from(merged.values());
}
