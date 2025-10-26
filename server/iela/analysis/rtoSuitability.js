function calculateDSCR(monthlyRent, totalMonthlyPayment) {
  if (totalMonthlyPayment === 0) return 0;
  return monthlyRent / totalMonthlyPayment;
}

function calculatePTI(totalMonthlyPayment, monthlyIncome) {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyPayment / monthlyIncome) * 100;
}

function determineRTOBadge(input) {
  const { monthlyRent, monthlyMortgage, monthlyTaxes, monthlyInsurance, monthlyHOA, monthlyIncome } = input;

  if (!monthlyRent || !monthlyMortgage) {
    return 'yellow';
  }

  const totalPayment = 
    monthlyMortgage + 
    (monthlyTaxes || 0) + 
    (monthlyInsurance || 0) + 
    (monthlyHOA || 0);

  const dscr = calculateDSCR(monthlyRent, totalPayment);

  if (monthlyIncome) {
    const pti = calculatePTI(totalPayment, monthlyIncome);

    if (dscr >= 1.25 && pti <= 30) {
      return 'green';
    }

    if (dscr >= 1.1 && pti <= 38) {
      return 'yellow';
    }

    return 'red';
  }

  if (dscr >= 1.25) return 'green';
  if (dscr >= 1.1) return 'yellow';
  return 'red';
}

function analyzeRTOSuitability(input) {
  const { monthlyRent, monthlyMortgage, monthlyTaxes, monthlyInsurance, monthlyHOA, monthlyIncome } = input;

  const badge = determineRTOBadge(input);

  const output = {
    badge,
    dscrByRent: [],
    recommendation: ''
  };

  if (monthlyMortgage) {
    const totalPayment = 
      monthlyMortgage + 
      (monthlyTaxes || 0) + 
      (monthlyInsurance || 0) + 
      (monthlyHOA || 0);

    if (monthlyRent) {
      output.dscr = parseFloat(calculateDSCR(monthlyRent, totalPayment).toFixed(2));

      const rentVariations = [
        monthlyRent * 0.9,
        monthlyRent,
        monthlyRent * 1.1
      ];

      output.dscrByRent = rentVariations.map(rent => ({
        rent: Math.round(rent),
        dscr: parseFloat(calculateDSCR(rent, totalPayment).toFixed(2))
      }));

      const noi = monthlyRent - totalPayment;
      if (monthlyRent > 0) {
        output.breakevenVacancy = parseFloat(((noi / monthlyRent) * 100).toFixed(1));
      }
    }

    if (monthlyIncome) {
      output.pti = parseFloat(calculatePTI(totalPayment, monthlyIncome).toFixed(1));
    }
  }

  switch (badge) {
    case 'green':
      output.recommendation = 'Excellent rent-to-own candidate. Strong cash flow and low payment-to-income ratio.';
      break;
    case 'yellow':
      output.recommendation = 'Moderate rent-to-own candidate. May require additional income verification or down payment assistance.';
      break;
    case 'red':
      output.recommendation = 'Challenging rent-to-own candidate. Consider increasing rent, reducing price, or targeting higher-income participants.';
      break;
  }

  return output;
}

module.exports = {
  calculateDSCR,
  calculatePTI,
  determineRTOBadge,
  analyzeRTOSuitability
};
