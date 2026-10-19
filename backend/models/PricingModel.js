import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class PricingModel {
    async getPricing(id) {
        const { db } = await connectDB();

        const result = await db.collection("pricing").findOne({ _id: id });

        return result;
    }

    async createPricing(pricingData) {
        const { db } = await connectDB();
        const result = await db.collection("pricing").insertOne(pricingData)

        if(!result.acknowledged) throw new ValidationError("Pricing insertion failed");

        return result;
    }

    async viewAllPricing(filter, page, limit) {
    const { db } = await connectDB();

    const prices = await db.collection("pricing").aggregate([
        { $match: filter },

        // 🔹 Join Plan collection
        {
            $lookup: {
                from: "plans", // make sure this matches your actual collection name
                localField: "plan_id",
                foreignField: "_id",
                as: "plan"
            }
        },

        // Convert array -> object
        {
            $unwind: {
                path: "$plan",
                preserveNullAndEmptyArrays: true
            }
        },

        // 🔹 Optional: remove internal plan fields you don't need
        {
            $project: {
                "plan._id": 1,
                "plan.label": 1,
                "plan.name": 1,
                plan_id: 1,
                name: 1,
                label: 1,
                type: 1,
                duration_days: 1,
                price: 1,
                membership_fee: 1,
                status: 1,
                createdAt: 1
            }
        },

        {
            $addFields: {
                statusPriority: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$status", "active"] }, then: 1 },
                            { case: { $eq: ["$status", "inactive"] }, then: 2 },
                            { case: { $eq: ["$status", "archived"] }, then: 3 }
                        ],
                        default: 4
                    }
                }
            }
        },

        { $sort: { statusPriority: 1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }

    ]).toArray();
    const total = await db.collection("pricing").countDocuments(filter);

    return {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        data: prices
    };
}

    async viewOnePricing(id) {
        const { db } = await connectDB();

        const result = await db.collection("pricing").findOne({ _id: id });

        if(!result) {
            throw new ValidationError("Error showing a price");
        }

        return result;
    }

    async viewPricingByPlan(id) {
        const { db } = await connectDB();

        const result = await db.collection("pricing").aggregate([
            {
                $match: {
                    plan_id: id,
                    status: { $in: ["active", "inactive", "archived"] },
                }
            },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2},
                                { case: { $eq: ["$status", "archived"] }, then: 3}
                            ],
                            default: 4
                        }
                    }
                }
            }, 
            { $sort: { statusPriority: 1, createdAt: -1} },
            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: "$plan" },
            {
                $group: {
                    _id: "$plan._id",
                    plan_id: { $first: "$plan._id" },
                    name: { $first: "$plan.name" },
                    label: { $first: "$plan.label" },
                    pricing: { 
                        $push: {
                            _id: "$_id",
                            category: "$category",
                            label: "$label",
                            duration: "$duration",
                            price: "$price",
                            membership_fee: "$membership_fee",
                            status: "$status",
                            type: '$type'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    plan_id: 1,
                    name: 1,
                    label: 1,
                    pricing: 1,
                    type: 1,
                }
            }
            
        ]).toArray();
        
        return result[0] || null;
    }

    async updatePricing(priceData) {
        const { db } = await connectDB();

        const { _id, ...fieldsToUpdate } = priceData;

        const result = await db.collection("pricing").updateOne(
            { _id },
            { $set: fieldsToUpdate }
        );

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to update a pricing");
        }

        return priceData

    }

    async updatePricingStatus(data) {
        const { db } = await connectDB();

        const { _id, ...fieldsToUpdate } = data;

        const result = await db.collection("pricing").updateOne(
            { _id },
            { $set: fieldsToUpdate }
        )

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to update the price status");
        }

        return data;
    }
}

export default new PricingModel();