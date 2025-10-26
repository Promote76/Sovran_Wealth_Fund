const enrichmentService = require('../services/enrichmentService');
const mlPredictions = require('../ml/predictions');

async function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(`${message}: expected truthy value, got ${value}`);
  }
}

function assertFalsy(value, message) {
  if (value) {
    throw new Error(`${message}: expected falsy value, got ${value}`);
  }
}

const tests = [
  {
    name: 'Geocoding returns consistent results for same address',
    fn: async () => {
      const address = '247 Howell Drive Southwest';
      const city = 'Atlanta';
      const state = 'GA';
      const zip = '30331';

      const result1 = await enrichmentService.geocodeAddress(address, city, state, zip);
      const result2 = await enrichmentService.geocodeAddress(address, city, state, zip);

      assertTruthy(result1, 'Geocoding should return result');
      assertTruthy(result2, 'Geocoding should return result');
      
      if (result1 && result2) {
        assertEquals(result1.latitude, result2.latitude, 'Latitude should be consistent');
        assertEquals(result1.longitude, result2.longitude, 'Longitude should be consistent');
      }
    }
  },
  {
    name: 'Property facts are deterministic for same address',
    fn: async () => {
      const address = '247 Howell Drive Southwest';
      const city = 'Atlanta';
      const state = 'GA';
      const zip = '30331';

      const facts1 = await enrichmentService.getPropertyFacts(address, city, state, zip);
      const facts2 = await enrichmentService.getPropertyFacts(address, city, state, zip);

      assertEquals(facts1, facts2, 'Property facts should be identical');
      assertTruthy(facts1.bedrooms, 'Bedrooms should be defined');
      assertTruthy(facts1.bathrooms, 'Bathrooms should be defined');
      assertTruthy(facts1.squareFeet, 'Square feet should be defined');
      assertTruthy(facts1.source, 'Source should be defined');
    }
  },
  {
    name: 'Market data is consistent for same location',
    fn: async () => {
      const city = 'Atlanta';
      const state = 'GA';
      const zip = '30331';

      const market1 = await enrichmentService.getMarketData(city, state, zip);
      const market2 = await enrichmentService.getMarketData(city, state, zip);

      assertEquals(market1, market2, 'Market data should be identical');
      assertEquals(market1.medianHomeValue, 295000, 'Median home value should be 295000');
      assertEquals(market1.medianRent, 1750, 'Median rent should be 1750');
    }
  },
  {
    name: 'Neighborhood scores are deterministic',
    fn: async () => {
      const lat = 33.7490;
      const lon = -84.3880;

      const scores1 = await enrichmentService.getNeighborhoodScore(lat, lon);
      const scores2 = await enrichmentService.getNeighborhoodScore(lat, lon);

      assertEquals(scores1, scores2, 'Neighborhood scores should be identical');
      assertTruthy(scores1.walkScore, 'Walk score should be defined');
      assertTruthy(scores1.crimeScore, 'Crime score should be defined');
      assertTruthy(scores1.schoolScore, 'School score should be defined');
    }
  },
  {
    name: 'ML repair prediction is deterministic',
    fn: async () => {
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

      assertEquals(prediction1, prediction2, 'Repair predictions should be identical');
      assertTruthy(prediction1.estimated, 'Estimated repair cost should be defined');
      assertTruthy(prediction1.low, 'Low estimate should be defined');
      assertTruthy(prediction1.high, 'High estimate should be defined');
    }
  },
  {
    name: 'ML rent prediction is deterministic',
    fn: () => {
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

      assertEquals(prediction1, prediction2, 'Rent predictions should be identical');
      assertTruthy(prediction1.estimated, 'Estimated rent should be defined');
    }
  },
  {
    name: 'Different addresses produce different property facts',
    fn: async () => {
      const addr1Facts = await enrichmentService.getPropertyFacts('123 Main St', 'Atlanta', 'GA', '30331');
      const addr2Facts = await enrichmentService.getPropertyFacts('456 Oak Ave', 'Atlanta', 'GA', '30331');

      if (JSON.stringify(addr1Facts) === JSON.stringify(addr2Facts)) {
        throw new Error('Different addresses should produce different property facts');
      }
    }
  },
  {
    name: 'Hash-based seeding produces consistent results',
    fn: () => {
      const seed1 = enrichmentService.hashAddress('247 Howell Drive Southwest', 'Atlanta', 'GA');
      const seed2 = enrichmentService.hashAddress('247 Howell Drive Southwest', 'Atlanta', 'GA');
      const seed3 = enrichmentService.hashAddress('123 Main Street', 'Atlanta', 'GA');

      assertEquals(seed1, seed2, 'Same address should produce same hash');
      
      if (seed1 === seed3) {
        throw new Error('Different addresses should produce different hashes');
      }
    }
  }
];

if (require.main === module) {
  (async () => {
    console.log('🧪 Running IELA Enrichment Regression Tests\n');
    
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        passed++;
      } catch (error) {
        console.error(`❌ ${test.name}`);
        console.error(`   ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed! Enrichment service is deterministic and production-ready.');
      process.exit(0);
    }
  })();
}

module.exports = { tests };
