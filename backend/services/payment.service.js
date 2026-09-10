import { ObjectId } from "mongodb";
import { axiosInstance } from "../config/xendit.js";
import PaymentModel from "../models/PaymentModel.js";
import MembershipService from "../services/membership.service.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import ClientModel from "../models/ClientModel.js";
import { ValidationError } from "../errors/ValidationError.js";
import ucfirst from "../utils/ucfirst.js";
import { paymentSuccessEmail } from "../templates/payment/email.paymentSuccessEmail.js";
import AuditLogsService from "./audit.logs.service.js";
import DiscountRequestService from "./discountrequest.service.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";
import { sendEmail } from "./email.service.js";
import PlanModel from "../models/PlanModel.js";
import PricingModel from "../models/PricingModel.js";
import ClientPassService from "./client.pass.service.js";
import StatusModel from "../models/StatusModel.js";
import generateReceiptPDF from "../templates/pdf/receiptTemplate.js";
import PDFDocument from "pdfkit";
import BookingService from "./booking.service.js";



class PaymentService {
    
    async createPaymentSchema(meta, body, updater, session = null) {
        let { plan_id, pricing_id, payment_for, amount } = body;

        if(!plan_id || !ObjectId.isValid(plan_id)) throw new ValidationError("Invalid plan ID");
        if(!pricing_id || !ObjectId.isValid(pricing_id)) throw new ValidationError("Invalid pricing ID");
        payment_for = payment_for?.trim().toLowerCase() ?? null;
        amount = amount ? Number(amount) : null;
        const plan = await PlanModel.viewAPlan(new ObjectId(plan_id));
        if(!plan) throw new ValidationError("No plan exist");
        
        const price = await PricingModel.viewOnePricing(new ObjectId(pricing_id));
        if(!price) throw new ValidationError("No pricing exist");

        
        return PaymentModel.createPaymentSchema(data, session)
    }

