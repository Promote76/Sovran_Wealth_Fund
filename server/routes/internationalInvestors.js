const express = require('express');
const router = express.Router();
const kycService = require('../services/kycService');
const walletScreeningService = require('../services/walletScreeningService');
const escrowService = require('../services/escrowService');

// International Investor Onboarding API (GENIUS Act Edition)
// Handles KYC/AML, accreditation, wallet screening, and escrow setup
// for international crypto investors

router.post('/international/onboarding', async (req, res) => {
  try {
    const {
      existingInvestorId,
      kyc,
      accreditation,
      wallet,
      funding,
      disclosures,
      geniusActVersion,
      module
    } = req.body;

    // Validation
    if (!kyc || !kyc.fullName || !kyc.email || !kyc.nationality || !kyc.country) {
      return res.status(400).json({
        success: false,
        error: 'KYC information is incomplete'
      });
    }

    if (!kyc.ofacAttestation) {
      return res.status(400).json({
        success: false,
        error: 'OFAC attestation is required'
      });
    }

    if (!wallet || !wallet.address || !wallet.chain) {
      return res.status(400).json({
        success: false,
        error: 'Wallet information is incomplete'
      });
    }

    // Validate wallet address format (EVM)
    const walletRegex = /^0x[a-fA-F0-9]{40}$/i;
    if (!walletRegex.test(wallet.address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    if (!funding || !funding.amount || funding.amount < 500 || funding.amount > 5000000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid funding amount (must be between $500 and $5,000,000)'
      });
    }

    // Validate stablecoin selection
    const validStablecoins = ['usdc', 'usdt', 'busd'];
    if (!funding.preferredStablecoin || !validStablecoins.includes(funding.preferredStablecoin.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid stablecoin. Must be one of: ${validStablecoins.join(', ').toUpperCase()}`
      });
    }

    // Validate escrow provider selection
    const validEscrowProviders = ['circle', 'anchorage', 'fireblocks'];
    if (!funding.escrow || !validEscrowProviders.includes(funding.escrow.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid escrow provider. Must be one of: ${validEscrowProviders.join(', ')}`
      });
    }

    // Normalize to lowercase for consistency
    funding.preferredStablecoin = funding.preferredStablecoin.toLowerCase();
    funding.escrow = funding.escrow.toLowerCase();

    if (!disclosures || !disclosures.fatcaCrsSelfCert || !disclosures.understandsRisk || !disclosures.agreesToTerms) {
      return res.status(400).json({
        success: false,
        error: 'All disclosures must be accepted'
      });
    }

    // Generate unique onboarding ID
    const onboardingId = `INT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create onboarding record (in a real implementation, this would be saved to database)
    const onboardingRecord = {
      onboardingId,
      existingInvestorId,
      kyc: {
        fullName: kyc.fullName,
        email: kyc.email,
        nationality: kyc.nationality,
        country: kyc.country,
        pep: kyc.pep || false,
        ofacAttestation: kyc.ofacAttestation
      },
      accreditation: {
        isAccredited: accreditation.isAccredited || 'unknown',
        basis: accreditation.basis || 'na'
      },
      wallet: {
        chain: wallet.chain,
        address: wallet.address,
        screeningStatus: 'pending' // Would be 'approved' after Chainalysis check
      },
      funding: {
        preferredStablecoin: funding.preferredStablecoin,
        escrow: funding.escrow,
        amount: funding.amount,
        tranchePlan: funding.tranchePlan
      },
      disclosures: {
        fatcaCrsSelfCert: disclosures.fatcaCrsSelfCert,
        understandsRisk: disclosures.understandsRisk,
        agreesToTerms: disclosures.agreesToTerms
      },
      compliance: {
        kycStatus: 'pending', // Would trigger Persona KYC
        walletScreeningStatus: 'pending', // Would trigger Chainalysis screening
        accreditationStatus: 'pending', // Would trigger Middesk verification if needed
        taxDocStatus: 'pending' // W-9/W-8 collection
      },
      geniusActVersion,
      module,
      status: 'pending_compliance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Step 1: Create KYC inquiry
    const kycInquiry = await kycService.createInquiry({
      onboardingId,
      fullName: kyc.fullName,
      email: kyc.email,
      nationality: kyc.nationality,
      country: kyc.country,
      referenceId: onboardingId
    });

    // Step 2: Screen wallet for sanctions/risk
    const walletScreening = await walletScreeningService.screenWallet({
      address: wallet.address,
      chain: wallet.chain,
      onboardingId
    });

    // Check if wallet failed screening
    if (!walletScreening.approved || walletScreening.sanctioned) {
      return res.status(403).json({
        success: false,
        error: 'Wallet failed compliance screening',
        details: {
          sanctioned: walletScreening.sanctioned,
          riskScore: walletScreening.riskScore,
          message: 'This wallet cannot be used for funding. Please contact compliance@axiomplatform.io'
        }
      });
    }

    // Step 3: Generate escrow deposit instructions
    let depositInstructions;
    try {
      depositInstructions = await escrowService.generateDepositInstructions({
        onboardingId,
        amount: funding.amount,
        stablecoin: funding.preferredStablecoin,
        chain: wallet.chain,
        provider: funding.escrow
      });
    } catch (escrowError) {
      // If escrow setup fails but KYC/wallet screening succeeded, still record the attempt
      console.error('❌ Escrow setup failed:', escrowError);
      
      // For institutional providers that need setup, provide helpful error
      if (escrowError.message.includes('institutional') || escrowError.message.includes('workspace')) {
        return res.status(503).json({
          success: false,
          error: 'Selected escrow provider requires additional setup',
          details: {
            message: escrowError.message,
            alternatives: 'Please select Circle as your escrow provider, which is currently available.',
            onboardingId,
            kycInquiryId: kycInquiry.inquiryId,
            walletApproved: walletScreening.approved
          }
        });
      }
      
      throw escrowError;
    }

    // Update onboarding record with service IDs
    onboardingRecord.compliance.kycInquiryId = kycInquiry.inquiryId;
    onboardingRecord.compliance.kycSessionUrl = kycInquiry.sessionUrl;
    onboardingRecord.compliance.walletScreeningId = walletScreening.screeningId;
    onboardingRecord.compliance.depositAddress = depositInstructions.depositAddress;
    onboardingRecord.compliance.depositInstructions = depositInstructions.instructions;

    // TODO: Save onboardingRecord to database
    // TODO: Send confirmation email with KYC session URL and deposit instructions
    // TODO: Register wallet for ongoing monitoring
    
    console.log('✅ International investor onboarding processed:', {
      onboardingId,
      email: kyc.email,
      country: kyc.country,
      amount: funding.amount,
      chain: wallet.chain,
      kycStatus: kycInquiry.status,
      walletApproved: walletScreening.approved
    });

    // Return success response with onboarding ID and next steps
    res.json({
      success: true,
      data: {
        onboardingId,
        status: 'active',
        message: 'Onboarding application received. Please complete KYC verification and fund your account.',
        kyc: {
          inquiryId: kycInquiry.inquiryId,
          sessionUrl: kycInquiry.sessionUrl,
          status: kycInquiry.status,
          message: 'Click the session URL to complete identity verification'
        },
        wallet: {
          screeningId: walletScreening.screeningId,
          approved: walletScreening.approved,
          riskScore: walletScreening.riskScore,
          message: 'Wallet approved for funding'
        },
        deposit: {
          address: depositInstructions.depositAddress,
          instructions: depositInstructions.instructions,
          expiresAt: depositInstructions.expiresAt,
          message: 'Deposit instructions are ready. Fund your account to activate investment opportunities.'
        },
        nextSteps: [
          {
            step: 'kyc_verification',
            status: 'ready',
            actionUrl: kycInquiry.sessionUrl,
            description: 'Complete identity verification (5-10 minutes)'
          },
          {
            step: 'fund_account',
            status: 'ready',
            depositAddress: depositInstructions.depositAddress,
            description: `Send ${funding.amount} ${funding.preferredStablecoin.toUpperCase()} to activate your account`
          },
          {
            step: 'investor_dashboard',
            status: 'pending',
            description: 'Access granted after KYC completion and initial deposit'
          }
        ],
        estimatedCompletionTime: '15-30 minutes',
        supportEmail: 'compliance@axiomplatform.io'
      }
    });

  } catch (error) {
    console.error('❌ International investor onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during onboarding'
    });
  }
});

// Get onboarding status by ID
router.get('/international/onboarding/:onboardingId', async (req, res) => {
  try {
    const { onboardingId } = req.params;

    // TODO: In production, fetch from database
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        onboardingId,
        status: 'pending_compliance',
        compliance: {
          kycStatus: 'pending',
          walletScreeningStatus: 'pending',
          accreditationStatus: 'pending',
          taxDocStatus: 'pending'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Onboarding status fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook endpoint for compliance service updates
router.post('/international/compliance-webhook', async (req, res) => {
  try {
    const {
      onboardingId,
      service, // 'persona', 'chainalysis', 'middesk', etc.
      status,
      data
    } = req.body;

    // TODO: Verify webhook signature for security
    // TODO: Update onboarding record in database
    // TODO: Send notification to investor if status changed

    console.log('📬 Compliance webhook received:', {
      onboardingId,
      service,
      status
    });

    res.json({
      success: true,
      message: 'Webhook received'
    });

  } catch (error) {
    console.error('❌ Compliance webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
