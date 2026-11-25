'use client';

import { useEffect, useState } from 'react';
import type { AdventThemeTokens } from '@/lib/theme';
import { Bell, BellOff, BellRing, CalendarPlus, Check, Info } from 'lucide-react';

/**
 * 매일 아침 7시 대림절 말씀묵상 알림 설정 바
 *
 * 두 가지 방식을 함께 제공해 안드로이드·아이폰·카카오톡 인앱 브라우저까지 모두 커버합니다:
 * 1) PWA Web Push 알림: 매일 오전 7시(KST) 서버가 기기로 직접 푸시 발송
 * 2) 폰 캘린더(.ics) 일괄 등록: 11/29~12/25 매일 오전 7시 정시 알림 27일치를 기본 캘린더에 등록
 */

interface MorningAlarmBarProps {
  theme: AdventThemeTokens;
}

/** VAPID Base64URL 공개키를 PushManager가 요구하는 Uint8Array로 변환합니다. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function MorningAlarmBar({ theme }: MorningAlarmBarProps) {
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'info' | 'success' | 'warn'; text: string } | null>(
    null
  );
  const [envFlags, setEnvFlags] = useState({
    isKakaoInApp: false,
    isIosNeedInstall: false,
    supportsPush: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isKakaoInApp = /KAKAOTALK/i.test(ua);
    const isIos =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const supportsPush =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    setEnvFlags({
      isKakaoInApp,
      isIosNeedInstall: isIos && !isStandalone,
      supportsPush,
    });

    // 서버 VAPID 공개키 확인 및 기존 구독 상태 동기화
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/push/subscribe', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as {
            configured?: boolean;
            vapidPublicKey?: string | null;
          };
          if (!cancelled && data.configured && data.vapidPublicKey) {
            setVapidPublicKey(data.vapidPublicKey);
          }
        }
      } catch {
        // 무시
      }

      if (supportsPush) {
        try {
          const reg = await navigator.serviceWorker.getRegistration('/sw.js');
          const sub = await reg?.pushManager.getSubscription();
          if (!cancelled && sub) {
            setPushSubscribed(true);
          }
        } catch {
          // 무시
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTogglePush = async () => {
    setNotice(null);

    if (envFlags.isKakaoInApp) {
      setNotice({
        kind: 'warn',
        text: "카카오톡 내부 브라우저에서는 푸시 알림이 제한됩니다. 우측 하단(⋮) → '다른 브라우저로 열기'를 이용하시거나, 옆의 [캘린더 7시 등록] 버튼을 눌러주세요!",
      });
      return;
    }

    if (envFlags.isIosNeedInstall) {
      setNotice({
        kind: 'warn',
        text: "아이폰(Safari)은 하단 공유(↑) → '홈 화면에 추가' 후 홈 화면 아이콘으로 앱을 열어야 웹 푸시 알림을 켤 수 있어요! 번거로우시면 옆의 [캘린더 7시 등록]을 바로 이용해 보세요.",
      });
      return;
    }

    if (!envFlags.supportsPush) {
      setNotice({
        kind: 'warn',
        text: '현재 브라우저는 웹 푸시 알림을 지원하지 않습니다. 옆의 [캘린더 7시 등록 (.ics)] 버튼으로 매일 아침 7시 알림을 등록해 보세요!',
      });
      return;
    }

    setBusy(true);
    try {
      // 이미 구독 중이면 해제 처리
      if (pushSubscribed) {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setPushSubscribed(false);
        setNotice({ kind: 'info', text: '아침 7시 웹 푸시 알림을 해제했습니다.' });
        return;
      }

      // 1) 알림 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotice({
          kind: 'warn',
          text: '브라우저 알림 권한이 거부되어 있습니다. 사이트 설정에서 알림을 허용하시거나 옆의 [캘린더 7시 등록]을 이용해 주세요.',
        });
        return;
      }

      // 2) Service Worker 등록
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 3) 서버 VAPID 키가 아직 미설정(로컬 개발 중)이면 테스트 알림 미리보기 제공
      if (!vapidPublicKey) {
        await registration.showNotification('대림절 말씀묵상 시간입니다', {
          body: '미리보기 알림입니다. 배포 환경에 VAPID 키를 설정하면 매일 아침 7시에 자동 발송됩니다.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
        setNotice({
          kind: 'info',
          text: '미리보기 알림을 띄워드렸습니다! 배포 시 .env에 VAPID 키를 등록하면 매일 아침 7시에 자동으로 울립니다.',
        });
        return;
      }

      // 4) 실제 Web Push 구독 생성 및 서버(Supabase) 저장
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = subscription.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!res.ok) {
        await subscription.unsubscribe();
        throw new Error('서버 저장 실패');
      }

      setPushSubscribed(true);
      setNotice({
        kind: 'success',
        text: '아침 7시 웹 푸시 알림이 켜졌습니다! 대림절 기간 매일 아침 7시에 말씀 알림을 보내드릴게요.',
      });
    } catch (err) {
      setNotice({
        kind: 'warn',
        text: `푸시 알림 설정 중 오류가 발생했습니다. (${err instanceof Error ? err.message : '알 수 없는 오류'})`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="pixel-panel px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {pushSubscribed ? (
            <BellRing className="h-4 w-4 shrink-0 text-amber-300" />
          ) : (
            <Bell className="h-4 w-4 shrink-0" style={{ color: theme.frameGold }} />
          )}
          <div>
            <p className="font-pixel text-xs sm:text-sm" style={{ color: theme.frameGold }}>
              매일 아침 7시 말씀묵상 알림
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: theme.textMuted }}>
              “대림절 말씀묵상 시간입니다” 알림을 폰으로 받아보세요
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleTogglePush()}
            className="pixel-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] disabled:opacity-50"
            style={{
              backgroundColor: pushSubscribed ? 'rgba(16, 185, 129, 0.2)' : theme.panelBgSoft,
              color: pushSubscribed ? '#a7f3d0' : theme.frameGold,
            }}
          >
            {pushSubscribed ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>7시 푸시 켜짐</span>
                <BellOff className="ml-0.5 h-3 w-3 opacity-70" />
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                <span>{busy ? '설정 중...' : '7시 푸시 켜기'}</span>
              </>
            )}
          </button>

          <a
            href="/api/calendar/advent.ics"
            className="pixel-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px]"
            style={{
              backgroundColor: 'rgba(12, 6, 28, 0.55)',
              color: theme.accentPurple,
            }}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>캘린더 7시 등록 (.ics)</span>
          </a>
        </div>
      </div>

      {notice && (
        <div
          className="mt-2.5 flex items-start gap-2 border px-3 py-2 text-[11.5px] leading-relaxed"
          style={{
            borderColor:
              notice.kind === 'success'
                ? 'rgba(52, 211, 153, 0.45)'
                : notice.kind === 'warn'
                  ? 'rgba(251, 191, 36, 0.45)'
                  : 'rgba(196, 181, 253, 0.35)',
            backgroundColor:
              notice.kind === 'success'
                ? 'rgba(6, 78, 59, 0.32)'
                : notice.kind === 'warn'
                  ? 'rgba(120, 53, 15, 0.28)'
                  : 'rgba(30, 18, 62, 0.5)',
            color: theme.textPrimary,
          }}
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: theme.frameGold }} />
          <span>{notice.text}</span>
        </div>
      )}
    </section>
  );
}
