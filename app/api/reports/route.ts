import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateWeeklyReport } from '@/lib/ai';
import { sendWeeklyReport } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Get all competitors with recent data
    const competitors = await prisma.competitor.findMany({
      include: {
        pricing: { orderBy: { capturedAt: 'desc' }, take: 1 },
        features: { where: { status: 'active' } },
        news: { orderBy: { createdAt: 'desc' }, take: 5 },
        alerts: { 
          where: { 
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
          } 
        },
      },
    });

    // Calculate week dates
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekOf = startDate.toISOString().split('T')[0];

    // Generate AI report
    const reportContent = await generateWeeklyReport(competitors);

    // Store report
    const report = await prisma.weeklyReport.create({
      data: {
        startDate,
        endDate,
        summary: reportContent || '',
        recommendations: '',
      },
    });

    // Send email if provided
    if (email) {
      await sendWeeklyReport(email, reportContent || '', weekOf);
      await prisma.weeklyReport.update({
        where: { id: report.id },
        data: { sentAt: new Date() },
      });
    }

    return NextResponse.json({
      report,
      content: reportContent,
      weekOf,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Cron endpoint for automated weekly reports
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Trigger report generation
    const reportUrl = new URL(request.url);
    reportUrl.searchParams.set('email', email);
    
    const reportReq = new NextRequest(reportUrl, { method: 'GET' });
    return GET(reportReq);
  } catch (error) {
    console.error('Cron report error:', error);
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
  }
}
