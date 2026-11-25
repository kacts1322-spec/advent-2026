'use client';

import { useEffect, useState } from 'react';
import type { ReflectionItem } from '@/types/advent';
import type { AdventThemeTokens } from '@/lib/theme';
import { formatCommentTimeKst } from '@/lib/dateUtils';
import { Heart, MessageSquareHeart, Send } from 'lucide-react';

/**
 * 오늘의 묵상 나눔 입력 폼 & 댓글 리스트 컴포넌트
 *
 * - 로그인/비밀번호 없이 [이름(닉네임) + 묵상 내용]만으로 간편하게 등록합니다.
 * - 각 댓글에는 서로 은혜를 나누는 '아멘 ♥' 공감 버튼이 있어 기기당 1회 누를 수 있습니다.
 */

interface ReflectionSectionProps {
  devotionDate: string;
  reflections: ReflectionItem[];
  isLoading: boolean;
  onCreated: (newItem: ReflectionItem) => void;
  onUpdated: (updatedItem: ReflectionItem) => void;
  theme: AdventThemeTokens;
}

const AUTHOR_STORAGE_KEY = 'advent-2026-author-name';
const AMENED_STORAGE_KEY = 'advent-2026-amened-ids';

/** 작성자 이름 문자열을 바탕으로 일관된 픽셀 배지 색상을 선택합니다. */
function getAvatarAccent(name: string): string {
  const palette = ['#d9be76', '#c4b5fd', '#f48fb1', '#93c5fd', '#86efac', '#fcd34d'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % palette.length;
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function ReflectionSection({
  devotionDate,
  reflections,
  isLoading,
  onCreated,
  onUpdated,
  theme,
}: ReflectionSectionProps) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [amenedIds, setAmenedIds] = useState<Set<string>>(new Set());
  const [pendingAmenIds, setPendingAmenIds] = useState<Set<string>>(new Set());

  // 이전에 입력했던 닉네임과 '아멘 ♥' 누른 댓글 목록을 브라우저에서 복원합니다.
  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem(AUTHOR_STORAGE_KEY);
      if (savedName) setAuthorName(savedName);

      const savedAmened = window.localStorage.getItem(AMENED_STORAGE_KEY);
      if (savedAmened) {
        const parsed = JSON.parse(savedAmened);
        if (Array.isArray(parsed)) {
          setAmenedIds(new Set(parsed.map(String)));
        }
      }
    } catch {
      // 시크릿 모드 등으로 localStorage 접근이 불가해도 무시
    }
  }, []);

  const handleAmenClick = async (item: ReflectionItem) => {
    if (amenedIds.has(item.id) || pendingAmenIds.has(item.id)) return;

    // 즉각적인 반응성을 위해 먼저 낙관적 업데이트 적용
    const optimisticItem: ReflectionItem = {
      ...item,
      amenCount: (item.amenCount ?? 0) + 1,
    };
    onUpdated(optimisticItem);

    setPendingAmenIds((prev) => new Set(prev).add(item.id));
    setAmenedIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      try {
        window.localStorage.setItem(AMENED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // 무시
      }
      return next;
    });

    try {
      const res = await fetch(`/api/reflections/${encodeURIComponent(item.id)}/amen`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = (await res.json()) as { item?: ReflectionItem };
        if (data.item) {
          onUpdated(data.item);
        }
      } else {
        // 실패 시 원래 카운트로 롤백
        onUpdated(item);
        setAmenedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    } catch {
      onUpdated(item);
      setAmenedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } finally {
      setPendingAmenIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = authorName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName) {
      setErrorMsg('이름(또는 닉네임)을 입력해 주세요.');
      return;
    }
    if (trimmedContent.length < 2) {
      setErrorMsg('묵상 내용을 2자 이상 작성해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devotionDate,
          authorName: trimmedName,
          content: trimmedContent,
        }),
      });

      const data = (await res.json()) as { item?: ReflectionItem; error?: string };

      if (!res.ok || !data.item) {
        setErrorMsg(data.error ?? '묵상을 등록하지 못했습니다. 다시 시도해 주세요.');
        return;
      }

      try {
        window.localStorage.setItem(AUTHOR_STORAGE_KEY, trimmedName);
      } catch {
        // 무시
      }

      onCreated(data.item);
      setContent('');
      setSuccessMsg('오늘의 묵상이 등록되었습니다.');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reflection-section" className="pixel-panel p-4 sm:p-6">
      {/* 섹션 헤더 */}
      <div
        className="flex items-center justify-between gap-2 border-b pb-3.5"
        style={{ borderColor: 'rgba(217, 190, 118, 0.28)' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="h-4 w-4" style={{ color: theme.frameGold }} />
          <h2 className="font-pixel text-base sm:text-lg" style={{ color: theme.frameGold }}>
            오늘의 묵상 나누기
          </h2>
        </div>

        <span
          className="font-pixel border px-2 py-0.5 text-[11px]"
          style={{
            borderColor: theme.frameGoldDark,
            backgroundColor: 'rgba(12, 6, 28, 0.45)',
            color: theme.accentPurple,
          }}
        >
          나눔 {reflections.length}개
        </span>
      </div>

      {/* 묵상 입력 폼 */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label
              htmlFor="reflection-author"
              className="font-pixel mb-1 block text-[11px]"
              style={{ color: theme.textMuted }}
            >
              이름 / 닉네임
            </label>
            <input
              id="reflection-author"
              type="text"
              maxLength={30}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="예: 김하늘"
              className="w-full border-2 bg-[#130a29]/80 px-3 py-2 text-sm text-purple-50 placeholder:text-purple-300/40 focus:outline-none"
              style={{ borderColor: theme.frameGoldDark }}
            />
          </div>

          <div className="flex items-end sm:col-span-2">
            <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
              오늘 말씀에서 마음에 머문 구절, 감사, 혹은 작은 기도 제목을 자유롭게 나눠주세요.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="reflection-content"
              className="font-pixel text-[11px]"
              style={{ color: theme.textMuted }}
            >
              묵상 내용
            </label>
            <span className="text-[11px]" style={{ color: theme.textMuted }}>
              {content.length} / 2000
            </span>
          </div>
          <textarea
            id="reflection-content"
            rows={4}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 나에게 다가온 말씀을 적어보세요..."
            className="w-full resize-y border-2 bg-[#130a29]/80 p-3 text-sm leading-relaxed text-purple-50 placeholder:text-purple-300/40 focus:outline-none"
            style={{ borderColor: theme.frameGoldDark }}
          />
        </div>

        {errorMsg && (
          <p className="border border-rose-400/50 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
            {errorMsg}
          </p>
        )}

        {successMsg && (
          <p className="border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
            {successMsg}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="pixel-btn inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-50"
            style={{
              backgroundColor: theme.panelBgSoft,
              color: theme.frameGold,
            }}
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? '등록 중...' : '묵상 올리기'}
          </button>
        </div>
      </form>

      {/* 입력칸 아래 묵상 댓글 리스트 */}
      <div className="mt-6 space-y-3 border-t pt-5" style={{ borderColor: 'rgba(217, 190, 118, 0.22)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-pixel text-xs" style={{ color: theme.accentPurple }}>
            함께 나눈 묵상 ({reflections.length})
          </h3>
          <span className="text-[11px]" style={{ color: theme.textMuted }}>
            은혜받은 묵상에 ‘아멘 ♥’으로 마음을 전해 보세요
          </span>
        </div>

        {isLoading ? (
          <div className="pixel-panel-soft py-8 text-center font-pixel text-xs" style={{ color: theme.textMuted }}>
            묵상 나눔을 불러오는 중...
          </div>
        ) : reflections.length === 0 ? (
          <div className="pixel-panel-soft px-4 py-8 text-center">
            <p className="font-pixel text-xs" style={{ color: theme.frameGold }}>
              아직 등록된 묵상이 없습니다
            </p>
            <p className="mt-1.5 text-xs" style={{ color: theme.textMuted }}>
              오늘의 첫 번째 묵상을 남겨 공동체와 은혜를 나눠보세요.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reflections.map((item) => {
              const avatarColor = getAvatarAccent(item.authorName);
              const initial = item.authorName.trim().slice(0, 1);
              const hasAmened = amenedIds.has(item.id);
              const isPending = pendingAmenIds.has(item.id);

              return (
                <li key={item.id} className="pixel-panel-soft p-3.5 sm:p-4">
                  <div className="flex items-start gap-3">
                    {/* 작은 2D 픽셀 아바타 배지 */}
                    <div
                      className="font-pixel flex h-8 w-8 shrink-0 items-center justify-center border-2 text-xs font-bold"
                      style={{
                        borderColor: avatarColor,
                        backgroundColor: 'rgba(12, 6, 28, 0.7)',
                        color: avatarColor,
                      }}
                      aria-hidden="true"
                    >
                      {initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className="font-pixel text-xs sm:text-sm"
                          style={{ color: theme.textPrimary }}
                        >
                          {item.authorName}
                        </span>
                        <time
                          className="text-[11px]"
                          style={{ color: theme.textMuted }}
                          dateTime={item.createdAt}
                        >
                          {formatCommentTimeKst(item.createdAt)}
                        </time>
                      </div>

                      <p
                        className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed"
                        style={{ color: theme.textPrimary }}
                      >
                        {item.content}
                      </p>

                      {/* 아멘 ♥ 공감 버튼 */}
                      <div className="mt-2.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleAmenClick(item)}
                          disabled={hasAmened || isPending}
                          aria-pressed={hasAmened}
                          className="font-pixel inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] transition-colors disabled:cursor-default"
                          style={{
                            borderColor: hasAmened
                              ? '#f472b6'
                              : 'rgba(217, 190, 118, 0.45)',
                            backgroundColor: hasAmened
                              ? 'rgba(244, 114, 182, 0.16)'
                              : 'rgba(12, 6, 28, 0.5)',
                            color: hasAmened ? '#fbcfe8' : theme.textMuted,
                          }}
                        >
                          <Heart
                            className={`h-3 w-3 ${hasAmened ? 'fill-pink-400 text-pink-400' : ''}`}
                          />
                          <span>아멘</span>
                          <span style={{ color: hasAmened ? '#fde68a' : theme.frameGold }}>
                            {item.amenCount ?? 0}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
