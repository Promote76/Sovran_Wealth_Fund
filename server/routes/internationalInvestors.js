const express = require('express');
const router = express.Router();

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

    // TODO: In production, implement these steps:
    // 1. Save onboardingRecord to database
    // 2. Trigger Persona KYC session creation
    // 3. Trigger Chainalysis wallet screening
    // 4. If accredited investor, trigger Middesk verification
    // 5. Generate escrow deposit instructions
    // 6. Send confirmation email with next steps
    // 7. Create investor dashboard entry

    // For now, log the onboarding attempt
    console.log('✅ International investor onboarding received:', {
      onboardingId,
      email: kyc.email,
      country: kyc.country,
      amount: funding.amount,
      chain: wallet.chain
    });

    // Return success response with onboarding ID and next steps
    res.json({
      success: true,
      data: {
        onboardingId,
        status: 'pending_compliance',
        message: 'Onboarding application received. Compliance checks will begin shortly.',
        nextSteps: [
          {
            step: 'kyc_verification',
            status: 'pending',
            description: 'Identity verification via Persona will be initiated via email within 30 minutes'
          },
          {
            step: 'wallet_screening',
            status: 'pending',
            description: 'OFAC and wallet risk screening in progress'
          },
          {
            step: 'escrow_setup',
            status: 'pending',
            description: 'Upon approval, you will receive escrow deposit instructions'
          },
          {
            step: 'investor_dashboard',
            status: 'pending',
            description: 'Access to your investor dashboard will be granted after compliance clearance'
          }
        ],
        estimatedCompletionTime: '24-48 hours',
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
