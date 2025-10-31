function parseMessage(rawText, providedUrl) {
  const warnings = [];
  let confidence = 'high';

  const parsed = {
    optOut: detectOptOut(rawText)
  };

  parsed.address = extractAddress(rawText);
  if (!parsed.address) {
    warnings.push('Could not extract full address');
    confidence = 'medium';
  }

  parsed.asking = extractAmount(rawText, ['asking', 'price', 'listed']);
  parsed.arv = extractAmount(rawText, ['arv', 'after repair value']);

  // Fallback: Extract leading price for land.com listings (e.g., "$636,000 • 120 Acres")
  if (!parsed.asking && (providedUrl?.includes('land.com') || /\$[\d,]+\s*[•|]\s*\d+\s*acres?/i.test(rawText))) {
    parsed.asking = extractLeadingPrice(rawText);
  }

  if (!parsed.asking) {
    warnings.push('Could not extract asking price');
    confidence = 'low';
  }

  parsed.url = providedUrl || extractUrl(rawText);
  
  // Extract Dropbox image links
  parsed.imageUrls = extractDropboxImages(rawText);

  const contact = extractContact(rawText);
  parsed.contactName = contact.name;
  parsed.contactPhone = contact.phone;
  parsed.contactEmail = contact.email;

  if (parsed.address) {
    const parts = parseAddressParts(parsed.address);
    parsed.city = parts.city;
    parsed.state = parts.state;
    parsed.zip = parts.zip;
  }

  // Extract beds and baths
  const bedsBaths = extractBedsBaths(rawText);
  if (bedsBaths.beds) parsed.beds = bedsBaths.beds;
  if (bedsBaths.baths) parsed.baths = bedsBaths.baths;

  // Extract square footage
  parsed.squareFeet = extractSquareFeet(rawText);

  // Extract property type
  parsed.propertyType = extractPropertyType(rawText);

  // Extract year built
  parsed.yearBuilt = extractYearBuilt(rawText);

  // Extract lot size
  parsed.lotSize = extractLotSize(rawText);

  // Extract rent/rental income
  parsed.monthlyRent = extractRent(rawText);

  // Extract annual income (for land deals with CRP, timber, leases, etc.)
  parsed.annualIncome = extractAnnualIncome(rawText);

  // Extract condition
  parsed.condition = extractCondition(rawText);

  // Extract occupancy status
  parsed.occupancy = extractOccupancy(rawText);

  // Extract HOA fees
  parsed.hoaFees = extractHOAFees(rawText);

  // Extract property taxes
  parsed.propertyTax = extractPropertyTax(rawText);

  // Extract days on market
  parsed.daysOnMarket = extractDaysOnMarket(rawText);

  // Extract features (pool, garage, basement, etc.)
  const features = extractFeatures(rawText);
  if (features.pool !== undefined) parsed.hasPool = features.pool;
  if (features.garage !== undefined) parsed.garage = features.garage;
  if (features.basement !== undefined) parsed.hasBasement = features.basement;
  if (features.parking !== undefined) parsed.parking = features.parking;
  if (features.stories !== undefined) parsed.stories = features.stories;
  if (features.fireplace !== undefined) parsed.hasFireplace = features.fireplace;

  // Map lotSize to acreage field for land deals
  if (parsed.lotSize && parsed.lotSize.unit === 'acres' && parsed.lotSize.value) {
    parsed.acreage = parsed.lotSize.value;
  }

  return { parsed, confidence, warnings };
}

function detectOptOut(text) {
  const optOutPatterns = [
    /\bstop\b/i,
    /\bopt[\s-]?out\b/i,
    /\bunsubscribe\b/i,
    /\bremove\s+me\b/i,
    /\bcancel\b/i
  ];

  return optOutPatterns.some(pattern => pattern.test(text));
}

