import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";

class AIRecommendationModel {
    async findById(id) {
        const { db } = await connectDB();

        const result = await db.collection("business_recommendations").findOne(id)

        return result;
    }

    async requestRecommendation(data) {
        const { db } = await connectDB();

        const result = await db.collection("business_recommendations").insertOne(data)

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to insert workout recommendations");
        }

        return {
            data: {
                _id: result.insertedId,
                ...data
            }
        };
    }

    async decisionRecommendationByTrainer(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("business_recommendations").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        )

        if(!result) {
            throw new ValidationError("Failed to update decision");
        }

        return result;
    }

    async findLatestByParentId(id) {
        const { db } = await connectDB();

        return await db.collection("business_recommendations").findOne(
            { parent_id: id },
            { sort: { version: -1, createdAt: -1 } }
        )
    }

    async getRecommendationDetails(req, res, next) {
        
    }

    async getclientWorkoutNotes(req, res, next) {
        
    }

    async listTrainerPendingRecommendations(id, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit

        const data = await db.collection("business_recommendations").find({ 
            trainer_id: id,
            status: "pending"
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

        const total = await db.collection("work_recommendations").countDocuments({
            trainer_id: id,
            status: "pending"
        })

        return {
            data,
            total,
            page: Math.ceil(skip / limit) + 1,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async listAllRecommendations(filter, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit

        const data = await db.collection("business_recommendations")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

        const total = await db.collection("business_recommendations").countDocuments(filter)

        if(!data.length === 0 || !data) {
            return {
                data: [],
                page,
                limit,
                total,
                totalPages: 0,
            }
        }

        return {
            data,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getRecommendationChain(id) {
        const { db } = await connectDB()

        const versions = await db.collection("business_recommendations")
        .find({
            $or: [
                { _id: id },
                { parent_id: id }
            ]
        })
        .sort({ version: -1 })
        .toArray();

        if (!versions || versions.length === 0) {
            throw new ValidationError("No recommendation versions found");
        }


        const latest = versions[0]

        return {
            chain_id: id,
            latest,
            versions
        }
    }
    async getDateRange(range) {
    const end = new Date();
    const start = new Date();

    switch (range) {
        case "1_month":
            start.setMonth(start.getMonth() - 1);
            break;

        case "2_months":
            start.setMonth(start.getMonth() - 2);
            break;

        case "3_months":
            start.setMonth(start.getMonth() - 3);
            break;

        case "6_months":
            start.setMonth(start.getMonth() - 6);
            break;

        case "1_year":
            start.setFullYear(start.getFullYear() - 1);
            break;

        default:
            start.setMonth(start.getMonth() - 1);
    }

    return { start, end };
}

    async fetchAllData({ range = "1_month", startDate, endDate }) {
        const { db } = await connectDB();

    // =========================
    // DATE HANDLING (HYBRID SUPPORT)
    // =========================
const today = new Date();

const startOfYear = new Date(today.getFullYear(), 0, 1); // Jan 1
const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

// Assume these come from the request
let start = startDate ? new Date(startDate) : null;
let end = endDate ? new Date(endDate) : null;

// Default behavior

if (!start && !end) {
    // No filters -> entire current year
    start = startOfYear;
    end = endOfYear;
}
else if (start && !end) {
    // Start date specified, end defaults to today
    end = today;

    // Or if you prefer until end of the year instead:
    // end = endOfYear;
}
else if (!start && end) {
    // End date specified, start becomes Jan 1
    start = startOfYear;
}

const matchDate = {
    createdAt: {
        $gte: start,
        $lte: end
    }
};

    // =========================
    // 💰 REVENUE ANALYSIS
    // =========================
    const revenueAgg = await db.collection("payments").aggregate([
        { $match: { ...matchDate, status: "PAID" } },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
                transactions: { $sum: 1 }
            }
        }
    ]).toArray();

    const revenueByType = await db.collection("payments").aggregate([
        { $match: { ...matchDate, status: "PAID" } },
        {
            $group: {
                _id: "$payment_for",
                total: { $sum: "$amount" }
            }
        }
    ]).toArray();

    // =========================
    // 👥 CLIENT ANALYTICS
    // =========================
    const totalActiveClients = await db.collection("clients").countDocuments({
        status: "active"
    });

    const newClients = await db.collection("clients").countDocuments({
        createdAt: matchDate.createdAt
    });

    const churnedClients = await db.collection("clients").countDocuments({
        status: "inactive"
    });

    const retentionRate =
        totalActiveClients > 0
            ? (totalActiveClients - churnedClients) / totalActiveClients
            : 0;

    // =========================
    // 💳 PAYMENT ANALYTICS
    // =========================
    const paymentStats = await db.collection("payments").aggregate([
        { $match: matchDate },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]).toArray();

    const totalTransactions = await db.collection("payments").countDocuments(matchDate);

    const paid = paymentStats.find(p => p._id === "PAID")?.count || 0;
    const pending = paymentStats.find(p => p._id === "PENDING")?.count || 0;
    const failed = paymentStats.find(p => p._id === "FAILED")?.count || 0;

    const conversionRate =
        totalTransactions > 0 ? paid / totalTransactions : 0;

    // =========================
    // 🏋️ MEMBERSHIP INSIGHTS
    // =========================
    const membershipAgg = await db.collection("payments").aggregate([
        { $match: { ...matchDate, status: "PAID" } },
        {
            $group: {
                _id: "$payment_for",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]).toArray();

    const mostPopular = membershipAgg[0]?._id || null;
    const leastPopular = membershipAgg[membershipAgg.length - 1]?._id || null;

    // =========================
    // 📊 OPERATIONS (PEAK HOURS)
    // =========================
    const hourlyAgg = await db.collection("payments").aggregate([
        { $match: matchDate },
        {
            $group: {
                _id: { $hour: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]).toArray();

    const peak_hours = hourlyAgg.slice(0, 3).map(h => `${h._id}:00`);
    const low_hours = hourlyAgg.slice(-3).map(h => `${h._id}:00`);

    // =========================
    // 🧠 ALERT SYSTEM
    // =========================
    const alerts = [];

    if (pending > paid) {
        alerts.push("High number of pending payments detected");
    }

    if (conversionRate < 0.7) {
        alerts.push("Low payment conversion rate detected");
    }

    if (peak_hours.length > 0) {
        alerts.push("High traffic congestion during peak hours");
    }

    // =========================
    // 📦 FINAL OUTPUT (AI READY)
    // =========================
    return {
        period: {
            start,
            end,
            range
        },

        revenue: {
            total: revenueAgg[0]?.total || 0,
            transactions: revenueAgg[0]?.transactions || 0,
            breakdown: Object.fromEntries(
                revenueByType.map(r => [r._id, r.total])
            )
        },

        clients: {
            total_active: totalActiveClients,
            new_clients: newClients,
            churned_clients: churnedClients,
            retention_rate: retentionRate
        },

        payments: {
            total_transactions: totalTransactions,
            paid,
            pending,
            failed,
            conversion_rate: conversionRate
        },

        memberships: {
            most_popular: mostPopular,
            least_popular: leastPopular
        },

        operations: {
            peak_hours,
            low_hours
        },

        alerts
    }
}
}

export default new AIRecommendationModel();