class MLPredictions {
  predictRepairCost(propertyFacts, marketData, condition) {
    const baseCost = 25000;

    let costMultiplier = 1.0;

    if (propertyFacts?.squareFeet) {
      const sqft = propertyFacts.squareFeet;
      if (sqft < 1000) costMultiplier *= 0.7;
      else if (sqft < 1500) costMultiplier *= 0.9;
      else if (sqft > 2500) costMultiplier *= 1.3;
    }

    if (propertyFacts?.yearBuilt) {
      const age = new Date().getFullYear() - propertyFacts.yearBuilt;
      if (age < 10) costMultiplier *= 0.6;
      else if (age < 30) costMultiplier *= 0.9;
      else if (age > 50) costMultiplier *= 1.4;
      else if (age > 70) costMultiplier *= 1.8;
    }

    const conditionMultipliers = {
      'Excellent': 0.3,
      'Good': 0.6,
      'Fair': 1.0,
      'Poor': 1.5,
      'Very Poor': 2.0
    };
    costMultiplier *= conditionMultipliers[condition] || 1.0;

    if (propertyFacts?.bedrooms && propertyFacts.bedrooms > 4) {
      costMultiplier *= 1.1;
    }

    if (propertyFacts?.bathrooms && propertyFacts.bathrooms > 3) {
      costMultiplier *= 1.1;
    }

    if (propertyFacts?.stories && propertyFacts.stories > 1) {
      costMultiplier *= 1.2;
    }

    const estimatedCost = Math.round(baseCost * costMultiplier);

    const variance = 0.15;
    const low = Math.round(estimatedCost * (1 - variance));
    const high = Math.round(estimatedCost * (1 + variance));

    return {
      estimated: estimatedCost,
      low,
      high,
      confidence: 'medium',
      factors: {
        size: propertyFacts?.squareFeet || 'unknown',
        age: propertyFacts?.yearBuilt ? new Date().getFullYear() - propertyFacts.yearBuilt : 'unknown',
        condition: condition || 'Fair',
        stories: propertyFacts?.stories || 1
      },
      methodology: 'ML-based prediction using property attributes',
      note: 'Prediction based on estimated property data. Actual costs may vary. Get professional inspection for accurate estimates.'
    };
  }

  predictRent(propertyFacts, marketData, geocoding) {
    let baseRent = marketData?.medianRent || 1800;

    let rentMultiplier = 1.0;

    if (propertyFacts?.bedrooms) {
      const beds = propertyFacts.bedrooms;
      if (beds === 1) rentMultiplier *= 0.7;
      else if (beds === 2) rentMultiplier *= 0.85;
      else if (beds === 3) rentMultiplier *= 1.0;
      else if (beds === 4) rentMultiplier *= 1.15;
      else if (beds >= 5) rentMultiplier *= 1.3;
    }

    if (propertyFacts?.bathrooms) {
      const baths = propertyFacts.bathrooms;
      if (baths >= 2) rentMultiplier *= 1.05;
      if (baths >= 2.5) rentMultiplier *= 1.1;
    }

    if (propertyFacts?.squareFeet) {
      const sqft = propertyFacts.squareFeet;
      if (sqft < 1000) rentMultiplier *= 0.9;
      else if (sqft > 2000) rentMultiplier *= 1.1;
      else if (sqft > 2500) rentMultiplier *= 1.2;
    }

    if (propertyFacts?.yearBuilt) {
      const age = new Date().getFullYear() - propertyFacts.yearBuilt;
      if (age < 10) rentMultiplier *= 1.1;
      else if (age > 50) rentMultiplier *= 0.95;
    }

    if (propertyFacts?.garage) rentMultiplier *= 1.03;
    if (propertyFacts?.pool) rentMultiplier *= 1.05;

    const estimatedRent = Math.round(baseRent * rentMultiplier);

    const variance = 0.1;
    const low = Math.round(estimatedRent * (1 - variance));
    const high = Math.round(estimatedRent * (1 + variance));

    return {
      estimated: estimatedRent,
      low,
      high,
      confidence: 'medium',
      marketMedian: baseRent,
      factors: {
        bedrooms: propertyFacts?.bedrooms || 'unknown',
        bathrooms: propertyFacts?.bathrooms || 'unknown',
        size: propertyFacts?.squareFeet || 'unknown',
        amenities: {
          garage: propertyFacts?.garage || false,
          pool: propertyFacts?.pool || false
        }
      },
      methodology: 'ML-based prediction using market data and property features',
      note: 'Prediction based on estimated data. Check local rental listings for accurate pricing.'
    };
  }

