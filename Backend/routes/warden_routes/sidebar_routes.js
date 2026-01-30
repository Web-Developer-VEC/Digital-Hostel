const express = require('express');
const { ensureAuthenticated } = require('../../middleware/authMiddelware');
const { getWardenDetail } = require('../../controllers/warden_controllers/sidebar_controller');

const router = express.Router();

router.get('/sidebar_warden', ensureAuthenticated, getWardenDetail);

module.exports = router;