# Competitor Intel MVP

AI-powered competitor intelligence service. Monitor competitors 24/7 and deliver weekly intelligence reports.

## Features

- 🏢 **Competitor Management** - Add competitors by domain
- 💰 **Pricing Monitoring** - Track pricing changes automatically
- 🚀 **Feature Tracking** - Monitor new and deprecated features
- 📰 **News Aggregation** - Scrape blog posts and news mentions
- 💼 **Hiring Signals** - Track job postings and hiring surges
- 📊 **Dashboard UI** - Beautiful, responsive interface
- 📧 **Weekly Reports** - AI-generated intelligence summaries via email
- 🚨 **Alerts** - Real-time notifications for major changes

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Scraping:** Playwright
- **AI:** OpenAI GPT-4o-mini
- **Database:** PostgreSQL (Prisma ORM)
- **Email:** Resend
- **Styling:** Tailwind CSS

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OpenAI API key
- Resend API key (optional, for email)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/competitor-intel-mvp.git
cd competitor-intel-mvp
```

2. Install dependencies:
```bash
npm install
npx playwright install chromium
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Initialize the database:
```bash
npx prisma db push
```

5. Run development server:
```bash
npm run dev
```

## Usage

### Adding a Competitor

1. Go to Dashboard
2. Click "Add Competitor"
3. Enter company name and domain
4. Click "Refresh Data" to start tracking

### Triggering a Scrape

```bash
curl -X POST http://localhost:3000/api/competitors/{id}/scrape \
  -H "Content-Type: application/json" \
  -d '{"types": ["pricing", "features", "news", "jobs"]}'
```

### Generating a Weekly Report

```bash
curl "http://localhost:3000/api/reports?email=your@email.com"
```

## API Endpoints

### Competitors
- `GET /api/competitors` - List all competitors
- `POST /api/competitors` - Create competitor
- `GET /api/competitors/[id]` - Get competitor details
- `DELETE /api/competitors/[id]` - Delete competitor
- `POST /api/competitors/[id]/scrape` - Trigger scrape

### Reports
- `GET /api/reports` - Generate weekly report
- `POST /api/reports` - Cron endpoint (requires auth)

### Alerts
- `GET /api/alerts` - List alerts
- `PATCH /api/alerts` - Mark as read

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `RESEND_API_KEY` - For email notifications
- `RESEND_FROM` - Sender email address
- `NEWS_API_KEY` - For enhanced news coverage
- `CRON_SECRET` - For securing cron endpoints

## Scraping Strategy

The scraper uses heuristics to find data:
- **Pricing:** Tries `/pricing`, `/plans`, `/#pricing`, then homepage
- **Features:** Tries `/features`, `/product`, `/solutions`
- **News:** Scrapes `/blog`, `/news`, `/press` + Google News
- **Jobs:** Tries `/careers`, `/jobs` + common job boards (Greenhouse, Lever)

All scrapers wait for JavaScript rendering using Playwright.

## License

MIT
