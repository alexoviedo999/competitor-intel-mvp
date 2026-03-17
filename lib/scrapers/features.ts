import { chromium } from 'playwright';

interface Feature {
  name: string;
  description?: string | null;
  category?: string | null;
}

export async function scrapeFeatures(domain: string): Promise<Feature[]> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    const features: Feature[] = [];
    
    // Common feature page paths
    const featurePaths = ['/features', '/product', '/solutions', '/#features'];
    
    for (const path of featurePaths) {
      const url = `https://${domain}${path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        
        const pageFeatures = await page.evaluate(() => {
          const results: Feature[] = [];
          
          // Look for feature sections
          const featureCards = document.querySelectorAll(
            '[class*="feature"], [class*="benefit"], [class*="capability"]'
          );
          
          featureCards.forEach(card => {
            const titleEl = card.querySelector('h2, h3, h4, [class*="title"]');
            const descEl = card.querySelector('p, [class*="description"]');
            
            if (titleEl) {
              results.push({
                name: titleEl.textContent?.trim() || '',
                description: descEl?.textContent?.trim(),
              });
            }
          });
          
          // Fallback: look for grid items
          if (results.length === 0) {
            const gridItems = document.querySelectorAll('.grid > div, [class*="grid"] > div');
            gridItems.forEach(item => {
              const heading = item.querySelector('h2, h3, h4');
              if (heading) {
                results.push({
                  name: heading.textContent?.trim() || '',
                });
              }
            });
          }
          
          return results;
        });
        
        if (pageFeatures.length > 0) {
          features.push(...pageFeatures);
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Deduplicate
    const unique = features.filter((f, i, arr) => 
      f.name && arr.findIndex(x => x.name === f.name) === i
    );
    
    return unique;
  } finally {
    await browser.close();
  }
}

export function detectFeatureChanges(
  oldFeatures: Feature[],
  newFeatures: Feature[]
): { added: Feature[]; removed: Feature[] } {
  const oldNames = oldFeatures.map(f => f.name.toLowerCase());
  const newNames = newFeatures.map(f => f.name.toLowerCase());
  
  const added = newFeatures.filter(f => !oldNames.includes(f.name.toLowerCase()));
  const removed = oldFeatures.filter(f => !newNames.includes(f.name.toLowerCase()));
  
  return { added, removed };
}
