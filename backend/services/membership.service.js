import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import MembershipModel from "../models/MembershipModel.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import PricingModel from "../models/PricingModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import { calculateEndDate } from "../utils/calculateEndDate.js";
import PaymentModel from "../models/PaymentModel.js";
import PaymentService from "./payment.service.js";
import { ValidationError } from "../errors/ValidationError.js";
import PlanModel from "../models/PlanModel.js";
import ClientModel from "../models/ClientModel.js";
import AuditLogsService from "./audit.logs.service.js";
import { emailRequestmembership } from "../templates/membership/email.createRequestMembership.js";
import { sendEmail } from "./email.service.js";
import { emailmembershipActivated } from "../templates/membership/email.createMembership.js";
import ucfirst from "../utils/ucfirst.js";
import { membershipFrozenEmail } from "../templates/membership/email.freezeMembership.js";
import { membershipUnfrozenEmail } from "../templates/membership/email.unfreezeMembership.js";
import { membershipUpdatedEmail } from "../templates/membership/email.updateMembership.js";
import { getFileUrl } from "../utils/uploads/freeze.js";
import MembershipConfigModel from "../models/MembershipConfigModel.js";

dotenv.config();

class MembershipService {
    async requestmembership(meta, body, updater, session = null) {
        const id = new ObjectId(updater.id);

        if(!updater) {
            throw new ValidationError("No client login");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }

        const client = await ClientModel.findUserById(new ObjectId(id));
        if(!client) throw new ValidationError("No client found");

         if(!client.plan_id || !ObjectId.isValid(client.plan_id)) {
            throw new ValidationError("Invalid plan ID");
        }

        if(!client.pricing_id || !ObjectId.isValid(client.pricing_id)) {
            throw new ValidationError("Invalid pricing ID");
        }
        
        if(typeof is_discounted !== "boolean") {
            throw new ValidationError("Cannot determined if the client is discounted");
        }

        const plan = await PlanModel.viewAPlan(new ObjectId(client.plan_id));
        if(!plan) throw new ValidationError("Plan not found");

        const pricing = await PricingModel.getPricing(new ObjectId(client.pricing_id));
        if(!pricing) {
            throw new ValidationError("Pricing not found");
        }

        const sanitized = {
            client_id: id,
            plan_id: new ObjectId(plan._id),
            pricing_id: new ObjectId(pricing._id),
            status: "ready_for_payment", // pending | paid | ready_for_payment
            is_discounted,
            request_type: "creation",
            createdAt: new Date(),
            createdBy: id,
            updatedAt: null,
            updatedBy: null
        }

        const membership = {
            label: plan.label,
            duration: plan.label,
            duration_days: plan.duration_days,
            price: pricing.price,
            membership_fee: pricing.membership_fee,
            is_discounted
        }

        return await AuditLogsService.auditWrap({
            action: "membership_REQUEST_CREATED",
            entity: "memberships_request",
            actor: { id: id, role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) requested for an membership ${plan.label} for price of ${pricing.price}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_membership_REQUEST",
                    entity: "memberships_request",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a membership request notification`,
                    fn: async () => {
                        await sendEmail({
                            to: client.email,
                            subject: "6Pack Iron City - membership REQUEST",
                            html: emailRequestmembership(client, membership)
                        });
                    }
                })
                return await MembershipRequestModel.createmembershipRequest(sanitized, session)
                
            }
        });
    }
    
    /**
    async createMembershipRequest(meta, body, updater) {
        let { free } = body;
        let creator = updater.id;

        if(!client_id || !ObjectId.isValid(client_id)) {
            throw new ValidationError("Invalid client ID");
        }

        const client = await ClientModel.findUserById(new ObjectId(client_id));
        if(!client) {
            throw new ValidationError("No client found")
        }

        if(!plan_id || !ObjectId.isValid(plan_id)) {
            throw new ValidationError("Invalid plan ID");
        }

        if(!pricing_id || !ObjectId.isValid(pricing_id)) {
            throw new ValidationError("Invalid pricing ID");
        }

        if(!creator || !ObjectId.isValid(creator)) {
            throw new ValidationError("Invalid admin ID");
        }

        const plan = await PlanModel.viewAPlan(new ObjectId(plan_id));
        if(!plan) throw new ValidationError("Plan not found");

        const pricing = await PricingModel.getPricing(new ObjectId(pricing_id));

        if(!pricing) {
            throw new ValidationError("Pricing not found");
        }

        const sanitized = {
            client_id: new ObjectId(client_id),
            plan_id: new ObjectId(plan_id),
            pricing_id: new ObjectId(pricing_id),
            status: "pending", // pending | paid | ready_for_payment
            is_discounted: client.is_discounted,
            createdAt: new Date(),
            createdBy: new ObjectId(creator),
            updatedAt: null,
            updatedBy: null
        }
        
        return await AuditLogsService.auditWrap({
            action: "membership_REQUEST_CREATED",
            entity: "memberships_request",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} ${updater.role-updater.user_type} created membership request for ${client.first_name} ${client.last_name}`,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_membership_REQUESTED",
                    entity: "memberships",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a membership request successful `,
                    fn: async () => {
                        await sendEmail({
                            to: client.email,
                            subject: "6Pack Iron City - membership Request",
                            html: emailRequestmembership(client)
                        });
                    }
                })
                return await MembershipRequestModel.createmembershipRequest(sanitized);
            }
        });
        
    }
        */

    async createmembership(meta, updater, paymentId = null) {
        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid client ID");

        const client = await ClientModel.findUserById(new ObjectId(updater.id));
        if(!client) throw new ValidationError("No client found");

        const exist = await MembershipModel.alreadyHavemembership(new ObjectId(client._id));

        if(exist) {
            return exist;
        }

        const now = new Date();
        const endDate = await calculateEndDate(now);

        const config = await MembershipConfigModel.findActivemembershipConfigs();
        const membership = {
            name: config.label,
            duration: config.label,
            duration_days: config.duration_days,
            membership_fee: config.membership_fee,
            is_discounted: client.is_discounted, // boolean 
            start_date: new Date(),
            end_date: endDate
        }

        return await AuditLogsService.auditWrap({
            action: "membership_CREATED",
            entity: "memberships",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) approved membership creation request for ${client.first_name} ${client.last_name} `,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "membership_EMAIL_WELCOME",
                    entity: "memberships",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email membership approved`,
                    fn: async () => {
                        await sendEmail({
                            to: client.email,
                            subject: `6Pack Iron City - Welcome to 6Pack Iron City, ${ucfirst(client.first_name)}!`,
                            html: emailmembershipActivated(client, membership)
                        });
                    }
                })
                return await MembershipModel.createmembership({
                    client_id: client._id,
                    payment_id: paymentId ? new ObjectId(paymentId) : null,
                    start_date: new Date(),
                    end_date: endDate,
                    status: "pending",
                    is_frozen: false,
                    frozen_from: null,
                    frozen_til: null,
                    frozenBy: null,
                    unfrozenAt: null,
                    createdAt: new Date(),
                    createdBy: client._id,
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                });
            }
        });
        

    }

    async createmembershipByAdmin(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid membership request ID");
        if(!updater.id || !ObjectId.isValid(updater.id)) throw new ValidationError("Invalid admin ID");
        
        const request = await MembershipRequestModel.findmembershipByRequestId(new ObjectId(id));

        if(!request) {
            throw new ValidationError("Unable to find membership request");
        }

        const client = await ClientModel.findUserById(new ObjectId(request.client_id));
        if(!client) throw new ValidationError("No client found");

        const plan = await PlanModel.viewAPlan(new ObjectId(request.plan_id));
        if(!plan) throw new ValidationError("No plan found");

        const pricing = await PricingModel.getPricing(new ObjectId(request.pricing_id));
        if(!pricing) throw new ValidationError("No pricing found");

        const exist = await MembershipModel.alreadyHavemembership(new ObjectId(request._id));

        if(exist) {
            return exist;
        }

        const endDate = await calculateEndDate(request.pricing_id);

        const membership = {
            label: plan.label,
            duration: plan.label,
            duration_days: plan.duration_days,
            price: pricing.price,
            membership_fee: pricing.membership_fee,
            is_discounted: client.is_discounted,
            start_date: new Date(),
            end_date: endDate
        }


        return await AuditLogsService.auditWrap({
            action: "membership_CREATED",
            entity: "memberships",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) approved membership creation request for ${client.first_name} ${client.last_name} `,
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "membership_EMAIL_WELCOME",
                    entity: "memberships",
                    entity_id: new ObjectId(id) ?? null,
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email membership approved`,
                    fn: async () => {
                        await sendEmail({
                            to: client.email,
                            subject: `6Pack Iron City - Welcome to 6Pack Iron City, ${ucfirst(client.first_name)}!`,
                            html: emailmembershipActivated(client, membership)
                        });
                    }
                })
                return await MembershipModel.createmembership({
                    client_id: request.client_id,
                    plan_id: request.plan_id,
                    pricing_id: request.pricing_id,
                    start_date: new Date(),
                    end_date: endDate,
                    status: "active",
                    is_discounted: request.is_discounted,
                    is_frozen: false,
                    frozen_from: null,
                    frozen_til: null,
                    frozenBy: null,
                    unfrozenAt: null,
                    createdAt: new Date(),
                    createdBy: request.createdBy,
                    updatedAt: null,
                    updatedBy: null,
                    archivedAt: null,
                    archivedBy: null
                });
            }
        });
        

    }

    async viewmembership(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        return await MembershipModel.viewmembership(new ObjectId(id));
    }

    async viewAllmembership(query) {
        let { start_date, end_date, status, is_frozen, search, page = 1, limit = 10} = query;
        
        let filter = {};
        page = Number(page);
        limit = Number(limit);

        if(start_date) {
            filter.end_date = { $gte: new Date(start_date) }; 
        }

        if(end_date) {
            filter.start_date = { $lte: new Date(end_date) }; 
        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(is_frozen !== undefined) {
            filter.is_frozen = is_frozen === "true" || is_frozen === true;
        }


        if(search) {
            search = search.trim().toLowerCase()
        }

        return await MembershipModel.viewAllmembership(filter, search, page, limit);
    }

    async updatemembership(id, meta, body, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }
        let { frozen_from, frozen_til, is_frozen, status, statusRequest } = body;


        if(is_frozen === true) {
            if(!frozen_from || !frozen_til) {
                throw new ValidationError("Missing frozen_from and frozen_til");
            }
            frozen_from = new Date(frozen_from);
            frozen_til = new Date(frozen_til);
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }  
        let startDate
        if(body.start_date) {
            startDate = new Date(body.start_date)
        }
        
        let endDate
        if(body.end_date) {
            endDate = new Date(body.end_date)
        }

        if(startDate && Number.isNaN(startDate.getTime())) {
            throw new ValidationError("Invalid start date format")
        }

        if(endDate && Number.isNaN(endDate.getTime())) {
            throw new ValidationError("Invalid end date format")
        }
        
        const exisitngmembership = await MembershipModel.viewmembership(new ObjectId(id));
        
        if(!exisitngmembership) {
            throw new ValidationError("membership not found");
        }

        const client = await ClientModel.findUserById(new ObjectId(exisitngmembership.client_id));

        

        const membershipConfig = await MembershipConfigModel.findActivemembershipConfigs();
        
        if(!endDate && startDate) {
            const durationDays = membershipConfig.duration_days;
            
            updateData.end_date = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        }

        if(endDate && !startDate) {
            const durationDays = membershipConfig.duration_days;
            
            updateData.end_date = new Date(startDate.getTime() - durationDays * 24 * 60 * 60 * 1000);
        }

       if (startDate && endDate) {
            const diffInDays = Math.round(
                (endDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (diffInDays !== membershipConfig.duration_days) {
                throw new ValidationError(
                    `Start date and end date should be ${membershipConfig.duration_days} days apart`
                );
            }
        }

        const data = {
            status: status ? String(status).trim().toLowerCase() : exisitngmembership.status,
            start_date: startDate ? startDate : exisitngmembership.start_date,
            end_date: endDate ? endDate : exisitngmembership.end_date,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id),
        }

        if(is_frozen === true) {
            data.is_frozen = true;
            data.frozen_from = frozen_from;
            data.frozen_til = frozen_til;
            data.frozenBy = new ObjectId(updater.id);
        }

        if(is_frozen === false && is_frozen !== undefined) {
            data.is_frozen = false;
            data.frozen_from = null;
            data.frozen_til = null;
            data.frozenBy = null;
        }


        if(statusRequest !== null && (statusRequest === "approved" || statusRequest === "rejected")) {
            await MembershipRequestModel.updatemembershipStatus(new ObjectId(id), {
                status: statusRequest,
                updatedAt: new Date(),
                updatedBy: new ObjectId(updater.id)
            });
        }


        const email = {
            first_name: client.first_name,
            last_name: client.last_name,
            start_date: data.start_date ? data.start_date : exisitngmembership.start_date,
            end_date: data.end_date ? data.end_date : exisitngmembership.end_date,
            updatedBy: new ObjectId(updater.id),
            updatedAt: new Date()
        };


        return await AuditLogsService.auditWrap({
            action: "membership_UPDATE",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            changes: {
                patch: {
                    before: exisitngmembership,
                    after: data
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the membership info of ${client.first_name} ${client.last_name}`,
            fn: async () => {
                    await AuditLogsService.auditWrap({
                        action: "EMAIL_membership_REQUEST",
                        entity: "memberships_request",
                        actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                        meta: meta,
                        summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has updated the membership info of ${client.first_name} ${client.last_name}`,
                        fn: async () => {
                            await sendEmail({
                                to: client.email,
                                subject: "6Pack Iron City - membership Update",
                                html: membershipUpdatedEmail(email)
                            });
                        }
                    })
                

                return await MembershipModel.updatemembership(
                    new ObjectId(id),
                    data
                );
            }
        });
        
    }

    async updatemembershipStatus(id, meta, body, updater) {
        if (!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        let membership = await MembershipModel.viewmembership(new ObjectId(id));
        if (!membership) {
            throw new ValidationError("membership not found");
        }


        if (!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        let status = String(body.status).trim().toLowerCase();

        if (!status) {
            throw new ValidationError("Missing status value");
        }

        const allowedStatus = ["active", "cancelled", "archived"];

        if (!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value");
        }

        let updates = {
            status,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        };

        const createmembershipRequest = async (statusValue) => {
            const sanitizedRequest = {
                client_id,
                plan_id: new ObjectId(membership.plan_id),
                pricing_id: new ObjectId(membership.pricing_id),
                status: statusValue,
                request_type: "cancellation",
                createdAt: new Date(),
                createdBy: new ObjectId(updater.id),
                updatedAt: new Date(),
                updatedBy: new ObjectId(updater.id)
            };
            return await AuditLogsService.auditWrap({
                action: "membership_STATUS_UPDATED",
                entity: "memberships_request",
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                meta: meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created membership cancellation request for ${client.first_name} ${client.last_name}`,
                fn: async () => {
                    await AuditLogsService.auditWrap({
                        action: "EMAIL_membership_STATUS_UPDATED",
                        entity: "memberships",
                        entity_id: new ObjectId(id),
                        actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                        meta: meta,
                        summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent 
                        an email notification about membership new status ${statusValue}`,
                        fn: async () => {
                            await sendEmail({
                                to: client.email,
                                subject: `6Pack Iron City - membership ${statusValue}` ,
                                html: clientRegisteredEmail(client)
                            });
                        }
                    })
                    return await MembershipRequestModel.createmembershipRequest(sanitizedRequest);
                }
            });
        };

        let redirect;

        if (status === "cancelled") {
            const payment_method = String(body.payment_method || null).trim().toLowerCase();

            if (!payment_method) {
                throw new ValidationError("Payment method is required for cancellation");
            }

            let requestData = {
                plan_id: new ObjectId(membership.plan_id),
                pricing_id: new ObjectId(membership.pricing_id),
                ...body
            };

            if (payment_method === "cash") {
                const request = await createmembershipRequest("completed");

                const external_id = `cash-membership=${membership._id}-${Date.now()}`;

                await AuditLogsService.auditWrap({
                    action: "PAYMENT_CREATED",
                    entity: "payments",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${client.first_name} ${client.last_name} paid cash for request cancellation of membership`,
                    changes: {
                        patch: {
                            before: membership.status,
                            after: status
                        }
                    },
                    fn: async () => {
                        await PaymentModel.createPayment({
                            provider: "cash",
                            external_id,
                            amount: Number(body.amount),
                            status: "PAID",
                            payment_method: payment_method,
                            membership_request_id: request._id,
                            raw_response: null,
                            createdAt: new Date(),
                            createdBy: new ObjectId(updater.id),
                            updatedAt: new Date(),
                            updatedBy: new ObjectId(updater.id)
                        });
                    }
                });
                

            } else if (payment_method === "gcash") {
                const request = await this.createmembershipRequest(updater, requestData);

                requestData.membership_request_id = request.insertedId;

                redirect = await PaymentService.createGcashPayment(meta, requestData, updater);

            } else if (payment_method === "paymaya") {
                const request = await this.createmembershipRequest(updater, requestData);

                requestData.membership_request_id = request._id;
                redirect = await PaymentService.createMayaPayment(meta, requestData, updater);

            } else {
                throw new ValidationError("Invalid payment method");
            }
        }

        if (status === "archived") {
            updates.archivedAt = new Date();
            updates.archivedBy = new ObjectId(updater.id);
        }

        const email = {
            first_name: client.first_name,
            last_name: client.last_name,
            status,
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        };

        let updated = null;

        await AuditLogsService.auditWrap({
            action: "membership_STATUS_UPDATED",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type})`,
            fn: async () => {
                updated = await MembershipModel.updatemembershipStatus(new ObjectId(id), updates);
                await AuditLogsService.auditWrap({
                    action: "EMAIL_membership_STATUS_UPDATED",
                    entity: "email",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${client.first_name} ${client.last_name} (${client.role-client.user_type}) has been sent an email notification about membership status update`,
                    fn: async () => {
                        await sendEmail({
                            to: client.email,
                            subject: `6Pack Iron City - membership ${status} Updated`,
                            html: membershipUpdatedEmail(email)
                        });
                    }
                })
            }
        });
        

