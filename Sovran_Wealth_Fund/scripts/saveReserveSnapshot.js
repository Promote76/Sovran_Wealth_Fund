// Save daily reserve snapshot
const fetch = require('node-fetch');

async function saveSnapshot() {
  try {
    console.log('Fetching current reserves...');
    
    // Fetch current reserves
    const reservesRes = await fetch('http://localhost:3000/api/reports/proof-of-reserves');
    if (!reservesRes.ok) {
      throw new Error(`HTTP ${reservesRes.status}: ${reservesRes.statusText}`);
    }
    
    const reservesData = await reservesRes.json();
    console.log(`Total USD: $${reservesData.totalUSD?.toLocaleString() || 0}`);
    console.log(`Reserves: ${reservesData.reserves?.length || 0} wallets`);
    
    // Save to history
    const historyRes = await fetch('http://localhost:3000/api/reports/reserves-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalUSD: reservesData.totalUSD || 0,
        reserves: reservesData.reserves || []
      })
    });
    
    if (!historyRes.ok) {
      throw new Error(`Failed to save snapshot: HTTP ${historyRes.status}`);
    }
    
    const result = await historyRes.json();
    console.log('✅ Snapshot saved successfully:', result.entry.timestamp);
    
  } catch (error) {
    console.error('❌ Failed to save reserve snapshot:', error.message);
    process.exit(1);
  }
}

saveSnapshot();