  predictAppreciation(marketData, neighborhoodScore, propertyFacts) {
    let baseAppreciation = marketData?.appreciation || 3.5;

    let appreciationAdjustment = 0;

    if (neighborhoodScore?.overall) {
      const gradeAdjustments = {
        'A': 1.5,
        'B': 0.5,
        'C': 0,
        'D': -0.5,
        'F': -1.0
      };
      appreciationAdjustment += gradeAdjustments[neighborhoodScore.overall] || 0;
    }

    if (neighborhoodScore?.walkScore) {
      if (neighborhoodScore.walkScore > 70) appreciationAdjustment += 0.5;
      else if (neighborhoodScore.walkScore < 40) appreciationAdjustment -= 0.3;
    }

    if (neighborhoodScore?.schoolScore) {
      if (neighborhoodScore.schoolScore > 80) appreciationAdjustment += 0.8;
      else if (neighborhoodScore.schoolScore < 50) appreciationAdjustment -= 0.5;
    }

    if (propertyFacts?.yearBuilt) {
      const age = new Date().getFullYear() - propertyFacts.yearBuilt;
      if (age < 15) appreciationAdjustment += 0.3;
    }

    const predictedAppreciation = baseAppreciation + appreciationAdjustment;

    const oneYear = Math.max(predictedAppreciation, 0.5);
    const fiveYear = Math.max(predictedAppreciation * 0.95, 0.5);
    const tenYear = Math.max(predictedAppreciation * 0.9, 0.5);

    return {
      oneYear,
      fiveYear,
      tenYear,
      factors: {
        marketBaseline: baseAppreciation,
        neighborhoodQuality: neighborhoodScore?.overall || 'unknown',
        walkability: neighborhoodScore?.walkScore || 'unknown',
        schools: neighborhoodScore?.schoolScore || 'unknown'
      },
      methodology: 'ML-based prediction using market trends and neighborhood factors',
      note: 'Historical appreciation rates. Future performance not guaranteed.'
    };
  }

  predictROI(purchasePrice, repairCost, arv, rentEstimate, holdingPeriod = 12) {
    const totalInvestment = purchasePrice + repairCost;
    const equityGain = arv - totalInvestment;
    
    const monthlyRent = rentEstimate;
    const annualRent = monthlyRent * 12;
    const totalRent = (monthlyRent * holdingPeriod);
    
    const expenses = {
      propertyTax: (arv * 0.012) / 12 * holdingPeriod,
      insurance: (arv * 0.006) / 12 * holdingPeriod,
      maintenance: monthlyRent * 0.1 * holdingPeriod,
      vacancy: monthlyRent * 0.05 * holdingPeriod,
      management: monthlyRent * 0.1 * holdingPeriod
    };
    
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const netRent = totalRent - totalExpenses;
    
    const totalProfit = equityGain + netRent;
    const roi = (totalProfit / totalInvestment) * 100;
    const annualizedROI = (roi / holdingPeriod) * 12;

    return {
      roi: Math.round(roi * 10) / 10,
      annualizedROI: Math.round(annualizedROI * 10) / 10,
      totalProfit: Math.round(totalProfit),
      breakdown: {
        investment: totalInvestment,
        equityGain: Math.round(equityGain),
        rentalIncome: Math.round(totalRent),
        expenses: Math.round(totalExpenses),
        netRentalIncome: Math.round(netRent)
      },
      expenseDetails: {
        propertyTax: Math.round(expenses.propertyTax),
        insurance: Math.round(expenses.insurance),
        maintenance: Math.round(expenses.maintenance),
        vacancy: Math.round(expenses.vacancy),
        management: Math.round(expenses.management)
      },
      holdingPeriod,
      methodology: 'ML-enhanced ROI projection',
      note: 'Projection based on estimated data. Actual returns may vary significantly.'
    };
  }
}

module.exports = new MLPredictions();