    async createGcashPayment(meta, body, updater) {
        try {
            let { amount, payment_method, payment_for, pricing_id, plan_id, trainer_id } = body;

            if(!payment_method) throw new ValidationError("Payment method is required");
            payment_method = payment_method.trim().toLowerCase();

            const allowedPaymentFor = ["daily_pass", "membership", "trainer-booking", "membership_request"];
            if(!allowedPaymentFor.includes(payment_for)) {
                throw new ValidationError(`Invalid payment context. Allowed values are: ${allowedPaymentFor.join(", ")}`);
            }

            amount = Number(amount);
            if(!amount || amount <= 0) throw new ValidationError("Invalid amount");

            if(!payment_for) throw new ValidationError("Payment context (payment_for) is required");
            payment_for = payment_for.trim().toLowerCase();

            if(pricing_id && (!ObjectId.isValid(pricing_id))) throw new ValidationError("Invalid pricing ID");
            if(plan_id && (!ObjectId.isValid(plan_id))) throw new ValidationError("Invalid plan ID");

            /**
             * 
             * 
             * let membershipRequestId = null;
            if(payment_for === "membership_request") {
                if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
                    throw new ValidationError("Invalid membership request ID");
                }
                membershipRequestId = new ObjectId(membership_request_id);
                const membershipRequest = await MembershipRequestModel.findmembershipByRequestId(membershipRequestId);
                if(!membershipRequest) throw new ValidationError("membership request failed to fetch");
            }
             * 
             * 
             * const payment = await PaymentModel.getLatestPaymentDetails(new ObjectId(updater.id), payment_for, membershipRequestId);

            let id = null
            if((!payment || payment?.status === "EXPIRED") && payment.payment_for !== payment_for) {
                body.plan_id = payment?.plan_id
                body.pricing_id = payment?.pricing_id
                body.payment_for = payment_for
                body.amount = amount
                id = await this.createPaymentSchema(meta, body, updater);
            } else {
                id = payment._id
            }
             * 
             */
            

            const external_id = `client=${updater.id}-${Date.now()}`;

            const payload = {
                reference_id: external_id,
                currency: "PHP",
                amount,
                channel_code: "PH_GCASH",
                checkout_method: "ONE_TIME_PAYMENT",
                channel_properties: {
                    success_redirect_url: `http://localhost:5173/payment/success?payment_for=${payment_for}`,
                    failure_redirect_url: "http://localhost:5173/payment/failed",
                },
                payer_email: updater.email,
                metadata: {
                    givenNames: updater.first_name,
                    surname: updater.last_name,
                    email: updater.email,
                    phone: updater.phone,
                    payment_for: payment_for,
  
                }
            };

            const response = await axiosInstance.post("/ewallets/charges", payload);

            let paymentId = null;
            await AuditLogsService.auditWrap({
                action: "PAYMENT_CREATED",
                entity: "payments",
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type },
                meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created GCASH payment`,
                fn: async () => {

                    const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
                    const random = Math.floor(1000 + Math.random() * 9000);
                    const reference_no = `PAY-${date}-${random}`;

                    const now = new Date();
                    const data = {
                        client_id: new ObjectId(updater.id),
                        first_name: updater.first_name,
                        last_name: updater.last_name,
                        provider: 'xendit',
                        external_id: external_id,
                        amount: amount,
                        status: "PENDING", 
                        payment_for: payment_for, // daily_pass, membership, trainer-booking 
                        reference_no: reference_no,
                        payment_method: payment_method,
                        raw_response: response.data,
                        plan_id: plan_id ? new ObjectId(plan_id) : null,
                        pricing_id: pricing_id ? new ObjectId(pricing_id) : null,
                        createdAt: now,
                        createdBy: new ObjectId(updater.id),
                        updatedAt: null,
                        updatedBy: null,
                    }


                    paymentId = await PaymentModel.createPayment(data);
                }
            });

            paymentId = paymentId.insertedId;
            if(payment_for === "daily_pass") {
                const data = {
                    createdAt: new Date(),
                    createdBy: new ObjectId(updater.id),
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                };

                data.pricing_id = pricing_id;
                data.plan_id = plan_id;
                data.start_date = new Date();
                data.payment_id = paymentId;
                data.status = "pending";
                await ClientPassService.createclientPass(meta, data, updater);
            }

            if(payment_for === "membership") {
                await MembershipService.createmembership(meta, updater, paymentId);
            }

            if(payment_for === "trainer-booking") {
                if(!trainer_id || !ObjectId.isValid(trainer_id)) throw new ValidationError("Invalid trainer ID");

                await BookingService.bookTrainer(trainer_id, meta, updater, paymentId);
            }
            
            return {
                checkout_url: response.data.actions.desktop_web_checkout_url,
                external_id
            };

        } catch (error) {
            console.error("Xendit status:", error.response?.status);
            console.error("Xendit data:", error.response?.data);
            throw error;
        }
    }

    async createMayaPayment(meta, body, updater) {
        try {
            let { amount, payment_method, payment_for, pricing_id, plan_id, trainer_id } = body;

            if(!payment_method) throw new ValidationError("Payment method is required");
            payment_method = payment_method.trim().toLowerCase();

            amount = Number(amount);
            if(!amount || amount <= 0) throw new ValidationError("Invalid amount");

            if(!payment_for) throw new ValidationError("Payment context (payment_for) is required");
            payment_for = payment_for.trim().toLowerCase();

            if(pricing_id && (!ObjectId.isValid(pricing_id))) throw new ValidationError("Invalid pricing ID");
            if(plan_id && (!ObjectId.isValid(plan_id))) throw new ValidationError("Invalid plan ID");


            /**
             * 
            let membershipRequestId = null;
            if(payment_for === "membership_request") {
                if(!membership_request_id || !ObjectId.isValid(membership_request_id)) {
                    throw new ValidationError("Invalid membership request ID");
                }
                membershipRequestId = new ObjectId(membership_request_id);
                const membershipRequest = await MembershipRequestModel.findmembershipByRequestId(membershipRequestId);
                if(!membershipRequest) throw new ValidationError("membership request failed to fetch");
            }

            const payment = await PaymentModel.getLatestPaymentDetails(new ObjectId(updater.id), payment_for, membershipRequestId);

            let id = null;
            if((!payment || payment?.status === "EXPIRED") && payment.payment_for !== payment_for) {
                body.plan_id = payment?.plan_id;
                body.pricing_id = payment?.pricing_id;
                body.payment_for = payment_for
                body.amount = amount
                id = await this.createPaymentSchema(meta, body, updater);
            } else {
                id = payment._id;
            }
             */
            

            const external_id = `client=${updater.id}-${Date.now()}`;

            const payload = {
                reference_id: external_id,
                currency: "PHP",
                amount,
                checkout_method: "ONE_TIME_PAYMENT",
                channel_code: "PH_PAYMAYA",
                channel_properties: {
                    success_redirect_url: `http://localhost:5173/payment/success?payment_for=${payment_for}`,
                    failure_redirect_url: "http://localhost:5173/payment/failed",
                    cancel_redirect_url: "http://localhost:5173/payment/cancel"
                },
                payer_email: updater.email,
                metadata: {
                    givenNames: updater.first_name,
                    surname: updater.last_name,
                    email: updater.email,
                    payment_for: payment_for,
                    phone: updater.phone,
                }
            };

            const response = await axiosInstance.post("/ewallets/charges", payload);
            
            let paymentId = null;
            await AuditLogsService.auditWrap({
                action: "PAYMENT_CREATED",
                entity: "payments",
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type },
                meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created PayMaya payment`,
                fn: async () => {
                    const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
                    const random = Math.floor(1000 + Math.random() * 9000);
                    const reference_no = `PAY-${date}-${random}`;

                    const now = new Date();
                    const data = {
                        client_id: new ObjectId(updater.id),
                        first_name: updater.first_name,
                        last_name: updater.last_name,
                        provider: 'xendit',
                        external_id: external_id,
                        amount: amount,
                        status: "PENDING", 
                        payment_for: payment_for, // daily_pass, membership, trainer-booking 
                        reference_no: reference_no,
                        payment_method: payment_method,
                        // membership_request_id: null,
                        raw_response: response.data,
                        plan_id: plan_id ? new ObjectId(plan_id) : null,
                        pricing_id: pricing_id ? new ObjectId(pricing_id) : null,
                        createdAt: now,
                        createdBy: new ObjectId(updater.id),
                        updatedAt: null,
                        updatedBy: null,
                    }

                    paymentId = await PaymentModel.createPayment(data);

                }
            });
            paymentId = paymentId.insertedId;
            if(payment_for === "daily_pass") {

                const data = {
                    createdAt: new Date(),
                    createdBy: new ObjectId(updater.id),
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                };

                data.pricing_id = pricing_id;
                data.plan_id = plan_id;
                data.start_date = new Date();
                data.payment_id = paymentId;
                data.status = "pending";
                await ClientPassService.createclientPass(meta, data, updater);
                
            }

            if(payment_for === "membership") {
          
                await MembershipService.createmembership(meta, updater, paymentId);
            }

            if(payment_for === "trainer-booking") {
                if(!trainer_id || !ObjectId.isValid(trainer_id)) throw new ValidationError("Invalid trainer ID");

                await BookingService.bookTrainer(trainer_id, meta, updater, paymentId);
            }

            const action = response.data.actions;
            return {
                checkout_url: action.mobile_web_checkout_url ?? action.desktop_web_checkout_url,
                external_id
            };

        } catch (error) {
            console.error("PayMaya error:", error.response?.data);
            throw error;
        }
    }

    async markPaymentPaid(id, payload) {
        if (!id || typeof id !== "string") {
            throw new ValidationError("Invalid external ID");
        }
        

        const payment = await PaymentModel.findByExternalID(id);
        /**
         * 
        let membershipRequest = null
        if(payment.payment_for === "membership_request") {
            membershipRequest = await MembershipRequestModel.findmembershipByRequestId(new ObjectId(payment.membership_request_id));

            const data = {
                status: "completed",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }

            await MembershipRequestModel.updatemembershipStatus(new ObjectId(payment.membership_request_id), data)
        }

        if(payment.payment_for === "daily_pass") {
            const data = {
                status: "active",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await ClientPassService.updateclientPassStatus(new ObjectId(payment._id), data);
        }
         */
        

       
        const client = await ClientModel.findUserById(new ObjectId(payment.client_id));
        if(!payment) throw new ValidationError("Payment not found");
        if (payment.status === "PAID") return;



        if(payment.payment_for === "daily_pass") {
            const data = {
                status: "active",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await ClientPassService.updateclientPassStatus(new ObjectId(payment._id), data);
        }

        if(payment.payment_for === "membership") {
            const data = {
                status: "active",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await MembershipService.activatemembership(payment._id, data); 
        }

        if(payment.payment_for === "trainer-booking") {
            const data = {
                status: "on_going",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await BookingService.updateBookingStatus(payment._id, data);
        }

        const email = {
            first_name: payment.first_name,
            last_name: payment.last_name,
            amount: payment.amount,
            payment_method: payment.payment_method,
            external_id: id,
            createdAt: new Date()
        }   

        await AuditLogsService.auditWrap({
            action: "EMAIL_PAYMENT_GCASH_CREATED",
            entity: "payments",
            actor: { id: new ObjectId(client._id), role: client.role, user_type: client.user_type }, 
            summary: `${client.first_name} ${client.last_name} (${client.role-client.user_type}) has been sent an email notification about success ${ucfirst(payment.payment_method)} payment`,
            fn: async () => {
                
                await sendEmail({
                    to: client.email,
                    subject: `6Pack Iron City - Payment ${ucfirst(payment.payment_method)}`,
                    html: paymentSuccessEmail(email)
                });
                
            }
        })

        return PaymentModel.updateStatusByExternalID(id, {
            status: "PAID",
            raw_response: payload,
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        });

    }

    async markPaymentFailed(id, payload) {
        if (!id || typeof id !== "string") {
            throw new ValidationError("Invalid external ID");
        }

        const payment = await PaymentModel.findByExternalID(id);
        if(!payment) throw new ValidationError("Payment not found");
        if (payment.status === "FAILED") return;

        if(payment.payment_for === "daily_pass") {
            const data = {
                status: "cancelled",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await ClientPassService.updateclientPassStatus(new ObjectId(payment._id), data);
        }

        if(payment.payment_for === "membership") {
            const data = {
                status: "cancelled",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await MembershipService.activatemembership(payment._id, data); 
        }

        if(payment.payment_for === "trainer-booking") {
            const data = {
                status: "cancelled",
                updatedAt: new Date(),
                updatedBy: "xendit-webhook"
            }
            await BookingService.updateBookingStatus(payment._id, data);
        }
    
        return PaymentModel.updateStatusByExternalID(id, {
            status: "FAILED",
            raw_response: payload,
            updatedAt: new Date(),
            updatedBy: "xendit-webhook"
        });
    }

    async getAllPayment(query) {
        let { payment_method, status, search, page = 1, limit = 10 } = query;

        let filter =  {};

        if(payment_method) {
            filter.payment_method = payment_method.trim().toLowerCase()
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        return await PaymentModel.getAllPayment(filter, search, page, limit);
    }

    async getAllMyPayments(query, id) {
        let { payment_method, payment_for, search, page = 1, limit = 10 } = query;

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }

        let filter =  {
            client_id: new ObjectId(id)
        };

        if(payment_method) {
            filter.payment_method = payment_method.trim().toLowerCase()
        }

        if(payment_for) {
            filter.payment_for = payment_for.trim().toLowerCase()
        }

        search = search ? String(search).trim().toLowerCase() : null;

        return await PaymentModel.getAllMyPayments(filter, search, page, limit);
    }

    async getPaymentDetails(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid payment ID");
        }

        return await PaymentModel.getPaymentDetails(new ObjectId(id));
    }

    async getTotalRevenue(query) {
        let { status } = query;

        let filter = {};

        // Default to only successful payments if no status specified
        if (!status) {
            filter.status = { $in: ["PAID", "paid", "COMPLETED", "completed"] };
        } else {
            filter.status = status.trim().toLowerCase();
        }

        return await PaymentModel.getTotalRevenue(filter);
    }

    async receiptTemplate(id, res) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid payment ID");

        const payment = await PaymentModel.getPaymentDetails(new ObjectId(id));
        if(!payment) throw new ValidationError("Payment not found");
        

        const client = await ClientModel.findUserById(new ObjectId(payment.client_id));
        if(!client) throw new ValidationError("client not found"); 

        // Merge payment and client data for the receipt
        const receiptData = {
          ...payment,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone: client.phone,
          payment_for: payment.type || payment.payment_for || "Payment"
        };

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="receipt-${payment.external_id || id}.pdf"`);

        doc.pipe(res);
        
        generateReceiptPDF(doc, receiptData);
        
        doc.end();
    }
}

export default new PaymentService();