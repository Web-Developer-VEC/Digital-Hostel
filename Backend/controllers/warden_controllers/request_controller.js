const { getDb } = require('../../config/db');

async function getFoodRequestChange (req, res) {
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
        const requestsCollection = db.collection('food_change_requests');

        const warden = await wardenCollection.findOne({ unique_id , active:true });

        if (!warden) {
            return res.status(404).json({ error: "Warden not found" });
        }

        const primary_years = warden.primary_year;
        const warder_handling_gender = warden.gender;
        const requests = await requestsCollection.find({ year: { $in: primary_years } , gender: warder_handling_gender}).toArray();

        return res.status(200).json({ requests });
    } catch (error) {
        console.error('❌ Error fetching requests:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function foodChangeApprove (req, res) { 

    try {

        const { registration_number, name, action } = req.body;
        const db = getDb();
        const studentsCollection = db.collection('student_database');
        const requestsCollection = db.collection('food_change_requests');
        const cronCollection = db.collection('cronCollection');
        const request = await requestsCollection.findOne({ registration_number, name });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        let updateMessage = 'Food type change request declined';
        const currentTime = new Date();
        const istTime = new Date(currentTime.getTime() + (5.5 * 60 * 60 * 1000));
        const updateTimeIST = new Date(istTime.getTime() + (24 * 60 * 60 * 1000));

        if (action === "approve") {
            await cronCollection.insertOne({
                registration_number,
                name,
                foodtype: request.requested_foodtype,
                updation_time: updateTimeIST,
            });

            updateMessage = `Food type change approved. It will be effective on ${updateTimeIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`;
        }
        await requestsCollection.deleteOne({ registration_number, name });
        const student = await studentsCollection.findOne({ registration_number });
        const changesArray = student?.changes || [];

        const hasOtherChanges = changesArray.some(change =>
            ["name:", "room_number:", "phone_number_student:", "phone_number_parent:"].some(key => change.includes(key))
        );
        let editStatus = hasOtherChanges ? null : action === "approve" ? true : false;

        await studentsCollection.updateOne(
            { registration_number },
            {
                $set: { edit_status: editStatus },
                $pull: { changes: { $regex: `^food_type: ` } }
            }
        );

        return res.status(200).json({
            message: updateMessage,
            newFoodType: action === "approve" ? request.requested_foodtype : undefined,
            effectiveDate: action === "approve" ? updateTimeIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : undefined
        });

    } catch (error) {
        console.error('❌ Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getFoodRequestChange,
    foodChangeApprove
}
