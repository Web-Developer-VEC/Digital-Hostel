const { getDb } = require('../../config/db');
const { generateQR } = require('../../services/generateQR.service');

async function fetchPassWarden (req, res) {
    try {
        const db = getDb();
        const wardenCollection = db.collection("warden_database");
        const passCollection = db.collection("pass_details");

        const { user } = req.session;

        if (!user || !user.registration_number) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const user_id = user.registration_number;
        const usertype = user.type;
        const { date, warden_id } = req.body;
        const warden_data = await wardenCollection.findOne({ unique_id: user_id });
        if (!warden_data) {
            return res.status(404).json({ error: "Warden not found" });
        }

        let query = {};

        if(date){   

            const targetDate = date ? new Date(date) : new Date();
    
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
            query.request_completed = true;
            query.request_time = { $gte: startOfDay, $lte: endOfDay };

            if (usertype === "superior") {
                if (warden_id && warden_id !== "overall") {
                    query.authorised_warden_id = warden_id;
                } else {
                    query.year = { $in: warden_data.profile_years };
                }
            } else {
                query.gender = warden_data.gender;
                query.year = { $in: warden_data.primary_year };
            }
            const oldPasses = await passCollection.find(query).toArray();
            return res.status(200).json({ message: "Old passes fetched successfully", data: oldPasses });
        }

        const target_years = usertype === "superior" ? wardern.profile_years: warden_data.primary_year;
        const target_genders = usertype === "superior"?["Male", "female"]: warden.gender;

         query = {
            request_completed: false,
            expiry_status: false,
            gender : {$in: target_genders},
            qrcode_status: false,
            wardern_approval: null,
            superior_wardern_approval: null,
            notify_superior: usertype === "superior",
            parent_approval: { $ne: false },
            year: { $in: target_years } 
        };

        const pendingPasses = await passCollection.find(query).toArray();

        if (pendingPasses.length === 0) {
            return res.status(404).json({ message: "No pending passes found" });
        }
        
        return res.status(200).json({
            message: "Pending passes fetched successfully",
            data: pendingPasses
        });

    } catch (error) {
        console.error("❌ Error fetching old passes:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function WardenDecision (req, res) {
    try {
         const { user } = req.session;

        if (!user || !user.registration_number) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const warden_unique_id = user.registration_number;
         const isSuperior = user?.type === "superior";
        const { pass_id, action, medical_status, comment } = req.body;
        if (!pass_id || !["approve", "reject"].includes(action) ) {
            return res.status(400).json({ error: "pass_id and valid action (approve/reject) are required" });
        }
        const db = getDb();
        const passCollection = db.collection('pass_details');
        const wardenCollection = db.collection('warden_database');

        const warden_data = await wardenCollection.findOne({ unique_id: warden_unique_id });

        if (!warden_data) {
            return res.status(404).json({ error: "Warden not found" });
        }

        const passData = await passCollection.findOne({ pass_id: pass_id });

        if (!passData) {
            return res.status(404).json({ error: "Pass not found" });
        }

        const handling_year = usertype === "superior"? warden.profile_years : warden.primary_year;

        if (!handling_year.includes(passData.year)) {
            return res.status(400).json({ error: "Warden is accessing a pass outside assigned year" });
        }

         const approvalField = isSuperior
            ? "superior_wardern_approval"
            : "wardern_approval";

         if (passData[approvalField] !== null) {
            return res.status(400).json({
                message: `You have already ${
                    passData[approvalField] ? "approved" : "rejected"
                } this request.`
            });
        }


        const updateData = {
            [approvalField]: action === "approve",
            authorised_warden_id: warden_unique_id
        };

        if (comment && typeof comment === "string") {
            updateData.comment = comment;
        }

        if (action === "approve") {
            const qrPath = await generateQR(
                pass_id,
                passData.registration_number
            );

            updateData.qrcode_path = qrPath;
            updateData.qrcode_status = true;

            if (medical_status === true) {
                updateData.reason_type = "medical";
            }

            await passCollection.updateOne(
                { pass_id },
                { $set: updateData }
            );

            return res.status(200).json({
                message: "Pass approved successfully",
                qrcode_path: qrPath
            });
        }

         if (action === "reject" ) {
            updateData.qrcode_path = null;
            updateData.qrcode_status = false;
        }

        await passCollection.updateOne(
            { pass_id },
            { $set: updateData }
        );

        return res.status(200).json({
            message: "Pass rejected successfully"
        });

    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    fetchPassWarden,
    WardenDecision
}