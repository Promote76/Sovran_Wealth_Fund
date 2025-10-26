const DEFAULT_REPAIRS = {
  low: 15000,
  mid: 30000,
  high: 45000
};

function calculateMAO(arv, repairCost) {
  return Math.round(arv * 0.7 - repairCost);
}

function calculatePriceToARVPercent(asking, repairCost, arv) {
  if (arv === 0) return 0;
  return ((asking + repairCost) / arv) * 100;
}

function calculateCapRate(annualRent, purchasePrice, annualExpenses = 0) {
  if (purchasePrice === 0) return 0;
  const noi = annualRent - annualExpenses;
  return (noi / purchasePrice) * 100;
}

function calculateCashOnCash(annualCashFlow, totalInvestment) {
  if (totalInvestment === 0) return 0;
  return (annualCashFlow / totalInvestment) * 100;
}

function calculateROI(arv, purchasePrice, repairCost) {
  if (purchasePrice === 0 || arv === 0) return 0;
  const totalInvestment = purchasePrice + repairCost;
  const profit = arv - totalInvestment;
  return (profit / totalInvestment) * 100;
}

function analyzeProfitability(input) {
  const { asking, arv } = input;

  const repairs = {
    low: input.repairs?.low ?? DEFAULT_REPAIRS.low,
    mid: input.repairs?.mid ?? DEFAULT_REPAIRS.mid,
    high: input.repairs?.high ?? DEFAULT_REPAIRS.high
  };

  const maoByRepair = [
    { 
      repair: repairs.low, 
      mao: calculateMAO(arv, repairs.low),
      roi: parseFloat(calculateROI(arv, asking, repairs.low).toFixed(1))
    },
    { 
      repair: repairs.mid, 
      mao: calculateMAO(arv, repairs.mid),
      roi: parseFloat(calculateROI(arv, asking, repairs.mid).toFixed(1))
    },
    { 
      repair: repairs.high, 
      mao: calculateMAO(arv, repairs.high),
      roi: parseFloat(calculateROI(arv, asking, repairs.high).toFixed(1))
    }
  ];

  const priceToArvPctWithRepairs = [
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

  const output = {
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

module.exports = {
  calculateMAO,
  calculateROI,
  calculatePriceToARVPercent,
  calculateCapRate,
  calculateCashOnCash,
  analyzeProfitability
};
