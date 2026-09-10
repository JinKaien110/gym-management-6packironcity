import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";


class AdminDashboardModel {

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * ADMIN DASHBOARD
     */
    async dashboard() {
        const { db } = await connectDB();

        const totalclients = await db.collection("clients").countDocuments();
        const activemembership = await db.collection("memberships").countDocuments({ status: "active" });
        const revenue = await db.collection("payments").aggregate([
            { $match: { status: "PAID" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalRevenue: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]).toArray();

        const [
            membershipPending,
            discountPending
        ] = await Promise.all([
            db.collection("memberships_request").countDocuments({ status: "pending" }),
            db.collection("discount_requests").countDocuments({ status: "pending" })
        ]);

        const totalPending = membershipPending + discountPending;

        return {
            totalclients,
            activemembership,
            revenue,
            totalPending
        };
    }

    async recentActivities() {
        const { db } = await connectDB();

        const [items, total] = await Promise.all([
            db.collection("audit_logs")
            .find()
            .sort({ createdAt: -1 })     
            .limit(50)
            .toArray(),

            db.collection("audit_logs").countDocuments()
        ]);

        return {
            total,
            items
        };
    }

    async getAuditLogsForPdf({ limit = 200, page = 1 } = {}) {
        const { db } = await connectDB();
        const safeLimit = Math.max(Number(limit) || 200, 1);
        const safePage = Math.max(Number(page) || 1, 1);
        const skip = (safePage - 1) * safeLimit;

        const docs = await db.collection("audit_logs")
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .toArray();

        return docs.map((audit) => {
            const actor = audit.actor && typeof audit.actor === "object" ? audit.actor : {};

            return {
                _id: audit._id,
                timestamp: audit.createdAt || audit.timestamp || audit.updatedAt,
                action: audit.action || audit.type || "Action",
                entity: audit.entity || audit.collection || "N/A",
                entityId: audit.entity_id ?? audit.entityId ?? audit.collection_id ?? "",
                actorName: audit.actor_name || audit.createdBy || audit.user_name || audit.userId || actor.name || "System",
                role: audit.role || actor.role || "Unknown",
                status: audit.status || "success",
                summary: audit.summary || audit.details || audit.description || "",
                method: audit.method || audit.meta?.method || "",
                endpoint: audit.endpoint || audit.meta?.endpoint || "",
                ipAddress: audit.ip_address || audit.ipAddress || audit.meta?.ipAddress || "",
                requestId: audit.request_id || audit.requestId || "",
                error: audit.error || audit.error_message || "",
                raw: audit
            };
        });
    }

    async getBookingsForPdf({ limit = 200, page = 1 } = {}) {
        const { db } = await connectDB();
        const safeLimit = Math.max(Number(limit) || 200, 1);
        const safePage = Math.max(Number(page) || 1, 1);
        const skip = (safePage - 1) * safeLimit;

        const docs = await db.collection("bookings")
            .aggregate([
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
                    $lookup: {
                        from: "trainers",
                        localField: "trainer_id",
                        foreignField: "_id",
                        as: "trainer"
                    }
                },
                { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: safeLimit }
            ])
            .toArray();

        return docs.map((booking) => {
            const clientName = [booking.client?.first_name, booking.client?.last_name].filter(Boolean).join(" ") || booking.client?.name || "—";
            const trainerName = [booking.trainer?.first_name, booking.trainer?.last_name].filter(Boolean).join(" ") || booking.trainer?.name || "—";

            return {
                _id: booking._id,
                schedule_id: booking.schedule_id || null,
                client_id: booking.client_id || null,
                clientName,
                trainer_id: booking.trainer_id || null,
                trainerName,
                status: booking.status || "pending",
                type: booking.type || "class",
                joinedAt: booking.joinedAt || null,
                cancelledAt: booking.cancelledAt || null,
                cancelledBy: booking.cancelledBy || null,
                cancelReason: booking.cancelReason || null,
                createdAt: booking.createdAt || null,
                createdBy: booking.createdBy || null,
                updatedAt: booking.updatedAt || null,
                updatedBy: booking.updatedBy || null,
                raw: booking
            };
        });
    }

    async getMembershipsForPdf({ limit = 200, page = 1 } = {}) {
        const { db } = await connectDB();
        const safeLimit = Math.max(Number(limit) || 200, 1);
        const safePage = Math.max(Number(page) || 1, 1);
        const skip = (safePage - 1) * safeLimit;

        const docs = await db.collection("memberships")
            .aggregate([
                {
                    $lookup: {
                        from: "clients",
                        localField: "client_id",
                        foreignField: "_id",
                        as: "client"
                    }
                },
                { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: safeLimit }
            ])
            .toArray();

        return docs.map((membership) => {
            const clientName = [membership.client?.first_name, membership.client?.last_name].filter(Boolean).join(" ") || membership.client?.name || "—";

            return {
                _id: membership._id,
                client_id: membership.client_id || null,
                clientName,
                payment_id: membership.payment_id || null,
                start_date: membership.start_date || null,
                end_date: membership.end_date || null,
                status: membership.status || "pending",
                is_frozen: membership.is_frozen ?? false,
                frozen_from: membership.frozen_from || null,
                frozen_til: membership.frozen_til || null,
                frozenBy: membership.frozenBy || null,
                unfrozenAt: membership.unfrozenAt || null,
                createdAt: membership.createdAt || null,
                createdBy: membership.createdBy || null,
                updatedAt: membership.updatedAt || null,
                updatedBy: membership.updatedBy || null,
                archivedAt: membership.archivedAt || null,
                archivedBy: membership.archivedBy || null,
                raw: membership
            };
        });
    }

    async todaysClasses() {
        const { db } = await connectDB();

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await db.collection("class_schedule")
            .aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfDay, $lte: endOfDay }
                    }
                },
                {
                    $lookup: {
                        from: "classes",
                        localField: "class_id",
                        foreignField: "_id",
                        as: "class"
                    }
                }, 
                { $unwind: "$class" },
                 {
                $lookup: {
                    from: "bookings",
                    let: { scheduleId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$schedule_id", "$$scheduleId"] },
                                status: { $ne: "cancelled" }
                            }
                        }
                    ],
                    as: "bookings"
                }
            },

            {
                $addFields: {
                    joined_count: { $size: "$bookings" },
                    available_slots: {
                        $subtract: ["$capacity", { $size: "$bookings" }]
                    }
                }
            },
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        name: "$class.name",
                        createdAt: 1,
                        capacity: 1,
                        class_id: "$class._id",
                        schedule_id: "$_id",
                        joined_count: 1,
                        available_slots: 1,
                        start_at: 1,
                        end_at: 1,
                        status: 1,
                        notes: 1,
                        location: 1,
                        archivedAt: 1

                    }
                }

            ])
            .toArray();

        return result || [];
    }

    async pendingApprovals() {
 const { db } = await connectDB();

 const result = await db.collection("discount_requests")
 .aggregate([

   {
     $match: {
       status: "pending"
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
     $unwind: "$client"
   },

   {
     $project: {
       _id:1,
       type: {
         $literal: "discount"
       },

       createdAt:1,
       status:1,

       first_name:"$client.first_name",
       last_name:"$client.last_name",
       email:"$client.email",
       phone:"$client.phone",

       selfie_url:1,
       id_url:1
     }
   },

   {
     $unionWith: {
       coll: "membership_requests",
       pipeline: [

         {
           $match:{
             status:"pending"
           }
         },

         {
           $lookup:{
             from:"clients",
             localField:"client_id",
             foreignField:"_id",
             as:"client"
           }
         },

         {
           $unwind:"$client"
         },

         {
           $project:{
             _id:1,

             type:"$request_type",
             createdAt:1,
             status:1,

             first_name:"$client.first_name",
             last_name:"$client.last_name",
             email:"$client.email",
             phone:"$client.phone",

             membership_id:1,
             freeze_start_date:1,
             freeze_end_date:1,
             medical_proof_url:1
           }
         }

       ]
     }
   },

   {
      $sort:{
         createdAt:-1
      }
   },

   {
      $limit:5
   }

 ])
 .toArray();

 
 return result;
}

    async revenueThisMonthCard() {
        const { db } = await connectDB();

        const now = new Date();

        const firstDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const lastDay = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,59,59,999
        );

        const result = await db.collection("payments").aggregate([
            {
                $match: {
                    status: "PAID",
                    createdAt: {
                        $gte: firstDay,
                        $lte: lastDay
                    }
                }
            },

            {
                $group: {
                    _id: "$payment_for",
                    totalRevenue: {
                        $sum: "$amount"
                    },
                    transactions: {
                        $sum: 1
                    }
                }
            }

        ]).toArray();


        const revenue = {
            clients_pass: 0,
            membership: 0,
            trainer_booking: 0,
            total: 0
        };


        result.forEach(r => {
            if (r._id === "clients_pass")
                revenue.clients_pass = r.totalRevenue;

            if (r._id === "membership")
                revenue.membership = r.totalRevenue;

            if (r._id === "trainer-booking")
                revenue.trainer_booking = r.totalRevenue;

            revenue.total += r.totalRevenue;
        });

        return revenue;
    }

    async analyticsOverview() {
        const { db } = await connectDB();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const [
            totalClients,
            activeMemberships,
            totalTrainers,
            activeClasses,
            thisMonthRevenue,
            lastMonthRevenue,
            totalBookings,
            pendingRequests,
            dailyPassPricingDistribution
        ] = await Promise.all([
            db.collection("clients").countDocuments({ role: "client" }),
            db.collection("memberships").countDocuments({ status: "active" }),
            db.collection("trainers").countDocuments({ status: "active" }),
            db.collection("class_schedule").countDocuments({ status: "open", start_at: { $gte: now } }),
            db.collection("payments").aggregate([
                { $match: { status: "PAID", createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("payments").aggregate([
                { $match: { status: "PAID", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("bookings").countDocuments(),
            db.collection("discount_requests").countDocuments({ status: { $in: ["submitted", "pending"] } }),
            db.collection("clients_pass").aggregate([
        {
            $lookup: {
                from: "pricing",
                localField: "pricing_id",
                foreignField: "_id",
                as: "pricing"
            }
        },
        {
            $unwind: "$pricing"
        },
        {
            $lookup: {
                from: "plans",
                localField: "pricing.plan_id",
                foreignField: "_id",
                as: "plan"
            }
        },
        {
            $unwind: "$plan"
        },
        {
            $group: {
                _id: {
                    plan: "$plan.label",
                    pricingType: "$pricing.type",
                    price: "$pricing.price"
                },
                count: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                "_id.plan": 1,
                "_id.price": 1
            }
        }
    ]).toArray()
        ]);

        const formattedDailyPassPricingDistribution =
    dailyPassPricingDistribution.map(item => ({
        name: `${item._id.plan} - ₱${item._id.price}`,
        plan: item._id.plan,
        pricingType: item._id.pricingType,
        price: item._id.price,
        value: item.count
    }));

        const thisMonthTotal = thisMonthRevenue[0]?.total || 0;
        const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
        const revenueGrowth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

        return {
            totalClients,
            activeMemberships,
            totalTrainers,
            activeClasses,
            thisMonthRevenue: thisMonthTotal,
            lastMonthRevenue: lastMonthTotal,
            revenueGrowth: parseFloat(revenueGrowth),
            totalBookings,
            pendingRequests,
            dailyPassPricingDistribution: formattedDailyPassPricingDistribution
        };
    }

    async revenueByMonth(months = 6) {
        const { db } = await connectDB();
        const now = new Date();
        const pipeline = [];

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            
            const monthResult = await db.collection("payments").aggregate([
                { $match: { status: "PAID", createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
            ]).toArray();

            pipeline.push({
                month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
                revenue: monthResult[0]?.total || 0,
                count: monthResult[0]?.count || 0
            });
        }

        return pipeline;
    }

    async bookingsByType() {
        const { db } = await connectDB();
        
        const [classBookings, trainerBookings] = await Promise.all([
            db.collection("bookings").countDocuments({ type: "class" }),
            db.collection("bookings").countDocuments({ type: "trainer-booking" })
        ]);

        return [
            { name: "Class Bookings", value: classBookings, color: "#dc2626" },
            { name: "Trainer Sessions", value: trainerBookings, color: "#16a34a" }
        ];
    }

   async classPopularity() {
 const { db } = await connectDB();

 const result = await db.collection("bookings").aggregate([
   {
      $match:{
        type:"class",
        status:{ $ne:"cancelled" }
      }
   },

   {
      $lookup:{
        from:"class_schedule",
        localField:"schedule_id",
        foreignField:"_id",
        as:"schedule"
      }
   },

   {
      $unwind:"$schedule"
   },

   {
      $lookup:{
        from:"classes",
        localField:"schedule.class_id",
        foreignField:"_id",
        as:"class"
      }
   },

   {
      $unwind:"$class"
   },

   {
      $group:{
         _id:"$class._id",
         name:{ $first:"$class.name" },
         bookings:{ $sum:1 }
      }
   },

   {
      $sort:{
         bookings:-1
      }
   },

   {
      $limit:10
   },

   {
      $project:{
         _id:0,
         class_id:"$_id",
         name:1,
         bookings:1
      }
   }

 ]).toArray();

 return result;
}

    async clientGrowth(months = 6) {
        const { db } = await connectDB();
        const now = new Date();
        const pipeline = [];

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            
            const count = await db.collection("clients").countDocuments({
                role: "client",
                createdAt: { $gte: start, $lte: end }
            });

            pipeline.push({
                month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
                clients: count
            });
        }

        return pipeline;
    }

    async membershipStatusBreakdown() {
        const { db } = await connectDB();
        
        const result = await db.collection("memberships").aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();

        const statusColors = {
            active: "#16a34a",
            expired: "#6b7280",
            frozen: "#3b82f6",
            cancelled: "#dc2626",
            pending: "#f59e0b"
        };

        return result.map(r => ({
            name: r._id?.charAt(0).toUpperCase() + r._id?.slice(1),
            value: r.count,
            color: statusColors[r._id] || "#6b7280"
        }));
    }

    async topTrainers() {
        const { db } = await connectDB();
        
        const result = await db.collection("bookings").aggregate([
            { $match: { type: "trainer-booking", status: { $ne: "cancelled" } } },
            { $group: { _id: "$trainer_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "trainers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "trainerInfo"
                }
            },
            { $unwind: "$trainerInfo" },
            {
                $project: {
                    name: { $concat: ["$trainerInfo.first_name", " ", "$trainerInfo.last_name"] },
                    count: 1
                }
            }
        ]).toArray();

        return result;
    }

    async exportPDF(query = {}) {
        const { db } = await connectDB();
        const {
            months = 6,
            month,
            start_date,
            end_date,
            status,
            payment_method,
            payment_status,
            payment_for,
            payment_type,
            plan_id,
            class_id,
            trainer_id,
            specialization,
            search,
            gender,
            fitness_goal,
            discount_type,
            request_type,
            client_id,
            role,
            user_type,
            is_discounted,
            training_type,
            experience_level,
            days_per_week,
            session_minutes,
            medical_condition,
            membership_status,
            membership_frozen,
            plan_status,
            pricing_type,
            payment_provider,
            payment_reference,
            reference_no,
            payment_amount_min,
            payment_amount_max,
            class_status,
            booking_type,
            booking_status,
            schedule_status,
            trainer_status,
            trainer_specialization,
            trainer_rate_min,
            trainer_rate_max,
            discount_request_status,
            reviewed_by,
            audit_action,
            audit_entity,
            audit_actor_role,
            audit_status,
            http_method,
            created_by,
            updated_by
        } = query;
        const normalizedMonths = month ? 1 : Number(months) || 6;

        const parseBoolean = (value) => {
            if (value === undefined || value === null || value === "") return null;
            if (typeof value === "boolean") return value;
            if (typeof value === "number") return value === 1;
            if (typeof value === "string") {
                const lower = value.trim().toLowerCase();
                if (["true", "1", "yes", "y"].includes(lower)) return true;
                if (["false", "0", "no", "n"].includes(lower)) return false;
            }
            return null;
        };

        const normalizeMonthFilter = (value) => {
            if (!value) return null;
            const monthValue = String(value).trim();
            const match = monthValue.match(/^(\d{4})-(\d{2})$/);
            if (!match) return null;
            const [, yearRaw, monthRaw] = match;
            const year = Number(yearRaw);
            const monthNumber = Number(monthRaw);
            if (!year || monthNumber < 1 || monthNumber > 12) return null;
            const start = new Date(year, monthNumber - 1, 1);
            const end = new Date(year, monthNumber, 0, 23, 59, 59, 999);
            return { start, end };
        };

        const monthRange = normalizeMonthFilter(month);
        const buildDateFilter = (field = "createdAt") => {
            if (monthRange) {
                return { [field]: { $gte: monthRange.start, $lte: monthRange.end } };
            }
            if (start_date || end_date) {
                const dateFilter = {};
                if (start_date) dateFilter.$gte = new Date(start_date);
                if (end_date) {
                    const end = new Date(end_date);
                    end.setHours(23, 59, 59, 999);
                    dateFilter.$lte = end;
                }
                return { [field]: dateFilter };
            }
            return {};
        };

        const toObjectId = (value) => {
            if (!value) return null;
            return ObjectId.isValid(value) ? new ObjectId(value) : null;
        };

        const buildSearchFilter = (fields) => {
            if (!search) return {};
            return {
                $or: fields.map((field) => ({ [field]: { $regex: search, $options: "i" } }))
            };
        };

        const normalizeId = (value) => {
            if (!value) return null;
            if (value instanceof ObjectId) return value;
            return ObjectId.isValid(value) ? new ObjectId(value) : value;
        };

        const getName = (doc) => {
            if (!doc) return "—";
            const first = doc.first_name || doc.firstName || "";
            const last = doc.last_name || doc.lastName || "";
            const full = `${first} ${last}`.trim();
            return full || doc.name || doc.label || doc.email || "—";
        };

        const normalizeValue = (value) => {
            if (value === undefined || value === null || value === "") return null;
            return String(value).trim();
        };

        const clientFilter = {
            ...(role ? { role: String(role).toLowerCase() } : { role: "client" }),
            ...(user_type ? { user_type: String(user_type).toLowerCase() } : {}),
            ...(is_discounted !== undefined && is_discounted !== null && is_discounted !== "" ? { is_discounted: parseBoolean(is_discounted) } : {}),
            ...(gender ? { gender: String(gender).toLowerCase() } : {}),
            ...(fitness_goal ? { fitness_goal: { $in: Array.isArray(fitness_goal) ? fitness_goal.map((item) => String(item).toLowerCase()) : [String(fitness_goal).toLowerCase()] } } : {}),
            ...(training_type ? { training_type: { $in: Array.isArray(training_type) ? training_type.map((item) => String(item).toLowerCase()) : [String(training_type).toLowerCase()] } } : {}),
            ...(experience_level ? { experience_level: { $in: Array.isArray(experience_level) ? experience_level.map((item) => String(item).toLowerCase()) : [String(experience_level).toLowerCase()] } } : {}),
            ...(days_per_week ? { days_per_week: { $in: Array.isArray(days_per_week) ? days_per_week.map((item) => String(item).toLowerCase()) : [String(days_per_week).toLowerCase()] } } : {}),
            ...(session_minutes ? { session_minutes: { $in: Array.isArray(session_minutes) ? session_minutes.map((item) => String(item).toLowerCase()) : [String(session_minutes).toLowerCase()] } } : {}),
            ...(medical_condition ? { medical_condition: { $regex: String(medical_condition), $options: "i" } } : {}),
            ...(status ? { status: String(status).toLowerCase() } : {}),
            ...(search ? buildSearchFilter(["first_name", "last_name", "email", "phone"]) : {}),
            ...buildDateFilter("createdAt")
        };

        const trainerFilter = {
            ...(role ? { role: String(role).toLowerCase() } : { role: "trainer" }),
            ...(trainer_status ? { status: String(trainer_status).toLowerCase() } : {}),
            ...(status ? { status: String(status).toLowerCase() } : {}),
            ...(trainer_specialization || specialization ? { specialization: { $in: Array.isArray(trainer_specialization || specialization) ? (trainer_specialization || specialization).map((item) => String(item).toLowerCase()) : [String(trainer_specialization || specialization).toLowerCase()] } } : {}),
            ...(trainer_rate_min || trainer_rate_max ? { rate: {} } : {}),
            ...(search ? buildSearchFilter(["first_name", "last_name", "email", "phone"]) : {}),
            ...buildDateFilter("createdAt")
        };

        if (trainer_rate_min !== undefined && trainer_rate_min !== null && trainer_rate_min !== "") {
            trainerFilter.rate.$gte = Number(trainer_rate_min);
        }
        if (trainer_rate_max !== undefined && trainer_rate_max !== null && trainer_rate_max !== "") {
            trainerFilter.rate.$lte = Number(trainer_rate_max);
        }

        const membershipFilter = {
            ...(membership_status || status ? { status: String(membership_status || status).toLowerCase() } : {}),
            ...(membership_frozen !== undefined && membership_frozen !== null && membership_frozen !== "" ? { is_frozen: parseBoolean(membership_frozen) } : {}),
            ...(plan_id && toObjectId(plan_id) ? { plan_id: toObjectId(plan_id) } : {}),
            ...(client_id && toObjectId(client_id) ? { client_id: toObjectId(client_id) } : {}),
            ...buildDateFilter("createdAt")
        };

        const paymentFilter = {
            ...(payment_status || status ? { status: String(payment_status || status).toUpperCase() } : {}),
            ...(payment_method ? { payment_method: String(payment_method).toLowerCase() } : {}),
            ...(payment_provider ? { payment_provider: String(payment_provider).toLowerCase() } : {}),
            ...(payment_for || payment_type ? { payment_for: String(payment_for || payment_type).toLowerCase() } : {}),
            ...(payment_reference || reference_no ? { $or: [
                { reference: { $regex: String(payment_reference || reference_no), $options: "i" } },
                { external_id: { $regex: String(payment_reference || reference_no), $options: "i" } }
            ] } : {}),
            ...(payment_amount_min || payment_amount_max ? { amount: {} } : {}),
            ...(search ? buildSearchFilter(["external_id", "reference", "payment_for"]) : {}),
            ...buildDateFilter("createdAt")
        };

        if (payment_amount_min !== undefined && payment_amount_min !== null && payment_amount_min !== "") {
            paymentFilter.amount.$gte = Number(payment_amount_min);
        }
        if (payment_amount_max !== undefined && payment_amount_max !== null && payment_amount_max !== "") {
            paymentFilter.amount.$lte = Number(payment_amount_max);
        }

        const bookingFilter = {
            ...(booking_status || status ? { status: String(booking_status || status).toLowerCase() } : {}),
            ...(booking_type ? { type: String(booking_type).toLowerCase() } : {}),
            ...(class_id && toObjectId(class_id) ? { schedule_id: toObjectId(class_id) } : {}),
            ...(trainer_id && toObjectId(trainer_id) ? { trainer_id: toObjectId(trainer_id) } : {}),
            ...(client_id && toObjectId(client_id) ? { client_id: toObjectId(client_id) } : {}),
            ...buildDateFilter("createdAt")
        };

        const scheduleFilter = {
            ...(schedule_status || class_status || status ? { status: String(schedule_status || class_status || status).toLowerCase() } : {}),
            ...(class_id && toObjectId(class_id) ? { class_id: toObjectId(class_id) } : {}),
            ...(trainer_id && toObjectId(trainer_id) ? { trainer_id: toObjectId(trainer_id) } : {}),
            ...buildDateFilter("start_at")
        };

        const discountFilter = {
            ...(discount_request_status || status ? { status: String(discount_request_status || status).toLowerCase() } : {}),
            ...(discount_type ? { discount_type: String(discount_type) } : {}),
            ...(client_id && toObjectId(client_id) ? { client_id: toObjectId(client_id) } : {}),
            ...(reviewed_by && toObjectId(reviewed_by) ? { reviewed_by: toObjectId(reviewed_by) } : {}),
            ...buildDateFilter("createdAt")
        };

        const planFilter = {
            ...(plan_status || status ? { status: String(plan_status || status).toLowerCase() } : {}),
            ...(search ? { label: { $regex: search, $options: "i" } } : {})
        };

        const pricingFilter = {
            ...(status ? { status: String(status).toLowerCase() } : {}),
            ...(pricing_type || payment_type ? { type: String(pricing_type || payment_type).toLowerCase() } : {}),
            ...(search ? { type: { $regex: search, $options: "i" } } : {})
        };

        const clientPassFilter = {
            ...(status ? { status: String(status).toLowerCase() } : {}),
            ...(plan_id && toObjectId(plan_id) ? { plan_id: toObjectId(plan_id) } : {}),
            ...(client_id && toObjectId(client_id) ? { client_id: toObjectId(client_id) } : {}),
            ...(payment_reference || reference_no ? { payment_reference: { $regex: String(payment_reference || reference_no), $options: "i" } } : {}),
            ...buildDateFilter("createdAt")
        };

        const auditLogFilter = {
            ...(audit_action ? { action: { $regex: String(audit_action), $options: "i" } } : {}),
            ...(audit_entity ? { entity: { $regex: String(audit_entity), $options: "i" } } : {}),
            ...(audit_actor_role ? { role: { $regex: String(audit_actor_role), $options: "i" } } : {}),
            ...(audit_status || status ? { status: { $regex: String(audit_status || status), $options: "i" } } : {}),
            ...(http_method ? { method: { $regex: String(http_method), $options: "i" } } : {}),
            ...(created_by ? { createdBy: { $regex: String(created_by), $options: "i" } } : {}),
            ...(updated_by ? { updatedBy: { $regex: String(updated_by), $options: "i" } } : {}),
            ...buildDateFilter("createdAt")
        };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const clientScopeIds = (await db.collection("clients").find(clientFilter).project({ _id: 1 }).toArray()).map((item) => item._id);
        const clientScopeFilter = clientScopeIds.length ? { client_id: { $in: clientScopeIds } } : { client_id: { $in: [] } };

        const [overview, revenueByMonth, bookingsByType, classPopularity, clientGrowth, membershipStatus, topTrainers, dailyPassPricing, paymentSummary, membershipGrowthDistribution] = await Promise.all([
            (async () => {
                const [totalClients, activeMemberships, totalTrainers, activeClasses, thisMonthRevenue, lastMonthRevenue, totalBookings, pendingRequests] = await Promise.all([
                    db.collection("clients").countDocuments(clientFilter),
                    db.collection("memberships").countDocuments({ ...membershipFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), status: membershipFilter.status || "active" }),
                    db.collection("trainers").countDocuments(trainerFilter),
                    db.collection("class_schedule").countDocuments({ ...scheduleFilter, status: scheduleFilter.status || "open", start_at: { $gte: now } }),
                    db.collection("payments").aggregate([{ $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), status: paymentFilter.status || "PAID", createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
                    db.collection("payments").aggregate([{ $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), status: paymentFilter.status || "PAID", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
                    db.collection("bookings").countDocuments({ ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) }),
                    db.collection("discount_requests").countDocuments({ ...discountFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), status: { $in: ["submitted", "pending"] } })
                ]);

                const thisMonthTotal = thisMonthRevenue[0]?.total || 0;
                const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
                const revenueGrowth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

                return {
                    totalClients,
                    activeMemberships,
                    totalTrainers,
                    activeClasses,
                    thisMonthRevenue: thisMonthTotal,
                    lastMonthRevenue: lastMonthTotal,
                    revenueGrowth: parseFloat(revenueGrowth),
                    totalBookings,
                    pendingRequests
                };
            })(),
            (async () => {
                const pipeline = [];
                for (let i = normalizedMonths - 1; i >= 0; i--) {
                    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
                    const monthResult = await db.collection("payments").aggregate([
                        { $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), status: paymentFilter.status || "PAID", createdAt: { $gte: start, $lte: end } } },
                        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
                    ]).toArray();

                    pipeline.push({
                        month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
                        revenue: monthResult[0]?.total || 0,
                        count: monthResult[0]?.count || 0
                    });
                }
                return pipeline;
            })(),
            (async () => {
                const [classBookings, trainerBookings] = await Promise.all([
                    db.collection("bookings").countDocuments({ ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), type: "class" }),
                    db.collection("bookings").countDocuments({ ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), type: "trainer-booking" })
                ]);
                return [
                    { name: "Class Bookings", value: classBookings, color: "#dc2626" },
                    { name: "Trainer Sessions", value: trainerBookings, color: "#16a34a" }
                ];
            })(),
            (async () => {
                const result = await db.collection("bookings").aggregate([
                    { $match: { ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), type: "class", status: { $ne: "cancelled" } } },
                    { $lookup: { from: "class_schedule", localField: "schedule_id", foreignField: "_id", as: "schedule" } },
                    { $unwind: "$schedule" },
                    { $lookup: { from: "classes", localField: "schedule.class_id", foreignField: "_id", as: "class" } },
                    { $unwind: "$class" },
                    { $group: { _id: "$class._id", name: { $first: "$class.name" }, bookings: { $sum: 1 } } },
                    { $sort: { bookings: -1 } },
                    { $limit: 10 },
                    { $project: { _id: 0, class_id: "$_id", name: 1, bookings: 1 } }
                ]).toArray();
                return result;
            })(),
            (async () => {
                const pipeline = [];
                for (let i = normalizedMonths - 1; i >= 0; i--) {
                    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
                    const count = await db.collection("clients").countDocuments({ ...clientFilter, createdAt: { $gte: start, $lte: end } });
                    pipeline.push({ month: start.toLocaleString("default", { month: "short", year: "2-digit" }), clients: count });
                }
                return pipeline;
            })(),
            (async () => {
                const result = await db.collection("memberships").aggregate([
                    { $match: { ...membershipFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
                    {
                        $project: {
                            displayStatus: { 
                                $cond: [
                                    {
                                        $eq: ["$is_frozen", true]
                                    },
                                    "frozen",
                                    "$status"
                                ]
                            }
                        }
                    },
                    { $group: { _id: "$displayStatus", count: { $sum: 1 } } }
                ]).toArray();
                const statusColors = { 
                    active: "#16a34a", 
                    expired: "#7F8C8D", 
                    frozen: "#3b82f6", 
                    cancelled: "#dc2626",
                    pending: "#f59e0b",
                 };
                return result.map((r) => ({ name: r._id?.charAt(0).toUpperCase() + r._id?.slice(1), value: r.count, color: statusColors[r._id] || "#6b7280" }));
            })(),
            (async () => {
                const result = await db.collection("bookings").aggregate([
                    { $match: { ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), type: "trainer-booking", status: { $ne: "cancelled" } } },
                    { $group: { _id: "$trainer_id", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                    { $lookup: { from: "trainers", localField: "_id", foreignField: "_id", as: "trainerInfo" } },
                    { $unwind: "$trainerInfo" },
                    { $project: { name: { $concat: ["$trainerInfo.first_name", " ", "$trainerInfo.last_name"] }, count: 1 } }
                ]).toArray();
                return result;
            })(),
            (async () => {
                const dailyPassFilter = {};
                
                // Apply date range filter
                if (monthRange) {
                    dailyPassFilter.createdAt = { $gte: monthRange.start, $lte: monthRange.end };
                } else if (start_date || end_date) {
                    const dateFilter = {};
                    if (start_date) dateFilter.$gte = new Date(start_date);
                    if (end_date) {
                        const end = new Date(end_date);
                        end.setHours(23, 59, 59, 999);
                        dateFilter.$lte = end;
                    }
                    if (Object.keys(dateFilter).length > 0) {
                        dailyPassFilter.createdAt = dateFilter;
                    }
                }

                // Apply client scope filter if client IDs are filtered
                if (clientScopeIds.length && clientScopeFilter.client_id) {
                    dailyPassFilter.client_id = clientScopeFilter.client_id;
                }

                const result = await db.collection("clients_pass").aggregate([
                    {
                        $match: dailyPassFilter
                    },
                    {
                        $lookup: {
                            from: "pricing",
                            localField: "pricing_id",
                            foreignField: "_id",
                            as: "pricing"
                        }
                    },
                    { $unwind: "$pricing" },
                    {
                        $lookup: {
                            from: "plans",
                            localField: "pricing.plan_id",
                            foreignField: "_id",
                            as: "plan"
                        }
                    },
                    { $unwind: "$plan" },
                    // Apply plan_id filter if provided
                    ...(plan_id && toObjectId(plan_id) ? [
                        { $match: { "pricing.plan_id": toObjectId(plan_id) } }
                    ] : []),
                    {
                        $group: {
                            _id: {
                                plan: "$plan.label",
                                pricingType: "$pricing.type",
                                price: "$pricing.price"
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id.plan": 1, "_id.price": 1 } }
                ]).toArray();

                // Transform into chart-friendly grouped data
                const groupedMap = new Map();
                result.forEach((item) => {
                    const plan = item._id.plan;
                    if (!groupedMap.has(plan)) {
                        groupedMap.set(plan, { name: plan, regular: 0, discounted: 0, regularCount: 0, discountedCount: 0 });
                    }
                    const entry = groupedMap.get(plan);
                    if (item._id.pricingType === "discounted") {
                        entry.discounted = item._id.price;
                        entry.discountedCount = item.count;
                    } else {
                        entry.regular = item._id.price;
                        entry.regularCount = item.count;
                    }
                });

                return Array.from(groupedMap.values());
            })(),
            (async () => {
                const [statusBreakdown, methodBreakdown, typeBreakdown, recentPayments] = await Promise.all([
                    db.collection("payments").aggregate([
                        { $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
                        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
                        { $sort: { count: -1 } }
                    ]).toArray(),
                    db.collection("payments").aggregate([
                        { $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
                        { $group: { _id: "$payment_method", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
                        { $sort: { count: -1 } }
                    ]).toArray(),
                    db.collection("payments").aggregate([
                        { $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
                        { $group: { _id: "$payment_for", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
                        { $sort: { count: -1 } }
                    ]).toArray(),
                    db.collection("payments")
                        .find({ ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) })
                        .sort({ createdAt: -1 })
                        .limit(8)
                        .project({ _id: 1, status: 1, amount: 1, payment_method: 1, payment_for: 1, createdAt: 1, external_id: 1, reference: 1 })
                        .toArray()
                ]);

                const totalTransactions = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
                const paidCount = statusBreakdown.find((item) => item._id === "PAID")?.count || 0;
                const pendingCount = statusBreakdown.find((item) => item._id === "PENDING")?.count || 0;
                const failedCount = statusBreakdown.find((item) => item._id === "FAILED")?.count || 0;
                const totalRevenue = statusBreakdown.find((item) => item._id === "PAID")?.revenue || 0;

                return {
                    totalTransactions,
                    paidCount,
                    pendingCount,
                    failedCount,
                    totalRevenue,
                    byStatus: statusBreakdown.map((item) => ({ name: item._id || "Unknown", count: item.count, revenue: item.revenue })),
                    byMethod: methodBreakdown.map((item) => ({ name: item._id || "Unknown", count: item.count, revenue: item.revenue })),
                    byType: typeBreakdown.map((item) => ({ name: item._id || "Unknown", count: item.count, revenue: item.revenue })),
                    recentPayments: recentPayments.map((item) => ({
                        id: item.external_id || item.reference || item._id?.toString(),
                        amount: item.amount,
                        status: item.status,
                        paymentMethod: item.payment_method,
                        type: item.payment_for,
                        createdAt: item.createdAt
                    }))
                };
            })(),
            (async () => {
                const membershipGrowthFilter = {
                    ...membershipFilter,
                    ...(clientScopeIds.length ? clientScopeFilter : {}),
                };

                const pipeline = [];
                for (let i = normalizedMonths - 1; i >= 0; i--) {
                    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
                    const count = await db.collection("memberships").countDocuments({
                        ...membershipGrowthFilter,
                        createdAt: { $gte: start, $lte: end }
                    });
                    pipeline.push({
                        month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
                        memberships: count
                    });
                }

                return pipeline;
            })(),
        ]);

        const clientDocs = await db.collection("clients")
            .find(clientFilter)
            .sort({ createdAt: -1 })
            .toArray();

        const clientIds = clientDocs.map((client) => client._id).filter(Boolean);
        const [membershipsByClient, paymentsByClient, bookingsByClient, discountRequestsByClient, clientPassesByClient] = await Promise.all([
            db.collection("memberships").aggregate([
                { $match: { ...membershipFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), client_id: { $in: clientIds } } },
                { $group: { _id: "$client_id", count: { $sum: 1 }, statuses: { $addToSet: "$status" }, totalRevenue: { $sum: "$price_amount" } } }
            ]).toArray(),
            db.collection("payments").aggregate([
                { $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), client_id: { $in: clientIds } } },
                { $group: { _id: "$client_id", count: { $sum: 1 }, totalRevenue: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("bookings").aggregate([
                { $match: { ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), client_id: { $in: clientIds } } },
                { $group: { _id: "$client_id", classBookings: { $sum: { $cond: [{ $eq: ["$type", "class"] }, 1, 0] } }, trainerSessions: { $sum: { $cond: [{ $eq: ["$type", "trainer-booking"] }, 1, 0] } } } }
            ]).toArray(),
            db.collection("discount_requests").aggregate([
                { $match: { ...discountFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), client_id: { $in: clientIds } } },
                { $group: { _id: "$client_id", count: { $sum: 1 } } }
            ]).toArray(),
            db.collection("clients_pass").aggregate([
                { $match: { ...clientPassFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), client_id: { $in: clientIds } } },
                { $group: { _id: "$client_id", count: { $sum: 1 } } }
            ]).toArray()
        ]);

        const clientSummaryMap = new Map();
        membershipsByClient.forEach((item) => clientSummaryMap.set(item._id.toString(), { membershipCount: item.count, membershipStatus: item.statuses?.[0] || "—" }));
        paymentsByClient.forEach((item) => {
            const existing = clientSummaryMap.get(item._id.toString()) || {};
            existing.paymentsCount = item.count;
            existing.totalPaidAmount = item.totalRevenue || 0;
            clientSummaryMap.set(item._id.toString(), existing);
        });
        bookingsByClient.forEach((item) => {
            const existing = clientSummaryMap.get(item._id.toString()) || {};
            existing.classBookings = item.classBookings || 0;
            existing.trainerSessions = item.trainerSessions || 0;
            clientSummaryMap.set(item._id.toString(), existing);
        });
        discountRequestsByClient.forEach((item) => {
            const existing = clientSummaryMap.get(item._id.toString()) || {};
            existing.discountRequests = item.count || 0;
            clientSummaryMap.set(item._id.toString(), existing);
        });
        clientPassesByClient.forEach((item) => {
            const existing = clientSummaryMap.get(item._id.toString()) || {};
            existing.dailyPassCount = item.count || 0;
            clientSummaryMap.set(item._id.toString(), existing);
        });

        const clientRows = clientDocs.map((client) => {
            const summary = clientSummaryMap.get(client._id?.toString()) || {};
            return {
                _id: client._id,
                clientId: client._id?.toString(),
                firstName: client.first_name || "",
                lastName: client.last_name || "",
                email: client.email || "",
                phone: client.phone || "",
                gender: client.gender || "",
                age: client.dob ? new Date().getFullYear() - new Date(client.dob).getFullYear() : "",
                bmi: client.bmi || "",
                fitnessGoals: client.fitness_goal || client.fitnessGoals || "",
                trainingType: client.training_type || client.trainingType || "",
                experienceLevel: client.experience_level || client.experienceLevel || "",
                daysPerWeek: client.days_per_week || client.daysPerWeek || "",
                sessionMinutes: client.session_minutes || client.sessionMinutes || "",
                discounted: client.is_discounted || client.discounted || false,
                status: client.status || "active",
                createdDate: client.createdAt,
                membershipCount: summary.membershipCount || 0,
                membershipStatus: summary.membershipStatus || "—",
                paymentsCount: summary.paymentsCount || 0,
                totalPaidAmount: summary.totalPaidAmount || 0,
                classBookings: summary.classBookings || 0,
                trainerSessions: summary.trainerSessions || 0,
                discountRequests: summary.discountRequests || 0,
                dailyPassCount: summary.dailyPassCount || 0
            };
        });

        const trainerDocs = await db.collection("trainers")
            .find(trainerFilter)
            .sort({ createdAt: -1 })
            .toArray();

        const trainerIds = trainerDocs.map((trainer) => trainer._id).filter(Boolean);
        const [trainerClassCounts, trainerBookingCounts, trainerScheduleCounts] = await Promise.all([
            db.collection("class_schedule").aggregate([
                { $match: { ...scheduleFilter, trainer_id: { $in: trainerIds } } },
                { $group: { _id: "$trainer_id", classesConducted: { $sum: 1 } } }
            ]).toArray(),
            db.collection("bookings").aggregate([
                { $match: { ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), trainer_id: { $in: trainerIds }, type: "trainer-booking" } },
                { $group: { _id: "$trainer_id", sessions: { $sum: 1 } } }
            ]).toArray(),
            db.collection("class_schedule").aggregate([
                { $match: { ...scheduleFilter, trainer_id: { $in: trainerIds } } },
                { $group: { _id: "$trainer_id", assignedSchedules: { $sum: 1 } } }
            ]).toArray()
        ]);

        const trainerClassMap = new Map(trainerClassCounts.map((item) => [item._id?.toString(), item]));
        const trainerBookingMap = new Map(trainerBookingCounts.map((item) => [item._id?.toString(), item]));
        const trainerScheduleMap = new Map(trainerScheduleCounts.map((item) => [item._id?.toString(), item]));

        const trainerRows = trainerDocs.map((trainer) => {
            const cls = trainerClassMap.get(trainer._id?.toString()) || {};
            const booking = trainerBookingMap.get(trainer._id?.toString()) || {};
            const schedule = trainerScheduleMap.get(trainer._id?.toString()) || {};
            return {
                _id: trainer._id,
                trainerId: trainer._id?.toString(),
                name: getName(trainer),
                email: trainer.email || "",
                phone: trainer.phone || "",
                specializations: trainer.specialization || trainer.specializations || "",
                rate: trainer.rate || trainer.hourly_rate || "",
                availability: trainer.availability || trainer.available_hours || "",
                status: trainer.status || "active",
                classesConducted: cls.classesConducted || 0,
                trainerSessions: booking.sessions || 0,
                assignedSchedules: schedule.assignedSchedules || 0
            };
        });

        const membershipDocs = await db.collection("memberships").aggregate([
            { $match: { ...membershipFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "plans", localField: "plan_id", foreignField: "_id", as: "plan" } },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "pricing", localField: "pricing_id", foreignField: "_id", as: "pricing" } },
            { $unwind: { path: "$pricing", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        const membershipRows = membershipDocs.map((membership) => ({
            _id: membership._id,
            membershipId: membership._id?.toString(),
            client: getName(membership.client),
            plan: membership.plan?.label || membership.plan?.name || "—",
            startDate: membership.start_date || membership.createdAt,
            endDate: membership.end_date || membership.expiry_date,
            status: membership.status || "active",
            frozen: membership.is_frozen || membership.frozen || false,
            paymentReference: membership.payment_reference || membership.payment_ref || membership.payment_id || "—",
            createdDate: membership.createdAt
        }));

        const paymentDocs = await db.collection("payments").aggregate([
            { $match: { ...paymentFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "plans", localField: "plan_id", foreignField: "_id", as: "plan" } },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "pricing", localField: "pricing_id", foreignField: "_id", as: "pricing" } },
            { $unwind: { path: "$pricing", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        const paymentRows = paymentDocs.map((payment) => ({
            _id: payment._id,
            paymentReference: payment.reference || payment.external_id || payment._id?.toString(),
            client: getName(payment.client),
            amount: payment.amount || 0,
            status: payment.status || "PENDING",
            paymentMethod: payment.payment_method || "—",
            paymentFor: payment.payment_for || "—",
            plan: payment.plan?.label || payment.plan?.name || "—",
            pricingType: payment.pricing?.type || payment.pricing_type || "—",
            externalId: payment.external_id || "—",
            createdDate: payment.createdAt
        }));

        const planDocs = await db.collection("plans")
            .find(planFilter)
            .sort({ createdAt: -1 })
            .toArray();

        const planMembershipCounts = await db.collection("memberships").aggregate([
            { $match: { ...membershipFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), plan_id: { $in: planDocs.map((plan) => plan._id).filter(Boolean) } } },
            { $group: { _id: "$plan_id", membershipCount: { $sum: 1 } } }
        ]).toArray();
        const planMembershipMap = new Map(planMembershipCounts.map((item) => [item._id?.toString(), item.membershipCount]));
        const planClientNames = await db.collection("memberships").aggregate([
            { $match: { ...membershipFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), plan_id: { $in: planDocs.map((plan) => plan._id).filter(Boolean) } } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$plan_id", clients: { $push: { $concat: ["$client.first_name", " ", "$client.last_name"] } } } }
        ]).toArray();
        const planClientMap = new Map(planClientNames.map((item) => [item._id?.toString(), item.clients.filter(Boolean)]));

        const planRows = planDocs.map((plan) => ({
            _id: plan._id,
            plan: plan.label || plan.name || "—",
            duration: plan.duration || plan.duration_days || "—",
            membershipCount: planMembershipMap.get(plan._id?.toString()) || 0,
            dailyPassCount: 0,
            uniqueClients: planClientMap.get(plan._id?.toString())?.length || 0,
            revenueGenerated: 0,
            clientList: (planClientMap.get(plan._id?.toString()) || []).join(", ")
        }));

        const pricingDocs = await db.collection("pricing")
            .find(pricingFilter)
            .sort({ createdAt: -1 })
            .toArray();
        const pricingRows = pricingDocs.map((pricing) => ({
            _id: pricing._id,
            plan: pricing.plan_id || pricing.plan || "—",
            pricingType: pricing.type || "standard",
            price: pricing.price || 0,
            membershipFee: pricing.membership_fee || 0,
            numberOfPurchases: 0,
            revenue: 0,
            clientsUsingThisPricing: "—"
        }));

        const scheduleDocs = await db.collection("class_schedule").aggregate([
            { $match: scheduleFilter },
            { $lookup: { from: "classes", localField: "class_id", foreignField: "_id", as: "class" } },
            { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "trainers", localField: "trainer_id", foreignField: "_id", as: "trainer" } },
            { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "bookings", let: { scheduleId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$schedule_id", "$$scheduleId"] } } }], as: "bookings" } },
            { $addFields: { bookedCount: { $size: "$bookings" }, availableSlots: { $subtract: ["$capacity", { $size: "$bookings" }] } } },
            { $sort: { start_at: -1 } }
        ]).toArray();

        const scheduleRows = scheduleDocs.map((schedule) => ({
            _id: schedule._id,
            schedule: schedule._id?.toString(),
            className: schedule.class?.name || "—",
            trainer: getName(schedule.trainer),
            location: schedule.location || "—",
            capacity: schedule.capacity || 0,
            booked: schedule.bookedCount || 0,
            availableSlots: schedule.availableSlots || 0,
            status: schedule.status || "open"
        }));

        const classBookingsDocs = await db.collection("bookings").aggregate([
            { $match: { ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), type: "class" } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "class_schedule", localField: "schedule_id", foreignField: "_id", as: "schedule" } },
            { $unwind: { path: "$schedule", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "classes", localField: "schedule.class_id", foreignField: "_id", as: "class" } },
            { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "trainers", localField: "trainer_id", foreignField: "_id", as: "trainer" } },
            { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        const classBookingRows = classBookingsDocs.map((booking) => ({
            _id: booking._id,
            bookingId: booking._id?.toString(),
            client: getName(booking.client),
            className: booking.class?.name || "—",
            trainer: getName(booking.trainer),
            joinedDate: booking.createdAt || booking.joinedAt,
            status: booking.status || "pending",
            payment: booking.payment_reference || booking.payment_ref || "—"
        }));

        const trainerBookingDocs = await db.collection("bookings").aggregate([
            { $match: { ...bookingFilter, ...(clientScopeIds.length ? clientScopeFilter : {}), type: "trainer-booking" } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "trainers", localField: "trainer_id", foreignField: "_id", as: "trainer" } },
            { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        const trainerBookingRows = trainerBookingDocs.map((booking) => ({
            _id: booking._id,
            bookingId: booking._id?.toString(),
            client: getName(booking.client),
            trainer: getName(booking.trainer),
            bookedAt: booking.createdAt || booking.booked_at,
            status: booking.status || "pending",
            payment: booking.payment_reference || booking.payment_ref || "—"
        }));

        const clientPassDocs = await db.collection("clients_pass").aggregate([
            { $match: { ...clientPassFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "plans", localField: "plan_id", foreignField: "_id", as: "plan" } },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "pricing", localField: "pricing_id", foreignField: "_id", as: "pricing" } },
            { $unwind: { path: "$pricing", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        const clientPassRows = clientPassDocs.map((clientPass) => ({
            _id: clientPass._id,
            reference: clientPass.reference || clientPass._id?.toString(),
            client: getName(clientPass.client),
            plan: clientPass.plan?.label || clientPass.plan?.name || "—",
            pricing: clientPass.pricing?.type || "—",
            duration: clientPass.duration || clientPass.validity || "—",
            status: clientPass.status || "active",
            payment: clientPass.payment_reference || clientPass.payment_ref || "—",
            startDate: clientPass.start_date || clientPass.createdAt,
            endDate: clientPass.end_date || clientPass.expiry_date
        }));

        const discountDocs = await db.collection("discount_requests").aggregate([
            { $match: { ...discountFilter, ...(clientScopeIds.length ? clientScopeFilter : {}) } },
            { $lookup: { from: "clients", localField: "client_id", foreignField: "_id", as: "client" } },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "admins", localField: "reviewed_by", foreignField: "_id", as: "reviewer" } },
            { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        const discountRows = discountDocs.map((discount) => ({
            _id: discount._id,
            client: getName(discount.client),
            submittedDate: discount.createdAt,
            reviewedDate: discount.reviewed_at || discount.updatedAt,
            status: discount.status || "submitted",
            reviewer: getName(discount.reviewer)
        }));

        const auditDocs = await db.collection("audit_logs")
            .find(auditLogFilter)
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray();

        const auditRows = auditDocs.map((audit) => ({
            _id: audit._id,
            timestamp: audit.createdAt || audit.timestamp,
            actorName: audit.actor_name || audit.createdBy || audit.user_name || audit.userId || "System",
            role: audit.role || "Unknown",
            action: audit.action || audit.type || "Action",
            entity: audit.entity || audit.collection || "N/A",
            entityId: audit.entity_id || audit.entityId || "",
            summary: audit.summary || audit.details || "",
            status: audit.status || "success",
            method: audit.method || "",
            endpoint: audit.endpoint || "",
            ipAddress: audit.ip_address || audit.ipAddress || "",
            requestId: audit.request_id || audit.requestId || "",
            error: audit.error || ""
        }));

        const relationshipClients = clientRows.map((client) => ({
            clientName: `${client.firstName} ${client.lastName}`.trim(),
            currentMembership: client.membershipStatus || "—",
            plan: "—",
            pricing: "—",
            totalPayments: client.paymentsCount || 0,
            revenueGenerated: client.totalPaidAmount || 0,
            classesJoined: client.classBookings || 0,
            trainerSessions: client.trainerSessions || 0,
            discountRequests: client.discountRequests || 0,
            dailyPasses: client.dailyPassCount || 0,
            lastActivity: client.createdDate || null
        }));

        const relationshipTrainers = trainerRows.map((trainer) => ({
            trainer: trainer.name,
            classesConducted: trainer.classesConducted || 0,
            sessionsCompleted: trainer.trainerSessions || 0,
            uniqueClientsServed: 0,
            revenueInfluenced: 0
        }));

        const rankings = {
            highestPayingClients: [...clientRows].sort((a, b) => (b.totalPaidAmount || 0) - (a.totalPaidAmount || 0)).slice(0, 10),
            mostActiveClients: [...clientRows].sort((a, b) => (b.classBookings || 0) + (b.trainerSessions || 0) - ((a.classBookings || 0) + (a.trainerSessions || 0))).slice(0, 10),
            mostPopularTrainers: [...trainerRows].sort((a, b) => (b.trainerSessions || 0) - (a.trainerSessions || 0)).slice(0, 10),
            mostPopularClasses: [...classPopularity].sort((a, b) => (b.bookings || 0) - (a.bookings || 0)).slice(0, 10),
            mostPurchasedPlans: [...planRows].sort((a, b) => (b.membershipCount || 0) - (a.membershipCount || 0)).slice(0, 10),
            clientsWithMostSessions: [...clientRows].sort((a, b) => (b.trainerSessions || 0) - (a.trainerSessions || 0)).slice(0, 10),
            clientsWithMostClassBookings: [...clientRows].sort((a, b) => (b.classBookings || 0) - (a.classBookings || 0)).slice(0, 10)
        };

        const selectedFilters = [
            role ? { label: "Role", value: role } : null,
            user_type ? { label: "User Type", value: user_type } : null,
            is_discounted !== undefined && is_discounted !== null && is_discounted !== "" ? { label: "Discount Status", value: is_discounted } : null,
            gender ? { label: "Gender", value: gender } : null,
            fitness_goal ? { label: "Fitness Goal", value: fitness_goal } : null,
            training_type ? { label: "Training Type", value: training_type } : null,
            experience_level ? { label: "Experience Level", value: experience_level } : null,
            days_per_week ? { label: "Days Per Week", value: days_per_week } : null,
            session_minutes ? { label: "Session Minutes", value: session_minutes } : null,
            medical_condition ? { label: "Medical Condition", value: medical_condition } : null,
            membership_status ? { label: "Membership Status", value: membership_status } : null,
            membership_frozen !== undefined && membership_frozen !== null && membership_frozen !== "" ? { label: "Membership Frozen", value: membership_frozen } : null,
            plan_status ? { label: "Plan Status", value: plan_status } : null,
            pricing_type ? { label: "Pricing Type", value: pricing_type } : null,
            payment_method ? { label: "Payment Method", value: payment_method } : null,
            payment_provider ? { label: "Payment Provider", value: payment_provider } : null,
            payment_status ? { label: "Payment Status", value: payment_status } : null,
            payment_for || payment_type ? { label: "Payment For", value: payment_for || payment_type } : null,
            payment_reference || reference_no ? { label: "Payment Reference", value: payment_reference || reference_no } : null,
            payment_amount_min || payment_amount_max ? { label: "Payment Amount Range", value: `${payment_amount_min || ""} - ${payment_amount_max || ""}`.trim() } : null,
            class_id ? { label: "Class", value: class_id } : null,
            class_status ? { label: "Class Status", value: class_status } : null,
            booking_type ? { label: "Booking Type", value: booking_type } : null,
            booking_status ? { label: "Booking Status", value: booking_status } : null,
            schedule_status ? { label: "Schedule Status", value: schedule_status } : null,
            trainer_id ? { label: "Trainer", value: trainer_id } : null,
            trainer_status ? { label: "Trainer Status", value: trainer_status } : null,
            trainer_specialization || specialization ? { label: "Trainer Specialization", value: trainer_specialization || specialization } : null,
            trainer_rate_min || trainer_rate_max ? { label: "Trainer Rate", value: `${trainer_rate_min || ""} - ${trainer_rate_max || ""}`.trim() } : null,
            plan_id ? { label: "Plan", value: plan_id } : null,
            discount_type ? { label: "Discount Type", value: discount_type } : null,
            discount_request_status ? { label: "Discount Request Status", value: discount_request_status } : null,
            reviewed_by ? { label: "Reviewed By", value: reviewed_by } : null,
            audit_action ? { label: "Audit Action", value: audit_action } : null,
            audit_entity ? { label: "Audit Entity", value: audit_entity } : null,
            audit_actor_role ? { label: "Audit Actor Role", value: audit_actor_role } : null,
            audit_status ? { label: "Audit Status", value: audit_status } : null,
            http_method ? { label: "HTTP Method", value: http_method } : null,
            created_by ? { label: "Created By", value: created_by } : null,
            updated_by ? { label: "Updated By", value: updated_by } : null,
            month ? { label: "Month", value: month } : null,
            start_date ? { label: "Start Date", value: start_date } : null,
            end_date ? { label: "End Date", value: end_date } : null,
            search ? { label: "Search", value: search } : null,
            client_id ? { label: "Client", value: client_id } : null
        ].filter(Boolean);

        const totalRecordsIncluded = clientRows.length + trainerRows.length + membershipRows.length + paymentRows.length + planRows.length + pricingRows.length + scheduleRows.length + classBookingRows.length + trainerBookingRows.length + clientPassRows.length + discountRows.length + auditRows.length;

        return {
            generatedAt: new Date(),
            generatedBy: "Admin Dashboard",
            overview,
            revenueByMonth,
            bookingsByType,
            classPopularity,
            clientGrowth,
            membershipStatus,
            topTrainers,
            dailyPassPricingDistribution: dailyPassPricing,
            paymentSummary,
            membershipGrowthDistribution,
            timeframeLabel: `${normalizedMonths} month${normalizedMonths > 1 ? "s" : ""}`,
            appliedFilters: selectedFilters,
            appliedFiltersLabel: selectedFilters.length > 0 ? selectedFilters.map((item) => `${item.label}: ${item.value}`).join(", ") : "none",
            totalRecordsIncluded,
            sections: {
                clients: {
                    summary: {
                        totalClients: clientRows.length,
                        active: clientRows.filter((item) => String(item.status).toLowerCase() === "active").length,
                        inactive: clientRows.filter((item) => String(item.status).toLowerCase() !== "active").length,
                        discountedClients: clientRows.filter((item) => item.discounted).length,
                        nonDiscountedClients: clientRows.filter((item) => !item.discounted).length,
                        male: clientRows.filter((item) => String(item.gender).toLowerCase() === "male").length,
                        female: clientRows.filter((item) => String(item.gender).toLowerCase() === "female").length,
                        other: clientRows.filter((item) => !["male", "female"].includes(String(item.gender).toLowerCase())).length
                    },
                    rows: clientRows
                },
                trainers: {
                    summary: {
                        totalTrainers: trainerRows.length,
                        activeTrainers: trainerRows.filter((item) => String(item.status).toLowerCase() === "active").length,
                        inactiveTrainers: trainerRows.filter((item) => String(item.status).toLowerCase() !== "active").length,
                        averageRate: trainerRows.reduce((sum, item) => sum + Number(item.rate || 0), 0) / Math.max(trainerRows.length, 1),
                        averageMaxHours: trainerRows.reduce((sum, item) => sum + Number(item.availability || 0), 0) / Math.max(trainerRows.length, 1)
                    },
                    rows: trainerRows
                },
                memberships: {
                    summary: {
                        active: membershipRows.filter((item) => String(item.status).toLowerCase() === "active").length,
                        expired: membershipRows.filter((item) => String(item.status).toLowerCase() === "expired").length,
                        frozen: membershipRows.filter((item) => item.frozen).length,
                        suspended: membershipRows.filter((item) => String(item.status).toLowerCase() === "suspended").length
                    },
                    rows: membershipRows
                },
                payments: {
                    summary: {
                        totalTransactions: paymentRows.length,
                        paid: paymentRows.filter((item) => String(item.status).toUpperCase() === "PAID").length,
                        pending: paymentRows.filter((item) => String(item.status).toUpperCase() === "PENDING").length,
                        failed: paymentRows.filter((item) => String(item.status).toUpperCase() === "FAILED").length,
                        cancelled: paymentRows.filter((item) => String(item.status).toUpperCase() === "CANCELLED").length,
                        revenue: paymentRows.reduce((sum, item) => sum + Number(item.amount || 0), 0)
                    },
                    rows: paymentRows
                },
                plans: {
                    summary: {
                        totalPlans: planRows.length,
                        activePlans: planRows.filter((item) => String(item.status || "active").toLowerCase() === "active").length,
                        inactivePlans: planRows.filter((item) => String(item.status || "active").toLowerCase() !== "active").length
                    },
                    rows: planRows
                },
                pricing: {
                    summary: {
                        regularPricing: pricingRows.filter((item) => String(item.pricingType).toLowerCase() !== "discounted").length,
                        discountedPricing: pricingRows.filter((item) => String(item.pricingType).toLowerCase() === "discounted").length
                    },
                    rows: pricingRows
                },
                classSchedules: {
                    summary: {
                        open: scheduleRows.filter((item) => String(item.status).toLowerCase() === "open").length,
                        closed: scheduleRows.filter((item) => String(item.status).toLowerCase() === "closed").length,
                        completed: scheduleRows.filter((item) => String(item.status).toLowerCase() === "completed").length,
                        cancelled: scheduleRows.filter((item) => String(item.status).toLowerCase() === "cancelled").length,
                        averageCapacity: scheduleRows.reduce((sum, item) => sum + Number(item.capacity || 0), 0) / Math.max(scheduleRows.length, 1)
                    },
                    rows: scheduleRows
                },
                classBookings: {
                    summary: {
                        joined: classBookingRows.filter((item) => String(item.status).toLowerCase() === "joined").length,
                        cancelled: classBookingRows.filter((item) => String(item.status).toLowerCase() === "cancelled").length,
                        completed: classBookingRows.filter((item) => String(item.status).toLowerCase() === "completed").length
                    },
                    rows: classBookingRows
                },
                personalTrainerBookings: {
                    summary: {
                        completed: trainerBookingRows.filter((item) => String(item.status).toLowerCase() === "completed").length,
                        cancelled: trainerBookingRows.filter((item) => String(item.status).toLowerCase() === "cancelled").length,
                        pending: trainerBookingRows.filter((item) => String(item.status).toLowerCase() === "pending").length
                    },
                    rows: trainerBookingRows
                },
                clientPasses: {
                    summary: {
                        totalPasses: clientPassRows.length,
                        active: clientPassRows.filter((item) => String(item.status).toLowerCase() === "active").length,
                        expired: clientPassRows.filter((item) => String(item.status).toLowerCase() === "expired").length,
                        plansUsed: [...new Set(clientPassRows.map((item) => item.plan))].length
                    },
                    rows: clientPassRows
                },
                discountRequests: {
                    summary: {
                        submitted: discountRows.filter((item) => String(item.status).toLowerCase() === "submitted").length,
                        pending: discountRows.filter((item) => String(item.status).toLowerCase() === "pending").length,
                        approved: discountRows.filter((item) => String(item.status).toLowerCase() === "approved").length,
                        rejected: discountRows.filter((item) => String(item.status).toLowerCase() === "rejected").length,
                        approvalRate: discountRows.length ? Math.round((discountRows.filter((item) => ["approved", "rejected"].includes(String(item.status).toLowerCase())).length / discountRows.length) * 100) : 0
                    },
                    rows: discountRows
                },
                auditLogs: {
                    summary: {
                        totalActivities: auditRows.length,
                        successfulActions: auditRows.filter((item) => String(item.status).toLowerCase() === "success").length,
                        failedActions: auditRows.filter((item) => ["fail", "failed", "error"].includes(String(item.status).toLowerCase())).length
                    },
                    rows: auditRows
                }
            },
            relationshipAnalysis: {
                clients: relationshipClients,
                trainers: relationshipTrainers
            },
            rankings
        };
    }

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * client MANAGEMENT ADMIN DASHBOARD
     */
    async clientsManagement(filter, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $addFields: {
                    full_name: {
                        $concat: [
                            { $ifNull: ["$first_name", ""] },
                            " ",
                            { $ifNull: ["$last_name", ""] }
                        ]
                    }
                }
            },

            { $sort: { createdAt: -1 } },

            { $skip: skip },
            { $limit: limit }
        ];

        const clients = await db.collection("clients")
            .aggregate(pipeline)
            .toArray();

        const total = await db.collection("clients")
            .countDocuments(filter);

        return {
            clients,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * membership REQUEST ADMIN DASHBOARD
     */
    
    async membershipRequests(filter, search, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },
            
            // Sort by newest first (descending by createdAt)
            { $sort: { createdAt: -1 } },
            
            // Lookup client data
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            
            // Lookup plan data
            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            
            // Lookup pricing data
            {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "pricing"
                }
            },
            { $unwind: { path: "$pricing", preserveNullAndEmptyArrays: true } },
        ];

        // Add search if provided
        if(search && search.trim().length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } },
                        { "client.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }

        // Add pagination
        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );

        const results = await db.collection("memberships_request").aggregate(pipeline).toArray();

        // Get total count
        const countPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
        ];
        
        if(search && search.trim().length > 0) {
            countPipeline.push({
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } },
                        { "client.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }
        
        countPipeline.push({ $count: "count" });
        
        const countResult = await db.collection("memberships_request").aggregate(countPipeline).toArray();
        const total = countResult[0]?.count || 0;

        return {
            data: results,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * membershipS ADMIN DASHBOARD
     */

    async memberships(filter, search, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

            ...(search ? [{
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),

            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "price"
                }
            },
            { $unwind: { path: "$price", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "memberships_request",
                    let: { membershipId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$membership_id", "$membershipId"] }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 } 
                    ],
                    as: "memberships_request"
                }
            },
            {
                $unwind: {
                    path: "$memberships_request",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "expired"] }, then: 2 },
                                { case: { $eq: ["$status", "cancelled"] }, then: 3 },
                                { case: { $eq: ["$status", "archived"] }, then: 4 }
                            ],
                            default: 5
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    _id: 1,
                    client: {
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email"
                    },
                    plan: {
                        label: "$plan.label",
                        duration_days: "$plan.duration_days",
                        duration: "$plan.duration"
                    },
                    price: {
                        type: "$price.type",
                        price: "$price.price",
                        membership_fee: "$price.membership_fee"
                    },
                    start_date: 1,
                    end_date: 1,
                    status: 1,
                    is_frozen: 1,
                    createdAt: 1,
                    frozen_from: 1,
                    frozen_til: 1,
                    memberships_request: {
                        medical_proof_url: "$memberships_request.medical_proof_url"
                    }
                    
                }
            },

            { $skip: skip },
            { $limit: limit }
        ];

        const result = await db.collection("memberships").aggregate(pipeline).toArray();

        const totalPipeline = pipeline.slice(0, -2); 
        const totalResult = await db.collection("memberships")
            .aggregate([...totalPipeline, { $count: "count" }])
            .toArray();

        const total = totalResult[0]?.count || 0;

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async payments(filter, search, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: "memberships_request",
                    localField: "membership_request_id",
                    foreignField: "_id",
                    as: "request"
                }
            },
            { $unwind: { path: "$request", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

            ...(search ? [{
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),

           

            { $sort: { createdAt: -1 } },

            {
                $project: {
                    _id: 1,
                    date: "$createdAt",
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
                    client: 1,
                    payment_method: 1,
                    type: "$request.request_type",
                    amount: 1,
                    status: 1,
                    external_id: 1
                }
            },

            { $skip: skip },
            { $limit: limit }
        ];

        if (search) {
            pipeline.splice(6, 0, {
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }
            

        const result = await db.collection("payments").aggregate(pipeline).toArray();
        const total = await db.collection("payments").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async classes(page, limit, skip) {
        const { db } = await connectDB();

        const result = await db.collection("classes")
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray()

        const total = await db.collection("classes").countDocuments();

        return {
            page,
            result,
            total,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async schedules(filter, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: "classes",
                    localField: "class_id",
                    foreignField: "_id",
                    as: "class"
                }
            },
            { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "trainers",
                    localField: "trainer_id",
                    foreignField: "_id",
                    as: "trainer"
                }
            },
            { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "bookings",
                    let: { scheduleId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$schedule_id", "$$scheduleId"] },
                                status: { $ne: "cancelled" }
                            }
                        }
                    ],
                    as: "bookings"
                }
            },

            {
                $addFields: {
                    joined_count: { $size: "$bookings" },
                    available_slots: {
                        $subtract: ["$capacity", { $size: "$bookings" }]
                    }
                }
            },

            { $sort: { createdAt: -1 } },

            {
                $project: {
                    _id: 1,
                    class: {
                        class_id: "$class._id",
                        name: "$class.name",
                        default_capacity: "$class.default_capacity"
                    },
                    trainer: {
                        trainer_id: "$trainer._id",
                        first_name: "$trainer.first_name",
                        last_name: "$trainer.last_name",
                        email: "$trainer.email",
                        phone: "$trainer.phone"
                    },
                    start_at: 1,
                    end_at: 1,
                    location: 1,
                    notes: 1,
                    capacity: 1,
                    joined_count: 1,
                    available_slots: 1,
                    status: 1,
                    createdAt: 1
                }
            },

            { $skip: skip },
            { $limit: limit },
            
        ];

        const result = await db.collection("class_schedule").aggregate(pipeline).toArray();
        const total = await db.collection("class_schedule").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async trainers(filter, page, limit, skip) {
        const { db } = await connectDB();
        
        const pipeline = [
            { $match: filter },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 },
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            {
                $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    email: 1,
                    phone: 1,
                    role: 1,
                    status: 1,
                    max_hours: 1,
                    rate: 1,
                    specialization: 1,
                    certification: 1,
                    availability: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,
                    archivedAt: 1,
                    archivedBy: 1,
                    user_type: 1
                }
            }
        ];

        const result = await db.collection("trainers").aggregate(pipeline).toArray();
        const total = await db.collection("trainers").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async pricing(filter, page, limit) {
        const { db } = await connectDB();

        const prices = await db.collection("pricing").aggregate([
            { $match: filter },


            {
                $lookup: {
                    from: "plans", 
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },

            {
                $unwind: {
                    path: "$plan",
                    preserveNullAndEmptyArrays: true
                }
            },

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

    async plans(filter, page, limit) {
        const { db } = await connectDB();
        const plans = await db.collection("plans")
            .aggregate([
            { $match: filter },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
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
        ])
        .toArray();

        const total = await db.collection("plans").countDocuments(filter);

        return { 
            total, page, limit, pages: Math.ceil(total / limit), data: plans };
    }

    async bookings(filter, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").aggregate([
            { $match: filter },
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
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "class_schedule",
                    localField: "schedule_id",
                    foreignField: "_id",
                    as: "schedule"
                }
            },
            {
                $unwind: {
                    path: "$schedule",
                    preserveNullAndEmptyArrays: true
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
                    path: "$trainer",
                    preserveNullAndEmptyArrays: true
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
                $unwind: {
                    path: "$class",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    status: 1,
                    joinedAt: 1,
                    bookedAt: 1,
                    cancelledAt: 1,
                    cancelledBy: 1,
                    cancelReason: 1,
                    notes: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,
                    trainer_id: 1,
                    schedule_id: 1,

                    client: {
                    _id: "$client._id",
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
                    email: "$client.email",
                    phone: "$client.phone"
                    },

                    trainer: {
                    _id: "$trainer._id",
                    first_name: "$trainer.first_name",
                    last_name: "$trainer.last_name",
                    email: "$trainer.email",
                    phone: "$trainer.phone"
                    },

                    schedule: {
                    _id: "$schedule._id",
                    start_at: "$schedule.start_at",
                    end_at: "$schedule.end_at",
                    location: "$schedule.location"
                    },

                    class: {
                        _id: "$class._id",
                        name: "$class.name"
                    }
                }
                },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    statusPriority: 0
                }
            },

            { $skip: (page - 1) * limit },
            { $limit: limit }
        ])
        .toArray();
 

        const total = await db.collection("bookings").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async discounts(filter, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").aggregate([
            { $match: filter },
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
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "memberships_request",
                    localField: "membership_request_id",
                    foreignField: "_id",
                    as: "membership_request"
                }
            },
            { 
                $unwind: {
                    path: "$membership_request",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "plans",
                    localField: "membership_request.plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { 
                $unwind: {
                    path: "$plan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "pricing",
                    localField: "membership_request.pricing_id",
                    foreignField: "_id",
                    as: "pricing"
                }
            },
            { 
                $unwind: {
                    path: "$pricing",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    selfie_url: 1,
                    id_url: 1,
                    reviewed_at: 1,
                    reviewed_by: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,

                    client: {
                        _id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email",
                        phone: "$client.phone"
                    },

                    membership_request: {
                        _id: "$membership_request._id",
                        is_discounted: "$membership_request.is_discounted",
                        request_type: "$membership_request.request_type",
                        freeze_start_date: "$membership_request.freeze_start_date",
                        freeze_end_date: "$membership_request.freeze_end_date",
                        medical_proof_url: "$membership_request.medical_proof_url",
                    },

                    plan: {
                        _id: "$plan._id",
                        label: "$plan.label",
                        duration_days: "$plan.duration_days",
                        duration: "$plan.duration",
                    },

                    pricing: {
                        _id: "$pricing._id",
                        price: "$pricing.price",
                        membership_fee: "$pricing.membership_fee",
                        type: "$pricing.type",
                    }
                }
                },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    statusPriority: 0
                }
            },

            { $skip: (page - 1) * limit },
            { $limit: limit }
        ])
        .toArray();

        const total = await db.collection("discount_requests").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async airecommendations(filter, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("business_recommendations").aggregate([
            { $match: filter },

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
                    path: "$client",
                    preserveNullAndEmptyArrays: true
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
                    path: "$trainer",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    _id: 1,
                    parent_id: 1,
                    version: 1,
                    status: 1,
                    createdAt: 1,
                    createdBy: 1,

                    title: "$recommendation.title",
                    summary: "$recommendation.summary",
                    estimated_difficulty: "$recommendation.estimated_difficulty",

                    trainer_decision: {
                        decision: "$trainer_decision.decision",
                        comment: "$trainer_decision.comment",
                        decidedAt: "$trainer_decision.decidedAt",
                        decidedBy: "$trainer_decision.decidedBy"
                    },

                    client: {
                        _id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email"
                    },

                    trainer: {
                        _id: "$trainer._id",
                        first_name: "$trainer.first_name",
                        last_name: "$trainer.last_name",
                        email: "$trainer.email"
                    }
                }
            },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "pending"] }, then: 1 },
                                { case: { $eq: ["$status", "approved"] }, then: 2 },
                                { case: { $eq: ["$status", "rejected"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    statusPriority: 0
                }
            },
    
            { $skip: (page - 1) * limit },
            { $limit: limit }

        ]).toArray();

        const total = await db.collection("business_recommendations").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async membershipconfig(filter, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit;

        const result = await db.collection("membership_config").aggregate([
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 },
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        const total = await db.collection("membership_config").countDocuments(filter);

        if (!result.length) {
            return {
                page,
                limit,
                result: [],
                total: 0,
                totalPages: 0
            };
        }

        return {
            page,
            limit,
            result,
            total,
            totalPages: Math.ceil(total / limit)
        };
    }
} 

export default new AdminDashboardModel();