import { NextRequest, NextResponse } from 'next/server';
import { incrementReflectionAmen } from '@/lib/storage';

/**
 * POST /api/reflections/[id]/amen
 * 특정 묵상 댓글의 '아멘 ♥' 공감 수를 1 증가시킵니다.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const trimmedId = (id ?? '').trim();

    if (!trimmedId) {
      return NextResponse.json({ error: '잘못된 묵상 ID입니다.' }, { status: 400 });
    }

    const updated = await incrementReflectionAmen(trimmedId);
    if (!updated) {
      return NextResponse.json({ error: '해당 묵상 글을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/reflections/[id]/amen] 오류:', err);
    return NextResponse.json(
      { error: '아멘 공감을 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
