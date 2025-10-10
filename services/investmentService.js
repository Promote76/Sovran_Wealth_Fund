const Decimal = require('decimal.js');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
const { 
  investmentAccounts, 
  instruments, 
  positions, 
  orders, 
  executions, 
  investmentLedger,
  marketQuotes
} = require('../shared/schema');
const { eq, and, sql } = require('drizzle-orm');
const marketDataService = require('./marketDataService');

// Initialize database connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

class InvestmentService {
  
  async getOrCreateInstrument(symbol, type) {
    try {
      const upperSymbol = symbol.toUpperCase();
      
      const existing = await db
        .select()
        .from(instruments)
        .where(eq(instruments.symbol, upperSymbol))
        .limit(1);
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      const quoteResponse = await marketDataService.getQuote(upperSymbol);
      const quoteData = quoteResponse.data || quoteResponse;
      
      const [newInstrument] = await db.insert(instruments).values({
        symbol: upperSymbol,
        name: quoteData.name || upperSymbol,
        type: quoteData.type || type || 'stock',
        exchange: quoteData.exchange || null,
        quoteSource: quoteData.provider || 'market_api',
        isActive: true,
        metadata: {
          lastPrice: quoteData.price,
          currency: quoteData.currency || 'USD'
        }
      }).returning();
      
      return newInstrument;
    } catch (error) {
      console.error(`❌ Error getting/creating instrument ${symbol}:`, error);
      throw new Error(`Failed to retrieve instrument: ${error.message}`);
    }
  }
  
