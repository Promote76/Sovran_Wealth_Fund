const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class PropertyScraperService {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: '/nix/store/x205pbkd5xh5g4iv0g58xjla55has3cx-chromium-108.0.5359.94/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async scrapePropertyListing(url) {
    if (!url) {
      return { images: [], data: {} };
    }

    try {
      if (url.includes('investorlift.com')) {
        return await this.scrapeInvestorLiftWithPuppeteer(url);
      } else {
        const scrapedData = await this.scrapeUrl(url);
        return scrapedData;
      }
    } catch (error) {
      console.error(`Failed to scrape property URL ${url}:`, error.message);
      return { images: [], data: {} };
    }
  }

  async scrapeInvestorLiftWithPuppeteer(url) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log(`🌐 Loading InvestorLift page: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await page.waitForTimeout(3000);
      
      const scrapedData = await page.evaluate(() => {
        const images = [];
        const data = {};
        
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && 
              !src.includes('logo') && 
              !src.includes('icon') &&
              !src.includes('avatar') &&
              (src.includes('cloudinary') || 
               src.includes('investorlift') ||
               src.includes('photo') ||
               src.includes('image') ||
               img.alt?.toLowerCase().includes('property') ||
               img.alt?.toLowerCase().includes('photo'))) {
            images.push(src);
          }
        });
        
        const priceEl = document.querySelector('[class*="price"], [class*="Price"]');
        if (priceEl) {
          const priceText = priceEl.textContent;
          const priceMatch = priceText.match(/\$?[\d,]+/);
          if (priceMatch) {
            data.price = parseInt(priceMatch[0].replace(/[$,]/g, ''));
          }
        }
        
        const bedsEl = document.querySelector('[class*="bed"], [class*="Bed"]');
        if (bedsEl) {
          const bedsMatch = bedsEl.textContent.match(/(\d+)\s*bed/i);
          data.beds = bedsMatch ? parseInt(bedsMatch[1]) : null;
        }
        
        const bathsEl = document.querySelector('[class*="bath"], [class*="Bath"]');
        if (bathsEl) {
          const bathsMatch = bathsEl.textContent.match(/(\d+)\s*bath/i);
          data.baths = bathsMatch ? parseInt(bathsMatch[1]) : null;
        }
        
        const sqftEl = document.querySelector('[class*="sqft"], [class*="Sqft"], [class*="square"]');
        if (sqftEl) {
          const sqftMatch = sqftEl.textContent.match(/([\d,]+)\s*sq/i);
          data.sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : null;
        }
        
        const addressEl = document.querySelector('[class*="address"], [class*="Address"], h1');
        if (addressEl) {
          data.address = addressEl.textContent.trim();
        }
        
        const descEl = document.querySelector('[class*="description"], [class*="Description"]');
        if (descEl) {
          data.description = descEl.textContent.trim();
        }
        
        return { images: [...new Set(images)], data };
      });
      
      console.log(`✅ Scraped ${scrapedData.images.length} images from InvestorLift`);
      
      await page.close();
      return scrapedData;
      
    } catch (error) {
      console.error(`InvestorLift scraping error: ${error.message}`);
      await page.close();
      return { images: [], data: {} };
    }
  }

  async scrapeUrl(url) {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const images = [];
    const data = {};

    if (url.includes('zillow.com')) {
      return this.scrapeZillow($);
    } else if (url.includes('realtor.com')) {
      return this.scrapeRealtor($);
    } else {
      return this.scrapeGeneric($);
    }
  }

  scrapeZillow($) {
    const images = [];
    const data = {};

    $('picture img, [class*="photo"] img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        images.push(this.resolveUrl(src));
      }
    });

    const scriptData = $('script[type="application/ld+json"]').html();
    if (scriptData) {
      try {
        const json = JSON.parse(scriptData);
        if (json.image) {
          images.push(...(Array.isArray(json.image) ? json.image : [json.image]));
        }
        data.price = json.offers?.price;
        data.address = json.address?.streetAddress;
        data.description = json.description;
      } catch (e) {
        console.log('Failed to parse Zillow JSON-LD');
      }
    }

    return { images, data };
  }

  scrapeRealtor($) {
    const images = [];
    const data = {};

    $('[data-testid="photo-carousel"] img, .photo img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src) {
        images.push(this.resolveUrl(src));
      }
    });

    data.price = this.extractPrice($('[data-testid="home-price"]').text());
    data.beds = this.extractNumber($('[data-testid="bed-count"]').text());
    data.baths = this.extractNumber($('[data-testid="bath-count"]').text());
    data.sqft = this.extractNumber($('[data-testid="sqft"]').text());

    return { images, data };
  }

  scrapeGeneric($) {
    const images = [];
    const data = {};

    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      const alt = $(elem).attr('alt') || '';
      
      if (src && 
          !src.includes('logo') && 
          !src.includes('icon') && 
          !src.includes('avatar') &&
          (alt.toLowerCase().includes('property') || 
           alt.toLowerCase().includes('photo') ||
           alt.toLowerCase().includes('image') ||
           src.includes('property') ||
           src.includes('photo'))) {
        images.push(this.resolveUrl(src));
      }
    });

    const textContent = $('body').text();
    data.price = this.extractPrice(textContent);
    data.description = $('meta[name="description"]').attr('content');

    return { images, data };
  }

  resolveUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    return url;
  }

  extractPrice(text) {
    if (!text) return null;
    const match = text.match(/\$[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/[$,]/g, ''));
    }
    return null;
  }

  extractNumber(text) {
    if (!text) return null;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

const propertyScraperService = new PropertyScraperService();

process.on('exit', async () => {
  await propertyScraperService.close();
});

module.exports = { PropertyScraperService, propertyScraperService };
