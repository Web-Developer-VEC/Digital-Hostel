const express = require('express');
const { ensureAuthenticatedStudent } = require('../../middleware/authMiddelware');
const { getStudentPass } = require('../../controllers/student_controllers/preRequest_controller');

const router = express.Router();

router.get('/get_student_pass', ensureAuthenticatedStudent, getStudentPass);

module.exports = router;