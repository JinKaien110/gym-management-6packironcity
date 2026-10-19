import express from "express";
import BookingController from "../controllers/BookingController.js";
import { authorizeRoles, verifyToken, authorizeUserTypes } from "../middleware/authmiddleware.js";
const router = express.Router();

router.post("/client/booking/:id", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), BookingController.joinBooking);

router.get("/client/my-bookings", verifyToken, authorizeRoles("client"), BookingController.viewMyBookings);

router.get("/client/booking/:id", verifyToken, authorizeRoles("client"), BookingController.viewBookingDetails);

router.get("/admin/booking", verifyToken, authorizeRoles("admin", "staff"), BookingController.viewAllBooking);

router.patch("/client/booking/:id", verifyToken, authorizeUserTypes("admin", "client"), authorizeRoles("admin", "client"), BookingController.cancelBooking);

router.post("/client/booking/trainer/:id", verifyToken, authorizeUserTypes("client"), authorizeRoles("client"), BookingController.bookTrainer);

router.patch("/client/booking/trainer/:id/complete", verifyToken, authorizeUserTypes("client", "trainer"), authorizeRoles("client", "trainer"), BookingController.completeBooking);

router.get("/trainer/bookings", verifyToken, authorizeUserTypes("trainer"), authorizeRoles("trainer"), BookingController.fetchWhoBookedMe);

router.get("/trainer/earnings", verifyToken, authorizeUserTypes("trainer"), authorizeRoles("trainer"), BookingController.fetchTrainerEarnings);

export default router;