/**
 * Stripe Connect Integration Adapter
 * Handles investor account creation, onboarding, and automated payouts
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeConnectAdapter {
  /**
   * Create a Stripe Connect Express account for an investor
   */
  async createConnectAccount(email, firstName, lastName, country = 'US') {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          first_name: firstName,
          last_name: lastName,
          email,
        },
        business_profile: {
          product_description: 'Real estate investment income distribution',
        },
      });

      return {
        success: true,
        stripeAccountId: account.id,
        account,
      };
    } catch (error) {
      console.error('Stripe Connect account creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(stripeAccountId, refreshUrl, returnUrl) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return {
        success: true,
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      };
    } catch (error) {
      console.error('Stripe account link creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get account status and capabilities
   */
  async getAccountStatus(stripeAccountId) {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);

      return {
        success: true,
        account: {
          id: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requirements: account.requirements,
          capabilities: account.capabilities,
        },
      };
    } catch (error) {
      console.error('Stripe account retrieval error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a payout/transfer to connected account
   */
  async createPayout(stripeAccountId, amount, currency = 'usd', metadata = {}) {
    try {
      // Amount must be in cents
      const amountInCents = Math.round(amount * 100);

      // Minimum payout is $1
      if (amountInCents < 100) {
        return {
          success: false,
          error: 'Minimum payout amount is $1.00',
        };
      }

      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency,
        destination: stripeAccountId,
        description: `Investment income distribution - ${new Date().toISOString().split('T')[0]}`,
        metadata,
      });

      return {
        success: true,
        transferId: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency,
        destination: transfer.destination,
        created: transfer.created,
      };
    } catch (error) {
      console.error('Stripe transfer error:', error);
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }

  /**
   * Create batch transfers for multiple investors
   */
  async createBatchPayouts(payouts) {
    const results = [];

    for (const payout of payouts) {
      const result = await this.createPayout(
        payout.stripeAccountId,
        payout.amount,
        payout.currency || 'usd',
        payout.metadata || {}
      );

      results.push({
        ...result,
        investorId: payout.investorId,
        payoutId: payout.payoutId,
      });

      // Rate limiting: wait 100ms between transfers
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId) {
    try {
      const transfer = await stripe.transfers.retrieve(transferId);

      return {
        success: true,
        transfer: {
          id: transfer.id,
          amount: transfer.amount / 100,
          currency: transfer.currency,
          destination: transfer.destination,
          created: transfer.created,
          reversed: transfer.reversed,
        },
      };
    } catch (error) {
      console.error('Stripe transfer retrieval error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if account can receive payouts
   */
  async canReceivePayouts(stripeAccountId) {
    const status = await this.getAccountStatus(stripeAccountId);

    if (!status.success) {
      return false;
    }

    return (
      status.account.payoutsEnabled &&
      status.account.detailsSubmitted &&
      status.account.capabilities.transfers === 'active'
    );
  }

  /**
   * Get Connect account balance
   */
  async getAccountBalance(stripeAccountId) {
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });

      return {
        success: true,
        available: balance.available.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
        })),
      };
    } catch (error) {
      console.error('Stripe balance retrieval error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new StripeConnectAdapter();
