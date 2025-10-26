const enrichmentService = require('../services/enrichmentService');
const mlPredictions = require('../ml/predictions');

describe('IELA Enrichment Service - Deterministic Tests', () => {
  
  test('Geocoding should return consistent results for same address', async () => {
    const address = '247 Howell Drive Southwest';
    const city = 'Atlanta';
    const state = 'GA';
    const zip = '30331';

    const result1 = await enrichmentService.geocodeAddress(address, city, state, zip);
    const result2 = await enrichmentService.geocodeAddress(address, city, state, zip);

    expect(result1).toBeDefined();
    if (result1 && result2) {
      expect(result1.latitude).toBe(result2.latitude);
      expect(result1.longitude).toBe(result2.longitude);
    }
  });

  test('Property facts should be deterministic for same address', async () => {
    const address = '247 Howell Drive Southwest';
    const city = 'Atlanta';
    const state = 'GA';
    const zip = '30331';

    const facts1 = await enrichmentService.getPropertyFacts(address, city, state, zip);
    const facts2 = await enrichmentService.getPropertyFacts(address, city, state, zip);

    expect(facts1).toEqual(facts2);
    expect(facts1.bedrooms).toBeDefined();
    expect(facts1.bathrooms).toBeDefined();
    expect(facts1.squareFeet).toBeDefined();
    expect(facts1.source).toBe('estimated');
  });

  test('Market data should be consistent for same location', async () => {
    const city = 'Atlanta';
    const state = 'GA';
    const zip = '30331';

    const market1 = await enrichmentService.getMarketData(city, state, zip);
    const market2 = await enrichmentService.getMarketData(city, state, zip);

    expect(market1).toEqual(market2);
    expect(market1.medianHomeValue).toBe(295000);
    expect(market1.medianRent).toBe(1750);
  });

  test('Neighborhood scores should be deterministic for same coordinates', async () => {
    const lat = 33.7490;
    const lon = -84.3880;

    const scores1 = await enrichmentService.getNeighborhoodScore(lat, lon);
    const scores2 = await enrichmentService.getNeighborhoodScore(lat, lon);

    expect(scores1).toEqual(scores2);
    expect(scores1.walkScore).toBeDefined();
    expect(scores1.crimeScore).toBeDefined();
    expect(scores1.schoolScore).toBeDefined();
  });

  test('ML repair prediction should be deterministic', async () => {
    const propertyFacts = {
      squareFeet: 1450,
      yearBuilt: 1982,
      propertyType: 'Single Family',
      stories: 1
    };
    const marketData = {};
    const condition = 'Fair';

    const prediction1 = await mlPredictions.predictRepairCost(propertyFacts, marketData, condition);
    const prediction2 = await mlPredictions.predictRepairCost(propertyFacts, marketData, condition);

    expect(prediction1).toEqual(prediction2);
    expect(prediction1.estimated).toBeDefined();
    expect(prediction1.low).toBeDefined();
    expect(prediction1.high).toBeDefined();
  });

  test('ML rent prediction should be deterministic', () => {
    const propertyFacts = {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1450,
      garage: true
    };
    const marketData = {
      medianRent: 1750
    };

    const prediction1 = mlPredictions.predictRent(propertyFacts, marketData);
    const prediction2 = mlPredictions.predictRent(propertyFacts, marketData);

    expect(prediction1).toEqual(prediction2);
    expect(prediction1.estimated).toBeDefined();
  });

  test('Different addresses should produce different property facts', async () => {
    const addr1Facts = await enrichmentService.getPropertyFacts('123 Main St', 'Atlanta', 'GA', '30331');
    const addr2Facts = await enrichmentService.getPropertyFacts('456 Oak Ave', 'Atlanta', 'GA', '30331');

    expect(addr1Facts).not.toEqual(addr2Facts);
  });

  test('Hash-based seeding should produce consistent results', () => {
    const seed1 = enrichmentService.hashAddress('247 Howell Drive Southwest', 'Atlanta', 'GA');
    const seed2 = enrichmentService.hashAddress('247 Howell Drive Southwest', 'Atlanta', 'GA');
    const seed3 = enrichmentService.hashAddress('123 Main Street', 'Atlanta', 'GA');

    expect(seed1).toBe(seed2);
    expect(seed1).not.toBe(seed3);
  });
});

if (require.main === module) {
  console.log('🧪 Running IELA deterministic tests...');
  
  const tests = [
    { name: 'Property facts determinism', fn: async () => {
      const facts1 = await enrichmentService.getPropertyFacts('247 Howell Dr SW', 'Atlanta', 'GA', '30331');
      const facts2 = await enrichmentService.getPropertyFacts('247 Howell Dr SW', 'Atlanta', 'GA', '30331');
      if (JSON.stringify(facts1) !== JSON.stringify(facts2)) {
        throw new Error('Property facts not deterministic');
      }
      console.log('✅ Property facts are deterministic');
    }},
    { name: 'Market data consistency', fn: async () => {
      const market1 = await enrichmentService.getMarketData('Atlanta', 'GA', '30331');
      const market2 = await enrichmentService.getMarketData('Atlanta', 'GA', '30331');
      if (JSON.stringify(market1) !== JSON.stringify(market2)) {
        throw new Error('Market data not consistent');
      }
      console.log('✅ Market data is consistent');
    }},
    { name: 'Hashing consistency', fn: () => {
      const hash1 = enrichmentService.hashAddress('247 Howell Dr SW', 'Atlanta', 'GA');
      const hash2 = enrichmentService.hashAddress('247 Howell Dr SW', 'Atlanta', 'GA');
      if (hash1 !== hash2) {
        throw new Error('Address hashing not consistent');
      }
      console.log('✅ Address hashing is consistent');
    }}
  ];

  (async () => {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await test.fn();
        passed++;
      } catch (error) {
        console.error(`❌ ${test.name}: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  })();
}

module.exports = {};
