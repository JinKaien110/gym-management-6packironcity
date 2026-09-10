import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import AdminDashboardController from "../controllers/AdminDashboardController.js";

const router = express.Router();

router.get("/admin/dashboard", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.dashboard);

router.get("/admin/clients", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.clientsManagement);

router.get("/admin/memberships-request", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.membershipRequests);

router.get("/admin/memberships", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.memberships);

router.get("/admin/payments", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.payments);

router.get("/admin/classes", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.classes);

router.get("/admin/schedules", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff"), AdminDashboardController.schedules);

router.get("/admin/trainers", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.trainers);

router.get("/admin/pricing", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.pricing);

router.get("/admin/plans", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.plans);

router.get("/admin/bookings", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.bookings);

router.get("/admin/discounts", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.discounts);

router.get("/admin/workout-recommendations", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin"), AdminDashboardController.airecommendations);

router.get("/admin/membership-config", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), AdminDashboardController.membershipconfig);

router.get("/admin/analytics", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), AdminDashboardController.analytics);
router.get("/admin/analytics/export-pdf", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "superadmin"), AdminDashboardController.exportPDF);

export default router;