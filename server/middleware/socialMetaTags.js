const { dealService } = require('../iela/services/dealService');

/**
 * Social Media Meta Tags Middleware
 * Detects social media crawlers (Facebook, Twitter, LinkedIn) and serves
 * pre-rendered HTML with Open Graph and Twitter Card meta tags
 */

const SOCIAL_CRAWLERS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'SkypeUriPreview'
];

function isSocialCrawler(userAgent) {
  if (!userAgent) return false;
  return SOCIAL_CRAWLERS.some(bot => userAgent.includes(bot));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
}

function generateDealMetaTags(deal, dealId, baseUrl) {
  const address = deal.parsed?.address || deal.geocoding?.formattedAddress || 'Property';
  const city = deal.parsed?.city || deal.geocoding?.city || '';
  const state = deal.parsed?.state || deal.geocoding?.state || '';
  const price = deal.parsed?.asking || deal.parsed?.arv || 0;
  const beds = deal.parsed?.beds || deal.facts?.beds || 'N/A';
  const baths = deal.parsed?.baths || deal.facts?.baths || 'N/A';
  const sqft = deal.parsed?.squareFeet || deal.facts?.buildingSize || 'N/A';
  const profitMargin = deal.analysis?.maoByRepair?.[1]?.profitMargin || 0;
  
  // Get main property image (first image from media array)
  const mainImage = deal.media && deal.media.length > 0 
    ? deal.media[0].url 
    : `${baseUrl}/default-property.jpg`; // Fallback to default image
  
  const dealUrl = `${baseUrl}/deals/${dealId}`;
  
  const title = `${address} - ${city}, ${state}`;
  const description = `${beds} bed, ${baths} bath | ${sqft} sqft | ${formatCurrency(price)} | Profit: ${formatCurrency(profitMargin)} | Wholesale real estate investment opportunity on AXIOM`;
  
  const rtoBadge = deal.analysis?.rtoBadge === 'green' ? '🟢 RTO Ready' : '';
  const investorBadge = deal.analysis?.investorBadge === 'green' ? '💎 Investor Grade' : '';
  
  return `
    <!-- Open Graph Meta Tags for Facebook, LinkedIn, WhatsApp -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${mainImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${dealUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="AXIOM - Crypto Real Estate Platform" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${mainImage}" />
    <meta name="twitter:url" content="${dealUrl}" />
    
    <!-- Additional Property Data -->
    <meta property="product:price:amount" content="${price}" />
    <meta property="product:price:currency" content="USD" />
    <meta property="place:location:latitude" content="${deal.geocoding?.latitude || ''}" />
    <meta property="place:location:longitude" content="${deal.geocoding?.longitude || ''}" />
    
    <!-- Standard Meta Tags -->
    <meta name="description" content="${description}" />
    <meta name="keywords" content="real estate, wholesale, investment property, ${city}, ${state}, crypto real estate, fractional ownership" />
  `;
}

function generateSocialMetaHTML(deal, dealId, baseUrl) {
  const metaTags = generateDealMetaTags(deal, dealId, baseUrl);
  const address = deal.parsed?.address || 'Property';
  const city = deal.parsed?.city || '';
  const state = deal.parsed?.state || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${address} - ${city}, ${state} | AXIOM</title>
  
  ${metaTags}
  
  <!-- Redirect to React app after crawlers have scraped -->
  <script>
    // Only redirect if this is a real user, not a crawler
    if (!navigator.userAgent.match(/facebookexternalhit|Facebot|Twitterbot|LinkedInBot/i)) {
      window.location.href = '/deals/${dealId}';
    }
  </script>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
    <h1>${address}</h1>
    <h2>${city}, ${state}</h2>
    <p>Loading property details...</p>
    <p><a href="/deals/${dealId}">Click here if not redirected automatically</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * Middleware to handle social media crawler requests
 */
async function socialMetaTagsMiddleware(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';
  
  // Check if this is a social media crawler
  if (!isSocialCrawler(userAgent)) {
    return next();
  }
  
  // Check if this is a deal detail page
  const dealMatch = req.path.match(/^\/deals\/([a-f0-9\-]+)$/i);
  if (!dealMatch) {
    return next();
  }
  
  const dealId = dealMatch[1];
  
  try {
    // Fetch deal data from the service
    const deal = await dealService.getDeal(dealId);
    
    if (!deal) {
      console.log(`⚠️ Social crawler requested non-existent deal: ${dealId}`);
      return next();
    }
    
    console.log(`🤖 Social crawler detected (${userAgent.split(' ')[0]}) for deal: ${dealId}`);
    
    // Get base URL from request
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'axiomprotocol.app';
    const baseUrl = `${protocol}://${host}`;
    
    // Generate and serve HTML with meta tags
    const html = generateSocialMetaHTML(deal, dealId, baseUrl);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('❌ Social meta tags error:', error);
    // On error, let the request continue to the normal handler
    return next();
  }
}

module.exports = {
  socialMetaTagsMiddleware,
  generateDealMetaTags,
  isSocialCrawler
};
