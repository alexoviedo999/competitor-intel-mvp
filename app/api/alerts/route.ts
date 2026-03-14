import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');

    const where: any = {};
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      include: { competitor: { select: { name: true, domain: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, isRead } = body;

    await prisma.alert.updateMany({
      where: { id: { in: ids } },
      data: { isRead },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alerts:', error);
    return NextResponse.json({ error: 'Failed to update alerts' }, { status: 500 });
  }
}
