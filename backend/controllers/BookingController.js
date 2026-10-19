import BookingService from "../services/booking.service.js";
import { debuggerLog } from "../utils/debuggerLog.js";

class BookingController {
    async joinBooking(req, res, next) {
        try {
            const result = await BookingService.joinBooking(req.params.id, req.auditMeta, req.user);

            return res.status(200).json({ message: "Successfully joined a class schedule", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async bookTrainer(req, res, next) {
        try {
            const result = await BookingService.bookTrainer(req.params.id, req.auditMeta, req.user);

            return res.status(200).json({ message: "Successfully booked a trainer", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewMyBookings(req, res, next) {
        try {
            const result = await BookingService.viewMyBookings(req.user.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewBookingDetails(req, res, next) {
        try {
            const result = await BookingService.viewBookingDetails(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async viewAllBooking(req, res, next) {
        try {
            const result = await BookingService.viewAllBooking(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async cancelBooking(req, res, next) {
        try {
            const result = await BookingService.cancelBooking(req.params.id, req.auditMeta, req.body, req.user);

            const message = result?.type === "trainer-booking" 
                ? "Successfully cancelled a trainer booking" 
                : "Successfully cancelled a class booking";
            return res.status(200).json({ message, result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async completeBooking(req, res, next) {
        try {
            const result = await BookingService.completeBooking(req.params.id, req.auditMeta, req.user);
            
            return res.status(200).json({ message: "Successfully marked a booking as completed", result});
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }

    async fetchWhoBookedMe(req, res, next) {
        try {
            const result = await BookingService.fetchWhoBookedMe(req.query, req.user.id,);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
         }
    }

    async fetchTrainerEarnings(req, res, next) {
        try {
            const result = await BookingService.fetchTrainerEarnings(req.query, req.user.id);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("Server Error: ", error)
            next(error)
        }
    }
}

export default new BookingController();