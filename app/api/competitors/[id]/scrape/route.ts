import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scrapePricing, detectPricingChanges } from '@/lib/scrapers/pricing';
import { scrapeFeatures, detectFeatureChanges } from '@/lib/scrapers/features';
import { scrapeBlog, scrapeHomepage, searchNews } from '@/lib/scrapers/news';
import { scrapeJobs, detectHiringSurge } from '@/lib/scrapers/jobs';
import { synthesizeIntel } from '@/lib/ai';
import { sendAlert } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { types = ['pricing', 'features', 'news', 'jobs'] } = body;

    const competitor = await prisma.competitor.findUnique({ where: { id } });
    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    const results: any = { competitor: competitor.name };

    // Scrape pricing
    if (types.includes('pricing')) {
      const pricing = await scrapePricing(competitor.domain);
      
      // Get last pricing snapshot
      const lastPricing = await prisma.pricingSnapshot.findFirst({
        where: { competitorId: id },
        orderBy: { capturedAt: 'desc' },
      });
      
      const oldTiers = lastPricing?.tiers as any[] || [];
      const changes = detectPricingChanges(oldTiers, pricing.tiers);
      
      const snapshot = await prisma.pricingSnapshot.create({
        data: {
          competitorId: id,
          tiers: pricing.tiers as any,
          rawHtml: pricing.rawHtml,
          changeDetected: changes.hasChanges,
          changeSummary: changes.summary,
        },
      });
      
      // Create alert if pricing changed
      if (changes.hasChanges) {
        await prisma.alert.create({
          data: {
            competitorId: id,
            type: 'pricing',
            severity: 'critical',
            title: 'Pricing Change Detected',
            description: changes.summary,
          },
        });
      }
      
      results.pricing = { snapshot, changes };
    }

    // Scrape features
    if (types.includes('features')) {
      const features = await scrapeFeatures(competitor.domain);
      
      const oldFeatures = await prisma.feature.findMany({
        where: { competitorId: id, status: 'active' },
      });
      
      const changes = detectFeatureChanges(oldFeatures, features);
      
      // Mark old features as deprecated
      if (changes.removed.length > 0) {
        await prisma.feature.updateMany({
          where: {
            competitorId: id,
            name: { in: changes.removed.map(f => f.name) },
          },
          data: { status: 'deprecated', deprecatedAt: new Date() },
        });
      }
      
      // Add new features
      if (changes.added.length > 0) {
        await prisma.feature.createMany({
          data: changes.added.map(f => ({
            competitorId: id,
            name: f.name,
            description: f.description,
          })),
          skipDuplicates: true,
        });
      }
      
      // Create alert for new features
      if (changes.added.length > 0) {
        await prisma.alert.create({
          data: {
            competitorId: id,
            type: 'feature',
            severity: 'warning',
            title: 'New Features Launched',
            description: changes.added.map(f => f.name).join(', '),
          },
        });
      }
      
      results.features = changes;
    }

    // Scrape news
    if (types.includes('news')) {
      const [blogPosts, homepage, googleNews] = await Promise.all([
        scrapeBlog(competitor.domain),
        scrapeHomepage(competitor.domain),
        searchNews(competitor.name),
      ]);
      
      // Update competitor with latest homepage data
      await prisma.competitor.update({
        where: { id },
        data: {
          tagline: homepage.tagline || homepage.h1Text,
        },
      });
      
      // Add news items
      for (const item of [...blogPosts, ...googleNews].slice(0, 10)) {
        await prisma.newsItem.upsert({
          where: {
            competitorId_title: {
              competitorId: id,
              title: item.title,
            },
          },
          create: {
            competitorId: id,
            title: item.title,
            url: item.url,
            source: item.source,
          },
          update: {
            source: item.source,
          },
        });
      }
      
      results.news = { blogPosts, googleNews };
    }

    // Scrape jobs
    if (types.includes('jobs')) {
      const jobs = await scrapeJobs(competitor.domain);
      
      const oldJobs = await prisma.jobPosting.findMany({
        where: { competitorId: id, status: 'active' },
      });
      
      const hiringChanges = detectHiringSurge(oldJobs, jobs);
      
      // Mark old jobs as removed
      if (hiringChanges.removedRoles.length > 0) {
        await prisma.jobPosting.updateMany({
          where: { competitorId: id, status: 'active' },
          data: { status: 'removed', removedAt: new Date() },
        });
      }
      
      // Add new jobs
      for (const job of jobs) {
        await prisma.jobPosting.upsert({
          where: {
            competitorId_title: {
              competitorId: id,
              title: job.title,
            },
          },
          create: {
            competitorId: id,
            title: job.title,
            department: job.department,
            location: job.location,
            url: job.url,
          },
          update: {
            department: job.department,
            location: job.location,
          },
        });
      }
      
      // Create alert for hiring surge
      if (hiringChanges.surge) {
        await prisma.alert.create({
          data: {
            competitorId: id,
            type: 'hiring',
            severity: 'info',
            title: 'Hiring Surge Detected',
            description: `${hiringChanges.newRoles.length} new roles posted`,
          },
        });
      }
      
      results.jobs = { count: jobs.length, surge: hiringChanges.surge };
    }

    // Generate AI synthesis
    const intel = await synthesizeIntel(competitor.name, results);
    results.synthesis = intel;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Scraping failed', details: String(error) }, { status: 500 });
  }
}
