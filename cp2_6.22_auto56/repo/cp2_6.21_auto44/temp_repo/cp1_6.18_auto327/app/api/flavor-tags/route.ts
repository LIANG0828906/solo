import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tags = await prisma.flavorTag.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('GET /api/flavor-tags error:', error);
    return NextResponse.json(
      { success: false, error: '获取风味标签失败' },
      { status: 500 }
    );
  }
}
