import AdventApp from '@/components/AdventApp';
import { getTodayKstDateString } from '@/lib/dateUtils';

/**
 * 매 접속 시 서버 기준 한국 시간(KST) 당일 말씀만 정확히 계산하기 위해 동적 렌더링을 사용합니다.
 */
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const serverTodayKst = getTodayKstDateString();
  return <AdventApp serverTodayKst={serverTodayKst} />;
}
