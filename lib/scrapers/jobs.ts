import { chromium } from 'playwright';

interface JobPosting {
  title: string;
  department?: string | null;
  location?: string | null;
  url?: string | null;
}

export async function scrapeJobs(domain: string): Promise<JobPosting[]> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    const jobs: JobPosting[] = [];
    
    // Common job board paths
    const jobPaths = [
      '/careers',
      '/jobs',
      '/about/careers',
      '/company/careers',
      'boards.greenhouse.io',
      'lever.co',
      'jobs.ashbyhq.com',
    ];
    
    for (const path of jobPaths) {
      let url: string;
      
      if (path.startsWith('http') || path.includes('.')) {
        // External job board
        const subdomain = domain.split('.')[0];
        url = `https://${path}/${subdomain}`;
      } else {
        url = `https://${domain}${path}`;
      }
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        
        const postings = await page.evaluate(() => {
          const results: JobPosting[] = [];
          
          // Common job board patterns
          const jobLinks = document.querySelectorAll(
            'a[href*="job"], a[href*="career"], [class*="job"] a, [class*="opening"] a'
          );
          
          jobLinks.forEach(link => {
            const title = link.textContent?.trim();
            const href = link.getAttribute('href');
            
            if (title && title.length > 3 && href) {
              results.push({
                title: title.substring(0, 200),
                url: href.startsWith('http') ? href : `https://${window.location.hostname}${href}`,
              });
            }
          });
          
          // Look for department/location info
          const jobCards = document.querySelectorAll('[class*="job"], [class*="opening"]');
          jobCards.forEach(card => {
            const titleEl = card.querySelector('a, [class*="title"]');
            const deptEl = card.querySelector('[class*="department"], [class*="team"]');
            const locEl = card.querySelector('[class*="location"], [class*="office"]');
            
            if (titleEl) {
              results.push({
                title: titleEl.textContent?.trim() || '',
                department: deptEl?.textContent?.trim(),
                location: locEl?.textContent?.trim(),
              });
            }
          });
          
          return results;
        });
        
        if (postings.length > 0) {
          jobs.push(...postings);
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Deduplicate by title
    const unique = jobs.filter((j, i, arr) => 
      j.title && arr.findIndex(x => x.title === j.title) === i
    );
    
    return unique;
  } finally {
    await browser.close();
  }
}

export function detectHiringSurge(
  oldJobs: JobPosting[],
  newJobs: JobPosting[]
): { surge: boolean; newRoles: JobPosting[]; removedRoles: string[] } {
  const oldTitles = oldJobs.map(j => j.title.toLowerCase());
  const newTitles = newJobs.map(j => j.title.toLowerCase());
  
  const newRoles = newJobs.filter(j => !oldTitles.includes(j.title.toLowerCase()));
  const removedRoles = oldTitles.filter(t => !newTitles.includes(t));
  
  // Surge = more than 20% increase
  const surge = newRoles.length > oldJobs.length * 0.2;
  
  return { surge, newRoles, removedRoles };
}