function extractAddress(text) {
  const addressPatterns = [
    /(\d+\s+(?:[A-Za-z]+\s+){1,5}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl|Way|Circle|Cir|Southwest|Southwest|Northeast|Southeast|Northwest|SW|NW|NE|SE)(?:\.)?(?:\s*,?\s*(?:[A-Za-z\s]+,?\s*)?[A-Z]{2}\s+\d{5})?)/i,
    /(\d+\s+[^,\n]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Southwest|SW|NW|NE|SE)[^,\n]*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s+\d{5})/i,
    /in\s+([^.!?\n]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|SW|NW|NE|SE)[^.!?\n]+(?:[A-Z]{2}\s+\d{5})?)/i
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  return undefined;
}

function extractAmount(text, labels) {
  for (const label of labels) {
    const patterns = [
      new RegExp(`${label}[:\\s]+(\\$)?([0-9,]+)(k)\\b`, 'i'),
      new RegExp(`${label}[:\\s]+(\\$)?([0-9,]+)(?:,000)?\\b`, 'i'),
      new RegExp(`${label}[:\\s]+(\\$)?([0-9]{1,3}(?:,[0-9]{3})*)\\b`, 'i')
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const hasK = match[3];
        return normalizeAmount(match[2], hasK);
      }
    }
  }

  return undefined;
}

function extractLeadingPrice(text) {
  // Land.com format: "$636,000 • 120 Acres" or "$500,000 | 50 acres"
  const patterns = [
    /^\s*\$([0-9,]+)(?:\s*[•|]\s*\d+\s*acres?)/i,  // At start of text
    /\n\s*\$([0-9,]+)(?:\s*[•|]\s*\d+\s*acres?)/i, // After newline
    /\$([0-9,]+)(?:\s*[•|]\s*\d+\s*acres?)/i        // Anywhere in text
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
  }

  return undefined;
}

function normalizeAmount(value, hasK) {
  const cleanValue = value.replace(/,/g, '');

  if (hasK || /k$/i.test(value)) {
    return parseFloat(cleanValue.replace(/k$/i, '')) * 1000;
  }

  return parseInt(cleanValue, 10);
}

function extractUrl(text) {
  const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i;
  const match = text.match(urlPattern);
  return match ? match[1] : undefined;
}

