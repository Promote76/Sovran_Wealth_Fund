const express = require('express');
const router = express.Router();
const realEstateInvestorService = require('../services/realEstateInvestorService');

// Get all properties
router.get('/properties', async (req, res) => {
  try {
    const properties = await realEstateInvestorService.getAllProperties();
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('❌ Properties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get investor portfolio
router.get('/portfolio/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const portfolio = await realEstateInvestorService.getInvestorPortfolio(walletAddress);
    
    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('❌ Portfolio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build invest transaction
router.post('/tx/invest', async (req, res) => {
  try {
    const { walletAddress, propertyId, amount } = req.body;
    
    if (!walletAddress || !propertyId || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address, property ID, and amount required' 
      });
    }

    const txData = await realEstateInvestorService.buildInvestTx(
      walletAddress,
      propertyId,
      amount
    );
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build invest tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build claim rental transaction
router.post('/tx/claim-rental', async (req, res) => {
  try {
    const { walletAddress, propertyId } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address required' 
      });
    }

    const txData = await realEstateInvestorService.buildClaimRentalTx(
      walletAddress,
      propertyId || 'all'
    );
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build claim rental tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await realEstateInvestorService.getPlatformStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available shares for a property (from smart contract)
router.get('/properties/:propertyId/available-shares', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const shareInfo = await realEstateInvestorService.getAvailableShares(propertyId);
    
    res.json({
      success: true,
      data: shareInfo
    });
  } catch (error) {
    console.error('❌ Get available shares error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==== PROPERTY SUBMISSION ROUTES ====

// Submit a new property
router.post('/submissions', async (req, res) => {
  try {
    const submissionData = req.body;
    
    if (!submissionData.submitterWalletAddress || !submissionData.propertyName || 
        !submissionData.purchasePrice || !submissionData.monthlyRent ||
        !submissionData.totalShares || !submissionData.pricePerShare) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required fields missing: submitterWalletAddress, propertyName, purchasePrice, monthlyRent, totalShares, pricePerShare' 
      });
    }
    
    // Auto-calculate total investment target for validation
    const calculatedTarget = submissionData.totalShares * submissionData.pricePerShare;
    if (calculatedTarget > submissionData.purchasePrice * 1.5) {
      return res.status(400).json({
        success: false,
        error: 'Total shares * price per share cannot exceed 150% of purchase price'
      });
    }

    const submission = await realEstateInvestorService.createPropertySubmission(submissionData);
    
    res.json({
      success: true,
      data: submission,
      message: 'Property submission created successfully'
    });
  } catch (error) {
    console.error('❌ Create submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all property submissions (admin only for now)
router.get('/submissions', async (req, res) => {
  try {
    const { status, submitterWallet } = req.query;
    const submissions = await realEstateInvestorService.getPropertySubmissions(status, submitterWallet);
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('❌ Get submissions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific property submission
router.get('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await realEstateInvestorService.getPropertySubmissionById(id);
    
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        error: 'Submission not found' 
      });
    }
    
    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('❌ Get submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve property submission and prepare for on-chain listing
router.patch('/submissions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, approvalNotes, metadataURI } = req.body;
    
    if (!reviewedBy) {
      return res.status(400).json({ 
        success: false, 
        error: 'reviewedBy (admin user ID) is required' 
      });
    }

    if (!metadataURI) {
      return res.status(400).json({
        success: false,
        error: 'metadataURI is required for approval - property metadata must be uploaded to IPFS/storage before approval'
      });
    }

    const submission = await realEstateInvestorService.approvePropertySubmission(
      id, 
      reviewedBy, 
      approvalNotes, 
      metadataURI
    );
    
    res.json({
      success: true,
      data: submission,
      message: 'Property submission approved'
    });
  } catch (error) {
    console.error('❌ Approve submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject property submission
router.patch('/submissions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, rejectionReason } = req.body;
    
    if (!reviewedBy || !rejectionReason) {
      return res.status(400).json({ 
        success: false, 
        error: 'reviewedBy and rejectionReason are required' 
      });
    }

    const submission = await realEstateInvestorService.rejectPropertySubmission(
      id, 
      reviewedBy, 
      rejectionReason
    );
    
    res.json({
      success: true,
      data: submission,
      message: 'Property submission rejected'
    });
  } catch (error) {
    console.error('❌ Reject submission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build listProperty transaction for approved submission (admin only)
router.post('/submissions/:id/list-tx', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminWallet } = req.body;
    
    if (!adminWallet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Admin wallet address required' 
      });
    }

    const txData = await realEstateInvestorService.buildListPropertyTx(id, adminWallet);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for admin to sign'
    });
  } catch (error) {
    console.error('❌ Build list property tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark submission as listed on-chain (after successful transaction)
router.patch('/submissions/:id/mark-listed', async (req, res) => {
  try {
    const { id } = req.params;
    const { onChainPropertyId, txHash } = req.body;
    
    if (!onChainPropertyId || !txHash) {
      return res.status(400).json({ 
        success: false, 
        error: 'onChainPropertyId and txHash are required' 
      });
    }

    const submission = await realEstateInvestorService.markSubmissionAsListed(
      id, 
      onChainPropertyId, 
      txHash
    );
    
    res.json({
      success: true,
      data: submission,
      message: 'Property marked as listed on-chain'
    });
  } catch (error) {
    console.error('❌ Mark as listed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
