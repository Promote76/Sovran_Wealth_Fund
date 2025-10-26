const express = require('express');
const { dealService } = require('../iela/services/dealService');
const featureFlags = require('../config/featureFlags');

const router = express.Router();

router.use((req, res, next) => {
  if (!featureFlags.IELA_ENABLED) {
    return res.status(404).json({
      success: false,
      error: 'IELA Pipeline is not enabled. Set AXIOM_FEATURE_IELA=true to activate.'
    });
  }
  next();
});

router.post('/ingest', async (req, res) => {
  try {
    const request = req.body;

    if (!request.rawText) {
      return res.status(400).json({
        success: false,
        error: 'rawText is required'
      });
    }

    const userId = req.user?.id;

    const deal = await dealService.ingestDeal(request, userId);

    console.log(`✅ IELA: Deal ingested ${deal.id}`);

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('❌ IELA ingest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:dealId/enrich', async (req, res) => {
  try {
    const { dealId } = req.params;
    const options = req.body;

    const deal = await dealService.enrichDeal(dealId, options);

    console.log(`✅ IELA: Deal enriched ${dealId}`);

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('❌ IELA enrich error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:dealId/analyze', async (req, res) => {
  try {
    const { dealId } = req.params;
    const options = req.body;

    const deal = await dealService.analyzeDeal(dealId, options.customRepairEstimates);

    console.log(`✅ IELA: Deal analyzed ${dealId}`);

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('❌ IELA analyze error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:dealId/publish', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { target } = req.body;

    if (!target || !['investor', 'rto'].includes(target)) {
      return res.status(400).json({
        success: false,
        error: 'target must be "investor" or "rto"'
      });
    }

    const result = await dealService.publishDeal(dealId, target);

    console.log(`✅ IELA: Deal published ${dealId} as ${target}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ IELA publish error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;

    const deal = await dealService.getDeal(dealId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('❌ IELA get deal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    const deals = await dealService.listDeals({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      data: deals,
      count: deals.length
    });
  } catch (error) {
    console.error('❌ IELA list deals error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
