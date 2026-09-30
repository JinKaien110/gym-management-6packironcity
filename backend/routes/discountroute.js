import express from "express";
import DiscountRequestController from "../controllers/DiscountRequestController.js";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
import { uploadDiscountFiles } from "../utils/uploads/discount.js";
const router = express.Router();

router.post("/discount-request", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), uploadDiscountFiles, DiscountRequestController.createDiscountRequest);

router.patch("/discount-request/:id/decision", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff"), DiscountRequestController.decisionOnDiscountRequest);

router.get("/discount-request/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "staff", "client"), DiscountRequestController.findDiscountRequestById);

router.get("/discount-requests", verifyToken, authorizeUserTypes("admin"), authorizeRoles("admin", "staff", 'superadmin'), DiscountRequestController.getAllDiscountRequests);

router.get("/client/discount-request", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), DiscountRequestController.findDiscountRequestByClientId);

router.patch("/client/discount-requests/payasregular", verifyToken, authorizeUserTypes("client", "admin"), authorizeRoles("client", "admin"), DiscountRequestController.payAsRegularInstead);


export default router; 