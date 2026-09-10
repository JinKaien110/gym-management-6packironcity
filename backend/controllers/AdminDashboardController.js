import { ValidationError } from "../errors/ValidationError.js";
import AdminDashboardService from "../services/admin.dashboard.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class AdminDashboardController {
    async dashboard(req, res, next) {
        try {
            const result = await AdminDashboardService.dashboard();

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("dashboard Controller: ", error)
            next(error)
        }
    }

    async clientsManagement(req, res, next) {
        try {
            const result = await AdminDashboardService.clientsManagement(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("clientsManagement Controller: ", error)
            next(error)
        }
    }

    async membershipRequests(req, res, next) {
        try {
            const result = await AdminDashboardService.membershipRequests(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("membershipRequests Controller: ", error)
            next(error)
        }
    }

    async memberships(req, res, next) {
        try {
            const result = await AdminDashboardService.memberships(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("memberships Controller: ", error)
            next(error)
        }
    }

    async payments(req, res, next) {
        try {
            const result = await AdminDashboardService.payments(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("payments Controller: ", error)
            next(error)
        }
    }

    async classes(req, res, next) {
        try {
            const result = await AdminDashboardService.classes(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("classes Controller: ", error)
            next(error)
        }
    }

    async schedules(req, res, next) {
        try {
            const result = await AdminDashboardService.schedules(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("schedules Controller: ", error)
            next(error)
        }
    }

    async trainers(req, res, next) {
        try {
            const result = await AdminDashboardService.trainers(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("trainers Controller: ", error)
            next(error)
        }
    }

    async classes(req, res, next) {
        try {
            const result = await AdminDashboardService.classes(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("classes Controller: ", error)
            next(error)
        }
    }

    async pricing(req, res, next) {
        try {
            const result = await AdminDashboardService.pricing(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("pricing Controller: ", error)
            next(error)
        }
    }

    async plans(req, res, next) {
        try {
            const result = await AdminDashboardService.plans(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("plans Controller: ", error)
            next(error)
        }
    }

    async bookings(req, res, next) {
        try {
            const result = await AdminDashboardService.bookings(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("bookings Controller: ", error)
            next(error)
        }
    }

    async discounts(req, res, next) {
        try {
            const result = await AdminDashboardService.discounts(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("discounts Controller: ", error)
            next(error)
        }
    }

    async airecommendations(req, res, next) {
        try {
            const result = await AdminDashboardService.airecommendations(req.query);

            return res.status(201).json(result);
        } catch (error) {
            debuggerLog("airecommendations Controller: ", error)
            next(error)
        }
    }

    async membershipconfig(req, res, next) {
        try {
            const result = await AdminDashboardService.membershipconfig(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("getAll Controller", error);
            next(error)
        }
    }

    async analytics(req, res, next) {
        try {
            const result = await AdminDashboardService.analytics(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("analytics Controller", error);
            next(error)
        }
    }

    async exportPDF(req, res, next) {
        try {
            const collectionName = String(req.query?.collection || "").trim().toLowerCase();

            if (collectionName === "audit_logs") {
                return await AdminDashboardService.exportAuditLogs(req, res);
            }

            if (collectionName === "bookings") {
                return await AdminDashboardService.exportBookings(req, res);
            }

            if (collectionName === "memberships") {
                return await AdminDashboardService.exportMemberships(req, res);
            }

            return await AdminDashboardService.analyticsExportPDF(req.query, res);
        } catch (error) {
            debuggerLog("analytics export PDF Controller", error);
            next(error)
        }
    }
}

export default new AdminDashboardController();