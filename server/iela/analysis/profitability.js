import { MAOCalc, PriceToARVCalc } from '../models/types';

export interface ProfitabilityInput {
  asking: number;
  arv: number;
  repairs?: {
    low?: number;
    mid?: number;
    high?: number;
  };
  monthlyRent?: number;
  monthlyExpenses?: number;
}

export interface ProfitabilityOutput {
  maoByRepair: MAOCalc[];
  priceToArvPctWithRepairs: PriceToARVCalc[];
  capRate?: number;
  monthlyCashFlow?: number;
  yearOneCashOnCash?: number;
}

const DEFAULT_REPAIRS = {
  low: 15000,
  mid: 30000,
  high: 45000
};

export function calculateMAO(arv: number, repairCost: number): number {
  return Math.round(arv * 0.7 - repairCost);
}

export function calculatePriceToARVPercent(
  asking: number,
  repairCost: number,
  arv: number
): number {
  if (arv === 0) return 0;
  return ((asking + repairCost) / arv) * 100;
}

export function calculateCapRate(
  annualRent: number,
  purchasePrice: number,
  annualExpenses: number = 0
): number {
  if (purchasePrice === 0) return 0;
  const noi = annualRent - annualExpenses;
  return (noi / purchasePrice) * 100;
}

export function calculateCashOnCash(
  annualCashFlow: number,
  totalInvestment: number
): number {
  if (totalInvestment === 0) return 0;
  return (annualCashFlow / totalInvestment) * 100;
}

export function analyzeProfitability(input: ProfitabilityInput): ProfitabilityOutput {
  const { asking, arv } = input;

  const repairs = {
    low: input.repairs?.low ?? DEFAULT_REPAIRS.low,
    mid: input.repairs?.mid ?? DEFAULT_REPAIRS.mid,
    high: input.repairs?.high ?? DEFAULT_REPAIRS.high
  };

  const maoByRepair: MAOCalc[] = [
    { repair: repairs.low, mao: calculateMAO(arv, repairs.low) },
    { repair: repairs.mid, mao: calculateMAO(arv, repairs.mid) },
    { repair: repairs.high, mao: calculateMAO(arv, repairs.high) }
  ];

  const priceToArvPctWithRepairs: PriceToARVCalc[] = [
    { 
      repair: repairs.low, 
      pct: parseFloat(calculatePriceToARVPercent(asking, repairs.low, arv).toFixed(1))
    },
    { 
      repair: repairs.mid, 
      pct: parseFloat(calculatePriceToARVPercent(asking, repairs.mid, arv).toFixed(1))
    },
    { 
      repair: repairs.high, 
      pct: parseFloat(calculatePriceToARVPercent(asking, repairs.high, arv).toFixed(1))
    }
  ];

  const output: ProfitabilityOutput = {
    maoByRepair,
    priceToArvPctWithRepairs
  };

  if (input.monthlyRent && input.monthlyExpenses !== undefined) {
    const annualRent = input.monthlyRent * 12;
    const annualExpenses = input.monthlyExpenses * 12;
    output.capRate = parseFloat(calculateCapRate(annualRent, asking, annualExpenses).toFixed(2));
    output.monthlyCashFlow = input.monthlyRent - input.monthlyExpenses;

    const downPayment = asking * 0.20;
    const closingCosts = asking * 0.03;
    const totalInvestment = downPayment + closingCosts + repairs.mid;
    const annualCashFlow = output.monthlyCashFlow * 12;
    output.yearOneCashOnCash = parseFloat(calculateCashOnCash(annualCashFlow, totalInvestment).toFixed(2));
  }

  return output;
}
