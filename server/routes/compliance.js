const express = require('express');
const router = express.Router();
const complianceService = require('../services/complianceService');

router.post('/accreditation/submit', async (req, res) => {
  try {
    const { investorId, walletAddress, verificationType, verificationMethod, verificationData, documents } = req.body;

    if (!investorId || isNaN(parseInt(investorId)) || parseInt(investorId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    if (!verificationType || !['income', 'net_worth', 'professional', 'entity'].includes(verificationType)) {
      return res.status(400).json({ success: false, error: 'Valid verificationType is required' });
    }

    const result = await complianceService.verifyAccreditation(
      parseInt(investorId),
      verificationType,
      verificationData || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Error submitting accreditation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/accreditation/:verificationId/review', async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { reviewerId, approved, rejectionReason } = req.body;

    if (!reviewerId || isNaN(parseInt(reviewerId)) || parseInt(reviewerId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid reviewerId is required' });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Approved must be boolean' });
    }

    const result = await complianceService.reviewAccreditationVerification(
      verificationId,
      parseInt(reviewerId),
      approved,
      rejectionReason
    );

    res.json(result);
  } catch (error) {
    console.error('Error reviewing accreditation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/accreditation/list', async (req, res) => {
  try {
    const { investorId, status, limit } = req.query;

    if (investorId && (isNaN(parseInt(investorId)) || parseInt(investorId) <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    const result = await complianceService.getAccreditationVerifications({
      investorId: investorId ? parseInt(investorId) : undefined,
      status,
      limit: limit ? parseInt(limit) : 50
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching accreditations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/aml/check', async (req, res) => {
  try {
    const { investorId, walletAddress, checkType } = req.body;

    if (!investorId || isNaN(parseInt(investorId)) || parseInt(investorId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    const validCheckTypes = ['identity_verification', 'sanctions_screening', 'pep_screening', 'adverse_media', 'source_of_funds', 'ongoing_monitoring'];
    if (!checkType || !validCheckTypes.includes(checkType)) {
      return res.status(400).json({ success: false, error: 'Valid checkType is required' });
    }

    const result = await complianceService.runAMLCheck(
      parseInt(investorId),
      walletAddress,
      checkType
    );

    res.json(result);
  } catch (error) {
    console.error('Error running AML check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/aml/:checkId/review', async (req, res) => {
  try {
    const { checkId } = req.params;
    const { reviewerId, status, riskLevel, findings, actionTaken } = req.body;

    if (!reviewerId || isNaN(parseInt(reviewerId)) || parseInt(reviewerId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid reviewerId is required' });
    }

    const validStatuses = ['pending', 'clear', 'flagged', 'rejected', 'needs_review'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required' });
    }

    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    if (!riskLevel || !validRiskLevels.includes(riskLevel)) {
      return res.status(400).json({ success: false, error: 'Valid riskLevel is required' });
    }

    const result = await complianceService.reviewAMLCheck(
      checkId,
      parseInt(reviewerId),
      status,
      riskLevel,
      findings || {},
      actionTaken
    );

    res.json(result);
  } catch (error) {
    console.error('Error reviewing AML check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/aml/list', async (req, res) => {
  try {
    const { investorId, status, limit } = req.query;

    if (investorId && (isNaN(parseInt(investorId)) || parseInt(investorId) <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    const result = await complianceService.getAMLChecks({
      investorId: investorId ? parseInt(investorId) : undefined,
      status,
      limit: limit ? parseInt(limit) : 50
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching AML checks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const { investorId, severity, status, limit } = req.query;

    if (investorId && (isNaN(parseInt(investorId)) || parseInt(investorId) <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    const result = await complianceService.getComplianceAlerts({
      investorId: investorId ? parseInt(investorId) : undefined,
      severity,
      status,
      limit: limit ? parseInt(limit) : 50
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy, resolutionNotes } = req.body;

    if (!resolvedBy || isNaN(parseInt(resolvedBy)) || parseInt(resolvedBy) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid resolvedBy is required' });
    }

    if (!resolutionNotes || resolutionNotes.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Resolution notes are required' });
    }

    const result = await complianceService.resolveAlert(
      alertId,
      parseInt(resolvedBy),
      resolutionNotes
    );

    res.json(result);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;
    const { walletAddress } = req.query;

    if (!investorId || isNaN(parseInt(investorId)) || parseInt(investorId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    const result = await complianceService.getInvestorComplianceStatus(
      parseInt(investorId),
      walletAddress
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching compliance status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/filings/create', async (req, res) => {
  try {
    const { filingType, propertyId, jurisdiction, filingData, filedBy, dueDate } = req.body;

    const validFilingTypes = ['form_d', 'form_c', 'blue_sky', 'annual_report', 'amendment'];
    if (!filingType || !validFilingTypes.includes(filingType)) {
      return res.status(400).json({ success: false, error: 'Valid filingType is required' });
    }

    if (propertyId && (isNaN(parseInt(propertyId)) || parseInt(propertyId) <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid propertyId is required' });
    }

    if (!jurisdiction || jurisdiction.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Jurisdiction is required' });
    }

    const result = await complianceService.createFormDFiling(
      propertyId ? parseInt(propertyId) : null,
      filingData || {}
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating filing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/filings/:filingId/update', async (req, res) => {
  try {
    const { filingId } = req.params;
    const { status, filingNumber, confirmationNumber, filingUrl, rejectionReason, reviewedBy } = req.body;

    const validStatuses = ['draft', 'pending_review', 'filed', 'accepted', 'rejected', 'amended'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required' });
    }

    const result = await complianceService.updateFilingStatus(
      filingId,
      status,
      {
        filingNumber,
        confirmationNumber,
        filingUrl,
        rejectionReason,
        reviewedBy: reviewedBy ? parseInt(reviewedBy) : undefined
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Error updating filing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/filings/list', async (req, res) => {
  try {
    const { propertyId, status, limit } = req.query;

    if (propertyId && (isNaN(parseInt(propertyId)) || parseInt(propertyId) <= 0)) {
      return res.status(400).json({ success: false, error: 'Valid propertyId is required' });
    }

    const result = await complianceService.getRegulatoryFilings({
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      status,
      limit: limit ? parseInt(limit) : 50
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching filings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const result = await complianceService.getComplianceMetrics();
    res.json({ success: true, metrics: result });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/investment/check', async (req, res) => {
  try {
    const { investorId, propertyId, investmentAmount } = req.body;

    if (!investorId || isNaN(parseInt(investorId)) || parseInt(investorId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid investorId is required' });
    }

    if (!propertyId || isNaN(parseInt(propertyId)) || parseInt(propertyId) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid propertyId is required' });
    }

    if (!investmentAmount || isNaN(parseFloat(investmentAmount)) || parseFloat(investmentAmount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid investmentAmount is required' });
    }

    const result = await complianceService.checkInvestmentCompliance(
      parseInt(investorId),
      parseInt(propertyId),
      parseFloat(investmentAmount)
    );

    res.json({ success: true, compliance: result });
  } catch (error) {
    console.error('Error checking investment compliance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
