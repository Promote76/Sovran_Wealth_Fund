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

module.exports = {
  parseMessage,
  normalizeAmount,
  extractAmount
};
