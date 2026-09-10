
import { ObjectId } from "mongodb";
import { ValidationError } from "../errors/ValidationError.js";
import AuditLogsService from "./audit.logs.service.js";
import { generateQrCode } from "../utils/generateQrCode.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import MembershipModel from "../models/MembershipModel.js";
import { connectDB } from "../config/db.js";
import { trainerAssignedToclientEmail } from "../templates/assignment/email.trainerAssignedToClient.js";
import { sendEmail } from "./email.service.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import ClientModel from "../models/ClientModel.js";
import { generateRandomPassword } from "../utils/generateRandomPassword.js";
import { validatePhilippinePhoneNumber } from "../utils/validatePhoneNumber.js";

class ClientService {
    async PostForm(body, meta, updater) {
        const { gender, date_of_birth, height, weight, bmi, fitness_goal, medical_condition, training_type, experience_level, days_per_week, session_minutes } = body;
        const id = updater.id;

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }

        const client = await ClientModel.findUserById(new ObjectId(id));
        if(!client) throw new ValidationError("client not found");

        if(!gender || !date_of_birth || !height || !weight || !bmi || !fitness_goal || !training_type || !experience_level || !days_per_week || !session_minutes) {
            throw new ValidationError("Please fill out the necesarry fields")
        }

        const dob = new Date(date_of_birth);

        if(isNaN(dob.getTime())) {
            throw new ValidationError("Invalid date format for DOB");
        }

        const today = new Date();
        if(dob > today) {
            throw new ValidationError("DOB cannot be in the future");
        }

        const ageDiff = today.getFullYear() - dob.getFullYear();
        if(ageDiff < 12 || ageDiff > 100) {
            throw new ValidationError("Unrealistic Age");
        }

        if(!Array.isArray(fitness_goal)) {
            throw new ValidationError("Fitness goals must be an array" );
        }

        const qr = await generateQrCode(id);

        const sanitized = {
            status: "active",
            gender: gender.trim().toLowerCase(),
            date_of_birth: dob,
            height: Number(height),
            weight: Number(weight),
            bmi: Number(bmi.toFixed(1)),
            fitness_goal: Array.isArray(fitness_goal)
                ? fitness_goal.map(f => f.trim().toLowerCase())
                : [fitness_goal.trim().toLowerCase()],
            medical_condition: medical_condition?.trim(),
            training_type: training_type.trim().toLowerCase(),
            experience_level: experience_level.trim().toLowerCase(),
            days_per_week: Number(days_per_week),
            session_minutes: Number(session_minutes),
            qr_code: qr,
            updatedAt: new Date(),
            updatedBy: new ObjectId(id)
        }
        
