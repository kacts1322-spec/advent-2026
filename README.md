# 2026 대림절 말씀 묵상 (청년부 묵상집)

2026년 대림절(11월 29일 ~ 12월 25일) 기간 동안 매일 당일의 말씀을 읽고, 청년부 공동체와 함께 묵상을 나누는 2D 레트로 픽셀 감성 웹앱입니다.

## 주요 기능

- **당일 말씀 전용**: 서버 기준 한국 시간(KST)으로 매일 오늘 날짜의 말씀만 열립니다.
- **평일 & 주말(토/일) 맞춤 본문**:
  - **평일(월~금) 및 성탄절(12/25)**: `함께 묵상할 본문` 전체 + `기존 본문` 핵심 요절 하이라이트
  - **토요일·주일**: 2026 교회력 나 해(RCL Year B) 주일 4본문(구약·시편·서신서·복음서) 탭 제공
- **4종 번역본 단일 선택**: 개역개정, 새번역, 공동번역(대한성서공회) 및 NIV(BibleGateway) 지원 + 자동 캐시
- **주차별 깊어지는 보라색 테마 & 2D 픽셀 트리 · 대림초 4개**:
  - 1~4주차마다 보라색 톤이 진해지고 트리에 오너먼트가 하나씩 달리며, 트리 양옆 4색 대림초(진보라·연보라·분홍·흰색, 개별 대림환) 촛불이 매주 하나씩 점등됩니다.
  - 12월 25일에는 성탄 큰 별과 축복 메시지가 표시됩니다.
- **대림절·성탄절 유래 & 성탄목 신앙 교육 이야기**: 기본 접힘 상태의 안내 바에서 대림절·성탄절의 의미와 전통 성탄목 4가지 상징(사과·장미·빵·초)을 확인할 수 있습니다.
- **간편 묵상 댓글 & 아멘 ♥ 공감**: 로그인/비밀번호 없이 `[이름 + 묵상 내용]`으로 등록하고, 다른 지체의 묵상에 `아멘 ♥`으로 공감(기기당 1회)
- **매일 아침 7시 말씀묵상 알림 (PWA Web Push + 캘린더 `.ics`)**:
  - 웹 푸시 구독(`/api/push/subscribe`) 및 매일 오전 7시(KST) 자동 발송 API(`/api/cron/daily-push`, `vercel.json` + `.github/workflows/daily-advent-push.yml`)
  - 11/29~12/25 매일 오전 7시 정시 캘린더 알림 일괄 등록(`/api/calendar/advent.ics`)
- **성탄절 아카이브 출력 (12월 25일 이후 오픈)**:
  - **4주 묵상 스케치 (`/print/sketch`)**: 1~4주차(4주차+성탄절) 한 주당 A4 1페이지씩 총 4페이지 인쇄/PDF 저장 (중복 작성자 배려 + 아멘 수 자동 추천, `[↻ 다른 글]` 교체, 하단 전체 참여자 이름 표시)
  - **전체 묵상 엑셀 시트 (`/api/export/excel`)**: 전체 묵상 모음(`아멘 ♥` 포함) + 일자별 말씀 및 참여현황 2개 시트가 담긴 `.xlsx` 다운로드

## 사용 설명서 및 주차별 이미지

- 사용 설명서 PDF: `docs/2026_대림절_묵상웹앱_사용설명서.pdf`
- 주차별·성탄절 2D 씬 이미지: `docs/images/01_대림절_1주차.png` ~ `05_성탄절_12월25일.png`

## 로컬 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3026` 으로 접속합니다.

## Supabase DB & 아침 7시 웹 푸시 배포 설정

1. Supabase 프로젝트 생성 후 SQL Editor에서 `supabase/schema.sql` 실행
2. 터미널에서 `npm run generate-vapid` 실행 후 공개키·비밀키 발급
3. Vercel 환경변수(또는 로컬 `.env.local`)에 아래 값 설정 (`.env.example` 참고):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_SUBJECT=mailto:your-email@example.com
   CRON_SECRET=your_long_random_secret
   ```
4. GitHub 저장소 `Settings → Secrets and variables → Actions`에 `APP_URL`과 `CRON_SECRET`을 등록하면 `.github/workflows/daily-advent-push.yml`이 대림절 기간 매일 한국 시간 오전 7시에 자동 발송합니다.
