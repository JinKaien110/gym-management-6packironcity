import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js";
import { ValidationError } from "../errors/ValidationError.js";
import { schedule } from "node-cron";

class BookingModel {
    async joinBooking(data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to join booking")
        }

        return result;
    }

    async viewMyBookings(id, page, limit) {
        const { db } = await connectDB();


        const pipeline = [
            { $match: { client_id: id } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "class_schedule",
                    localField: "schedule_id",
                    foreignField: "_id",
                    as: "schedule"
                }
            },
            {
                $lookup: {
                    from: "classes",
                    localField: "schedule.class_id",
                    foreignField: "_id",
                    as: "class"
                }
            },
            {
                $lookup: {
                    from: "trainers",
                    localField: "trainer_id",
                    foreignField: "_id",
                    as: "trainer"
                }
            },
            {
                $unwind: {  
                    path: "$schedule",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$trainer",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$class",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $project: {
                    _id: 1,
                    client_id: 1,
                    schedule: {
                        schedule_id: "$schedule._id",
                        start_at: "$schedule.start_at",
                        end_at: "$schedule.end_at",
                        location: "$schedule.location",
                        notes: "$schedule.notes",
                        status: "$schedule.status",
                        trainer_first_name: "$schedule.trainer.first_name",
                        trainer_last_name: "$schedule.trainer.last_name",
                    },
                    class: {
                        class_id: "$class._id",
                        name: "$class.name",
                    },
                    trainer: {
                        trainer_id: "$trainer._id",
                        first_name: "$trainer.first_name",
                        last_name: "$trainer.last_name",
                        email: "$trainer.email",
                        phone: "$trainer.phone",
                    },
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    booking: {
                        booking_id: "$_id",
                        status: "$status",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                        type: "$type",
                        notes: "$notes",
                     }
                 }
             }
         ];

        const result = await db.collection("bookings").aggregate(pipeline).toArray();

        const total = await db.collection("bookings")
        .countDocuments({ client_id: id })

        return {
            data: result,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async checkIfAlreadyJoined(schedule_id, client_id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOne({
            schedule_id: schedule_id,
            client_id: client_id,
            status: "joined"
        });

        return result;
    }

    async checkIfTrainerAlreadyBooked(trainer_id, client_id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOne({
            trainer_id: trainer_id,
            client_id: client_id,
            status: "booked"
        });

        return result;
    }

    async bookTrainer(data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").insertOne(data);

        if(!result || !result.acknowledged) {
            throw new ValidationError("Failed to book trainer")
         }

        return result;
    }

    async viewBookingDetails(id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOne({
            _id: id
        });

        return result;
    }

    async countJoined(schedule_id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").countDocuments({
            schedule_id: schedule_id,
            status: "joined"
        });

        return result;
    }

    async viewAllBooking(filter, page, limit) {
        const { db } = await connectDB();

        const skip = (page - 1) * limit

        const [result, total] = await Promise.all([
            db.collection("bookings")
            .aggregate([
                { $match: filter },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]).toArray(),

            db.collection("bookings")
            .countDocuments(filter)
        ])

        if(!result.length === 0) {
            return {
                result: [],
                page,
                limit,
                totalPages: 0
            }
        }

        return {
            result,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async cancelBooking(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to cancel bookings")
        }

        return result
    }

    async findBookingByPaymentId(id) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOne({
            payment_id: id
         });

         return result;
    }

    async completeBooking(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to complete booking")
        }

        return result;
    }

    async fetchWhoBookedMe(id, page, limit) {
        const { db } = await connectDB();

        const skip = (page - 1) * limit;

        const pipeline = [
            { $match: { trainer_id: id } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "class_schedule",
                    localField: "schedule_id",
                    foreignField: "_id",
                    as: "schedule"
                }
            },
            {
                $lookup: {
                    from: "classes",
                    localField: "schedule.class_id",
                    foreignField: "_id",
                    as: "class"
                }
            },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            {
                $unwind: {  
                    path: "$schedule",
                    preserveNullAndEmptyArrays: true
                }   
            },
            {
                $unwind: {  
                    path: "$class",
                    preserveNullAndEmptyArrays: true
                }   
            },
            {
                $unwind: {  
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }   
            },
                { $project: {
                    _id: 1,
                    client: {
                        client_id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email",
                        phone: "$client.phone"
                    },
                    schedule: {
                        schedule_id: "$schedule._id",
                        start_at: "$schedule.start_at",
                        end_at: "$schedule.end_at",
                        location: "$schedule.location",
                        notes: "$schedule.notes",
                        status: "$schedule.status",
                        class: {
                            class_id: "$class._id",
                            name: "$class.name"
                        }
                    },
                    date: "$createdAt",
                    type: 1,
                    status: 1,
                    notes: 1,
                    createdAt: 1,
                    updatedAt: 1,
                } },
            { $skip: skip },
            { $limit: limit }
        ];

        const [result, total] = await Promise.all([
            db.collection("bookings")
            .aggregate(pipeline)
            .toArray(),

            db.collection("bookings")
            .countDocuments({ trainer_id: id })
        ]);

        return {
            result,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    }

    async fetchTrainerEarnings(id, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit;

        const [aggregate] = await db.collection("bookings").aggregate([
            {
                $match: {
                    trainer_id: id,
                    type: "trainer-booking",
                    payment_id: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "payments",
                    localField: "payment_id",
                    foreignField: "_id",
                    as: "payment"
                }
            },
            { $unwind: "$payment" },
            { $match: { "payment.payment_for": "trainer-booking" } },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: "$payment._id",
                    date: { $ifNull: ["$payment.date", "$payment.createdAt"] },
                    amount: "$payment.amount",
                    status: "$payment.status",
                    client_name: {
                        $trim: {
                            input: {
                                $concat: [
                                    { $ifNull: ["$client.first_name", ""] },
                                    " ",
                                    { $ifNull: ["$client.last_name", ""] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $facet: {
                    result: [
                        { $sort: { date: -1 } },
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    summary: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                totalEarnings: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$status", "PAID"] },
                                            { $ifNull: ["$amount", 0] },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]).toArray();

        const summary = aggregate?.summary?.[0] || { total: 0, totalEarnings: 0 };
        return {
            result: aggregate?.result || [],
            total: summary.total,
            totalEarnings: summary.totalEarnings,
            page,
            limit,
            totalPages: Math.ceil(summary.total / limit)
        };
    }

    async updateBookingStatus(id, data) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocument: "after" }
        );

        if(!result) {
            throw new ValidationError("Failed to update booking status")
        }

        return result;
    }
}

export default new BookingModel();