const { getDb } = require('../../config/db');
const { generateQR } = require('../../services/generateQR.service')

async function profileChangeRequestSuperior (req, res) {
    try {

        const { user } = req.session;

        if (!user || !user.registration_number) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const unique_id = user.registration_number;
        if (!unique_id) {
            return res.status(400).json({ error: "warden_unique_id is required" });
        }

        const db = getDb();
        const wardenCollection = db.collection('warden_database');
        const requestsCollection = db.collection('profile_change_requests');

        const warden = await wardenCollection.findOne({ unique_id , active:true });

        if (!warden) {
            return res.status(404).json({ error: "Warden not found" });
        }

        const primary_year = warden.profile_years;
        const requests = await requestsCollection.find({ year: { $in: primary_year } }).toArray();

        return res.status(200).json({ requests });
    } catch (error) {
        console.error('❌ Error fetching requests:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function profileUpdate (req, res) {
    try {
        const { user } = req.session;

        if (!user || !user.registration_number) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const unique_id = user.registration_number;
        const { registration_number, action } = req.body;
        const db = getDb();
        const wardenCollection = db.collection('warden_database');
        const studentCollection = db.collection('student_database');
        const tempRequestCollection = db.collection('profile_change_requests');
        const warden = await wardenCollection.findOne({ unique_id });
        if (!warden) {
            return res.status(404).json({ error: "Warden not found" });
        }
        const updateRequest = await tempRequestCollection.findOne({ registration_number });
        if (!updateRequest) {
            return res.status(404).json({ error: "Request not found" });
        }

        const student = await studentCollection.findOne({ registration_number });
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        const changesArray = student?.changes || [];
        const hasFoodTypeChange = changesArray.some(change => /^food_type: /.test(change));
        if (action === "approve") {
            await studentCollection.updateOne(
                { registration_number: updateRequest.registration_number },
                {
                    $set: {
                        name: updateRequest.name,
                        phone_number_student: updateRequest.phone_number_student,
                        phone_number_parent: updateRequest.phone_number_parent,
                        edit_status: true
                    },
                    $pull: {
                        changes: {
                            $in: [
                                `name: ${updateRequest.name}`,
                                `phone_number_student: ${updateRequest.phone_number_student}`,
                                `phone_number_parent: ${updateRequest.phone_number_parent}`
                            ]
                        }
                    }
                }
            );
            await tempRequestCollection.updateOne(
                { registration_number },
                { $set: { edit_status: true } }
            );
            if (hasFoodTypeChange) {
                await studentCollection.updateOne(
                    { registration_number },
                    { $set: { edit_status: null } }
                );
            }
            res.json({
                message: "Request approved and profile updated",
                approved_by: warden.name
            });
        } else if (action === "reject") {
            await tempRequestCollection.updateOne(
                { registration_number },
                { $set: { edit_status: false } }
            );
            await studentCollection.updateOne(
                { registration_number: updateRequest.registration_number },
                {
                    $set: { edit_status: false },
                    $pull: {
                        changes: {
                            $in: [
                                `name: ${updateRequest.name}`,
                                `phone_number_student: ${updateRequest.phone_number_student}`,
                                `phone_number_parent: ${updateRequest.phone_number_parent}`
                            ]
                        }
                    }
                }
            );
            if (hasFoodTypeChange) {
                await studentCollection.updateOne(
                    { registration_number },
                    { $set: { edit_status: null } }
                );
            }
            res.json({
                message: "Request rejected",
                rejected_by: warden.name
            });
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }
        await tempRequestCollection.deleteOne({ registration_number });

    } catch (err) {
        console.error("❌ Error:", err);
        return res.status(500).json({ error: "Internal Server error" });
    }
}

async function getVacateFormRequest (req, res) {
    try {
        const db = getDb();
        const vacateCollection = db.collection("vacate_forms");

        const vacateForms = await vacateCollection.find().toArray();

        res.json({ vacate_forms: vacateForms });
    } catch (err) {
        console.error("Error fetching vacate forms:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function confirmVacate (req, res) {
    try {
        const db = getDb();
        const studentCollection = db.collection("student_database");
        const vacateCollection = db.collection("vacate_forms");
        const archiveCollection = db.collection("student_archive");

        const { student_id, action } = req.body;
        if (!student_id || !action) {
            return res.status(400).json({ error: "Missing student_id or action" });
        }

        if (action === 'approve') {
            const studentData = await studentCollection.findOne({ registration_number: student_id });
            if (!studentData) {
                return res.status(404).json({ error: "Student not found in database" });
            }

            await archiveCollection.insertOne(studentData);
            await studentCollection.deleteOne({ registration_number: student_id });
            await vacateCollection.deleteOne({ registration_number: student_id });

            return res.json({ message: "Student archived and removed from student database & vacate forms" });
        } 
        
        if (action === 'decline') {
            await vacateCollection.deleteOne({ registration_number: student_id });
            return res.json({ message: "Student vacate request declined, removed from vacate forms" });
        }

        res.status(400).json({ error: "Invalid action" });
    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = {
    profileChangeRequestSuperior,
    profileUpdate,
    getVacateFormRequest,
    confirmVacate
}