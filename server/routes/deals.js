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

router.put('/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    const deal = await dealService.updateDeal(dealId, updates);

    console.log(`✅ IELA: Deal ${dealId} updated`);

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('❌ IELA update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:dealId/upload-images', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: 'images array is required'
      });
    }

    const deal = await dealService.addDealImages(dealId, images);

    console.log(`✅ IELA: ${images.length} images added to deal ${dealId}`);

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('❌ IELA upload images error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;

    await dealService.deleteDeal(dealId);

    console.log(`🗑️ IELA: Deal ${dealId} deleted`);

    res.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('❌ IELA delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
