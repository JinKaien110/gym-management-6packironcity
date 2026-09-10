import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { ObjectId } from "mongodb";
import { hashedPassword } from "../utils/hashedPassword.js";
import { emailCreateAdmin } from "../templates/auth/email.createAdmin.js";
import { sendEmail } from "./email.service.js";
import { emailUpdateAdminPassword } from "../templates/auth/email.updatePassword.js";
import AdminDashboardModel from "../models/AdminDashboardModel.js";
import PDFDocument from "pdfkit";


class AdminDashboardService {
    async dashboard() {
        const [dashboard, recentActivities, todaysClasses, pendingApprovals, revenueThisMonthCard] = await Promise.all([
            AdminDashboardModel.dashboard(),
            AdminDashboardModel.recentActivities(),
            AdminDashboardModel.todaysClasses(),
            AdminDashboardModel.pendingApprovals(),
            AdminDashboardModel.revenueThisMonthCard()
        ]);

        return {
            dashboard,
            recentActivities,
            todaysClasses,
            pendingApprovals,
            revenueThisMonthCard
        }
    }

    async clientsManagement(query) {
        let { status, fitness_goal, gender, search, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit)
        const skip = (page - 1) * limit

        let filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(fitness_goal) {

            const goals = Array.isArray(fitness_goal)
                ? fitness_goal
                : [fitness_goal];

            filter.fitness_goal = {
                $in: goals.map(g => g.trim().toLowerCase())
            }
        }
        
        if(gender) {
            filter.gender = gender.trim().toLowerCase()
        }

        filter.role = "client";

        if (search) {
            filter.$or = [
                { first_name: { $regex: search, $options: "i" } },
                { last_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        return await AdminDashboardModel.clientsManagement(filter, page, limit, skip);
    }

    async membershipRequests(query) {
        let { status, request_type, search, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit)
        const skip = (page - 1) * limit

        let filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(request_type) {
            filter.request_type = request_type.trim().toLowerCase();
        }

        if(search) {
            search = search.trim().toLowerCase()
        }

        return AdminDashboardModel.membershipRequests(filter, search, page, limit, skip);
    }

    async memberships(query) {
        let { start_date, end_date, status, plan_id, search, page = 1, limit = 10} = query;
        
        let filter = {};
        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit

        if(start_date) {
            filter.end_date = { $gte: new Date(start_date) }; 
        }

        if(end_date) {
            filter.start_date = { $lte: new Date(end_date) }; 
        }

        if(plan_id) {
            filter.plan_id = new ObjectId(plan_id)
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(status === "frozen") {
            filter.is_frozen = true
        }

        if(search) {
            search = search.trim().toLowerCase()
        }

        return AdminDashboardModel.memberships(filter, search, page, limit, skip);
    }

    async payments(query) {
        let { 
            status, 
            payment_method, 
            search, 
            start_date,
            end_date,
            page = 1, 
            limit = 10 
        } = query;

        let filter = {};

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        if (start_date || end_date) {
            filter.createdAt = {};

            if (start_date) {
                filter.createdAt.$gte = new Date(start_date);
            }

            if (end_date) {
                filter.createdAt.$lte = new Date(end_date);
            }
        }

        if (status) {
            filter.status = status.trim()
        }

        if (payment_method) {
            filter.payment_method = payment_method.trim().toLowerCase();
        }
        
        if (search) {
            search = search.trim().toLowerCase();
        }

        return AdminDashboardModel.payments(filter, search, page, limit, skip);
    }

    async classes(query) {
        let { page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;
        
        return AdminDashboardModel.classes(page, limit, skip);
    }

    async schedules(query) {
        let { class_id, start_at, end_at, trainer_id, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        let filter = {};

        if (class_id) {
            filter.class_id = new ObjectId(class_id);
        }

        if (trainer_id) {
            filter.trainer_id = new ObjectId(trainer_id);
        }

        if (status) {
            filter.status = status.trim().toLowerCase();
        }


        if (start_at || end_at) {
            filter.start_at = {};

            if (start_at) {
                filter.start_at.$gte = new Date(start_at);
            }

            if (end_at) {
                const end = new Date(end_at);
                end.setHours(23, 59, 59, 999);
                filter.start_at.$lte = end;
            }
        }

        return AdminDashboardModel.schedules(filter, page, limit, skip);
    }

    async trainers(query) {
        let { search, specialization, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        let filter = {};

        filter.role = "trainer";

        if (search) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { first_name: searchRegex },
                { last_name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ];
        }

        if (specialization) {
            filter.specialization = { $in: Array.isArray(specialization) ? specialization : [specialization] };
        }

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        return AdminDashboardModel.trainers(filter, page, limit, skip);
    }

    async pricing(query) {
        let { price, membership_fee, status, type, page = 1, limit = 10 } = query;
                
        page = Number(page);
        limit = Number(limit);
        price = Number(price);
        membership_fee = Number(membership_fee);

        const filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(price) {
            filter.price = price;
        }

        if(membership_fee) {
            filter.membership_fee = membership_fee;
        }

        if(type) {
            filter.type = String(type).trim().toLowerCase();
        }

        return await AdminDashboardModel.pricing(filter, page, limit);
    }

    async plans(query) {
        let { status, label, page = 1, limit = 10 } = query;
        
        page = Number(page)
        limit = Number(limit)
    
        const filter = {};
    
        if(status) {
            filter.status = status.trim().toLowerCase();
        }
    
        if(label) {
            filter.label = label.trim().toLowerCase();
        }
    
        return await AdminDashboardModel.plans(filter, page, limit);
    }

async bookings(query) {
        let { status, client_id, trainer_id, schedule_id, type, page = 1, limit = 10 } = query;
        
        page = Number(page)
        limit = Number(limit)
    
        const filter = {};
    
        if(status) {
            filter.status = status.trim().toLowerCase();
        }
    
        if(client_id) {
            filter.client_id = new ObjectId(client_id)
        }

        if(trainer_id) {
            filter.trainer_id = new ObjectId(trainer_id)
        }

        if(schedule_id) {
            filter.schedule_id = new ObjectId(schedule_id)
        }

        if(type) {
            filter.type = type.trim().toLowerCase();
        }
    
        return await AdminDashboardModel.bookings(filter, page, limit);
    }

    async discounts(query) {
        let { 
            status, 
            discount_type, 
            client_id, 
            start_date, 
            end_date, 
            page = 1, 
            limit = 10 
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        if (discount_type) {
            filter.discount_type = discount_type.trim();
        }

        if (client_id && ObjectId.isValid(client_id)) {
            filter.client_id = new ObjectId(client_id);
        }

        if (start_date || end_date) {
            filter.createdAt = {};

            if (start_date) {
                filter.createdAt.$gte = new Date(start_date);
            }

            if (end_date) {
                filter.createdAt.$lte = new Date(end_date);
            }
        }

        return await AdminDashboardModel.discounts(filter, page, limit);
    }

    async airecommendations(query) {
        let { 
            status, 
            client_id,
            trainer_id,
            start_date, 
            end_date, 
            page = 1, 
            limit = 10 
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (status) {
            filter.status = status.trim().toLowerCase();
        }

        if (client_id && ObjectId.isValid(client_id)) {
            filter.client_id = new ObjectId(client_id);
        }

        if (trainer_id && ObjectId.isValid(trainer_id)) {
            filter.trainer_id = new ObjectId(trainer_id);
        }

        if (start_date || end_date) {
            const dateFilter = {};

            if (start_date) {
                const start = new Date(start_date);
                if (!isNaN(start)) {
                    start.setHours(0, 0, 0, 0);
                    dateFilter.$gte = start;
                }
            }

            if (end_date) {
                const end = new Date(end_date);
                if (!isNaN(end)) {
                    end.setHours(23, 59, 59, 999);
                    dateFilter.$lte = end;
                }
            }

            if (Object.keys(dateFilter).length > 0) {
                filter.createdAt = dateFilter;
            }
        }

        return await AdminDashboardModel.airecommendations(filter, page, limit);
    }

    async membershipconfig(query) {
        let {
            search,
            duration,
            min_fee,
            max_fee,
            min_days,
            max_days,
            perks,
            page = 1,
            limit = 10,
        } = query;

        page = Number(page);
        limit = Number(limit);

        const filter = {};

        if (search) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        if (duration) {
            filter.duration = String(duration).toLowerCase().trim();
        }

        if (min_fee || max_fee) {
            filter.fee = {};
            if (min_fee) filter.fee.$gte = Number(min_fee);
            if (max_fee) filter.fee.$lte = Number(max_fee);
        }

        if (min_days || max_days) {
            filter.duration_days = {};
            if (min_days) filter.duration_days.$gte = Number(min_days);
            if (max_days) filter.duration_days.$lte = Number(max_days);
        }

        if (perks) {
            const perksArray = Array.isArray(perks)
                ? perks
                : [perks];

            filter.perks = {
                $in: perksArray.map(p => String(p).toLowerCase().trim())
            };
        }


        return await AdminDashboardModel.membershipconfig(filter, page, limit);
    }

    normalizeAnalyticsFilters(query = {}) {
        const parsedFilters = (() => {
            if (!query?.filters) return {};

            if (typeof query.filters === "string") {
                try {
                    return JSON.parse(query.filters);
                } catch (error) {
                    return {};
                }
            }

            return query.filters;
        })();

        const normalizedQuery = {
            ...parsedFilters,
            ...query,
        };

        if (normalizedQuery.filters) {
            delete normalizedQuery.filters;
        }

        return normalizedQuery;
    }

    async analytics(query = {}) {
        const normalizedQuery = this.normalizeAnalyticsFilters(query);
        const reportData = await AdminDashboardModel.exportPDF(normalizedQuery);

        return {
            overview: reportData.overview,
            revenueByMonth: reportData.revenueByMonth,
            bookingsByType: reportData.bookingsByType,
            classPopularity: reportData.classPopularity,
            clientGrowth: reportData.clientGrowth,
            membershipStatus: reportData.membershipStatus,
            topTrainers: reportData.topTrainers,
            paymentSummary: reportData.paymentSummary,
            dailyPassPricingDistribution: reportData.dailyPassPricingDistribution,
            membershipGrowthDistribution: reportData.membershipGrowthDistribution,
            reportData
        };
    }

    async exportAuditLogs(req, res) {
        const { collection, limit = 200, page = 1 } = req.query || {};
        const normalizedCollection = String(collection || "").trim().toLowerCase();

        if (normalizedCollection !== "audit_logs") {
            return res.status(400).json({
                success: false,
                message: "Invalid collection specified for export."
            });
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
        const safePage = Math.max(Number(page) || 1, 1);
        const auditLogs = await AdminDashboardModel.getAuditLogsForPdf({
            limit: safeLimit,
            page: safePage
        });

        const formattedLogs = auditLogs.map((audit) => ({
            _id: audit._id ? String(audit._id) : "",
            timestamp: audit.timestamp || "",
            actor: audit.actorName || "System",
            role: audit.role || "Unknown",
            action: audit.action || "Action",
            entity: audit.entity || "N/A",
            entityId: audit.entityId || "",
            summary: audit.summary || "",
            status: audit.status || "success",
            method: audit.method || "",
            endpoint: audit.endpoint || "",
            ipAddress: audit.ipAddress || "",
            requestId: audit.requestId || "",
            error: audit.error || ""
        }));

        return res.status(200).json({
            success: true,
            collection: "audit_logs",
            total: formattedLogs.length,
            data: formattedLogs,
            items: formattedLogs
        });
    }

    async exportBookings(req, res) {
        const { collection, limit = 200, page = 1 } = req.query || {};
        const normalizedCollection = String(collection || "").trim().toLowerCase();

        if (normalizedCollection !== "bookings") {
            return res.status(400).json({
                success: false,
                message: "Invalid collection specified for export."
            });
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
        const safePage = Math.max(Number(page) || 1, 1);
        const bookings = await AdminDashboardModel.getBookingsForPdf({
            limit: safeLimit,
            page: safePage
        });

        const formattedBookings = bookings.map((booking) => ({
            _id: booking._id ? String(booking._id) : "",
            schedule_id: booking.schedule_id ? String(booking.schedule_id) : "",
            client_id: booking.client_id ? String(booking.client_id) : "",
            clientName: booking.clientName || "—",
            trainerName: booking.trainerName || "—",
            status: booking.status || "pending",
            type: booking.type || "class",
            joinedAt: booking.joinedAt || null,
            cancelledAt: booking.cancelledAt || null,
            cancelledBy: booking.cancelledBy ? String(booking.cancelledBy) : null,
            cancelReason: booking.cancelReason || null,
            createdAt: booking.createdAt || null,
            createdBy: booking.createdBy ? String(booking.createdBy) : null,
            updatedAt: booking.updatedAt || null,
            updatedBy: booking.updatedBy ? String(booking.updatedBy) : null
        }));

        return res.status(200).json({
            success: true,
            collection: "bookings",
            total: formattedBookings.length,
            data: formattedBookings,
            items: formattedBookings
        });
    }

    async exportMemberships(req, res) {
        const { collection, limit = 200, page = 1 } = req.query || {};
        const normalizedCollection = String(collection || "").trim().toLowerCase();

        if (normalizedCollection !== "memberships") {
            return res.status(400).json({
                success: false,
                message: "Invalid collection specified for export."
            });
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
        const safePage = Math.max(Number(page) || 1, 1);
        const memberships = await AdminDashboardModel.getMembershipsForPdf({
            limit: safeLimit,
            page: safePage
        });

        const formattedMemberships = memberships.map((membership) => ({
            _id: membership._id ? String(membership._id) : "",
            client_id: membership.client_id ? String(membership.client_id) : "",
            clientName: membership.clientName || "—",
            payment_id: membership.payment_id ? String(membership.payment_id) : "",
            start_date: membership.start_date || null,
            end_date: membership.end_date || null,
            status: membership.status || "pending",
            is_frozen: membership.is_frozen ?? false,
            frozen_from: membership.frozen_from || null,
            frozen_til: membership.frozen_til || null,
            frozenBy: membership.frozenBy ? String(membership.frozenBy) : null,
            unfrozenAt: membership.unfrozenAt || null,
            createdAt: membership.createdAt || null,
            createdBy: membership.createdBy ? String(membership.createdBy) : null,
            updatedAt: membership.updatedAt || null,
            updatedBy: membership.updatedBy ? String(membership.updatedBy) : null,
            archivedAt: membership.archivedAt || null,
            archivedBy: membership.archivedBy ? String(membership.archivedBy) : null
        }));

        return res.status(200).json({
            success: true,
            collection: "memberships",
            total: formattedMemberships.length,
            data: formattedMemberships,
            items: formattedMemberships
        });
    }

    async analyticsExportPDF(query, res) {
        const normalizedQuery = this.normalizeAnalyticsFilters(query);
        const exportData = await AdminDashboardModel.exportPDF(normalizedQuery);
        const doc = new PDFDocument({ margin: 36, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="admin-analytics-${new Date().toISOString().split("T")[0]}.pdf"`
        );

        doc.pipe(res);

        const formatCurrency = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const formatDate = (dateString) => {
            if (!dateString) return "—";
            return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        };
        const valueText = (value) => {
            if (value === null || value === undefined || value === "") return "—";
            if (typeof value === "boolean") return value ? "Yes" : "No";
            if (typeof value === "number") return value.toLocaleString();
            return String(value);
        };
        const ensureSpace = (label, value) => {
            if (doc.y > 720) {
                doc.addPage();
            }
            doc.fontSize(9).font("Helvetica").text(`${label}: ${valueText(value)}`);
        };
        const addSectionTitle = (title) => {
            if (doc.y > 720) {
                doc.addPage();
            }
            doc.moveDown(0.3);
            doc.fontSize(12).font("Helvetica-Bold").text(title, { underline: true });
            doc.moveDown(0.2);
        };
        const addSummaryBlock = (title, items) => {
            addSectionTitle(title);
            items.forEach((item) => ensureSpace(item.label, item.value));
            doc.moveDown(0.4);
        };
        const addSimpleTable = (headers, rows, widths) => {
    const left = doc.page.margins.left;
    const rowPadding = 5;
    const lineHeight = 11;

    const drawHeader = () => {
        doc.font("Helvetica-Bold").fontSize(8);

        let x = left;
        const y = doc.y;

        headers.forEach((header, i) => {
            const w = widths[i];
            doc.text(header, x + 2, y + 2, {
                width: w - 4,
                align: "left",
            });

            doc.rect(x, y, w, 18).stroke();

            x += w;
        });

        doc.y = y + 18;
        doc.font("Helvetica");
    };

    if (doc.y > 700) doc.addPage();

    drawHeader();

    rows.forEach((row) => {

        // Calculate tallest cell first
        let rowHeight = 0;

        row.forEach((cell, i) => {

            const text =
                String(cell ?? "").length > 60
                    ? String(cell).slice(0, 57) + "..."
                    : String(cell ?? "");

            const h = doc.heightOfString(text, {
                width: widths[i] - 6,
                align: "left",
            });

            rowHeight = Math.max(rowHeight, h);
        });

        rowHeight += rowPadding * 2;

        // New page if needed
        if (doc.y + rowHeight > 760) {
            doc.addPage();
            drawHeader();
        }

        const startY = doc.y;
        let x = left;

        row.forEach((cell, i) => {

            const text =
                String(cell ?? "").length > 60
                    ? String(cell).slice(0, 57) + "..."
                    : String(cell ?? "");

            doc.rect(x, startY, widths[i], rowHeight).stroke();

            doc.text(text, x + 3, startY + rowPadding, {
                width: widths[i] - 6,
                align: "left",
            });

            x += widths[i];
        });

        doc.y = startY + rowHeight;
    });

    doc.moveDown();
};

        doc.fontSize(18).font("Helvetica-Bold").text("Gym Membership Management System - Analytics Report", { align: "left" });
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#6b7280").text(`Generated At: ${new Date().toLocaleString()}`);
        doc.text(`Generated By: ${exportData.generatedBy || "Admin Dashboard"}`);
        doc.text(`Timeframe: ${exportData.timeframeLabel}`);
        doc.text(`Applied Filters: ${exportData.appliedFiltersLabel}`);
        doc.text(`Total Records Included: ${exportData.totalRecordsIncluded}`);
        doc.moveDown(0.8);

        doc.fillColor("#111827");
        doc.fontSize(13).font("Helvetica-Bold").text("PART I - EXECUTIVE ANALYTICS DASHBOARD", { underline: true });
        doc.moveDown(0.3);

        addSummaryBlock("Executive Overview", [
            { label: "Total clients", value: exportData.overview.totalClients },
            { label: "Active memberships", value: exportData.overview.activeMemberships },
            { label: "Active trainers", value: exportData.overview.totalTrainers },
            { label: "Open classes", value: exportData.overview.activeClasses },
            { label: "Revenue this period", value: formatCurrency(exportData.overview.thisMonthRevenue) },
            { label: "Revenue growth", value: `${exportData.overview.revenueGrowth}%` },
            { label: "Bookings", value: exportData.overview.totalBookings },
            { label: "Pending requests", value: exportData.overview.pendingRequests }
        ]);

        addSummaryBlock("Revenue Summary", [
            { label: "Monthly revenue", value: exportData.revenueByMonth.map((item) => `${item.month}: ${formatCurrency(item.revenue)}`).join(" | ") }
        ]);

        addSummaryBlock("Membership Summary", [
            { label: "Membership status", value: exportData.membershipStatus.map((item) => `${item.name} (${item.value})`).join(" | ") }
        ]);

        addSummaryBlock("Client Growth", [
            { label: "Growth trend", value: exportData.clientGrowth.map((item) => `${item.month}: ${item.clients}`).join(" | ") }
        ]);

        addSummaryBlock("Booking Distribution", [
            { label: "Bookings by type", value: exportData.bookingsByType.map((item) => `${item.name}: ${item.value}`).join(" | ") }
        ]);

        addSummaryBlock("Class Popularity", [
            { label: "Top classes", value: exportData.classPopularity.slice(0, 8).map((item) => `${item.name} (${item.bookings})`).join(" | ") }
        ]);

        addSummaryBlock("Top Trainers", [
            { label: "Top trainers", value: exportData.topTrainers.slice(0, 8).map((item) => `${item.name} (${item.count})`).join(" | ") }
        ]);

        addSummaryBlock("Payment Summary", [
            { label: "Transactions", value: exportData.paymentSummary.totalTransactions },
            { label: "Paid", value: exportData.paymentSummary.paidCount },
            { label: "Pending", value: exportData.paymentSummary.pendingCount },
            { label: "Failed", value: exportData.paymentSummary.failedCount },
            { label: "Revenue captured", value: formatCurrency(exportData.paymentSummary.totalRevenue) }
        ]);

        doc.addPage();
        doc.fontSize(13).font("Helvetica-Bold").text("PART II - DETAILED TABULAR REPORT", { underline: true });
        doc.moveDown(0.3);

        const clientSection = exportData.sections?.clients || {};
        addSectionTitle("SECTION 1 - CLIENTS");
        addSummaryBlock("Summary", [
            { label: "Total clients", value: clientSection.summary?.totalClients || 0 },
            { label: "Active", value: clientSection.summary?.active || 0 },
            { label: "Inactive", value: clientSection.summary?.inactive || 0 },
            { label: "Discounted clients", value: clientSection.summary?.discountedClients || 0 },
            { label: "Male", value: clientSection.summary?.male || 0 },
            { label: "Female", value: clientSection.summary?.female || 0 },
            { label: "Other/Not specified", value: clientSection.summary?.other || 0 }
        ]);
        addSimpleTable(
            ["Client ID", "Name", "Email", "Phone", "Gender", "Status", "Created Date"],
            (clientSection.rows || []).slice(0, 40).map((row) => [
                row.clientId?.slice(0, 12) || "—",
                `${row.firstName || ""} ${row.lastName || ""}`.trim(),
                row.email || "—",
                row.phone || "—",
                row.gender || "—",
                row.status || "—",
                formatDate(row.createdDate)
            ]),
            [70, 90, 90, 70, 45, 45, 55]
        );

        const trainerSection = exportData.sections?.trainers || {};
        addSectionTitle("SECTION 2 - TRAINERS");
        addSummaryBlock("Summary", [
            { label: "Total trainers", value: trainerSection.summary?.totalTrainers || 0 },
            { label: "Active trainers", value: trainerSection.summary?.activeTrainers || 0 },
            { label: "Inactive trainers", value: trainerSection.summary?.inactiveTrainers || 0 },
            { label: "Average rate", value: formatCurrency(trainerSection.summary?.averageRate || 0) },
            { label: "Average max hours", value: trainerSection.summary?.averageMaxHours || 0 }
        ]);
        addSimpleTable(
            ["Trainer ID", "Name", "Email", "Specializations", "Rate", "Status"],
            (trainerSection.rows || []).slice(0, 40).map((row) => [
                row.trainerId?.slice(0, 12) || "—",
                row.name || "—",
                row.email || "—",
                valueText(row.specializations),
                formatCurrency(row.rate || 0),
                row.status || "—"
            ]),
            [70, 80, 95, 90, 50, 45]
        );

        const membershipSection = exportData.sections?.memberships || {};
        addSectionTitle("SECTION 3 - MEMBERSHIPS");
        addSummaryBlock("Summary", [
            { label: "Active", value: membershipSection.summary?.active || 0 },
            { label: "Expired", value: membershipSection.summary?.expired || 0 },
            { label: "Frozen", value: membershipSection.summary?.frozen || 0 },
            { label: "Suspended", value: membershipSection.summary?.suspended || 0 }
        ]);
        addSimpleTable(
            ["Membership ID", "Client", "Plan", "Start Date", "End Date", "Status"],
            (membershipSection.rows || []).slice(0, 40).map((row) => [
                row.membershipId?.slice(0, 12) || "—",
                row.client || "—",
                row.plan || "—",
                formatDate(row.startDate),
                formatDate(row.endDate),
                row.status || "—"
            ]),
            [70, 80, 70, 55, 55, 45]
        );

        const paymentSection = exportData.sections?.payments || {};
        addSectionTitle("SECTION 4 - PAYMENTS");
        addSummaryBlock("Summary", [
            { label: "Total transactions", value: paymentSection.summary?.totalTransactions || 0 },
            { label: "Paid", value: paymentSection.summary?.paid || 0 },
            { label: "Pending", value: paymentSection.summary?.pending || 0 },
            { label: "Failed", value: paymentSection.summary?.failed || 0 },
            { label: "Cancelled", value: paymentSection.summary?.cancelled || 0 },
            { label: "Revenue", value: formatCurrency(paymentSection.summary?.revenue || 0) }
        ]);
        addSimpleTable(
            ["Payment Ref", "Client", "Amount", "Status", "Method", "Created Date"],
            (paymentSection.rows || []).slice(0, 40).map((row) => [
                row.paymentReference || "—",
                row.client || "—",
                formatCurrency(row.amount || 0),
                row.status || "—",
                row.paymentMethod || "—",
                formatDate(row.createdDate)
            ]),
            [80, 90, 50, 45, 55, 55]
        );

        const planSection = exportData.sections?.plans || {};
        addSectionTitle("SECTION 5 - PLANS");
        addSummaryBlock("Summary", [
            { label: "Total plans", value: planSection.summary?.totalPlans || 0 },
            { label: "Active plans", value: planSection.summary?.activePlans || 0 },
            { label: "Inactive plans", value: planSection.summary?.inactivePlans || 0 }
        ]);
        addSimpleTable(
            ["Plan", "Duration", "Membership Count", "Unique Clients"],
            (planSection.rows || []).slice(0, 30).map((row) => [
                row.plan || "—",
                row.duration || "—",
                row.membershipCount || 0,
                row.uniqueClients || 0
            ]),
            [90, 55, 50, 50]
        );

        const pricingSection = exportData.sections?.pricing || {};
        addSectionTitle("SECTION 6 - PRICING");
        addSummaryBlock("Summary", [
            { label: "Regular pricing", value: pricingSection.summary?.regularPricing || 0 },
            { label: "Discounted pricing", value: pricingSection.summary?.discountedPricing || 0 }
        ]);
        addSimpleTable(
            ["Pricing ID", "Plan", "Type", "Price", "Membership Fee"],
            (pricingSection.rows || []).slice(0, 30).map((row) => [
                row._id?.toString().slice(0, 12) || "—",
                row.plan || "—",
                row.pricingType || "—",
                formatCurrency(row.price || 0),
                formatCurrency(row.membershipFee || 0)
            ]),
            [70, 90, 55, 55, 60]
        );

        const scheduleSection = exportData.sections?.classSchedules || {};
        addSectionTitle("SECTION 7 - CLASS SCHEDULES");
        addSummaryBlock("Summary", [
            { label: "Open", value: scheduleSection.summary?.open || 0 },
            { label: "Closed", value: scheduleSection.summary?.closed || 0 },
            { label: "Completed", value: scheduleSection.summary?.completed || 0 },
            { label: "Cancelled", value: scheduleSection.summary?.cancelled || 0 },
            { label: "Average capacity", value: scheduleSection.summary?.averageCapacity || 0 }
        ]);
        addSimpleTable(
            ["Schedule", "Class", "Trainer", "Location", "Booked", "Status"],
            (scheduleSection.rows || []).slice(0, 30).map((row) => [
                row.schedule?.slice(0, 12) || "—",
                row.className || "—",
                row.trainer || "—",
                row.location || "—",
                row.booked || 0,
                row.status || "—"
            ]),
            [70, 80, 75, 70, 35, 45]
        );

        const classBookingSection = exportData.sections?.classBookings || {};
        addSectionTitle("SECTION 8A - CLASS BOOKINGS");
        addSummaryBlock("Summary", [
            { label: "Joined", value: classBookingSection.summary?.joined || 0 },
            { label: "Cancelled", value: classBookingSection.summary?.cancelled || 0 },
            { label: "Completed", value: classBookingSection.summary?.completed || 0 }
        ]);
        addSimpleTable(
            ["Booking ID", "Client", "Class", "Trainer", "Status"],
            (classBookingSection.rows || []).slice(0, 30).map((row) => [
                row.bookingId?.slice(0, 12) || "—",
                row.client || "—",
                row.className || "—",
                row.trainer || "—",
                row.status || "—"
            ]),
            [70, 85, 80, 80, 45]
        );

        const trainerBookingSection = exportData.sections?.personalTrainerBookings || {};
        addSectionTitle("SECTION 8B - PERSONAL TRAINER BOOKINGS");
        addSummaryBlock("Summary", [
            { label: "Completed", value: trainerBookingSection.summary?.completed || 0 },
            { label: "Cancelled", value: trainerBookingSection.summary?.cancelled || 0 },
            { label: "Pending", value: trainerBookingSection.summary?.pending || 0 }
        ]);
        addSimpleTable(
            ["Booking ID", "Client", "Trainer", "Status"],
            (trainerBookingSection.rows || []).slice(0, 30).map((row) => [
                row.bookingId?.slice(0, 12) || "—",
                row.client || "—",
                row.trainer || "—",
                row.status || "—"
            ]),
            [70, 85, 85, 45]
        );

        const clientPassSection = exportData.sections?.clientPasses || {};
        addSectionTitle("SECTION 9 - CLIENT PASSES");
        addSummaryBlock("Summary", [
            { label: "Total passes", value: clientPassSection.summary?.totalPasses || 0 },
            { label: "Active", value: clientPassSection.summary?.active || 0 },
            { label: "Expired", value: clientPassSection.summary?.expired || 0 },
            { label: "Plans used", value: clientPassSection.summary?.plansUsed || 0 }
        ]);
        addSimpleTable(
            ["Reference", "Client", "Plan", "Status"],
            (clientPassSection.rows || []).slice(0, 30).map((row) => [
                row.reference?.slice(0, 12) || "—",
                row.client || "—",
                row.plan || "—",
                row.status || "—"
            ]),
            [70, 90, 90, 45]
        );

        const discountSection = exportData.sections?.discountRequests || {};
        addSectionTitle("SECTION 10 - DISCOUNT REQUESTS");
        addSummaryBlock("Summary", [
            { label: "Submitted", value: discountSection.summary?.submitted || 0 },
            { label: "Pending", value: discountSection.summary?.pending || 0 },
            { label: "Approved", value: discountSection.summary?.approved || 0 },
            { label: "Rejected", value: discountSection.summary?.rejected || 0 },
            { label: "Approval rate", value: `${discountSection.summary?.approvalRate || 0}%` }
        ]);
        addSimpleTable(
            ["Client", "Submitted Date", "Reviewed Date", "Status", "Reviewer"],
            (discountSection.rows || []).slice(0, 30).map((row) => [
                row.client || "—",
                formatDate(row.submittedDate),
                formatDate(row.reviewedDate),
                row.status || "—",
                row.reviewer || "—"
            ]),
            [90, 60, 60, 45, 80]
        );

        const auditSection = exportData.sections?.auditLogs || {};
        addSectionTitle("SECTION 11 - AUDIT LOGS");
        addSummaryBlock("Summary", [
            { label: "Total activities", value: auditSection.summary?.totalActivities || 0 },
            { label: "Successful actions", value: auditSection.summary?.successfulActions || 0 },
            { label: "Failed actions", value: auditSection.summary?.failedActions || 0 }
        ]);
        addSimpleTable(
            ["Timestamp", "Actor", "Action", "Entity", "Status"],
            (auditSection.rows || []).slice(0, 30).map((row) => [
                formatDate(row.timestamp),
                row.actorName || "—",
                row.action || "—",
                row.entity || "—",
                row.status || "—"
            ]),
            [70, 80, 70, 80, 45]
        );

        addSectionTitle("RELATIONSHIP ANALYSIS");
        const relationshipClients = (exportData.relationshipAnalysis?.clients || []).slice(0, 20);
        addSimpleTable(
            ["Client", "Membership", "Payments", "Revenue", "Classes", "Sessions"],
            relationshipClients.map((row) => [
                row.clientName || "—",
                row.currentMembership || "—",
                row.totalPayments || 0,
                formatCurrency(row.revenueGenerated || 0),
                row.classesJoined || 0,
                row.trainerSessions || 0
            ]),
            [90, 60, 40, 55, 35, 35]
        );

        addSectionTitle("TOP RANKINGS");
        const rankings = exportData.rankings || {};
        addSimpleTable(
            ["Ranking", "Label", "Value"],
            [
                ...rankings.highestPayingClients.slice(0, 5).map((row, index) => [`Highest Paying ${index + 1}`, row.firstName || row.clientId || "—", formatCurrency(row.totalPaidAmount || 0)]),
                ...rankings.mostActiveClients.slice(0, 5).map((row, index) => [`Most Active ${index + 1}`, `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.clientId || "—", (row.classBookings || 0) + (row.trainerSessions || 0)]),
                ...rankings.mostPopularTrainers.slice(0, 5).map((row, index) => [`Popular Trainer ${index + 1}`, row.name || "—", row.trainerSessions || row.count || 0])
            ],
            [60, 110, 60]
        );

        doc.addPage();
        doc.fontSize(11).font("Helvetica-Bold").text("REPORT FOOTER", { underline: true });
        doc.moveDown(0.3);
        ensureSpace("Generated At", new Date().toLocaleString());
        ensureSpace("Generated By", exportData.generatedBy || "Admin Dashboard");
        ensureSpace("Applied Filters", exportData.appliedFiltersLabel || "none");
        ensureSpace("Total Clients", exportData.sections?.clients?.summary?.totalClients || 0);
        ensureSpace("Total Trainers", exportData.sections?.trainers?.summary?.totalTrainers || 0);
        ensureSpace("Total Revenue", formatCurrency(exportData.sections?.payments?.summary?.revenue || 0));
        ensureSpace("Total Records Included", exportData.totalRecordsIncluded || 0);

        doc.end();
    }
}

export default new AdminDashboardService();