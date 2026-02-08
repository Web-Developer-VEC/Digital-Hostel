const express = require('express');
const { ensureAuthenticatedWarden } = require('../../middleware/authMiddelware');
const { passMeasureWarden, analysisWarden } = require('../../controllers/general_warden_controllers/analysis_controller');

const router = express.Router();

router.get('/pass_measures_warden', ensureAuthenticatedWarden, passMeasureWarden);
router.post('/pass_analysis_warden', ensureAuthenticatedWarden, analysisWarden);

module.exports = router;