/**
 * Feature #8: Multi-chain Deployment Orchestrator
 * Creates database tables for cross-chain contract deployment and monitoring
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createMultichainTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating supported_chains table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS supported_chains (
        id SERIAL PRIMARY KEY,
        chain_id INTEGER NOT NULL UNIQUE,
        chain_name VARCHAR(50) NOT NULL,
        network_type VARCHAR(20) NOT NULL CHECK (network_type IN ('mainnet', 'testnet')),
        chain_type VARCHAR(20) NOT NULL CHECK (chain_type IN ('layer1', 'layer2', 'sidechain')),
        parent_chain_id INTEGER REFERENCES supported_chains(id) ON DELETE SET NULL,
        rpc_url TEXT NOT NULL,
        explorer_url TEXT,
        native_currency_symbol VARCHAR(10) NOT NULL,
        native_currency_decimals INTEGER DEFAULT 18 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        gas_price_oracle VARCHAR(50),
        average_block_time_seconds INTEGER,
        confirmation_blocks INTEGER DEFAULT 1 NOT NULL,
        supports_eip1559 BOOLEAN DEFAULT false,
        bridge_contracts JSONB,
        deployment_config JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      -- Seed supported chains
      INSERT INTO supported_chains (chain_id, chain_name, network_type, chain_type, rpc_url, explorer_url, native_currency_symbol)
      VALUES 
        (56, 'Binance Smart Chain', 'mainnet', 'layer1', 'https://bsc-dataseed.binance.org/', 'https://bscscan.com', 'BNB'),
        (137, 'Polygon', 'mainnet', 'layer2', 'https://polygon-rpc.com/', 'https://polygonscan.com', 'MATIC'),
        (42161, 'Arbitrum', 'mainnet', 'layer2', 'https://arb1.arbitrum.io/rpc', 'https://arbiscan.io', 'ETH'),
        (10, 'Optimism', 'mainnet', 'layer2', 'https://mainnet.optimism.io', 'https://optimistic.etherscan.io', 'ETH')
      ON CONFLICT (chain_id) DO NOTHING;
    `);
    
    console.log('Creating deployed_contracts table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS deployed_contracts (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR(36) NOT NULL UNIQUE,
        contract_name VARCHAR(100) NOT NULL,
        contract_type VARCHAR(30) NOT NULL CHECK (contract_type IN (
          'property_shares', 'staking', 'governance', 'treasury', 'bridge', 'utility'
        )),
        chain_id INTEGER NOT NULL REFERENCES supported_chains(id) ON DELETE CASCADE,
        contract_address VARCHAR(42) NOT NULL,
        deployer_address VARCHAR(42) NOT NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        contract_version VARCHAR(20),
        compiler_version VARCHAR(50),
        deployment_tx_hash VARCHAR(66),
        deployment_block_number BIGINT,
        gas_used BIGINT,
        deployment_cost DECIMAL(18,8),
        verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN (
          'pending', 'verified', 'failed', 'not_required'
        )),
        verified_at TIMESTAMP,
        verification_url TEXT,
        proxy_address VARCHAR(42),
        implementation_address VARCHAR(42),
        is_upgradeable BOOLEAN DEFAULT false,
        constructor_args JSONB,
        abi JSONB,
        bytecode TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated', 'destroyed')),
        metadata JSONB,
        deployed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        deployed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(chain_id, contract_address)
      );
      
      CREATE INDEX IF NOT EXISTS deployed_contracts_deployment_id_idx ON deployed_contracts(deployment_id);
      CREATE INDEX IF NOT EXISTS deployed_contracts_chain_idx ON deployed_contracts(chain_id);
      CREATE INDEX IF NOT EXISTS deployed_contracts_address_idx ON deployed_contracts(contract_address);
      CREATE INDEX IF NOT EXISTS deployed_contracts_type_idx ON deployed_contracts(contract_type);
      CREATE INDEX IF NOT EXISTS deployed_contracts_property_idx ON deployed_contracts(property_id);
    `);
    
    console.log('Creating cross_chain_bridges table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS cross_chain_bridges (
        id SERIAL PRIMARY KEY,
        bridge_id VARCHAR(36) NOT NULL UNIQUE,
        bridge_name VARCHAR(100) NOT NULL,
        source_chain_id INTEGER NOT NULL REFERENCES supported_chains(id) ON DELETE CASCADE,
        destination_chain_id INTEGER NOT NULL REFERENCES supported_chains(id) ON DELETE CASCADE,
        bridge_type VARCHAR(30) NOT NULL CHECK (bridge_type IN (
          'native', 'lock_mint', 'burn_mint', 'liquidity_pool', 'wrapped'
        )),
        source_contract_address VARCHAR(42),
        destination_contract_address VARCHAR(42),
        supported_tokens JSONB,
        min_transfer_amount DECIMAL(18,8),
        max_transfer_amount DECIMAL(18,8),
        transfer_fee_percent DECIMAL(5,2),
        estimated_time_minutes INTEGER,
        is_active BOOLEAN DEFAULT true NOT NULL,
        security_audit_url TEXT,
        documentation_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (source_chain_id != destination_chain_id)
      );
      
      CREATE INDEX IF NOT EXISTS cross_chain_bridges_source_idx ON cross_chain_bridges(source_chain_id);
      CREATE INDEX IF NOT EXISTS cross_chain_bridges_destination_idx ON cross_chain_bridges(destination_chain_id);
      CREATE INDEX IF NOT EXISTS cross_chain_bridges_active_idx ON cross_chain_bridges(is_active);
    `);
    
    console.log('Creating bridge_transactions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS bridge_transactions (
        id SERIAL PRIMARY KEY,
        bridge_tx_id VARCHAR(36) NOT NULL UNIQUE,
        bridge_id INTEGER NOT NULL REFERENCES cross_chain_bridges(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42) NOT NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        source_chain_id INTEGER NOT NULL REFERENCES supported_chains(id),
        destination_chain_id INTEGER NOT NULL REFERENCES supported_chains(id),
        source_tx_hash VARCHAR(66) NOT NULL,
        destination_tx_hash VARCHAR(66),
        token_symbol VARCHAR(20) NOT NULL,
        amount DECIMAL(18,8) NOT NULL,
        fee_amount DECIMAL(18,8),
        status VARCHAR(20) DEFAULT 'initiated' NOT NULL CHECK (status IN (
          'initiated', 'pending', 'confirmed', 'completed', 'failed', 'refunded'
        )),
        initiated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        confirmed_at TIMESTAMP,
        completed_at TIMESTAMP,
        failed_at TIMESTAMP,
        failure_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS bridge_tx_bridge_id_idx ON bridge_transactions(bridge_tx_id);
      CREATE INDEX IF NOT EXISTS bridge_tx_bridge_idx ON bridge_transactions(bridge_id);
      CREATE INDEX IF NOT EXISTS bridge_tx_wallet_idx ON bridge_transactions(wallet_address);
      CREATE INDEX IF NOT EXISTS bridge_tx_status_idx ON bridge_transactions(status);
      CREATE INDEX IF NOT EXISTS bridge_tx_source_hash_idx ON bridge_transactions(source_tx_hash);
    `);
    
    console.log('Creating deployment_templates table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS deployment_templates (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(36) NOT NULL UNIQUE,
        template_name VARCHAR(100) NOT NULL,
        contract_type VARCHAR(30) NOT NULL,
        solidity_version VARCHAR(20) NOT NULL,
        source_code TEXT NOT NULL,
        constructor_params JSONB NOT NULL,
        compilation_settings JSONB,
        deployment_script TEXT,
        verification_script TEXT,
        gas_estimate BIGINT,
        is_upgradeable BOOLEAN DEFAULT false,
        upgrade_strategy VARCHAR(30) CHECK (upgrade_strategy IN ('transparent', 'uups', 'beacon', 'none')),
        security_audit_url TEXT,
        documentation_url TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        version VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Creating chain_monitoring table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS chain_monitoring (
        id SERIAL PRIMARY KEY,
        monitoring_id VARCHAR(36) NOT NULL UNIQUE,
        deployment_id INTEGER NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
        chain_id INTEGER NOT NULL REFERENCES supported_chains(id) ON DELETE CASCADE,
        contract_address VARCHAR(42) NOT NULL,
        monitor_type VARCHAR(30) NOT NULL CHECK (monitor_type IN (
          'balance', 'events', 'state_changes', 'gas_usage', 'errors', 'security'
        )),
        check_frequency_minutes INTEGER DEFAULT 60 NOT NULL,
        alert_threshold JSONB,
        last_check_at TIMESTAMP,
        last_check_result JSONB,
        next_check_at TIMESTAMP,
        alerts_triggered INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(deployment_id, monitor_type)
      );
      
      CREATE INDEX IF NOT EXISTS chain_monitoring_deployment_idx ON chain_monitoring(deployment_id);
      CREATE INDEX IF NOT EXISTS chain_monitoring_chain_idx ON chain_monitoring(chain_id);
      CREATE INDEX IF NOT EXISTS chain_monitoring_next_check_idx ON chain_monitoring(next_check_at);
      CREATE INDEX IF NOT EXISTS chain_monitoring_active_idx ON chain_monitoring(is_active);
    `);
    
    console.log('Creating gas_price_history table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS gas_price_history (
        id SERIAL PRIMARY KEY,
        chain_id INTEGER NOT NULL REFERENCES supported_chains(id) ON DELETE CASCADE,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        gas_price_gwei DECIMAL(10,2) NOT NULL,
        base_fee_gwei DECIMAL(10,2),
        priority_fee_gwei DECIMAL(10,2),
        gas_price_usd DECIMAL(10,6),
        network_utilization_percent DECIMAL(5,2),
        block_number BIGINT
      );
      
      CREATE INDEX IF NOT EXISTS gas_price_chain_idx ON gas_price_history(chain_id);
      CREATE INDEX IF NOT EXISTS gas_price_timestamp_idx ON gas_price_history(timestamp DESC);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Multi-chain Deployment tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. supported_chains - Chain configuration (BSC, Polygon, Arbitrum, Optimism)');
    console.log('  2. deployed_contracts - Contract deployment tracking');
    console.log('  3. cross_chain_bridges - Bridge configurations');
    console.log('  4. bridge_transactions - Cross-chain transfer tracking');
    console.log('  5. deployment_templates - Reusable contract templates');
    console.log('  6. chain_monitoring - Automated contract monitoring');
    console.log('  7. gas_price_history - Gas price analytics');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating multi-chain tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createMultichainTables()
  .then(() => {
    console.log('\n🎉 Multi-chain Deployment migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
