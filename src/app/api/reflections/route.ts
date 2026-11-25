import { NextRequest, NextResponse } from 'next/server';
import { getAdventPeriodStatus, getTodayKstDateString } from '@/lib/dateUtils';
import { createReflection, getReflectionsByDate, getStorageMode } from '@/lib/storage';

/**
 * 묵상 나눔(댓글) API (항상 서버 기준 한국 시간 KST 당일 날짜 대상)
 * - GET  /api/reflections
 * - POST /api/reflections { authorName, content }
 */

export async function GET() {
  try {
    const targetDate = getTodayKstDateString();
    const items = await getReflectionsByDate(targetDate);

    return NextResponse.json({
      date: targetDate,
      storageMode: getStorageMode(),
      items,
    });
  } catch (err) {
    console.error('[GET /api/reflections] 오류:', err);
    return NextResponse.json(
      { error: '묵상 댓글 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      authorName?: string;
      content?: string;
    } | null;

    if (!body) {
      return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    const targetDate = getTodayKstDateString();

    if (getAdventPeriodStatus(targetDate) !== 'active') {
      return NextResponse.json(
        { error: '대림절 묵상 기간에만 묵상을 등록할 수 있습니다.' },
        { status: 400 }
      );
    }

    const authorName = (body.authorName ?? '').trim();
    const content = (body.content ?? '').trim();

    if (authorName.length < 1 || authorName.length > 30) {
      return NextResponse.json(
        { error: '이름(닉네임)은 1자 이상 30자 이하로 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (content.length < 2 || content.length > 2000) {
      return NextResponse.json(
        { error: '묵상 내용은 2자 이상 2,000자 이하로 작성해 주세요.' },
        { status: 400 }
      );
    }

    const created = await createReflection(targetDate, authorName, content);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/reflections] 오류:', err);
    return NextResponse.json(
      { error: '묵상을 저장하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
