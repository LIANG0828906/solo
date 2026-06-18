import { NextResponse } from 'next/server';
import { prisma, DEFAULT_USER_ID, getDefaultUser } from '@/lib/prisma';
import type { RoastLevel } from '@prisma/client';

interface CreateRecordBody {
  coffeeName: string;
  roastLevel: RoastLevel;
  rating: number;
  notes?: string;
  flavorTagIds: string[];
}

const VALID_ROAST_LEVELS: ReadonlyArray<RoastLevel> = ['LIGHT', 'MEDIUM', 'DARK', 'EXTRA_DARK'];

export async function GET() {
  try {
    await getDefaultUser();

    const records = await prisma.record.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: { flavorTags: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('GET /api/records error:', error);
    return NextResponse.json(
      { success: false, error: '获取记录失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRecordBody;
    const { coffeeName, roastLevel, rating, notes, flavorTagIds } = body;

    if (!coffeeName || typeof coffeeName !== 'string' || coffeeName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '咖啡名称不能为空' },
        { status: 400 }
      );
    }

    if (!VALID_ROAST_LEVELS.includes(roastLevel)) {
      return NextResponse.json(
        { success: false, error: '烘焙度无效' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { success: false, error: '评分必须为1-5的整数' },
        { status: 400 }
      );
    }

    if (!Array.isArray(flavorTagIds)) {
      return NextResponse.json(
        { success: false, error: '风味标签格式错误' },
        { status: 400 }
      );
    }

    if (flavorTagIds.length > 3) {
      return NextResponse.json(
        { success: false, error: '最多选择3个风味标签' },
        { status: 400 }
      );
    }

    const uniqueTagIds = Array.from(new Set(flavorTagIds));

    if (uniqueTagIds.length > 0) {
      const existingTags = await prisma.flavorTag.findMany({
        where: { id: { in: uniqueTagIds } },
        select: { id: true },
      });
      if (existingTags.length !== uniqueTagIds.length) {
        return NextResponse.json(
          { success: false, error: '存在无效的风味标签' },
          { status: 400 }
        );
      }
    }

    await getDefaultUser();

    const newRecord = await prisma.record.create({
      data: {
        userId: DEFAULT_USER_ID,
        coffeeName: coffeeName.trim(),
        roastLevel,
        rating,
        notes: notes?.trim() || null,
        flavorTags: {
          connect: uniqueTagIds.map((id) => ({ id })),
        },
      },
      include: { flavorTags: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/records error:', error);
    return NextResponse.json(
      { success: false, error: '创建记录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
