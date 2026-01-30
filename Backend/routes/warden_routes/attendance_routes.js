const express = require('express');
const { ensureAuthenticatedWarden } = require('../../middleware/authMiddelware');
const { getFoodCount } = require('../../controllers/warden_controllers/attendance_controller');

const router = express.Router();

router.get('/food_count_warden', ensureAuthenticatedWarden, getFoodCount);

module.exports = router;