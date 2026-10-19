import express from "express";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import MembershipController from "../controllers/MembershipController.js";
import { uploadFreezeFiles } from "../utils/uploads/freeze.js";

const router = express.Router();

router.post("/membership/request", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.createmembershipRequest);

// Admin routes for membership requests
router.post("/admin/membership-request", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MembershipController.createmembershipRequest);

router.post("/membership/create/", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.createmembership);

router.post("/admin/membership/create", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.Admincreatemembership);

router.get("/membership/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.viewmembership);

router.get("/memberships", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", "superadmin"), MembershipController.viewAllmembership);

router.patch("/membership/update-membership/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.updatemembership);

router.patch("/membership/update-status/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.updatemembershipStatus);

router.patch("/membership/freeze/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), uploadFreezeFiles, MembershipController.freezemembership);

router.patch("/membership/unfreeze/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), MembershipController.unfreezemembership);

router.get("/membership-requests", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", 'superadmin'), MembershipController.fetchAllmembershipRequests);

router.post("/membership-request/freeze", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "client"), uploadFreezeFiles, MembershipController.requestFreezemembership);

router.get("/membership/active", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), MembershipController.fetchMyActiveMembership);

router.get("/client/membership/last", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), MembershipController.fetchMyLastMembership);

export default router;