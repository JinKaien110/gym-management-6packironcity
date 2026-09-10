import { ValidationError } from "../errors/ValidationError.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";
import ClientModel from "../models/ClientModel.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import PlanModel from "../models/PlanModel.js";
import PricingModel from "../models/PricingModel.js";
import AuditLogsService from "./audit.logs.service.js"; 
import { ObjectId } from "mongodb";
import { sendEmail } from "./email.service.js";
import { clientDiscountRequestEmail } from "../templates/discount/email.clientRequestDiscount.js";
import { clientDiscountDecisionEmail } from "../templates/discount/email.clientDiscountDecision.js";
import { connectDB } from "../config/db.js";
import PaymentModel from "../models/PaymentModel.js";

class DiscountRequestService {

    async createDiscountRequest(meta, files, updater) {
        let { selfie_url, id_url } = files || {};


        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid client ID");
        }
        if (!selfie_url) throw new ValidationError("Selfie is required");
        if (!id_url) throw new ValidationError("ID photo is required");

        const MAX_SIZE = 25 * 1024 * 1024
        if (selfie_url.size > MAX_SIZE) throw new ValidationError("Selfie URL too long");
        if (id_url.size > MAX_SIZE) throw new ValidationError("ID URL too long");

        const data = {
            client_id: new ObjectId(updater.id),
            selfie_url: selfie_url,
            id_url: id_url,
            status: "pending",
            reviewed_at: null,
            reviewed_by: null,
            createdAt: new Date(),
            createdBy: new ObjectId(updater.id)
        }

        const email = {
            first_name: updater.first_name,
            last_name: updater.last_name,
            email: updater.email,
            status: "pending", // pending  | approved | rejected
            requested_at: new Date()
        }


        return await AuditLogsService.auditWrap({
            action: "DISCOUNT_REQUEST_CREATED",
            entity: "discount_requests",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) requested a discount`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_DISCOUNT_REQUEST_CREATED",
                    entity: "discount_requests",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a discount request email`,
                    fn: async () => {
                        await sendEmail({
                            to: updater.email,
                            subject: "6Pack Iron City Gym - Discount Request Received",
                            html: clientDiscountRequestEmail(email)
                        });
                        return await DiscountRequestModel.createDiscountRequest(data);
                    }
                    
                })
                
            }
        }); 
    }

    async decisionOnDiscountRequest(id, meta, decision, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid discount request ID");
        }

        const decisionNormalized = String(decision || "").trim().toLowerCase();
        if(!decisionNormalized) {
            throw new ValidationError("No decision value");
        }

        const allowedDecisions = ["rejected", "approved"]
        if(!allowedDecisions.includes(decisionNormalized)) {
            throw new ValidationError("Invalid decision value");
        }
        

        return await AuditLogsService.auditWrap({
            action: "DISCOUNT_REQUEST_DECISION",
            entity: "discount_requests",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has ${decisionNormalized} the discount request ${String(id)}`,
            fn: async () => {
                
                const { db, client } = await connectDB();
                const session = client.startSession();
                try {
                    session.startTransaction();
                    
        const discountRequest = await DiscountRequestModel.findDiscountRequestById(new ObjectId(id), session);
        if(!discountRequest) throw new ValidationError("No discount request found");

        const client = await ClientModel.findUserById(new ObjectId(discountRequest.client_id));
     

        
        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid admin/staff ID");
        }

        const now = new Date();
        const discountData = {
            status: decisionNormalized.trim().toLowerCase(),
            reviewed_at: now,
            reviewed_by: new ObjectId(updater.id),
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        };

        const clientData = {
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        }

        if(decisionNormalized === "approved") {
            clientData.is_discounted = true
        }

        if(decisionNormalized === "rejected") {
            clientData.is_discounted = false
        }   

        const email = {
            first_name: client.first_name,
            last_name: client.last_name,
            email: client.email,

            decision: decisionNormalized,
            is_discounted: decisionNormalized === "approved" ? "Discounted" : "Regular",

            reviewed_by: `${updater.first_name} ${updater.last_name}`,
            reviewed_at: now,

        };

                const decisionMade = await DiscountRequestModel.decisionOnDiscountRequest(new ObjectId(id), discountData, session);

                await ClientModel.updateclient(client._id, clientData, session)

                await session.commitTransaction();

                // RETURN DECISION MADE DB RETURN VALUE FOR ENTITY ID :D 

                await AuditLogsService.auditWrap({
                action: "EMAIL_DISCOUNT_DECISION",
                entity: "discount_requests",
                entity_id: new ObjectId(id),
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                meta: meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent the discount request decision email`,
                fn: async () => {
                    return await sendEmail({
                        to: client.email,
                        subject: `6Pack Iron City - Discount ${decisionNormalized === "approved" ? "Approved" : "Decision"}`,
                        html: clientDiscountDecisionEmail(email)
                    });
                }
            });
                return decisionMade;
            } catch (error) {
                await session.abortTransaction();
                throw new ValidationError(error.message)
            } finally {
                await session.endSession();
            }
            
        }
        });
    }

    async findDiscountRequestById(id, user) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid discount request ID");
        }

        const discountRequest = await DiscountRequestModel.findDiscountRequestById(new ObjectId(id));
        if(!discountRequest) throw new ValidationError("No discount request found");
        
        return discountRequest;
    }

    async findDiscountRequestByClientId(clientId) {
        if(!clientId || !ObjectId.isValid(clientId)) {
            throw new ValidationError("Invalid client ID");
        }

        const discountRequest = await DiscountRequestModel.findDiscountRequestByClientId(new ObjectId(clientId));
        if(!discountRequest) return null;
        
        return discountRequest;
    }

    async getAllDiscountRequests(query) {
        let { client_id, status, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        const filter = {};
        if(client_id && ObjectId.isValid(client_id)) {
            filter.client_id = new ObjectId(client_id);
        }
        if(status && typeof status === "string") {
            filter.status = status.trim().toLowerCase();
        }

        return await DiscountRequestModel.getAllDiscountRequests(filter, page, limit);
    }

    async payAsRegularInstead(meta, updater) {
        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid client ID");

        const data = {
            status: "cancelled",
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
         }

        const discountRequest = await DiscountRequestModel.findDiscountRequestByclientId(new ObjectId(updater.id));
        if(!discountRequest) return;

        return await AuditLogsService.auditWrap({
            action: "DISCOUNT_REQUEST_CANCELLED_PAY_AS_REGULAR",
            entity: "discount_requests",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) cancelled the discount request and chose to pay as regular instead`,
            fn: async () => {
                return await DiscountRequestModel.decisionOnDiscountRequest(discountRequest._id, data);
            }
        });

    }
}

export default new DiscountRequestService();