  async executeBuyOrder(accountId, symbol, quantity, orderType = 'MARKET', limitPrice = null, createdBy) {
    try {
      const instrument = await this.getOrCreateInstrument(symbol);
      
      const [account] = await db
        .select()
        .from(investmentAccounts)
        .where(eq(investmentAccounts.id, accountId))
        .limit(1);
      
      if (!account) {
        throw new Error('Investment account not found');
      }
      
      if (account.status !== 'active') {
        throw new Error('Account is not active');
      }
      
      let executionPrice;
      if (orderType === 'MARKET') {
        const quoteResponse = await marketDataService.getQuote(symbol);
        const quoteData = quoteResponse.data || quoteResponse;
        if (!quoteData || !quoteData.price) {
          throw new Error(`Failed to get price for ${symbol}`);
        }
        executionPrice = new Decimal(quoteData.price);
      } else if (orderType === 'LIMIT') {
        if (!limitPrice) {
          throw new Error('Limit price required for LIMIT orders');
        }
        executionPrice = new Decimal(limitPrice);
      } else {
        throw new Error(`Unsupported order type: ${orderType}`);
      }
      
      const qty = new Decimal(quantity);
      const totalCost = executionPrice.times(qty);
      const fees = totalCost.times('0.001');
      const totalAmount = totalCost.plus(fees);
      
      const currentCashBalance = new Decimal(account.cashBalance);
      if (currentCashBalance.lessThan(totalAmount)) {
        throw new Error(`Insufficient funds. Required: $${totalAmount.toFixed(2)}, Available: $${currentCashBalance.toFixed(2)}`);
      }
      
      return await db.transaction(async (tx) => {
        const [order] = await tx.insert(orders).values({
          accountId,
          instrumentId: instrument.id,
          side: 'BUY',
          orderType,
          quantity: qty.toString(),
          limitPrice: limitPrice ? new Decimal(limitPrice).toString() : null,
          tif: 'GTC',
          status: 'filled',
          filledQty: qty.toString(),
          avgFillPrice: executionPrice.toString(),
          createdBy,
          metadata: { instrument: symbol, fees: fees.toString() }
        }).returning();
        
        const [execution] = await tx.insert(executions).values({
          orderId: order.id,
          fillQty: qty.toString(),
          fillPrice: executionPrice.toString(),
          fees: fees.toString(),
          venue: 'internal'
        }).returning();
        
        const existingPositions = await tx
          .select()
          .from(positions)
          .where(
            and(
              eq(positions.accountId, accountId),
              eq(positions.instrumentId, instrument.id)
            )
          )
          .limit(1);
        
        let position;
        if (existingPositions.length > 0) {
          const existing = existingPositions[0];
          const oldQty = new Decimal(existing.quantity);
          const oldCost = new Decimal(existing.avgCost);
          const newQty = oldQty.plus(qty);
          const newAvgCost = oldQty.times(oldCost).plus(qty.times(executionPrice)).dividedBy(newQty);
          
          [position] = await tx
            .update(positions)
            .set({
              quantity: newQty.toString(),
              avgCost: newAvgCost.toString(),
              updatedAt: new Date()
            })
            .where(eq(positions.id, existing.id))
            .returning();
        } else {
          [position] = await tx.insert(positions).values({
            accountId,
            instrumentId: instrument.id,
            quantity: qty.toString(),
            avgCost: executionPrice.toString(),
            realizedPnl: '0',
            unrealizedPnl: '0'
          }).returning();
        }
        
        const newCashBalance = currentCashBalance.minus(totalAmount);
        await tx
          .update(investmentAccounts)
          .set({
            cashBalance: newCashBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(investmentAccounts.id, accountId));
        
        await tx.insert(investmentLedger).values({
          accountId,
          type: 'BUY',
          amount: totalAmount.negated().toString(),
          instrumentId: instrument.id,
          refId: `ORDER-${order.id}`,
          description: `Bought ${qty} shares of ${symbol} @ $${executionPrice}`
        });
        
        return {
          success: true,
          order,
          execution,
          position,
          totalCost: totalCost.toString(),
          fees: fees.toString(),
          newCashBalance: newCashBalance.toString()
        };
      });
    } catch (error) {
      console.error('❌ Buy order execution error:', error);
      throw error;
    }
  }
  
  async executeSellOrder(accountId, symbol, quantity, orderType = 'MARKET', limitPrice = null, createdBy) {
    try {
      const instrument = await this.getOrCreateInstrument(symbol);
      
      const [account] = await db
        .select()
        .from(investmentAccounts)
        .where(eq(investmentAccounts.id, accountId))
        .limit(1);
      
      if (!account) {
        throw new Error('Investment account not found');
      }
      
      if (account.status !== 'active') {
        throw new Error('Account is not active');
      }
      
      const existingPositions = await db
        .select()
        .from(positions)
        .where(
          and(
            eq(positions.accountId, accountId),
            eq(positions.instrumentId, instrument.id)
          )
        )
        .limit(1);
      
      if (existingPositions.length === 0) {
        throw new Error('No position found for this instrument');
      }
      
      const position = existingPositions[0];
      const currentQty = new Decimal(position.quantity);
      const sellQty = new Decimal(quantity);
      
      if (currentQty.lessThan(sellQty)) {
        throw new Error(`Insufficient shares. Available: ${currentQty}, Requested: ${sellQty}`);
      }
      
      let executionPrice;
      if (orderType === 'MARKET') {
        const quoteResponse = await marketDataService.getQuote(symbol);
        const quoteData = quoteResponse.data || quoteResponse;
        if (!quoteData || !quoteData.price) {
          throw new Error(`Failed to get price for ${symbol}`);
        }
        executionPrice = new Decimal(quoteData.price);
      } else if (orderType === 'LIMIT') {
        if (!limitPrice) {
          throw new Error('Limit price required for LIMIT orders');
        }
        executionPrice = new Decimal(limitPrice);
      } else {
        throw new Error(`Unsupported order type: ${orderType}`);
      }
      
      const totalProceeds = executionPrice.times(sellQty);
      const fees = totalProceeds.times('0.001');
      const netProceeds = totalProceeds.minus(fees);
      
      const avgCost = new Decimal(position.avgCost);
      const costBasis = avgCost.times(sellQty);
      const realizedPnl = executionPrice.minus(avgCost).times(sellQty).minus(fees);
      
      return await db.transaction(async (tx) => {
        const [order] = await tx.insert(orders).values({
          accountId,
          instrumentId: instrument.id,
          side: 'SELL',
          orderType,
          quantity: sellQty.toString(),
          limitPrice: limitPrice ? new Decimal(limitPrice).toString() : null,
          tif: 'GTC',
          status: 'filled',
          filledQty: sellQty.toString(),
          avgFillPrice: executionPrice.toString(),
          createdBy,
          metadata: { 
            instrument: symbol, 
            fees: fees.toString(),
            realizedPnl: realizedPnl.toString()
          }
        }).returning();
        
        const [execution] = await tx.insert(executions).values({
          orderId: order.id,
          fillQty: sellQty.toString(),
          fillPrice: executionPrice.toString(),
          fees: fees.toString(),
          venue: 'internal'
        }).returning();
        
        const newQty = currentQty.minus(sellQty);
        const currentRealizedPnl = new Decimal(position.realizedPnl || '0');
        const newRealizedPnl = currentRealizedPnl.plus(realizedPnl);
        
        let updatedPosition;
        if (newQty.isZero()) {
          [updatedPosition] = await tx
            .update(positions)
            .set({
              quantity: '0',
              realizedPnl: newRealizedPnl.toString(),
              unrealizedPnl: '0',
              updatedAt: new Date()
            })
            .where(eq(positions.id, position.id))
            .returning();
        } else {
          [updatedPosition] = await tx
            .update(positions)
            .set({
              quantity: newQty.toString(),
              realizedPnl: newRealizedPnl.toString(),
              updatedAt: new Date()
            })
            .where(eq(positions.id, position.id))
            .returning();
        }
        
        const currentCashBalance = new Decimal(account.cashBalance);
        const newCashBalance = currentCashBalance.plus(netProceeds);
        
        await tx
          .update(investmentAccounts)
          .set({
            cashBalance: newCashBalance.toString(),
            updatedAt: new Date()
          })
          .where(eq(investmentAccounts.id, accountId));
        
        await tx.insert(investmentLedger).values({
          accountId,
          type: 'SELL',
          amount: netProceeds.toString(),
          instrumentId: instrument.id,
          refId: `ORDER-${order.id}`,
          description: `Sold ${sellQty} shares of ${symbol} @ $${executionPrice} (P&L: $${realizedPnl.toFixed(2)})`
        });
        
        return {
          success: true,
          order,
          execution,
          position: updatedPosition,
          totalProceeds: totalProceeds.toString(),
          fees: fees.toString(),
          netProceeds: netProceeds.toString(),
          realizedPnl: realizedPnl.toString(),
          newCashBalance: newCashBalance.toString()
        };
      });
    } catch (error) {
      console.error('❌ Sell order execution error:', error);
      throw error;
    }
  }
  
  async getAccountPositions(accountId) {
    try {
      const positionsData = await db
        .select({
          position: positions,
          instrument: instruments
        })
        .from(positions)
        .leftJoin(instruments, eq(positions.instrumentId, instruments.id))
        .where(eq(positions.accountId, accountId));
      
      const positionsWithPnl = await Promise.all(
        positionsData.map(async ({ position, instrument }) => {
          const qty = new Decimal(position.quantity);
          
          if (qty.isZero()) {
            return null;
          }
          
          try {
            const quoteData = await marketDataService.getQuote(instrument.symbol);
            const currentPrice = new Decimal(quoteData.price);
            const avgCost = new Decimal(position.avgCost);
            const marketValue = currentPrice.times(qty);
            const costBasis = avgCost.times(qty);
            const unrealizedPnl = marketValue.minus(costBasis);
            const unrealizedPnlPercent = unrealizedPnl.dividedBy(costBasis).times(100);
            
            return {
              id: position.id,
              symbol: instrument.symbol,
              name: instrument.name,
              type: instrument.type,
              quantity: qty.toString(),
              avgCost: avgCost.toString(),
              currentPrice: currentPrice.toString(),
              marketValue: marketValue.toString(),
              costBasis: costBasis.toString(),
              unrealizedPnl: unrealizedPnl.toString(),
              unrealizedPnlPercent: unrealizedPnlPercent.toFixed(2),
              realizedPnl: position.realizedPnl,
              updatedAt: position.updatedAt
            };
          } catch (error) {
            console.error(`Error fetching price for ${instrument.symbol}:`, error);
            return {
              id: position.id,
              symbol: instrument.symbol,
              name: instrument.name,
              type: instrument.type,
              quantity: qty.toString(),
              avgCost: position.avgCost,
              currentPrice: null,
              marketValue: null,
              costBasis: null,
              unrealizedPnl: '0',
              unrealizedPnlPercent: '0',
              realizedPnl: position.realizedPnl,
              updatedAt: position.updatedAt
            };
          }
        })
      );
      
      return positionsWithPnl.filter(p => p !== null);
    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      throw error;
    }
  }
  
  async getOrderHistory(accountId, limit = 50) {
    try {
      const orderHistory = await db
        .select({
          order: orders,
          instrument: instruments,
          executions: executions
        })
        .from(orders)
        .leftJoin(instruments, eq(orders.instrumentId, instruments.id))
        .leftJoin(executions, eq(executions.orderId, orders.id))
        .where(eq(orders.accountId, accountId))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(limit);
      
      const groupedOrders = {};
      orderHistory.forEach(({ order, instrument, executions: exec }) => {
        if (!groupedOrders[order.id]) {
          groupedOrders[order.id] = {
            ...order,
            instrument: instrument ? {
              symbol: instrument.symbol,
              name: instrument.name,
              type: instrument.type
            } : null,
            executions: []
          };
        }
        if (exec) {
          groupedOrders[order.id].executions.push(exec);
        }
      });
      
      return Object.values(groupedOrders);
    } catch (error) {
      console.error('❌ Error fetching order history:', error);
      throw error;
    }
  }
  
  async getAccountSummary(accountId) {
    try {
      const [account] = await db
        .select()
        .from(investmentAccounts)
        .where(eq(investmentAccounts.id, accountId))
        .limit(1);
      
      if (!account) {
        throw new Error('Account not found');
      }
      
      const positionsData = await this.getAccountPositions(accountId);
      
      const cashBalance = new Decimal(account.cashBalance);
      let totalMarketValue = new Decimal(0);
      let totalCostBasis = new Decimal(0);
      let totalUnrealizedPnl = new Decimal(0);
      let totalRealizedPnl = new Decimal(0);
      
      positionsData.forEach(pos => {
        if (pos.marketValue) {
          totalMarketValue = totalMarketValue.plus(pos.marketValue);
        }
        if (pos.costBasis) {
          totalCostBasis = totalCostBasis.plus(pos.costBasis);
        }
        if (pos.unrealizedPnl) {
          totalUnrealizedPnl = totalUnrealizedPnl.plus(pos.unrealizedPnl);
        }
        if (pos.realizedPnl) {
          totalRealizedPnl = totalRealizedPnl.plus(pos.realizedPnl);
        }
      });
      
      const totalAccountValue = cashBalance.plus(totalMarketValue);
      const totalPnl = totalRealizedPnl.plus(totalUnrealizedPnl);
      const totalPnlPercent = totalCostBasis.isZero() 
        ? '0' 
        : totalPnl.dividedBy(totalCostBasis).times(100).toFixed(2);
      
      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        cashBalance: cashBalance.toString(),
        totalMarketValue: totalMarketValue.toString(),
        totalAccountValue: totalAccountValue.toString(),
        totalCostBasis: totalCostBasis.toString(),
        totalUnrealizedPnl: totalUnrealizedPnl.toString(),
        totalRealizedPnl: totalRealizedPnl.toString(),
        totalPnl: totalPnl.toString(),
        totalPnlPercent,
        positionsCount: positionsData.length,
        status: account.status,
        baseCurrency: account.baseCurrency
      };
    } catch (error) {
      console.error('❌ Error generating account summary:', error);
      throw error;
    }
  }
}

module.exports = new InvestmentService();
