import { chromium } from 'playwright';

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  features: string[];
}

interface PricingData {
  tiers: PricingTier[];
  currency: string;
  rawHtml: string;
}

export async function scrapePricing(domain: string): Promise<PricingData> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Common pricing page paths
    const pricingPaths = ['/pricing', '/plans', '/products', '/#pricing'];
    let pricingHtml = '';
    let pricingUrl = '';
    
    for (const path of pricingPaths) {
      const url = `https://${domain}${path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        pricingHtml = await page.content();
        pricingUrl = url;
        break;
      } catch {
        continue;
      }
    }
    
    if (!pricingHtml) {
      // Try homepage as fallback
      await page.goto(`https://${domain}`, { waitUntil: 'networkidle' });
      pricingHtml = await page.content();
    }
    
    // Extract pricing using heuristics
    const tiers = await page.evaluate(() => {
      const results: PricingTier[] = [];
      
      // Look for common pricing card patterns
      const pricingCards = document.querySelectorAll('[class*="pricing"], [class*="plan"], [class*="tier"]');
      
      if (pricingCards.length > 0) {
        pricingCards.forEach(card => {
          const nameEl = card.querySelector('[class*="name"], [class*="title"], h2, h3');
          const priceEl = card.querySelector('[class*="price"], [class*="amount"]');
          const featureEls = card.querySelectorAll('li, [class*="feature"]');
          
          if (priceEl) {
            results.push({
              name: nameEl?.textContent?.trim() || 'Unknown',
              price: priceEl?.textContent?.trim() || '',
              features: Array.from(featureEls).map(f => f.textContent?.trim() || '').filter(Boolean),
            });
          }
        });
      }
      
      // Fallback: look for $ amounts
      if (results.length === 0) {
        const priceRegex = /\$(\d+)(?:\/mo|\/month|\/yr|\/year)?/g;
        const bodyText = document.body.innerHTML;
        const matches = bodyText.match(priceRegex);
        
        if (matches) {
          const uniquePrices = [...new Set(matches)];
          uniquePrices.forEach((price, i) => {
            results.push({
              name: `Plan ${i + 1}`,
              price: price,
              features: [],
            });
          });
        }
      }
      
      return results;
    });
    
    return {
      tiers,
      currency: 'USD',
      rawHtml: pricingHtml,
    };
  } finally {
    await browser.close();
  }
}

export function detectPricingChanges(
  oldTiers: PricingTier[],
  newTiers: PricingTier[]
): { hasChanges: boolean; summary: string } {
  if (oldTiers.length === 0) {
    return { hasChanges: false, summary: 'Initial pricing capture' };
  }
  
  const changes: string[] = [];
  
  // Check for price changes
  oldTiers.forEach(oldTier => {
    const newTier = newTiers.find(t => t.name === oldTier.name);
    if (newTier && newTier.price !== oldTier.price) {
      changes.push(`Price change: ${oldTier.name} ${oldTier.price} → ${newTier.price}`);
    }
  });
  
  // Check for new/removed tiers
  const oldNames = oldTiers.map(t => t.name);
  const newNames = newTiers.map(t => t.name);
  
  newNames.forEach(name => {
    if (!oldNames.includes(name)) {
      changes.push(`New plan added: ${name}`);
    }
  });
  
  oldNames.forEach(name => {
    if (!newNames.includes(name)) {
      changes.push(`Plan removed: ${name}`);
    }
  });
  
  return {
    hasChanges: changes.length > 0,
    summary: changes.join('\n'),
  };
}