function extractDropboxImages(text) {
  const dropboxImageUrls = [];
  
  // Pattern to match Dropbox file links (images)
  const dropboxPattern = /(https?:\/\/(?:www\.)?dropbox\.com\/[^\s<>"{}|\\^`\[\]]+\.(?:jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)[^\s<>"{}|\\^`\[\]]*)/gi;
  
  const matches = text.matchAll(dropboxPattern);
  
  for (const match of matches) {
    let urlString = match[1];
    
    try {
      const url = new URL(urlString);
      // Remove any existing dl parameter
      url.searchParams.delete('dl');
      // Add dl=1
      url.searchParams.set('dl', '1');
      dropboxImageUrls.push(url.toString());
    } catch (e) {
      // Fallback if URL parsing fails
      console.warn('Failed to parse Dropbox URL:', urlString, e.message);
      dropboxImageUrls.push(urlString);
    }
  }
  
  return dropboxImageUrls;
}

function extractContact(text) {
  const contact = {};

  const namePattern = /contact\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i;
  const nameMatch = text.match(namePattern);
  if (nameMatch) {
    contact.name = nameMatch[1].trim();
  }

  const phonePatterns = [
    /(\d{3})[\s.-](\d{3})[\s.-](\d{4})/,
    /\((\d{3})\)\s*(\d{3})[\s.-](\d{4})/,
    /(\d{10})/
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 4) {
        contact.phone = `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        const phone = match[1];
        contact.phone = `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
      }
      break;
    }
  }

  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailPattern);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }

  return contact;
}

function extractBedsBaths(text) {
  const result = {};

  // Isolate main listing by removing "Deals nearby" section and similar markers
  // Use specific patterns to avoid matching common words like "available"
  let mainText = text;
  const sectionMarkers = [
    /\bDeals\s+nearby\b/i,
    /\bSimilar\s+properties\b/i,
    /\bOther\s+listings\b/i,
    /\bView\s+all\s+company\s+deals\b/i
  ];
  
  for (const marker of sectionMarkers) {
    const match = mainText.match(marker);
    if (match) {
      mainText = mainText.substring(0, match.index);
    }
  }

  // Pattern 1 (HIGHEST PRIORITY): Labeled compact form "4 Bed / 3 Bath", "4BR/2.5BA", "3bd/2ba"
  const compactLabeledPattern = /(\d+(?:\.\d+)?)\s*(?:bed(?:room)?s?|b[rd]r?)\s*[/|&-]\s*(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|b[at]h?s?)/i;
  const compactLabeledMatch = mainText.match(compactLabeledPattern);
  if (compactLabeledMatch) {
    result.beds = parseFloat(compactLabeledMatch[1]);
    result.baths = parseFloat(compactLabeledMatch[2]);
    return result; // Found labeled compact notation, return immediately
  }

  // Pattern 2: Label-first format "Beds\n4" or "Beds: 4"
  // Use negative lookbehind to prevent matching "3 bed 2" where "bed 2" would be extracted
  const bedsLabelPattern = /(?<!\d\s)beds?[\s:]+(\d+(?:\.\d+)?)/i;
  const bathsLabelPattern = /(?<!\d\s)baths?[\s:]+(\d+(?:\.\d+)?)/i;
  
  const bedsLabelMatch = mainText.match(bedsLabelPattern);
  if (bedsLabelMatch) {
    result.beds = parseFloat(bedsLabelMatch[1]);
  }

  const bathsLabelMatch = mainText.match(bathsLabelPattern);
  if (bathsLabelMatch) {
    result.baths = parseFloat(bathsLabelMatch[1]);
  }

  // Pattern 3: Number-first format "3 bed", "4 bedrooms", "2BR", "3bd"
  if (!result.beds) {
    const bedsPattern = /(\d+(?:\.\d+)?)\s*(?:bed(?:room)?s?|b[rd]r?)\b/i;
    const bedsMatch = mainText.match(bedsPattern);
    if (bedsMatch) {
      result.beds = parseFloat(bedsMatch[1]);
    }
  }

  if (!result.baths) {
    const bathsPattern = /(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|b[at]h?s?)\b/i;
    const bathsMatch = mainText.match(bathsPattern);
    if (bathsMatch) {
      result.baths = parseFloat(bathsMatch[1]);
    }
  }

  // Pattern 4 (LAST RESORT): Bare numeric compact form "3/2", "4-2" 
  // Only use if we don't have BOTH beds and baths from labeled patterns
  // Must NOT be part of a date (reject years and months)
  if (!result.beds || !result.baths) {
    const compactBarePattern = /(?<!\d\/)\b(\d+(?:\.\d+)?)\s*[/|-]\s*(\d+(?:\.\d+)?)\b(?!\/\d)/;
    const compactBareMatch = mainText.match(compactBarePattern);
    if (compactBareMatch) {
      const beds = parseFloat(compactBareMatch[1]);
      const baths = parseFloat(compactBareMatch[2]);
      // Sanity check: beds should be 1-10, baths should be 0.5-10
      // Also reject if second number looks like a year (>100) or month (>12)
      if (beds >= 1 && beds <= 10 && baths >= 0.5 && baths <= 10) {
        if (!result.beds) result.beds = beds;
        if (!result.baths) result.baths = baths;
      }
    }
  }

  return result;
}

function extractSquareFeet(text) {
  // Isolate main listing (same as beds/baths)
  let mainText = text;
  const sectionMarkers = [
    /\bDeals\s+nearby\b/i,
    /\bSimilar\s+properties\b/i,
    /\bOther\s+listings\b/i,
    /\bView\s+all\s+company\s+deals\b/i
  ];
  
  for (const marker of sectionMarkers) {
    const match = mainText.match(marker);
    if (match) {
      mainText = mainText.substring(0, match.index);
    }
  }

  // Pattern 1: "Size: 2,790 SqFt" or "Size: 2790 sqft"
  const sizePattern = /size[\s:]+([0-9,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i;
  const sizeMatch = mainText.match(sizePattern);
  if (sizeMatch) {
    return parseInt(sizeMatch[1].replace(/,/g, ''), 10);
  }

  // Pattern 2: "Sq.Ft\n2790" or "Sq.Ft: 2,790"
  const sqftLabelPattern = /sq\.?\s*ft\.?[\s:]+([0-9,]+)/i;
  const sqftLabelMatch = mainText.match(sqftLabelPattern);
  if (sqftLabelMatch) {
    return parseInt(sqftLabelMatch[1].replace(/,/g, ''), 10);
  }

  // Pattern 3: "2,790 SqFt" or "2790 sqft" (number first)
  const sqftPattern = /([0-9,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)\b/i;
  const sqftMatch = mainText.match(sqftPattern);
  if (sqftMatch) {
    const value = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
    // Sanity check: square footage should be reasonable (200-20000 for residential)
    if (value >= 200 && value <= 20000) {
      return value;
    }
  }

  return null;
}

function parseAddressParts(address) {
  const parts = {};

  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zipMatch) {
    parts.zip = zipMatch[1];
  }

  const stateMatch = address.match(/\b([A-Z]{2})\s+\d{5}/);
  if (stateMatch) {
    parts.state = stateMatch[1];
  }

  const cityPattern = /,\s*([A-Za-z\s]+),?\s*[A-Z]{2}/;
  const cityMatch = address.match(cityPattern);
  if (cityMatch) {
    parts.city = cityMatch[1].trim();
  }

  return parts;
}

function extractPropertyType(text) {
  const propertyTypes = {
    'single[ -]?family|sfr|single family home|detached|sfh': 'Single Family',
    'multi[ -]?family|duplex|triplex|fourplex|multifamily|2 unit|3 unit|4 unit': 'Multi-Family',
    'condo|condominium': 'Condo',
    'townhouse|townhome|town home': 'Townhouse',
    'mobile home|manufactured home|trailer': 'Mobile Home',
    'apartment building|apt building': 'Apartment',
    'commercial|retail|office space': 'Commercial',
    'land|vacant lot|lot only': 'Land'
  };

  for (const [pattern, type] of Object.entries(propertyTypes)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(text)) {
      return type;
    }
  }

  return undefined;
}

function extractYearBuilt(text) {
  // Patterns: "Built in 1985", "Year Built: 1985", "1985 construction", "Built 1985"
  const patterns = [
    /built[\s:]+(?:in\s+)?(\d{4})/i,
    /year\s+built[\s:]+(\d{4})/i,
    /construction[\s:]+(\d{4})/i,
    /(\d{4})\s+built/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[1], 10);
      // Sanity check: year should be between 1800 and current year + 2
      const currentYear = new Date().getFullYear();
      if (year >= 1800 && year <= currentYear + 2) {
        return year;
      }
    }
  }

  return undefined;
}

function extractLotSize(text) {
  // Patterns: "0.25 acres", "Lot: 5,000 sqft", "10,000 sq ft lot"
  const acresPattern = /([\d,.]+)\s*acres?/i;
  const acresMatch = text.match(acresPattern);
  if (acresMatch) {
    const value = parseFloat(acresMatch[1].replace(/,/g, ''));
    return { value, unit: 'acres' };
  }

  const lotSqftPattern = /lot[\s:]+([0-9,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i;
  const lotSqftMatch = text.match(lotSqftPattern);
  if (lotSqftMatch) {
    const value = parseInt(lotSqftMatch[1].replace(/,/g, ''), 10);
    return { value, unit: 'sqft' };
  }

  const sqftLotPattern = /([0-9,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)\s+lot/i;
  const sqftLotMatch = text.match(sqftLotPattern);
  if (sqftLotMatch) {
    const value = parseInt(sqftLotMatch[1].replace(/,/g, ''), 10);
    return { value, unit: 'sqft' };
  }

  return undefined;
}

function extractRent(text) {
  // Patterns: "Rent: $1,500/mo", "Monthly rent $1500", "$1,200 per month"
  const patterns = [
    /rent[\s:]+\$?([0-9,]+)(?:\/mo|\/month|per\s+month)?/i,
    /\$([0-9,]+)(?:\/mo|\/month|per\s+month)/i,
    /monthly\s+rent[\s:]+\$?([0-9,]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''), 10);
      // Sanity check: rent should be reasonable ($100-$20,000/month)
      if (value >= 100 && value <= 20000) {
        return value;
      }
    }
  }

  return undefined;
}

function extractAnnualIncome(text) {
  // Patterns for annual income from CRP, timber, leases, etc.
  const patterns = [
    // Standard annual income patterns
    /annual\s+(?:income|payment|revenue)[\s:]+~?\$?([0-9,]+)\s*k?/i,
    /~?\$([0-9,]+)\s*k?\s*(?:per\s+year|\/\s*yr|\/\s*year|annually)/i,
    /(?:income|payment|revenue)[\s:]+~?\$?([0-9,]+)\s*k?\s*(?:per\s+year|\/\s*yr|\/\s*year|annually)/i,
    /estimated\s+(?:annual\s+)?(?:income|revenue)[\s:]+~?\$?([0-9,]+)\s*k?/i,
    
    // CRP-specific patterns
    /crp\s+\(.*?~?\$([0-9,]+)\s*k?\s*\/\s*yr/i,
    /crp\s+(?:annual\s+)?payment[\s:]+~?\$?([0-9,]+)\s*k?/i,
    /crp[\s:]+~?\$?([0-9,]+)\s*k?\s*(?:per\s+year|\/\s*yr|annually)/i,
    /~?\$([0-9,]+)\s*k?\s+crp/i,
    
    // Timber-specific patterns
    /timber\s+(?:annual\s+)?income[\s:]+~?\$?([0-9,]+)\s*k?/i,
    /timber\s+(?:sales|revenue|harvest)[\s:]+~?\$?([0-9,]+)\s*k?/i,
    /~?\$([0-9,]+)\s*k?\s+(?:from\s+)?timber/i,
    
    // Income-producing patterns (land.com style)
    /income[\s-]producing.*?~?\$([0-9,]+)\s*k?/i,
    /produces?\s+~?\$?([0-9,]+)\s*k?\s+annually/i,
    /generates?\s+~?\$?([0-9,]+)\s*k?\s+(?:per\s+year|annually)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let value = parseInt(match[1].replace(/,/g, ''), 10);
      
      // Check if the match includes 'k' or 'K' (thousands)
      const fullMatch = match[0].toLowerCase();
      if (fullMatch.includes('k') && !fullMatch.includes('asking')) {
        value = value * 1000; // Convert K to actual thousands
      }
      
      // Sanity check: annual income should be reasonable ($100-$500,000/year)
      if (value >= 100 && value <= 500000) {
        return value;
      }
    }
  }

  return undefined;
}

function extractCondition(text) {
  const conditions = {
    'turnkey|move-in ready|excellent condition|pristine|like new': 'Excellent',
    'good condition|well maintained|updated': 'Good',
    'fair condition|needs some work|needs updates': 'Fair',
    'poor condition|needs work|fixer|fixer-upper|tlc|handyman special|distressed': 'Poor',
    'tear down|demolition|rebuild': 'Tear Down'
  };

  for (const [pattern, condition] of Object.entries(conditions)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(text)) {
      return condition;
    }
  }

  return undefined;
}

function extractOccupancy(text) {
  // Priority order: most specific first
  if (/\bowner occupied\b|\bowner living\b/i.test(text)) {
    return 'Owner Occupied';
  }
  if (/\btenant occupied\b|\brented\b|\btenants?\sin\b|\boccupied\b/i.test(text)) {
    return 'Occupied';
  }
  // Only match "vacant" if not part of "vacant lot"
  if (/\bvacant\b(?!\s+lot)|\bempty\b|\bunoccupied\b/i.test(text)) {
    return 'Vacant';
  }
  return undefined;
}

function extractHOAFees(text) {
  // Patterns: "HOA: $150/mo", "HOA fees $150", "$150 HOA"
  const patterns = [
    /hoa[\s:]+(fees?[\s:]+)?\$?([0-9,]+)(?:\/mo|\/month|per\s+month)?/i,
    /\$([0-9,]+)\s+hoa/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt((match[2] || match[1]).replace(/,/g, ''), 10);
      // Sanity check: HOA should be reasonable ($0-$2,000/month)
      if (value >= 0 && value <= 2000) {
        return value;
      }
    }
  }

  // Check for "no HOA"
  if (/no\s+hoa/i.test(text)) {
    return 0;
  }

  return undefined;
}

function extractPropertyTax(text) {
  // Patterns: "Property tax: $3,500/yr", "Taxes $3500", "$3,500 annual tax"
  const patterns = [
    /(?:property\s+)?tax(?:es)?[\s:]+\$?([0-9,]+)(?:\/yr|\/year|per\s+year|annually)?/i,
    /\$([0-9,]+)\s+(?:annual|yearly)\s+tax/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''), 10);
      // Sanity check: property tax should be reasonable ($0-$50,000/year for residential)
      if (value >= 0 && value <= 50000) {
        return value;
      }
    }
  }

  return undefined;
}

function extractDaysOnMarket(text) {
  // Patterns: "30 days on market", "DOM: 45", "Listed 60 days ago"
  const patterns = [
    /(\d+)\s+days?\s+on\s+market/i,
    /dom[\s:]+(\d+)/i,
    /listed\s+(\d+)\s+days?\s+ago/i,
    /on\s+market\s+(\d+)\s+days?/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      // Sanity check: DOM should be reasonable (0-3650 days = 10 years)
      if (value >= 0 && value <= 3650) {
        return value;
      }
    }
  }

  return undefined;
}

function extractFeatures(text) {
  const features = {};

  // Pool
  if (/\bpool\b/i.test(text)) {
    features.pool = true;
  }

  // Garage
  const garagePatterns = [
    /(\d+)\s*car\s+garage/i,
    /garage[\s:]+(\d+)/i,
    /(\d+)\s*garage/i
  ];
  for (const pattern of garagePatterns) {
    const match = text.match(pattern);
    if (match) {
      features.garage = parseInt(match[1], 10);
      break;
    }
  }
  if (!features.garage && /\bgarage\b/i.test(text)) {
    features.garage = 1; // Has garage but number not specified
  }

  // Parking
  const parkingPatterns = [
    /(\d+)\s*(?:car\s+)?parking/i,
    /parking[\s:]+(\d+)/i
  ];
  for (const pattern of parkingPatterns) {
    const match = text.match(pattern);
    if (match) {
      features.parking = parseInt(match[1], 10);
      break;
    }
  }

  // Basement
  if (/\bbasement\b/i.test(text)) {
    features.basement = true;
  }
  if (/finished\s+basement/i.test(text)) {
    features.basement = 'Finished';
  }
  if (/unfinished\s+basement/i.test(text)) {
    features.basement = 'Unfinished';
  }

  // Stories
  const storyPatterns = [
    /(\d+)[\s-]*(?:story|stories)/i,
    /(\d+)[\s-]*level/i
  ];
  for (const pattern of storyPatterns) {
    const match = text.match(pattern);
    if (match) {
      features.stories = parseInt(match[1], 10);
      break;
    }
  }

  // Fireplace
  if (/\bfireplace\b/i.test(text)) {
    features.fireplace = true;
  }

  return features;
}

module.exports = {
  parseMessage,
  normalizeAmount,
  extractAmount
};
