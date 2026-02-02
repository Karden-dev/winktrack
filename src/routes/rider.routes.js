const express = require('express');
const router = express.Router();
const riderController = require('../controllers/rider.controller');

router.get('/me', riderController.getDashboardInfo);     // GET /api/rider/me?phone=699...
router.post('/status', riderController.toggleStatus);    // POST /api/rider/status
router.post('/message', riderController.updateMessage);  // POST /api/rider/message

module.exports = router;