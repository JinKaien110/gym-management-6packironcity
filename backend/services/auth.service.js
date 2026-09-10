import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js"; 
import AuthModel from "../models/AuthModel.js";
import ClientModel from "../models/ClientModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { ObjectId } from "mongodb";
import { generateToken } from "../utils/generateToken.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipService from "./membership.service.js";
import AdminModel from "../models/AdminModel.js";
import ucfirst from "../utils/ucfirst.js";
import { connectDB  } from "../config/db.js";
import { sendEmail } from "./email.service.js";
import PlanModel from "../models/PlanModel.js";
import PricingModel from "../models/PricingModel.js";
import MembershipRequestModel from "../models/MembershipRequestModel.js";
import DiscountRequestModel from "../models/DiscountRequestModel.js";
import PaymentService from "./payment.service.js";
import PaymentModel from "../models/PaymentModel.js";
import ClientPassModel from "../models/ClientPassModel.js";
import { validatePhilippinePhoneNumber } from "../utils/validatePhoneNumber.js";



class AuthService {
    async loginUser(meta, body) {
        const { email, password } = body;

        if (!email || !password) {
            throw new ValidationError("Please fill out the necessary field.");
        }

        const sanitizedEmail = String(email).trim().toLowerCase();
        const sanitizedPassword = String(password).trim();

        const [client, trainer, admin] = await Promise.all([
            AuthModel.FindUserByEmail(sanitizedEmail),
            TrainerManagementModel.findTrainerByEmail(sanitizedEmail),
            AdminModel.viewAdminByEmail(sanitizedEmail)
        ]);

        const account = client || trainer || admin;
        
        if (!account) {
            throw new ValidationError("No user found.");
        }

        const isPasswordMatch = await AuthModel.ValidatePassword(
            sanitizedPassword,
            account.password
        );

        if (!isPasswordMatch) {
            throw new ValidationError("Incorrect password." );
        }

    

        // 3) Generate token from the same account
        const token = generateToken({
            id: account._id,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            role: account.role,
            user_type: account.user_type,
            is_discounted: account.is_discounted || false,
            status: account.status 
        });

        let userPayload = null;

        if(account.user_type === "admin") {
            userPayload = await AdminModel.viewAdmin(account._id);
        } else if (account.user_type === "trainer") {
            userPayload = await TrainerManagementModel.findTrainerById(account._id);
        } else if (account.user_type === "client") {
            userPayload = await this.SingleSourceOfTruth(account._id);
        }

        return await AuditLogsService.auditWrap({
            action: "AUTH_LOGIN",
            entity: account.role,
            entity_id: account._id,
            actor: { id: account._id, role: account.role, user_type: account.user_type  }, 
            meta: meta,
            summary: `${account.first_name} (${account.role-account.user_type}) has logged in`,
            fn: async () => {
                return {
                    token,
                    userPayload
                };
            }
        });
    }

    async RegisterUser(meta, body) {
        let { email, first_name, last_name, phone, password } = body;
        if(!email?.trim() || !password?.trim() || !first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
            throw new ValidationError("Please fillout the necessary field.");
        }

        if(phone) {
            // Validate Philippine phone number
            const phoneValidation = validatePhilippinePhoneNumber(phone);
            if (!phoneValidation.valid) {
                throw new ValidationError(phoneValidation.message);
            }
            phone = phone.trim();
        }

        await checkDuplicate(null, {email, phone})

        const hash = await hashedPassword(password.trim())
        
        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone,
            address: null,
            password: hash,

            role: "client",
            user_type: "client",
            status: "active",

            is_discounted: false,

            gender: null,
            date_of_birth: null,
            height: null,
            weight: null,
            bmi: null,
            fitness_goal: [],
            medical_condition: null,

            training_type: null,
            experience_level: null,
            days_per_week: null, 
            session_minutes: null,

            emergency_name: null,
            emergency_contact: null,
            emergency_relationship: null,

            qr_code: null,
            
            createdAt: new Date(),
            createdBy: "self",
            updatedAt: new Date(),
            updatedBy: "self",
            archivedAt: null,
            archivedBy: null
        }

        const UserExist = await AuthModel.FindUserByEmail(sanitized.email);
        if(UserExist) throw new ValidationError("User already existed.");

