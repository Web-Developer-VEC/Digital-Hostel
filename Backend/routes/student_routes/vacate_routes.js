const express = require('express');
const { ensureAuthenticatedStudent } = require('../../middleware/authMiddelware');
const { submitVacateForm } = require('../../controllers/student_controllers/vacate_controllers/vacate_controller');

const router = express.Router();

router.post('/submit_vacate_form', ensureAuthenticatedStudent, submitVacateForm);

module.exports = router;