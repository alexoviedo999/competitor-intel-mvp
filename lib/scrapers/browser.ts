import { chromium, Browser, Page } from 'playwright';

export async function getBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
  });
}

export async function scrapePage(
  browser: Browser,
  url: string,
  waitFor?: string
): Promise<{ html: string; content: string }> {
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (waitFor) {
      await page.waitForSelector(waitFor, { timeout: 10000 });
    }
    
    const html = await page.content();
    const content = await page.evaluate(() => document.body.innerText);
    
    return { html, content };
  } finally {
    await page.close();
  }
}

export async function scrapeWithRetry(
  url: string,
  waitFor?: string,
  retries = 3
): Promise<{ html: string; content: string }> {
  const browser = await getBrowser();
  
  try {
    for (let i = 0; i < retries; i++) {
      try {
        return await scrapePage(browser, url, waitFor);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error('Max retries reached');
  } finally {
    await browser.close();
  }
}
