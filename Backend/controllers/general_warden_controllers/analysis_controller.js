const { getDb } = require('../../config/db');
const moment = require("moment");
require("moment-timezone");

async function passMeasureWarden (req, res) {
    try {
        const db = getDb();
        const collection = db.collection("pass_details");

        const { user } = req.session;

        if (!user || !user.registration_number) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const warden_id = user.registration_number ;
        const warden_type = user.type;
        const wardenCollection = db.collection("warden_database");
        const warden_data = await wardenCollection.findOne({ unique_id: warden_id });

        if (!warden_data) {
            return res.status(400).json({ error: "Invalid warden data." });
        }

        const genders =
            warden_type === "superior"
                ? ["Male", "Female"]
                : [warden_data.gender];
         const primary_years =
            warden_type === "superior"
                ? warden_data.profile_years
                : warden_data.primary_year;

        if (!Array.isArray(primary_years) || primary_years.length === 0) {
            return res.status(400).json({ error: "Primary years must be an array with at least one value." });
        }

        const currentDate = moment().utc().startOf("day").toDate();
        const nextDate = moment().utc().endOf("day").toDate();
        const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

        const passTypes = ["od", "outpass", "staypass", "leave"];
        let finalResult = {};

         for (const gender of genders) {
            let genderResult = {};
            let overall = {
                exitTimeCount: 0,
                reEntryTimeCount: 0,
                activeOutsideCount: 0,
                overdueReturnCount: 0,
                activeOutsideDetails: { names: [], passtypes: [] },
                overdueReturnDetails: { names: [], late_by: [] },
                passTypeCounts: {}
            };

            passTypes.forEach(t => {
                overall.passTypeCounts[t] = { count: 0, names: [] };
            });

          for (const year of primary_years) {
                const baseFilter = {
                    year,
                    gender,
                    qrcode_status: true,
                    exit_time: { $ne: null }
                };

                // EXIT
                const exitData = await collection.find({
                    ...baseFilter,
                    $or: [
                        { from: { $lte: currentDate }, to: { $gte: currentDate } },
                        { from: { $gte: currentDate, $lt: nextDate } },
                        { to: { $gte: currentDate, $lt: nextDate } }
                    ]
                }).project({ name: 1 }).toArray();

                // RE-ENTRY
                const reEntryData = await collection.find({
                    ...baseFilter,
                    re_entry_time: { $gte: currentDate, $lt: nextDate }
                }).project({ name: 1 }).toArray();

                // ACTIVE OUTSIDE
                const activeOutside = await collection.find({
                    ...baseFilter,
                    exit_time: { $exists: true },
                    to: { $gt: istTime },
                    re_entry_time: { $in: [null, ""] }
                }).project({ name: 1, passtype: 1 }).toArray();

                // OVERDUE
                const overdue = await collection.find({
                    ...baseFilter,
                    exit_time: { $exists: true },
                    to: { $lt: istTime },
                    re_entry_time: { $in: [null, ""] }
                }).project({ name: 1, to: 1 }).toArray();

                const overdueProcessed = overdue.map(d => {
                    const diff = istTime - new Date(d.to);
                    return {
                        name: d.name,
                        late_by: `${Math.floor(diff / 3600000)} hours ${Math.floor((diff % 3600000) / 60000)} minutes`
                    };
                });

                let passTypeCounts = {};
                for (const type of passTypes) {
                    const p = await collection.find({
                        ...baseFilter,
                        passtype: type
                    }).project({ name: 1 }).toArray();

                    passTypeCounts[type] = { count: p.length, names: p.map(x => x.name) };
                    overall.passTypeCounts[type].count += p.length;
                    overall.passTypeCounts[type].names.push(...p.map(x => x.name));
                }

                genderResult[year] = {
                    exitTimeCount: exitData.length,
                    reEntryTimeCount: reEntryData.length,
                    activeOutsideCount: activeOutside.length,
                    overdueReturnCount: overdue.length,
                    activeOutsideDetails: {
                        names: activeOutside.map(x => x.name),
                        passtypes: activeOutside.map(x => x.passtype)
                    },
                    overdueReturnDetails: {
                        names: overdueProcessed.map(x => x.name),
                        late_by: overdueProcessed.map(x => x.late_by)
                    },
                    passTypeCounts,
                    currentDate,
                    nextDate,
                    istTime
                };

                // OVERALL AGGREGATION
                overall.exitTimeCount += exitData.length;
                overall.reEntryTimeCount += reEntryData.length;
                overall.activeOutsideCount += activeOutside.length;
                overall.overdueReturnCount += overdue.length;
                overall.activeOutsideDetails.names.push(...activeOutside.map(x => x.name));
                overall.activeOutsideDetails.passtypes.push(...activeOutside.map(x => x.passtype));
                overall.overdueReturnDetails.names.push(...overdueProcessed.map(x => x.name));
                overall.overdueReturnDetails.late_by.push(...overdueProcessed.map(x => x.late_by));
            }

            genderResult["overall"] = overall;

            if (warden_type === "superior") {
                finalResult[gender.toLowerCase()] = genderResult;
            } else {
                finalResult = genderResult;
            }
        }

        return res.status(200).json({
            primary_years,
            data: finalResult
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function analysisWarden (req, res) {
    try {
        const db = getDb();
        const collection = db.collection("pass_details");

        const { type, year, date } = req.body;
        if (!type) {
            return res.status(400).json({ error: "Missing 'type' parameter in query" });
        }
        
        const { user } = req.session;

        if (!user || !user.registration_number) {
            return res.status(401).json({ message: "Session expired. Please login again." });
        }

        const  warden_id = user.registration_number;
        const warden_type = user.type;
        const wardenCollection = db.collection("warden_database");
        const warden_data = await wardenCollection.findOne({ unique_id: warden_id });

        if (!warden_data ) {
            return res.status(400).json({ error: "Invalid warden data." });
        }

        const warden_handling_gender = warden_type ==="superior"?["Male","Female"] :[warden_data.gender];
        const primary_years = warden_type === "superior" ? warden_data.profile_years:warden_data.primary_year;
        if (!Array.isArray(primary_years) || primary_years.length === 0) {
            return res.status(400).json({ error: "Primary years must be an array with at least one value." });
        }

           const baseDate = date
            ? new Date(`${date}T00:00:00.000Z`)
            : new Date();

        const formattedDate = baseDate.toISOString().split("T")[0];

        const startOfDay = new Date(`${formattedDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${formattedDate}T23:59:59.999Z`);

        const istTime = new Date(baseDate.getTime() + (5.5 * 60 * 60 * 1000));

        let yearFilter;
        if (["1", "2", "3", "4"].includes(year)) {
            yearFilter = { year: parseInt(year) };
        } else if (year === "overall") {
            yearFilter = { year: { $in: primary_years } };
        } else {
            return res.status(400).json({ error: "Invalid year value." });
        }

        const commonFilters = {
            passtype: type,
            gender: { $in: warden_handling_gender },
            qrcode_status:true,
            ...yearFilter
        };

           const activeDocs = await collection.find({
            ...commonFilters,
            $or: [
                { from: { $lte: baseDate }, to: { $gte: baseDate } },
                { from: { $gte: startOfDay, $lt: endOfDay } },
                { to: { $gte: startOfDay, $lt: endOfDay } }
            ]
        }).project({ name: 1, _id: 0 }).toArray();

        /* ---------- TO FIELD TODAY ---------- */

        const toFieldDocs = await collection.find({
            ...commonFilters,
            to: { $gte: startOfDay, $lt: endOfDay }
        }).project({ name: 1, _id: 0 }).toArray();

        /* ---------- OVERDUE PASSES ---------- */

        const overdueDocs = await collection.find({
            ...commonFilters,
            exit_time: { $exists: true },
            to: { $lt: istTime },
            re_entry_time: { $in: [null, ""] }
        }).project({ name: 1, _id: 0 }).toArray();


        const reasonCategories = {
            outpass: ["shopping", "classes", "internship", "medical"],
            staypass: ["holiday", "weekend holiday", "semester holiday", "festival holiday"],
            od: ["internship", "symposium", "sports", "hackathon"],
            leave: ["function", "medical", "exams", "emergency"]
        };
        
        const validReasons = reasonCategories[type.toLowerCase()] || [];
        const reasonAggregation = await collection.aggregate([
            {
                $match: {
                    ...commonFilters,
                    reason_for_visit: { $exists: true, $ne: null },
                    $or: [
                        { from: { $lte: baseDate }, to: { $gte: baseDate } },
                        { from: { $gte: startOfDay, $lt: endOfDay } },
                        { to: { $gte: startOfDay, $lt: endOfDay } }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $in: ["$reason_type", validReasons] },
                            then: "$reason_type",
                            else: "Others"
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        const reasonTypeCounts = reasonAggregation.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});       

        return res.status(200).json({
            activePasses: {
                 count: activeDocs.length,
                names: activeDocs.map(d => d.name)
            },
            toFieldMatch: {
                 count: toFieldDocs.length,
                names: toFieldDocs.map(d => d.name)
            },
            overduePasses: {
                 count: overdueDocs.length,
                names: overdueDocs.map(d => d.name)
            },
            reasonTypeCounts,
            date: formattedDate
        });

    } catch (error) {
        console.error("Error fetching pass analysis:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


module.exports = {
    passMeasureWarden,
    analysisWarden
}