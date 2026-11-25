import Link from 'next/link';
import SketchPrintView from '@/components/SketchPrintView';
import { buildWeeklySketchPayload, isChristmasExportUnlocked } from '@/lib/exportUtils';
import { getAllReflections } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function SketchPrintPage() {
  if (!isChristmasExportUnlocked()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#180c33] px-4 text-purple-50">
        <div className="pixel-panel max-w-md p-6 text-center">
          <p className="font-pixel text-xs text-amber-200">2026 ADVENT SKETCH</p>
          <h1 className="font-pixel mt-2 text-lg text-[#f0cf70]">
            성탄절(12월 25일)에 열립니다
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-purple-200">
            1~4주차 대림절 묵상 스케치(4페이지)와 전체 묵상 엑셀 시트는 성탄절 당일부터
            출력하실 수 있습니다.
          </p>
          <Link
            href="/"
            className="pixel-btn mt-5 inline-block bg-[#291852] px-4 py-2 text-xs text-[#f0cf70]"
          >
            오늘의 말씀으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const allReflections = await getAllReflections();
  const payload = buildWeeklySketchPayload(allReflections);

  return <SketchPrintView payload={payload} />;
}