        return await AuditLogsService.auditWrap({
            action: "AUTH_REGISTER",
            entity: "clients",
            actor: { email: email.trim().toLowerCase(), role: "client", user_type: "client" }, 
            meta: meta,
            summary: `${email.trim().toLowerCase()} has registered`,
            fn: async () => {
                const { db, client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();

                    const updater = await ClientModel.RegisterUser(sanitized, session);
                    
                    await session.commitTransaction();
                    return updater;
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }

            }
        });
    }
    
    async Me(user) {
        if (!user) throw new ValidationError("Invalid user logged in");
        if (!user.id || !ObjectId.isValid(user.id)) throw new ValidationError("Invalid user ID");
        if (!user.user_type || !user.role) throw new ValidationError("Invalid token payload");

        const id = new ObjectId(user.id);
        
        if (user.user_type === "admin") {
            const allowed = ["admin", "staff", "superadmin"];
            if (!allowed.includes(user.role)) throw new ValidationError("Forbidden");
            return await AdminModel.viewAdmin(id);
        }

        if (user.user_type === "client") {
            if (user.role !== "client") throw new ValidationError("Forbidden");
            return await this.SingleSourceOfTruth(user);
        }

        if (user.user_type === "trainer") {
            if (user.role !== "trainer") throw new ValidationError("Forbidden");
            console.log("Trainer ID:", id); // Debug log
            return await TrainerManagementModel.findTrainerById(id);
        }

        throw new ValidationError("No user found");
    }

    async SingleSourceOfTruth(user) {
    
        if (!user) throw new ValidationError("Invalid client logged in");

        if (!user.id || !ObjectId.isValid(user.id)) throw new ValidationError("Invalid client ID");

        const id = new ObjectId(user.id);

        const client = await ClientModel.findUserById(id);

        const membership_request = await MembershipRequestModel.findmembershipRequestByclientId(id);

        const discount_request = await DiscountRequestModel.findDiscountRequestBymembershipRequestId(membership_request?._id || null);
        
        const payment = await PaymentModel.getLatestPaymentDetails(id, "daily_pass");
        const client_pass = await ClientPassModel.findActiveclientPass(id);
        const plan = await PlanModel.viewAPlan(new ObjectId(client_pass?.plan_id ? client_pass.plan_id : payment?.plan_id ));
        const pricing = await PricingModel.getPricing(new ObjectId(client_pass?.pricing_id ? client_pass.pricing_id : payment?.pricing_id ));

        
        const membership = await MembershipModel.fetchMyActiveMembership(id);

        const result = {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                user_type: user.user_type,
                is_discounted: user.is_discounted,
                ...client
            },
            discount_request: discount_request ? {
                id: discount_request._id,
                status: discount_request.status,
                reviewed_by: discount_request.reviewed_by,
                reviewed_at: discount_request.reviewed_at,
            } : null,
            payment: payment ? {
                id: payment._id,
                payment_for: payment.payment_for,
                status: payment.status,
                provider: payment.provider,
                amount: payment.amount,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
                reference_no: payment.reference_no,
                payment_method: payment.payment_method,
                
            } : null,
            plan: plan ? {
                id: plan._id,
                name: plan.name,
                label: plan.label,
                duration_days: plan.duration_days,
            } : null,
            pricing: pricing ? {
                id: pricing._id,
                name: pricing.name,
                label: pricing.label,
                price: pricing.price,
                membership_fee: pricing.membership_fee,
                type: pricing.type
            } : null,
            client_pass: client_pass ? {
                id: client_pass._id,
                plan_id: client_pass.plan_id,
                pricing_id: client_pass.pricing_id,
                start_date: client_pass.start_date,
                end_date: client_pass.end_date,
                payment_id: client_pass.payment_id,
                duration_days: client_pass.duration_days,
                reference_no: client_pass.reference_no,
                status: client_pass.status,
                createdAt: client_pass.createdAt,
                updatedAt: client_pass.updatedAt
            } : null,
            membership: membership ? {
                id: membership._id,
                start_date: membership.start_date,
                end_date: membership.end_date,
                status: membership.status,
                is_discounted: membership.is_discounted,
                is_frozen: membership.is_frozen,
                frozen_at: membership.frozen_at,
                frozen_til: membership.frozen_til
            } : null
        }
        return result;
    }
}

export default new AuthService();