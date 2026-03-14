import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const competitors = await prisma.competitor.findMany({
      include: {
        pricing: { orderBy: { capturedAt: 'desc' }, take: 2 },
        features: { where: { status: 'active' } },
        news: { orderBy: { createdAt: 'desc' }, take: 5 },
        alerts: { where: { isRead: false } },
        _count: { select: { jobs: true, reviews: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, tagline, targetMarket, pricingModel, fundingStage } = body;

    const competitor = await prisma.competitor.create({
      data: {
        name,
        domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        tagline,
        targetMarket,
        pricingModel,
        fundingStage,
      },
    });

    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    console.error('Error creating competitor:', error);
    return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 });
  }
}