        return await AuditLogsService.auditWrap({
            action: "clientS_POSTFORM",
            entity: "clients",
            entity_id: new ObjectId(updater.id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            changes: {
                patch: {
                    before: client,
                    after: sanitized
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) filled out postform for his health information`,
            fn: async () => {
                return await ClientModel.PostForm(id, sanitized);
            }
        });
    }

    async updateProfile(id, body, meta, updater) {
        let { first_name, last_name, gender, date_of_birth, phone, email, address, is_discounted, emergency_name, emergency_contact, emergency_relationship, experience_level, days_per_week, session_minutes, height, weight, bmi, fitness_goal, training_type } = body;
        let updatedBy = updater.id;

        const sanitizedclient = {};

        // client Collection
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid client ID");
        if(first_name) sanitizedclient.first_name = first_name.trim();
        if(last_name) sanitizedclient.last_name = last_name.trim();
        if(gender) sanitizedclient.gender = gender.trim().toLowerCase();
        if(date_of_birth) {
            const dob = new Date(date_of_birth);

            if(Number.isNaN(dob.getTime())) {
                throw new ValidationError("Invalid date of birth format");
            }
            sanitizedclient.date_of_birth = dob
        }
        if(typeof is_discounted === "boolean") sanitizedclient.is_discounted = is_discounted;
        if(experience_level) sanitizedclient.experience_level = experience_level.trim().toLowerCase();
        if(days_per_week) sanitizedclient.days_per_week = Number(days_per_week)
        if(session_minutes) sanitizedclient.session_minutes = Number(session_minutes)
        if(height) sanitizedclient.height = Number(height)
        if(weight) sanitizedclient.weight = Number(weight)
        if(bmi) sanitizedclient.bmi = Number(bmi)
        if(fitness_goal) sanitizedclient.fitness_goal = Array.isArray(fitness_goal) ? Array.map(f => f.trim().toLowerCase()) : [fitness_goal.trim().toLowerCase()];
        if(training_type) sanitizedclient.training_type = training_type.trim().toLowerCase();    
        if(phone) {
            // Validate Philippine phone number
            const phoneValidation = validatePhilippinePhoneNumber(phone);
            if (!phoneValidation.valid) {
                throw new ValidationError(phoneValidation.message);
            }
            sanitizedclient.phone = phone.trim();
        }
        if(email) sanitizedclient.email = email.trim().toLowerCase();
        if(address) sanitizedclient.address = address.trim().toLowerCase();
        if(emergency_name) sanitizedclient.emergency_name = emergency_name.trim();
        if(emergency_contact) sanitizedclient.emergency_contact = emergency_contact;
        if(emergency_relationship) sanitizedclient.emergency_relationship = emergency_relationship.trim().toLowerCase();
        if(!updatedBy || !ObjectId.isValid(updatedBy)) throw new ValidationError("Invalid admin ID");

        await checkDuplicate(new ObjectId(id), {
            email: sanitizedclient.email,
            phone: sanitizedclient.phone
        }); 
        
        const existingclient = await ClientModel.findUserById(new ObjectId(id));
        if (!existingclient) throw new ValidationError("No client found");


        const clientUpdates = getChangedFields(existingclient, sanitizedclient);

        return await AuditLogsService.auditWrap({
            action: "clientS_ADMIN_UPDATE",
            entity: "clients",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${first_name} ${last_name} profile and/or membership`,
            changes: { patch:  {
                before: existingclient,
                after: clientUpdates,
            } },
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();

                    if(Object.keys(clientUpdates).length) {
                        clientUpdates.updatedAt = new Date();
                        clientUpdates.updatedBy = new ObjectId(updatedBy);

                        await ClientModel.updateclient(new ObjectId(id), clientUpdates, session);

                    }

                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }

                return;
            }
        });
    } 

    async listOfTrainersAfterPostForm(client) {
        if(!client.id || !ObjectId.isValid(client.id)) {
            throw new ValidationError("Invalid client ID");
        }

        return ClientModel.listOfTrainersAfterPostForm(client.fitness_goal);
    }

    async selectTrainer(id, meta, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(id));
        if(!trainer) {
            throw new ValidationError("No trainer found");
        }

        const trainerSpecs = (trainer.specialization || []).map(s => String(s).toLowerCase());
        const clientGoal = Array.isArray(updater.fitness_goal)
        ? updater.fitness_goal.map(g => String(g).toLowerCase())
        : [];

        const hasMatch = clientGoal.some(goal => trainerSpecs.includes(goal));

        if(!hasMatch) {
            throw new ValidationError("Your fitness goals do not match trainer's specialization");
        }

        if(!updater || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid client");
        }

        const email = {
            client_first_name: updater.first_name,
            client_last_name: updater.last_name,
            trainer_first_name: trainer.first_name,
            trainer_last_name: trainer.last_name,
            trainer_email: trainer.email,
            trainer_phone: trainer.phone,
            assignedAt: new Date(),
            assignedBy: updater.first_name
        };


        return await AuditLogsService.auditWrap({
            action: "clientS_TRAINER_SELECT",
            entity: "clients",
            entity_id: new ObjectId(updater.id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} selected ${trainer.first_name} ${trainer.last_name} as a trainer`,
            fn: async () => {
                const { db, client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    
                    await ClientModel.assignATrainer(
                        new ObjectId(updater.id),
                        new ObjectId(id),
                        null,
                        session
                    );

                    await TrainerManagementModel.assignclient(
                        new ObjectId(updater.id),
                        new ObjectId(id),
                        null,
                        session
                    );

                    await AuditLogsService.auditWrap({
                        action: "EMAIL_TRAINER_NEW_client",
                        entity: "clients",
                        entity_id: new ObjectId(updater.id),
                        actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                        meta: meta,
                        summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent a notification email for new assigned client`,
                        fn: async () => {
                            return await sendEmail({
                                to: updater.email,
                                subject: "6Pack Iron City - Trainer Assignment",
                                html: trainerAssignedToclientEmail(email)
                            });
                        }
                    })
                    await session.commitTransaction();
                    
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
                return;
            }
        });
    }






    /***
     * ADMIN FUNCTIONS BELOW
     */

    async createclient(body, meta, updater) {
        const { first_name, last_name, email, phone } = body;
        const id = updater.id;

        if (!first_name || !last_name || !email || !phone ) {
            throw new ValidationError("Please fill out the necessary fields" );
        }

        if (updater.role === "client" ||  updater.role === "" || updater.role === null || updater.role === undefined) {
            throw new ValidationError("Invalid authentication role");
        }

        if (!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid admin ID" );
        }

        // Validate Philippine phone number
        const phoneValidation = validatePhilippinePhoneNumber(phone);
        if (!phoneValidation.valid) {
            throw new ValidationError(phoneValidation.message);
        }

        const doesExist = await ClientModel.findUserByEmail(email.trim().toLowerCase());
        if (doesExist) {
            throw new ValidationError("client already exists");
        }

        const hashpassword = generateRandomPassword();

        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            address: null,
            password: hashpassword,

            role: "client",
            user_type: "client",
            status: "active",

            is_discounted: false,

            gender: null,
            date_of_birth: null,
            height: null,
            weight: null,
            bmi: null,

            fitness_goal: null,
            training_type: null,
            medical_condition: null,
            experience_level: null,
            days_per_week: null,
            session_minutes: null,
            
            qr_code: null,

            emergency_name: null,
            emergency_contact: null,
            emergency_relationship: null,

            createdAt: new Date(),
            createdBy: new ObjectId(id),
            updatedAt: null,
            updatedBy: null,

            archivedAt: null,
            archivedBy: null,
        };

        await AuditLogsService.auditWrap({
            action: "clientS_ADMIN_CREATE",
            entity: "clients",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created  ${first_name.trim()} ${last_name.trim()}`,
            fn: async () => {
                return await ClientModel.createclient(sanitized);
            },
        });

    } 


    async listclients(query) {
        let { status, fitness_goal, gender, plan_id, search, page = 1, limit = 10 } = query;

        page = Number(page);
        limit = Number(limit)

        let filter = {};

        if(status) {
            filter.status = status.trim().toLowerCase();
        }

        if(fitness_goal) {

            const goals = Array.isArray(fitness_goal)
                ? fitness_goal
                : [fitness_goal];

            filter.fitness_goal = {
                $in: goals.map(g => g.trim().toLowerCase())
            }
        }

        if(plan_id && ObjectId.isValid(plan_id)) {
            filter.plan_id = new ObjectId(plan_id);
        }
        
        if(gender) {
            filter.gender = gender.trim().toLowerCase()
        }

        search = search?.trim();

        filter.role = "client";

        return await ClientModel.listclients(filter, search, page, limit);
    } 


    async viewclient(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }

        return await ClientModel.viewclient(new ObjectId(id));
    }


    async updateclientProfile(id, body, meta, updater) {
        let { first_name, last_name, gender, date_of_birth, phone, email, address, is_discounted, emergency_name, emergency_contact, emergency_relationship, experience_level, days_per_week, session_minutes, height, weight, bmi, fitness_goal, training_type } = body;
        let updatedBy = updater.id;

        const sanitizedclient = {};

        // client Collection
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid client ID");
        if(first_name) sanitizedclient.first_name = first_name.trim();
        if(last_name) sanitizedclient.last_name = last_name.trim();
        if(gender) sanitizedclient.gender = gender.trim().toLowerCase();
        if(date_of_birth) {
            const dob = new Date(date_of_birth);

            if(Number.isNaN(dob.getTime())) {
                throw new ValidationError("Invalid date of birth format");
            }
            sanitizedclient.date_of_birth = dob
        }
        if(typeof is_discounted === "boolean") sanitizedclient.is_discounted = is_discounted;
        if(experience_level) sanitizedclient.experience_level = experience_level.trim().toLowerCase();
        if(days_per_week) sanitizedclient.days_per_week = Number(days_per_week)
        if(session_minutes) sanitizedclient.session_minutes = Number(session_minutes)
        if(height) sanitizedclient.height = Number(height)
        if(weight) sanitizedclient.weight = Number(weight)
        if(bmi) sanitizedclient.bmi = Number(bmi)
        if(fitness_goal) sanitizedclient.fitness_goal = Array.isArray(fitness_goal) ? Array.map(f => f.trim().toLowerCase()) : [fitness_goal.trim().toLowerCase()];
        if(training_type) sanitizedclient.training_type = training_type.trim().toLowerCase();    
        if(phone) {
            // Validate Philippine phone number
            const phoneValidation = validatePhilippinePhoneNumber(phone);
            if (!phoneValidation.valid) {
                throw new ValidationError(phoneValidation.message);
            }
            sanitizedclient.phone = phone.trim();
        }
        if(email) sanitizedclient.email = email.trim().toLowerCase();
        if(address) sanitizedclient.address = address.trim().toLowerCase();
        if(emergency_name) sanitizedclient.emergency_name = emergency_name.trim();
        if(emergency_contact) sanitizedclient.emergency_contact = emergency_contact;
        if(emergency_relationship) sanitizedclient.emergency_relationship = emergency_relationship.trim().toLowerCase();
        if(!updatedBy || !ObjectId.isValid(updatedBy)) throw new ValidationError("Invalid admin ID");

        await checkDuplicate(new ObjectId(id), {
            email: sanitizedclient.email,
            phone: sanitizedclient.phone
        }); 
        
        const existingclient = await ClientModel.findUserById(new ObjectId(id));
        if (!existingclient) throw new ValidationError("No client found");


        const clientUpdates = getChangedFields(existingclient, sanitizedclient);

        return await AuditLogsService.auditWrap({
            action: "clientS_ADMIN_UPDATE",
            entity: "clients",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${first_name} ${last_name} profile and/or membership`,
            changes: { patch:  {
                before: existingclient,
                after: clientUpdates,
            } },
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();

                    if(Object.keys(clientUpdates).length) {
                        clientUpdates.updatedAt = new Date();
                        clientUpdates.updatedBy = new ObjectId(updatedBy);

                        await ClientModel.updateclient(new ObjectId(id), clientUpdates, session);

                    }

                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }

                return;
            }
        });
    } 

    async updateUserStatus(id, status, meta, updater) {
        let adminId = updater.id;
        
        const allowedStatus = ["active", "archived"];

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }
        
        const client = await ClientModel.findUserById(new ObjectId(id));
        if(!client) throw new ValidationError("No client found");

        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid client ID");
        }

        id = new ObjectId(id);
        adminId = new ObjectId(adminId);

        if(!status) {
            throw new ValidationError("Missing status");
        }

        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status");
        }

        const updateclientData = {
            status: status.trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: adminId,
            archivedAt: null,
            archivedBy: null
        };

        const updatemembershipData = {
            updatedAt: new Date(),
            updatedBy: adminId,
            archivedAt: null,
            archivedBy: null
        };

        if(status === "active") {
            updateclientData.archivedAt = null;
            updateclientData.archivedBy = null;

            updatemembershipData.archivedAt = null;
            updatemembershipData.archivedBy = null;
            updatemembershipData.status = "active";
        }

        if(status === "archived") {
            updateclientData.archivedAt = new Date();
            updateclientData.archivedBy = adminId;

            updatemembershipData.status = "archived" 
            updatemembershipData.archivedAt = new Date();
            updatemembershipData.archivedBy = adminId;
        }

        return await AuditLogsService.auditWrap({
            action: "clientS_STATUS_UPDATE",
            entity: "clients",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            changes: {
                patch: {
                    before: client.status,
                    after: status
                }
            },
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated ${client.first_name} ${client.last_name} profile status and/or membership status to ${status}`,
            fn: async () => {
                const { client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    await ClientModel.updateUserStatus(id, updateclientData, session);
                    await MembershipModel.updatemembershipStatus(id, updatemembershipData, session);
                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error.message)
                } finally {
                    await session.endSession();
                }
                
                return;
            }
        });
        
    } 

    async assignATrainer(id, body, meta, updater) {
        let { trainer_id } = body;
        let adminId = updater.id;

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }
        const client = await ClientModel.findUserById(new ObjectId(id));
        if(!client) throw new ValidationError("No client found");

        if(!trainer_id || !ObjectId.isValid(trainer_id)) {
            throw new ValidationError("Invalid trainer ID");
        }
        const trainerExist = await TrainerManagementModel.getTrainer(new ObjectId(id));
        if(!trainerExist) {
            throw new ValidationError("No trainer exist");
        }

        const assignedclients = trainerExist.assigned_clients || [];

        if(assignedclients.length >= trainerExist.max_clients) {
            throw new ValidationError("Trainer is already full");
        }

        if(assignedclients.some(id => id.equals(id))) {
            throw new ValidationError("client already assigned to this trainer");
        }


        if(!adminId || !ObjectId.isValid(adminId)) {
            throw new ValidationError("Invalid admin ID");
        }

        id = new ObjectId(id);
        trainer_id = new ObjectId(trainer_id);
        adminId = new ObjectId(adminId);

        
        return await AuditLogsService.auditWrap({
            action: "clientS_ASSIGN_TRAINER",
            entity: "clients",
            entity_id: new ObjectId(id) ?? null,
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) assigned a trainer ${trainerExist.first_name} ${trainerExist.last_name} to ${client.first_name} ${client.last_name}`,
            fn: async () => {
                const { db, client } = await connectDB();
                const session = client.startSession();

                try {
                    session.startTransaction();
                    await ClientModel.assignATrainer(id, trainer_id, adminId, session);
                    await TrainerManagementModel.assignclient(id, trainer_id, adminId, session);

                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw new ValidationError(error)
                } finally {
                    await session.endSession()
                }
                
                return;

            }
        });
        
    }

    /**
     * client PROFILE METHODS (SELF)
     */

    async getclientProfileSelf(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid client ID");
        }
        return await ClientModel.findUserById(new ObjectId(id));
    }

    async updateclientProfileSelf(id, body, meta, updater) {
        let { first_name, last_name, gender, date_of_birth, phone, email, address, is_discounted, emergency_name, emergency_contact, emergency_relationship, experience_level, days_per_week, session_minutes, height, weight, bmi, fitness_goal, training_type } = body;
        
        if(!id || !ObjectId.isValid(id)) throw new ValidationError("Invalid client ID");
        
        const existingclient = await ClientModel.findUserById(new ObjectId(id));
        if (!existingclient) throw new ValidationError("No client found");

        const sanitized = {};

        if(first_name) sanitized.first_name = first_name.trim();
        if(last_name) sanitized.last_name = last_name.trim();
        if(gender) sanitized.gender = gender.trim().toLowerCase();
        if(date_of_birth) {
            const dob = new Date(date_of_birth);
            if(Number.isNaN(dob.getTime())) {
                throw new ValidationError("Invalid date of birth format");
            }
            sanitized.date_of_birth = dob;
        }
        if(typeof is_discounted === "boolean") sanitized.is_discounted = is_discounted;
        if(experience_level) sanitized.experience_level = experience_level.trim().toLowerCase();
        if(days_per_week) sanitized.days_per_week = Number(days_per_week);
        if(session_minutes) sanitized.session_minutes = Number(session_minutes);
        if(height) {
            if(isNaN(Number(height)) || Number(height) <= 0) {
                throw new ValidationError("Invalid height value");
            }
            sanitized.height = Number(height);
        }
        if(weight) {
            if(isNaN(Number(weight)) || Number(weight) <= 0) {
                throw new ValidationError("Invalid weight value");
            }
            sanitized.weight = Number(weight);
        }
        // Calculate BMI if height and weight are provided
        if(sanitized.height && sanitized.weight) {
            const heightInMeters = sanitized.height / 100;
            const bmiValue = (sanitized.weight / (heightInMeters * heightInMeters)).toFixed(1);
            sanitized.bmi = Number(bmiValue);
        } else if(bmi) {
            sanitized.bmi = Number(bmi.toFixed(1));
        }
        if(fitness_goal) {
            sanitized.fitness_goal = Array.isArray(fitness_goal) 
                ? fitness_goal.map(f => f.trim().toLowerCase()) 
                : [fitness_goal.trim().toLowerCase()];
        }
        if(training_type) sanitized.training_type = training_type.trim().toLowerCase();
        if(phone) {
            // Validate Philippine phone number
            const phoneValidation = validatePhilippinePhoneNumber(phone);
            if (!phoneValidation.valid) {
                throw new ValidationError(phoneValidation.message);
            }
            sanitized.phone = phone.trim();
        }
        if(email) sanitized.email = email.trim().toLowerCase();
        if(address) sanitized.address = address.trim();
        if(emergency_name) sanitized.emergency_name = emergency_name.trim();
        if(emergency_contact) {
            if(isNaN(Number(emergency_contact))) {
                throw new ValidationError("Invalid emergency contact format");
            }
            sanitized.emergency_contact = emergency_contact;
        }
        if(emergency_relationship) sanitized.emergency_relationship = emergency_relationship.trim().toLowerCase();

        sanitized.updatedAt = new Date();
        sanitized.updatedBy = new ObjectId(id);

        return await AuditLogsService.auditWrap({
            action: "clientS_SELF_UPDATE",
            entity: "clients",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type },
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} updated their profile`,
            fn: async () => {
                return await ClientModel.updateclient(new ObjectId(id), sanitized);
            }
        });
    }
}

export default new ClientService();