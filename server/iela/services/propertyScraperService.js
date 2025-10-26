const axios = require('axios');
const cheerio = require('cheerio');

class PropertyScraperService {
  async scrapePropertyListing(url) {
    if (!url) {
      return { images: [], data: {} };
    }

    try {
      const scrapedData = await this.scrapeUrl(url);
      return scrapedData;
    } catch (error) {
      console.error(`Failed to scrape property URL ${url}:`, error.message);
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

    if (url.includes('investorlift.com')) {
      return this.scrapeInvestorLift($);
    } else if (url.includes('zillow.com')) {
      return this.scrapeZillow($);
    } else if (url.includes('realtor.com')) {
      return this.scrapeRealtor($);
    } else {
      return this.scrapeGeneric($);
    }
  }

  scrapeInvestorLift($) {
    const images = [];
    const data = {};

    // Scrape images from img tags (src, data-src, srcset)
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      const srcset = $(elem).attr('srcset');
      
      if (src && (src.includes('property') || src.includes('photo') || src.includes('image') || src.includes('cloudinary') || src.includes('cdn'))) {
        images.push(this.resolveUrl(src));
      }
      
      // Parse srcset for higher quality images
      if (srcset) {
        const srcsetUrls = srcset.split(',').map(s => s.trim().split(' ')[0]);
        srcsetUrls.forEach(url => {
          if (url && !images.includes(url)) {
            images.push(this.resolveUrl(url));
          }
        });
      }
    });

    // Scrape from picture elements
    $('picture source').each((i, elem) => {
      const srcset = $(elem).attr('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',').map(s => s.trim().split(' ')[0]);
        srcsetUrls.forEach(url => {
          if (url && !images.includes(url)) {
            images.push(this.resolveUrl(url));
          }
        });
      }
    });

    // Try to extract JSON-LD data for images
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const json = JSON.parse($(elem).html());
        if (json.image) {
          const jsonImages = Array.isArray(json.image) ? json.image : [json.image];
          jsonImages.forEach(img => {
            const imgUrl = typeof img === 'string' ? img : img.url;
            if (imgUrl && !images.includes(imgUrl)) {
              images.push(this.resolveUrl(imgUrl));
            }
          });
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    });

    data.price = this.extractPrice($('.price, .asking-price, [class*="price"]').first().text());
    data.beds = this.extractNumber($('[class*="bed"], .beds').first().text());
    data.baths = this.extractNumber($('[class*="bath"], .baths').first().text());
    data.sqft = this.extractNumber($('[class*="sqft"], [class*="square"]').first().text());
    data.address = $('.address, [class*="address"]').first().text().trim();
    data.description = $('.description, [class*="description"]').first().text().trim();

    return { images, data };
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
}

const propertyScraperService = new PropertyScraperService();

module.exports = { PropertyScraperService, propertyScraperService };
