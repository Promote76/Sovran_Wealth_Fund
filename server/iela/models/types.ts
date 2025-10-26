export type DealSource = 'sms' | 'email' | 'manual';

export type DealStatus = 'draft' | 'review' | 'listed_investor' | 'listed_rto' | 'archived';

export type RTOBadge = 'green' | 'yellow' | 'red';

export interface Media {
  id: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface ParsedFields {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  asking?: number;
  arv?: number;
  url?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  optOut: boolean;
}

export interface Geocode {
  lat: number;
  lng: number;
  placeId?: string;
  formattedAddress?: string;
}

export interface PropertyFacts {
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  lot?: number;
  lotUnit?: 'acres' | 'sqft';
  propertyType?: string;
  zoning?: string;
}

export interface FinanceEstimates {
  taxesEst?: number;
  insuranceEst?: number;
  hoa?: number;
  utilities?: number;
}

export interface RentData {
  marketRentEst?: number;
  rentRange?: [number, number];
  sources: string[];
  confidence?: 'low' | 'medium' | 'high';
}

export interface RepairEstimate {
  estLow: number;
  estMid: number;
  estHigh: number;
  notes: string[];
}

export interface MAOCalc {
  repair: number;
  mao: number;
}

export interface PriceToARVCalc {
  repair: number;
  pct: number;
}

export interface DSCRCalc {
  rent: number;
  dscr: number;
}

export interface Analysis {
  maoByRepair: MAOCalc[];
  priceToArvPctWithRepairs: PriceToARVCalc[];
  capRate?: number;
  dscrByRent: DSCRCalc[];
  breakevenVacancy?: number;
  rtoBadge: RTOBadge;
  monthlyCashFlow?: number;
  yearOneCashOnCash?: number;
}

export interface ComplianceLog {
  consentLog: string[];
  tosMode: 'scraping_disabled' | 'api_only' | 'manual_upload';
  optOutDetected: boolean;
  processedAt: string;
}

export interface Deal {
  id: string;
  source: DealSource;
  rawText: string;
  parsed: ParsedFields;
  geocode?: Geocode;
  facts?: PropertyFacts;
  finance?: FinanceEstimates;
  rents?: RentData;
  repairs: RepairEstimate;
  analysis?: Analysis;
  media: Media[];
  compliance: ComplianceLog;
  status: DealStatus;
  createdBy?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngestRequest {
  source: DealSource;
  rawText: string;
  url?: string;
  twilioSignature?: string;
}

export interface EnrichRequest {
  geocode?: boolean;
  propertyFacts?: boolean;
  rentData?: boolean;
}

export interface AnalyzeRequest {
  customRepairEstimates?: {
    low?: number;
    mid?: number;
    high?: number;
  };
}

export interface PublishRequest {
  target: 'investor' | 'rto';
}

export interface PublishResult {
  cardUrl: string;
  publicUrl?: string;
  publishedAt: string;
  target: 'investor' | 'rto';
}
