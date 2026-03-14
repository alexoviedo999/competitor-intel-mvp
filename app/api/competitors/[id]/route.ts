import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: {
        pricing: { orderBy: { capturedAt: 'desc' }, take: 10 },
        features: { orderBy: { launchedAt: 'desc' } },
        news: { orderBy: { createdAt: 'desc' }, take: 20 },
        jobs: { where: { status: 'active' }, orderBy: { postedAt: 'desc' } },
        reviews: { orderBy: { capturedAt: 'desc' }, take: 20 },
        alerts: { orderBy: { createdAt: 'desc' }, take: 20 },
        snapshots: { orderBy: { capturedAt: 'desc' }, take: 5 },
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    return NextResponse.json(competitor);
  } catch (error) {
    console.error('Error fetching competitor:', error);
    return NextResponse.json({ error: 'Failed to fetch competitor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.competitor.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
  }
}