        return  {
            redirect: redirect.checkout_url, 
            external_id: redirect.external_id,
            updated: updated
        }
    }

    async requestFreezemembership(meta, body, files, updater) {
        if (!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid client ID");
        }

        const { medical_proof_url } = files;

        if (!medical_proof_url) {
            throw new ValidationError("Medical proof is required");
        }

        const MAX_SIZE = 25 * 1024 * 1024;
        if (medical_proof_url.size > MAX_SIZE) {
            throw new ValidationError("Medical proof file is too large");
        }

        let { freeze_start_date, freeze_end_date } = body;

        if (!freeze_start_date || !freeze_end_date) {
            throw new ValidationError("Freeze dates are required");
        }

        freeze_start_date = new Date(freeze_start_date);
        freeze_end_date = new Date(freeze_end_date);

        if (isNaN(freeze_start_date.getTime()) || isNaN(freeze_end_date.getTime())) {
            throw new ValidationError("Invalid freeze dates");
        }

        if (freeze_start_date > freeze_end_date) {
            throw new ValidationError("Start date must not be after end date");
        }

        const membership = await MembershipModel.findmembershipByclientId(
            new ObjectId(updater.id)
        );

        if (!membership) {
            throw new ValidationError("No membership found");
        }

        if (membership.status !== "active") {
            throw new ValidationError("Only active memberships can be frozen");
        }

        const now = new Date();

        const data = {
            membership_id: new ObjectId(membership._id),
            client_id: new ObjectId(updater.id),
            status: "pending",
            is_discounted: updater.is_discounted,
            request_type: "freeze",
            freeze_start_date,
            freeze_end_date,
            medical_proof_url: medical_proof_url,
            createdAt: now,
            createdBy: new ObjectId(updater.id),
            updatedAt: null,
            updatedBy: null,
        };

        return await AuditLogsService.auditWrap({
            action: "membership_FREEZE_REQUEST",
            entity: "memberships_request",
            actor: {
                id: new ObjectId(updater.id),
                role: updater.role,
                user_type: updater.user_type
            },
            meta,
            summary: `${updater.first_name} ${updater.last_name} requested to freeze membership`,
            fn: async () => {
                return await MembershipRequestModel.createmembershipRequest(data);
            }
        });
    }

    async decisionFreezemembership(id, meta, body, updater) {
        if (!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid admin ID");
        }

        if (updater.role !== "admin") {
            throw new AuthorizationError("Only admins can decide freeze requests");
        }

        if (!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership request ID");
        }

        const membership_request =
            await MembershipRequestModel.findmembershipByRequestId(new ObjectId(id));

        if (!membership_request) {
            throw new ValidationError("No membership request found");
        }

        if (membership_request.request_type !== "freeze") {
            throw new ValidationError("Invalid request type");
        }

        if (membership_request.status !== "pending") {
            throw new ValidationError("This request has already been decided");
        }

        const status = body.status?.toString().trim().toLowerCase();

        if (!["approved", "rejected"].includes(status)) {
            throw new ValidationError("Invalid decision status");
        }

        const membership =
            await MembershipModel.findById(new ObjectId(membership_request.membership_id));

        if (!membership) {
            throw new ValidationError("membership not found");
        }

        const now = new Date();

        const membership_request_data = {
            status,
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        };

        const membership_data = {
            updatedAt: now,
            updatedBy: new ObjectId(updater.id)
        };

        if (status === "approved") {
            membership_data.is_frozen = true;
            membership_data.frozen_from = membership_request.freeze_start_date;
            membership_data.frozen_til = membership_request.freeze_end_date;
            membership_data.frozenBy = new ObjectId(updater.id);
        }

        return await AuditLogsService.auditWrap({
            action: "membership_FREEZE_DECISION",
            entity: "memberships_request",
            entity_id: new ObjectId(id),
            actor: {
                id: new ObjectId(updater.id),
                role: updater.role,
                user_type: updater.user_type
            },
            meta,
            summary: `${updater.first_name} ${updater.last_name} freeze request was ${status}`,
            fn: async () => {
                await MembershipRequestModel.updatemembershipStatus(
                    new ObjectId(id),
                    membership_request_data
                );

                if (status === "approved") {
                    await MembershipModel.updatemembership(
                        new ObjectId(membership_request.membership_id),
                        membership_data
                    );
                }
            }
        });
    }

    async freezemembership(id, meta, body, files, updater) {
    if (!id || !ObjectId.isValid(id)) {
        throw new ValidationError("Invalid membership ID");
    }

    if (!updater.id || !ObjectId.isValid(updater.id)) {
        throw new ValidationError("Invalid updater ID");
    }

    const{ medical_proof_url }= files
    if (!medical_proof_url) {
        throw new ValidationError("Medical proof is required");
    }

    const MAX_SIZE = 25 * 1024 * 1024;
    if (medical_proof_url.size > MAX_SIZE) {
        throw new ValidationError("Medical proof file is too large");
    }

    let { freeze_start_date, freeze_end_date } = body;

    if (!freeze_start_date || !freeze_end_date) {
        throw new ValidationError("Freeze dates are required");
    }

    freeze_start_date = new Date(freeze_start_date);
    freeze_end_date = new Date(freeze_end_date);

    if (
        isNaN(freeze_start_date.getTime()) ||
        isNaN(freeze_end_date.getTime())
    ) {
        throw new ValidationError("Invalid freeze dates");
    }

    if (freeze_start_date > freeze_end_date) {
        throw new ValidationError("Start date must not be after end date");
    }

    const membership = await MembershipModel.viewmembership(
        new ObjectId(id)
    );

    if (!membership) {
        throw new ValidationError("membership not found");
    }

    if (membership.status !== "active") {
        throw new ValidationError("Only active memberships can be frozen");
    }

    if (membership.is_frozen) {
        throw new ValidationError("membership is already frozen");
    }

    const client = await ClientModel.findUserById(
        new ObjectId(membership.client_id)
    );

    if (!client) {
        throw new ValidationError("client not found");
    }

    const plan = await PlanModel.viewAPlan(
        new ObjectId(membership.plan_id)
    );

    const now = new Date();

    const membership_data = {
        is_frozen: true,
        frozen_from: freeze_start_date,
        frozen_til: freeze_end_date,
        frozenAt: now,
        frozenBy: new ObjectId(updater.id),
        updatedAt: now,
        updatedBy: new ObjectId(updater.id)
    };

    const membership_request_data = {
        membership_id: new ObjectId(membership._id),
        client_id: new ObjectId(client._id),
        plan_id: new ObjectId(membership.plan_id),
        pricing_id: new ObjectId(membership.pricing_id),
        status: "approved",
        is_discounted: client.is_discounted,
        request_type: "freeze",
        freeze_start_date,
        freeze_end_date,
        medical_proof_url: medical_proof_url,
        createdAt: now,
        createdBy: new ObjectId(updater.id),
        approvedAt: now,
        approvedBy: new ObjectId(updater.id),
        updatedAt: null,
        updatedBy: null
    };

    const frozenByName = `${ucfirst(updater.first_name)} ${ucfirst(updater.last_name)}`;

    const emailPayload = {
        first_name: client.first_name,
        last_name: client.last_name,
        name: plan?.label,
        start_date: membership.start_date,
        end_date: membership.end_date,
        frozen_from: freeze_start_date,
        frozen_til: freeze_end_date,
        frozenBy: frozenByName,
        updatedAt: now
    };

    return await AuditLogsService.auditWrap({
        action: "membership_FROZEN",
        entity: "memberships",
        entity_id: new ObjectId(id),
        actor: {
            id: new ObjectId(updater.id),
            role: updater.role,
            user_type: updater.user_type
        },
        meta,
        summary: `${updater.first_name} ${updater.last_name} froze the membership of ${client.first_name} ${client.last_name}`,
        changes: {
            patch: {
                before: membership,
                after: membership_data
            }
        },
        fn: async () => {

            await MembershipRequestModel.createmembershipRequest(
                membership_request_data
            );

            await sendEmail({
                to: client.email,
                subject: "6Pack Iron City - membership Frozen",
                html: membershipFrozenEmail(emailPayload)
            });

            return await MembershipModel.freezemembership(
                new ObjectId(id),
                membership_data
            );
        }
    });
}

    async unfreezemembership(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid membership ID");
        }

        const membership = await MembershipModel.viewmembership(new ObjectId(id));

        if(!membership) {
            throw new ValidationError("membership not found");
        }

        if(!membership.is_frozen) {
            throw new ValidationError("membership is not frozen");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        const client = await ClientModel.findUserById(new ObjectId(membership.client_id));
        if(!client) throw new ValidationError("No client found");

        const data = {
            is_frozen: false,
            frozenAt: null,
            frozenBy: null,
            frozen_from: null,
            frozen_til: null, 
            unfrozenAt: new Date(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater.id)
        }  

        return await AuditLogsService.auditWrap({
            action: "membership_UNFREEZED",
            entity: "memberships",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has unfrozed the membership of ${client.first_name} ${client.last_name}`,
            changes: {
                patch: {
                    before: membership,
                    after: data
                }
            },
            fn: async () => {
                await AuditLogsService.auditWrap({
                    action: "EMAIL_membership_UNFREEZED",
                    entity: "memberships",
                    entity_id: client._id ?? null,
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email notification about unfroze of membership`,
                    fn: async () => {
                        const emailData = {
                            first_name: client.first_name,
                            last_name: client.last_name,
                            frozen_from: membership.frozen_from,
                            frozen_til: membership.frozen_til,
                            unfrozen_at: new Date(),
                            unfrozenBy: `${updater.first_name} ${updater.last_name}`
                        };
                        await sendEmail({
                            to: client.email,
                            subject: "6Pack Iron City Gym - membership Unfrozen",
                            html: membershipUnfrozenEmail(emailData)
                        });
                    }
                })
                await MembershipModel.unfreezemembership(
                    new ObjectId(id),
                    data
                );
            }
        });

        
    }

    async fetchAllmembershipRequests(query) {
        let { status, search, page = 1, limit = 10, request_type } = query;
        
        let filter = {};
        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || page < 1) page = 1;
        if (!Number.isInteger(limit) || limit < 1 || limit > 50) limit = 10;

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(request_type) {
            // Support filtering by request_type: 'cancellation' or 'creation'
            filter.request_type = { $in: request_type.split(',') };
        }

        if(search) {
            search = search.trim().toLowerCase()
        }

        return await MembershipRequestModel.fetchAllmembershipRequests(filter, search, page, limit);
    }

    async activatemembership(id, data) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid payment ID");
        }

        const membership = await MembershipModel.findmembershipByPaymentId(new ObjectId(id));
        if(!membership) throw new ValidationError("membership not found");

        return await MembershipModel.activatemembership(new ObjectId(membership._id), data);
    }

    async fetchMyActiveMembership(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }
        
        return await MembershipModel.fetchMyActiveMembership(new ObjectId(id));
    }

    async fetchMyLastMembership(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }
        
        return await MembershipModel.fetchMyLastMembership(new ObjectId(id));
    }
}

export default new MembershipService();
