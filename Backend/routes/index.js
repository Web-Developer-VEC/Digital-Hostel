const express = require('express');

const router = express.Router();


// Importing route files For Hostel Page
const loginRoute = require('./auth_routes');
const studentRequestRoute = require('./student_routes/request_routes');
const studentPreRequestRoute = require('./student_routes/preRequest_routes');
const studentProfileRoute = require('./student_routes/studentProfile_routes');
const studentVacateRoute = require('./student_routes/vacate_routes');
const securityRoute = require('./security_routes/security_routes');
const wardenDetailsRoute = require('./student_routes/sidebar_routes');
const wardenRequestRoute = require('./warden_routes/request_routes');
const wardenStudentRoute = require('./warden_routes/studentData_routes');
const superiorRequestRoute = require('./superior_routes/request_routes');
const superiorStudentRoute = require('./superior_routes/superiorStudent_routes');
const superiorWardensProfileRoute = require('./superior_routes/wardensprofile_routes');
const generalwardenrequestRoute = require('./general_warden_routes/request_routes');
const generalwardenattendanceRoute = require('./general_warden_routes/attendance_routes');
const generalwardenanalysisRoute = require('./general_warden_routes/analysis_routes')


// Routes For Hostel Page
router.use('', loginRoute);
router.use('', studentRequestRoute);
router.use('', studentPreRequestRoute);
router.use('', studentProfileRoute);
router.use('', studentVacateRoute);
router.use('', securityRoute);
router.use('', wardenDetailsRoute);
router.use('', wardenRequestRoute);
router.use('', wardenStudentRoute);
router.use('', superiorRequestRoute);
router.use('', superiorStudentRoute);
router.use('', superiorWardensProfileRoute);
router.use('',generalwardenanalysisRoute);
router.use('',generalwardenattendanceRoute);
router.use('',generalwardenrequestRoute)


module.exports = router;