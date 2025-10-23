const express = require('express');
const router = express.Router();
const dynamicAPRService = require('../services/dynamicAPRService');

router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await dynamicAPRService.getAPRDashboard();
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('❌ APR dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const { depositAmount } = req.body;
    
    if (!depositAmount || depositAmount < 0) {
      return res.status(400).json({ success: false, error: 'Valid deposit amount required' });
    }

    const result = await dynamicAPRService.simulateAPR(depositAmount);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Simulate APR error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await dynamicAPRService.getAPRHistory();
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ APR history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/deposit-impact', async (req, res) => {
  try {
    const impact = await dynamicAPRService.getDepositImpact();
    
    res.json({
      success: true,
      data: impact
    });
  } catch (error) {
    console.error('❌ Deposit impact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
