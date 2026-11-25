import { NextResponse } from 'next/server';
import { buildWeeklySketchPayload, isChristmasExportUnlocked } from '@/lib/exportUtils';
import { getAllReflections } from '@/lib/storage';

/**
 * GET /api/export/summary
 * 성탄절(12월 25일) 이후 주차별 4페이지 묵상 스케치 출력을 위한 집계 데이터를 반환합니다.
 */
export async function GET() {
  if (!isChristmasExportUnlocked()) {
    return NextResponse.json(
      { error: '대림절 묵상 스케치 출력은 성탄절(12월 25일)부터 열립니다.' },
      { status: 403 }
    );
  }

  try {
    const allReflections = await getAllReflections();
    const payload = buildWeeklySketchPayload(allReflections);
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/export/summary] 오류:', err);
    return NextResponse.json(
      { error: '묵상 스케치 데이터를 준비하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
