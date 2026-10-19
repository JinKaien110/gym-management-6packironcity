import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import BookingModel from "../models/BookingModel.js";
import ClassScheduleModel from "../models/ClassScheduleModel.js";
import ClassModel from "../models/ClassModel.js";
import ClientModel from "../models/ClientModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { clientJoinBookingEmail } from "../templates/booking/email.clientJoinBooking.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { sendEmail } from "./email.service.js";
import { clientCancelBookingEmail } from "../templates/booking/emaill.clientCancelBooking.js";
class BookingService {
    async joinBooking(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid class schedule ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid client ID");
        }



        const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(id));
        if(!schedule) {
            throw new ValidationError("Class schedule not found")
        }

        const classes = await ClassModel.viewClass(new ObjectId(schedule.class_id))

        if(schedule.status !== "open") {
            throw new ValidationError("Class schedule is not open for booking");
        }

        const alreadyJoined = await BookingModel.checkIfAlreadyJoined(
            new ObjectId(id),
            new ObjectId(updater.id)
        );

        if(alreadyJoined) {
            throw new ValidationError("You already joined this class schedule");
        }

        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(schedule.trainer_id))

        const joinedCount = await BookingModel.countJoined(new ObjectId(id));
        const capacity = schedule.capacity

        if(joinedCount >= capacity) {
            throw new ValidationError("Class schedule is already full");
        }

        const data = {
            schedule_id: new ObjectId(id),
            client_id: new ObjectId(updater.id),
            status: "joined",
            type: 'class', // class, trainer-booking
            joinedAt: new Date(),
            cancelledAt: null,
            cancelledBy: null,
            cancelReason: null,
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null
        }

        const email = {
            first_name: updater.first_name,
            last_name: updater.last_name,
            status: "joined",
            name: classes.name,
            trainer_first_name: trainer.first_name,
            trainer_last_name: trainer.last_name,
            start_at: schedule.start_at,
            location: schedule.location,
            notes: schedule.notes
        }

        return await AuditLogsService.auditWrap({
            action: "BOOKING_client_JOIN",
            entity: "bookings",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type  }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) book the class ${classes.label}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_client_JOINBOOKING",
                    entity: "admins",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email confirmation about booking a ${classes.label} class schedule`,
                    fn: async () => {
                        return await sendEmail({
                            to: updater.email,
                            subject: "6Pack Iron City - Booking Confirmation",
                            html: clientJoinBookingEmail(email)
                        });
                    }
                })
                return await BookingModel.joinBooking(data)
            }
        });
    }

    async bookTrainer(id, meta, updater, paymentId = null) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid trainer ID");

        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid client ID");

        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(id));

        if(!trainer) throw new ValidationError("Trainer not found");

        const alreadyBooked = await BookingModel.checkIfTrainerAlreadyBooked(
            new ObjectId(id),
            new ObjectId(updater.id)
        );

        if(alreadyBooked) {
            throw new ValidationError("You have already booked this trainer");
        }

        const data = {
            client_id: new ObjectId(updater.id),
            trainer_id: new ObjectId(id),
            payment_id: paymentId ? new ObjectId(paymentId) : null,
            bookedAt: new Date(),
            status: "scheduled", // scheduled, completed
            type: 'trainer-booking',
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null
        }

        return await AuditLogsService.auditWrap({
            action: "BOOKING_TRAINER",
            entity: "bookings",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) booked a trainer ${trainer.first_name} ${trainer.last_name}`,
            fn: async () => {
        
                return await BookingModel.bookTrainer(data)
            }
        });

    }


    async viewMyBookings(id, page = 1, limit = 10) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid user ID");
        }

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;


        return await BookingModel.viewMyBookings(
            new ObjectId(id),
            page,
            limit
        );
    }

    async viewBookingDetails(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid user ID");
        }

        return await BookingModel.viewBookingDetails(new ObjectId(id));
    }

    async viewAllBooking(query) {
        let { client_id, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        const filter = {};

        if(client_id && !ObjectId.isValid(client_id)) {
            throw new ValidationError("Invalid client ID");
        }

        if(client_id) filter.client_id = new ObjectId(client_id);

        status = status ? String(status).trim().toLowerCase(): undefined

        const allowedStatus = ["joined", "cancelled", "no_show"]

        if(status && !allowedStatus.includes(status)) {
            throw new ValidationError("Status value is not allowed")
        }

        if(status) filter.status = status

        return await BookingModel.viewAllBooking(filter, page, limit)
    }

    async cancelBooking(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid booking ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const booking = await BookingModel.viewBookingDetails(new ObjectId(id));

        let classes = null;
        let schedule = null;
        if(booking.type === "class") {
            const schedule = await ClassScheduleModel.viewClassSchedule(new ObjectId(booking.schedule_id))
            const classes = await ClassModel.viewClass(new ObjectId(schedule.class_id))
        } 


        

        if(!booking) {
            throw new ValidationError("Booking not found")
        }

        const isAdmin = updater.role === "admin" || updater.user_type === "admin";
        
        if(!isAdmin && !booking.client_id.equals(new ObjectId(updater.id))) {
            throw new ValidationError("You are not allowed to cancel this booking");
        }

        if(booking.status !== "joined" && booking.status !== "confirmed" && booking.status !== "pending" && booking.status !== "on_going") {
            throw new ValidationError("Booking cannot be cancelled")
        }

        let reason = null;
        if(body?.cancelReason !== undefined && body.cancelReason !== null) {
            const r = String(body.cancelReason).trim();
            if (r) reason = r
        }

        const data = {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: new ObjectId(updater.id),
            cancelReason: reason,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        const email = {
            first_name: updater.first_name,
            last_name: updater.last_name,
            status: "cancelled",
            name: classes?.name ? classes?.name : "the trainer",
            reason: reason ?? null
        }

        return await AuditLogsService.auditWrap({
            action: "BOOKING_client_CANCEL",
            entity: "bookings",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) cancel his booking in the class ${classes?.name ? classes?.name : "the trainer"} `,
            changes: {
                patch: {
                    before: {
                        status: booking.status
                    }, 
                    after: {
                        status: "cancelled"
                    },
                    reason
                }
            },
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_client_CANCELBOOKING",
                    entity: "clients",
                    entity_id: new ObjectId(updater._id) ?? null,
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a cancellation booking of ${classes?.name ? classes?.name : "the trainer"}`,
                    fn: async () => {
                        return await sendEmail({
                            to: updater.email,
                            subject: "6Pack Iron City - Booking Cancellation Confirmation",
                            html: clientCancelBookingEmail(email)
                        });
                    }
                })
                return await BookingModel.cancelBooking(
                    new ObjectId(id),
                    data
                )
            }
        });
    }

    async updateBookingStatus(id, data) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid payment ID");
        }

        const booking = await BookingModel.findBookingByPaymentId(new ObjectId(id));

        if(!booking) {
            throw new ValidationError("Booking not found")
        }

        return await BookingModel.updateBookingStatus(new ObjectId(booking._id), data);

    }

    async completeBooking(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid booking ID");
        }
        
        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const booking = await BookingModel.viewBookingDetails(new ObjectId(id));

        if(!booking) {
            throw new ValidationError("Booking not found")
        }

        const data = {
            status: "completed",
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }

        return await AuditLogsService.auditWrap({
            action: "BOOKING_CLIENT_COMPLETE",
            entity: "bookings",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) marked his booking as completed`,
            fn: async () => {
                return await BookingModel.completeBooking(new ObjectId(id), data)
            }
        });
    }
    
    async fetchWhoBookedMe(query, id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        let { page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;    

        return await BookingModel.fetchWhoBookedMe(new ObjectId(id), page, limit);
    }

    async fetchTrainerEarnings(query, id) {
        if (!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 10;
        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        return BookingModel.fetchTrainerEarnings(new ObjectId(id), page, limit);
    }
}

export default new BookingService();