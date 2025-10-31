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
        console.log(`📸 Using Puppeteer for InvestorLift (extended timeout: 60s)`);
        return await this.scrapeInvestorLiftWithPuppeteer(url);
      } else if (url.includes('dropbox.com')) {
        console.log(`📸 Using Puppeteer for Dropbox shared folder`);
        return await this.scrapeDropboxWithPuppeteer(url);
      } else if (url.includes('land.com')) {
        console.log(`📸 Using Puppeteer for land.com (extended timeout: 60s)`);
        return await this.scrapeLandComWithPuppeteer(url);
      } else {
        const scrapedData = await this.scrapeUrl(url);
        return scrapedData;
      }
    } catch (error) {
      console.error(`⚠️ Failed to scrape property URL ${url}:`, error.message);
      return { images: [], data: {} };
    }
  }

  async scrapeDropboxWithPuppeteer(url) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log(`🌐 Loading Dropbox shared folder: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      // Wait for Dropbox to load images
      await page.waitForTimeout(8000);
      
      const scrapedData = await page.evaluate(() => {
        const images = [];
        const data = {};
        
        // Dropbox uses specific selectors for file previews
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && 
              !src.includes('logo') && 
              !src.includes('icon') &&
              !src.includes('branding') &&
              !src.includes('sprite') &&
              (src.includes('dropbox') || 
               src.includes('preview') ||
               src.includes('thumb') ||
               src.includes('image'))) {
            // Convert thumbnail to full size if possible
            const fullSrc = src.replace('/thumb/', '/').replace('_thumb', '');
            images.push(fullSrc);
          }
        });
        
        // Look for image links in the file list
        document.querySelectorAll('a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".JPG"], a[href*=".JPEG"], a[href*=".PNG"]').forEach(link => {
          const href = link.href;
          if (href && !images.includes(href)) {
            images.push(href);
          }
        });
        
        return { images: [...new Set(images)], data };
      });
      
      console.log(`✅ Found ${scrapedData.images.length} images in Dropbox folder`);
      
      await page.close();
      return scrapedData;
      
    } catch (error) {
      console.error(`Dropbox scraping error: ${error.message}`);
      await page.close();
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
        timeout: 60000 
      });
      
      await page.waitForTimeout(5000);
      
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

  async scrapeLandComWithPuppeteer(url) {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log(`🌐 Loading land.com page: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      await page.waitForTimeout(3000);
      
      const scrapedData = await page.evaluate(() => {
        const images = [];
        const data = {};
        
        // Extract images
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && 
              !src.includes('logo') && 
              !src.includes('icon') &&
              !src.includes('avatar') &&
              (src.includes('land.com') || 
               src.includes('photo') ||
               src.includes('image') ||
               img.alt?.toLowerCase().includes('property'))) {
            images.push(src);
          }
        });
        
        // Extract price and acreage from "$636,000 • 120 Acres" pattern
        const pricePattern = /\$([0-9,]+)\s*[•|]\s*(\d+)\s*Acres?/i;
        const bodyText = document.body.textContent;
        const priceMatch = bodyText.match(pricePattern);
        if (priceMatch) {
          data.price = parseInt(priceMatch[1].replace(/,/g, ''));
          data.acres = parseInt(priceMatch[2]);
        }
        
        // Try to find price in specific elements
        if (!data.price) {
          const priceEl = document.querySelector('[class*="price"], [data-testid*="price"]');
          if (priceEl) {
            const priceText = priceEl.textContent;
            const match = priceText.match(/\$([0-9,]+)/);
            if (match) {
              data.price = parseInt(match[1].replace(/,/g, ''));
            }
          }
        }
        
        // Extract CRP payment amount
        const crpMatch = bodyText.match(/CRP[\s:]+[^$]*\$([0-9,]+)/i) || 
                        bodyText.match(/\$([0-9,]+)[^.]*CRP/i);
        if (crpMatch) {
          data.crpPayment = parseInt(crpMatch[1].replace(/,/g, ''));
        }
        
        // Extract annual income
        const incomeMatch = bodyText.match(/annual[\s\w]*income[^$]*\$([0-9,]+)/i) ||
                           bodyText.match(/\$([0-9,]+)[^.]*(?:per\s+year|annually)/i);
        if (incomeMatch) {
          data.annualIncome = parseInt(incomeMatch[1].replace(/,/g, ''));
        }
        
        // Extract address
        const h1 = document.querySelector('h1');
        if (h1) {
          data.address = h1.textContent.trim();
        }
        
        // Extract description
        const descEl = document.querySelector('[class*="description"], p');
        if (descEl) {
          data.description = descEl.textContent.trim().substring(0, 500);
        }
        
        return { images: [...new Set(images)], data };
      });
      
      console.log(`✅ Scraped land.com: ${scrapedData.images.length} images, price: ${scrapedData.data.price}, acres: ${scrapedData.data.acres}`);
      
      await page.close();
      return scrapedData;
      
    } catch (error) {
      console.error(`land.com scraping error: ${error.message}`);
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
