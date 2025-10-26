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

  // Pattern 1: Various bedroom formats - "3 bed", "4 bedrooms", "2BR", "3bd", "4bdr"
  const bedsPattern = /(\d+(?:\.\d+)?)\s*(?:bed(?:room)?s?|b[rd]r?)\b/i;
  const bathsPattern = /(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|b[at]h?s?)\b/i;

  const bedsMatch = text.match(bedsPattern);
  if (bedsMatch) {
    result.beds = parseFloat(bedsMatch[1]);
  }

  const bathsMatch = text.match(bathsPattern);
  if (bathsMatch) {
    result.baths = parseFloat(bathsMatch[1]);
  }

  // Pattern 2: Compact form "4BR/2.5BA", "3bd/2ba", "3/2"
  const compactPattern = /(\d+(?:\.\d+)?)\s*(?:bed(?:room)?s?|b[rd]r?)?[/|&]\s*(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|b[at]h?s?)?/i;
  const compactMatch = text.match(compactPattern);
  if (compactMatch && !result.beds && !result.baths) {
    result.beds = parseFloat(compactMatch[1]);
    result.baths = parseFloat(compactMatch[2]);
  }

  return result;
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
