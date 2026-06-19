const express = require('express');
const { ensureAuthenticatedWarden } = require('../../middleware/authMiddelware');
const { foodChangeApprove, getFoodRequestChange } = require('../../controllers/warden_controllers/request_controller');
const router = express.Router();

router.get('/food_requests_changes', ensureAuthenticatedWarden, getFoodRequestChange);
router.post('/approve_food_change', ensureAuthenticatedWarden, foodChangeApprove);

module.exports = router;