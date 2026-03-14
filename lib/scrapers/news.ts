import { chromium } from 'playwright';

interface NewsItem {
  title: string;
  summary?: string;
  url?: string;
  date?: string;
  source?: string;
}

export async function scrapeBlog(domain: string): Promise<NewsItem[]> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    const news: NewsItem[] = [];
    
    // Common blog paths
    const blogPaths = ['/blog', '/news', '/press', '/resources'];
    
    for (const path of blogPaths) {
      const url = `https://${domain}${path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        
        const posts = await page.evaluate(() => {
          const results: NewsItem[] = [];
          
          // Look for blog post links
          const postLinks = document.querySelectorAll(
            'article a, [class*="post"] a, [class*="article"] a, .blog-post a'
          );
          
          postLinks.forEach(link => {
            const title = link.textContent?.trim();
            const href = link.getAttribute('href');
            
            if (title && title.length > 10 && href) {
              results.push({
                title: title.substring(0, 200),
                url: href.startsWith('http') ? href : `https://${window.location.hostname}${href}`,
              });
            }
          });
          
          return results;
        });
        
        if (posts.length > 0) {
          news.push(...posts.slice(0, 10)); // Limit to 10 posts
          break;
        }
      } catch {
        continue;
      }
    }
    
    return news;
  } finally {
    await browser.close();
  }
}

export async function scrapeHomepage(domain: string): Promise<{
  tagline: string;
  metaDescription: string;
  h1Text: string;
}> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    await page.goto(`https://${domain}`, { waitUntil: 'networkidle' });
    
    const data = await page.evaluate(() => {
      const tagline = document.querySelector('h1, [class*="tagline"], [class*="hero"] h2')?.textContent?.trim() || '';
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1Text = document.querySelector('h1')?.textContent?.trim() || '';
      
      return { tagline, metaDescription, h1Text };
    });
    
    return data;
  } finally {
    await browser.close();
  }
}

export async function searchNews(companyName: string): Promise<NewsItem[]> {
  // Using Google News search (no API key needed)
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    const query = encodeURIComponent(`${companyName} funding OR acquisition OR launch`);
    
    await page.goto(`https://news.google.com/search?q=${query}`, { 
      waitUntil: 'networkidle',
      timeout: 20000 
    });
    
    const articles = await page.evaluate(() => {
      const results: NewsItem[] = [];
      
      const articleEls = document.querySelectorAll('article');
      articleEls.forEach(article => {
        const titleEl = article.querySelector('a[title]');
        const title = titleEl?.getAttribute('title') || titleEl?.textContent?.trim();
        const href = titleEl?.getAttribute('href');
        const sourceEl = article.querySelector('[class*="source"]');
        const source = sourceEl?.textContent?.trim();
        
        if (title) {
          results.push({
            title,
            url: href?.startsWith('http') ? href : `https://news.google.com${href}`,
            source,
          });
        }
      });
      
      return results.slice(0, 10);
    });
    
    return articles;
  } finally {
    await browser.close();
  }
}
