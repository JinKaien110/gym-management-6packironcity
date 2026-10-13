import { ChangeStream, ObjectId } from "mongodb";
import dotenv from "dotenv";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import { hashedPassword } from "../utils/hashedPassword.js";
import checkDuplicate from "../utils/checkDuplicate.js";
import { getChangedFields } from "../utils/getChangedFields.js";
import ClientModel from "../models/ClientModel.js";
import { ValidationError } from "../errors/ValidationError.js";
import { connectDB } from "../config/db.js";
import { clientAssignedToTrainerEmail } from "../templates/assignment/email.clientAssignedToTrainer.js";
import { sendEmail } from "./email.service.js";
import { generateRandomPassword } from "../utils/generateRandomPassword.js";
import AuditLogsService from "./audit.logs.service.js";
import { welcomeTrainer } from "../templates/trainers/email.welcome.js";



class TrainerService {
    async createTrainer(meta, body, updater) {
  
        let { first_name, last_name, email, phone, specialization, certification, availability, rate, max_hours } = body;
        let creator = updater.id;

        if(!first_name || !last_name || !email || !rate || !max_hours || !phone  || !specialization || !availability   ) {
            throw new ValidationError("Please fill out the necessary fields");
        }

        if(isNaN(rate) || isNaN(max_hours) ) {
            throw new ValidationError("Max clients should be numerical");
        }

        if(isNaN(rate)) {
            throw new ValidationError("Rate should be numerical");
        }

        if(isNaN(max_hours)) {
            throw new ValidationError("Max hours should be numerical");
        }

        if(!creator || !ObjectId.isValid(creator)) {
            throw new ValidationError("Invalid admin ID");
        }

        const password =  generateRandomPassword();
        console.log(password)
        const hashpw = await hashedPassword(password);

        const sanitized = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: hashpw,
            role: "trainer",
            user_type: "trainer",
            status: "active",
            specialization: Array.isArray(specialization)
                ? specialization.map(s => s.trim().toLowerCase())
                : [specialization.trim().toLowerCase()],
            certification: certification?.trim(),
            availability: {
                days: Array.isArray(availability.days) 
                    ? availability.days.map(d => String(d).trim().toLowerCase())
                    : [String(availability.days).trim().toLowerCase()],
                time_from: String(availability.time_from).trim(),
                time_to: String(availability.time_to).trim()
            },
            rate: Number(rate),
            max_hours: Number(max_hours),
            createdAt: new Date(),
            createdBy: new ObjectId(creator),
            updatedAt: new Date(),
            updatedBy: new ObjectId(creator),
            archivedAt: null,
            archivedBy: null
        }
    

        return await AuditLogsService.auditWrap({
            action: "TRAINER_CREATED",
            entity: "trainers",
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) created trainer ${first_name} ${last_name}`,
            fn: async () => {
                const client = await TrainerManagementModel.createTrainer(sanitized);
                
                await AuditLogsService.auditWrap({
                    action: "EMAIL_TRAINER_CREATED",
                    entity: "trainers",
                    actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                    meta: meta,
                    summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) has been sent an email notification about trainer credentials `,

                    fn: async () => {
              
                        await sendEmail({
                            to: sanitized.email,
                            subject: "6Pack Iron City - Welcome to 6Pack Iron City Trece",
                            html: welcomeTrainer(sanitized, password)
                        });
                    }
                })
                return client
            }
        });
       
    }

    async listPublicTrainers() {
    const filter = { status: "active" };
    return await TrainerManagementModel.listTrainers(filter, 1, 1000);
  }

  async listTrainers(query) {
        let { status, specialization, search, page = 1, limit = 10} = query;

        const allowedStatus = ["active", "inactive", "archived"];

        if(status && !allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status");
        }

        page = Number(page);
        limit = Number(limit);

        let filter = {

        }

        if(status) {
            filter.status = status.trim().toLowerCase()
        }

        if(specialization) {
            filter.specialization = specialization.trim().toLowerCase()
        }

        if(search) {
            filter.$or = [
                { first_name : { $regex: search, $options: "i" } },
                { last_name : { $regex: search, $options: "i" } }
            ];
        }

        return TrainerManagementModel.listTrainers(filter, page, limit);
    }

    async getTrainer(id) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        return await TrainerManagementModel.getTrainer(new ObjectId(id));
    }

    async updateTrainerProfile(id, meta, body, updater) {

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        await checkDuplicate(id, {
            email: body.email?.trim(),
            phone: body.phone?.trim()
        });

        let allowedFields = [];

        if(updater.role === "staff") {
            allowedFields = [
                "availability",
                "rate",
                "max_hours"
            ];
        }

        if(updater.role === "admin") {
            allowedFields = [
                "first_name",
                "last_name",
                "email",
                "phone",
                "availability",
                "specialization",
                "rate",
                "max_hours"
            ];
        }

        if(!allowedFields.length) {
            throw new ValidationError("Unauthorized role");
        }

         const existingTrainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

        const updateData = {};

        const fieldTypes = {
            first_name: "string",
            last_name: "string",
            email: "string",
            phone: "string",
            specialization: "array",
            availability: "object",
            max_clients: "number",
            rate: "number",
            max_hours: "number"
        }

        for (const key of allowedFields) {
            let value = body[key];
            if(value !== undefined) {
                updateData[key] = body[key];

                if(fieldTypes[key] === "string") {
                    updateData[key] = String(value).trim();
                } else if (fieldTypes[key] === "number") {
                    const num = Number(value);
                    if(Number.isNaN(num)) {
                        throw new ValidationError(`${key} must be a number`)
                    }
                    updateData[key] = num;
                } else if (fieldTypes[key] === "array") {
                        if (typeof value === "string") {
                        try {
                            value = JSON.parse(value); // handles '["a","b"]'
                        } catch {
                            // fallback for comma-separated strings
                            value = value.split(",");
                        }
                    }
                    if(!Array.isArray(value)) {
                        throw new ValidationError(`${key} must be an array`);
                    }
                    updateData[key] = value.map(v => typeof v === "string" ? v.trim().toLowerCase() : v);
                } else if (fieldTypes[key] === "object") {
                     if (typeof value === "string") {
                        try {
                            value = JSON.parse(value);
                        } catch {
                            throw new ValidationError(`${key} must be a valid object`);
                        }
                    }
                    if(typeof value !== "object") {
                        fieldTypes[key] = JSON.parse(fieldTypes[key]);
                        throw new ValidationError(`${key} must be an object`);
                    }
                    if(key === "availability") {
                        const existingAvailability = existingTrainer.availability || {};
                        
                        const { time_from, time_to, days } = value;
                        const sanitizedAvailability = { ...existingAvailability }; 

                        if(time_from !== undefined) sanitizedAvailability.time_from = String(time_from).trim();
                        if(time_to !== undefined) sanitizedAvailability.time_to = String(time_to).trim();
                        if(days !== undefined) {
                            sanitizedAvailability.days = Array.isArray(days)
                                ? days.map(d => String(d).trim().toLowerCase())
                                : [String(days).trim().toLowerCase()];
                        }

                        updateData[key] = sanitizedAvailability;
                    } else {
                        updateData[key] = value;
                    }
                }
            }
        }

        if(!Object.keys(updateData).length) {
            throw new ValidationError("No valid fields to update");
        } 

       

        const trainerUpdates = getChangedFields(existingTrainer, updateData);

        if(Object.keys(trainerUpdates).length) {
            trainerUpdates.updatedAt = new Date();
            trainerUpdates.updatedBy = new ObjectId(updater.id);
        }

        return await AuditLogsService.auditWrap({
            action: "TRAINER_UPDATED",
            entity: "trainers",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated trainer profile`,
            changes: {
                patch: {
                    before: existingTrainer,
                    after:  trainerUpdates
                }
            },
            fn: async () => {
                return await TrainerManagementModel.updateTrainerProfile(
                    new ObjectId(id),
                    trainerUpdates
                );
            }
        });
        
    }

    async updateTrainerStatus(id, meta, status, updater) {
        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }
        
        const trainer = await TrainerManagementModel.findTrainerById(new ObjectId(id));
        if(!trainer) throw new ValidationError("No trainer found");

        if(!updater || !ObjectId.isValid(updater)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(!status) {
            throw new ValidationError("Missing status value");
        }

        const allowedStatus = ["active", "inactive", "archived"];

        if(!allowedStatus.includes(status)) {
            throw new ValidationError("Invalid status value");
        }

        let sanitized = {
            status: status.trim().toLowerCase(),
            updatedAt: new Date(),
            updatedBy: new ObjectId(updater)
        }

        if(status === "archived") {
            sanitized.archivedAt = new Date();
            sanitized.archivedBy = new ObjectId(updater)

            await AuditLogsService.auditWrap({
                action: "TRAINER_UPDATED",
                entity: "trainers",
                entity_id: new ObjectId(id),
                actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
                meta: meta,
                summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) removed the trainers assigned to clients`,
                changes: {
                    patch: {
                        before: trainer.assigned_clients,
                        after: "0"
                    }
                },
                fn: async () => {
                    await TrainerManagementModel.removeTrainerFromclients(new ObjectId(id));
                }
            });
            
        }
        
        return await AuditLogsService.auditWrap({
            action: "TRAINER_UPDATED",
            entity: "trainers",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) updated the trainer ${trainer.first_name} ${trainer.last_name} status to ${status}`,
                changes: {
                    patch: {
                        before: trainer.status,
                        after: status
                    }
                },
            fn: async () => {
                return await TrainerManagementModel.updateTrainerStatus(new ObjectId(id), sanitized);
            }
        });
        
    }

    async assignclient(id, meta, body, updater) {

        if(!body.client_id) {
            throw new ValidationError("Please select a client to add");
        }

        if(!id || !ObjectId.isValid(id)) {
            throw new ValidationError("Invalid trainer ID");
        }

        if(!updater.id || !ObjectId.isValid(updater.id)) {
            throw new ValidationError("Invalid updater ID");
        }

        if(!ObjectId.isValid(body.client_id)) {
            throw new ValidationError("Invalid client ID");
        }

        const trainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

        if(!trainer) {
            throw new ValidationError("Trainer not found");
        }

        const client = await ClientModel.findUserById(new ObjectId(body.client_id));

        if(!client) {
            throw new ValidationError("client not found");
        }

        if(client.trainer_id) {
            throw new ValidationError("client has already have a trainer");
        }

        if(trainer.assigned_clients.some(m => m.equals(new ObjectId(body.client_id)))) {
            throw new ValidationError("client is already assigned to the trainer");
        }

        const email = {
            trainer_first_name: trainer.first_name,
            trainer_last_name: trainer.last_name,
            client_first_name: client.first_name,
            client_last_name: client.last_name,
            client_email: client.email,
            assignedAt: new Date(),
            assignedBy: new ObjectId(updater.id)
        };

        
        await AuditLogsService.auditWrap({
            action: "TRAINERS_UPDATED",
            entity: "trainers",
            entity_id: new ObjectId(id),
            actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type }, 
            meta: meta,
            summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) assigned client to ${client.first_name} ${client.last_name}`,
            fn: async () => {
                return await TrainerManagementModel.assignclient(
                    new ObjectId(body.client_id), 
                    new ObjectId(id), // trainer_id
                    new ObjectId(updater.id)
                );
            }
        });
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
                    html: clientAssignedToTrainerEmail(email)
                });
            }
        });
        return;
    }

     async removeclient(id, meta, body, updater) {

         if(!body.client_id) {
             throw new ValidationError("Please select a client to remove");
         }

         if(!id || !ObjectId.isValid(id)) {
             throw new ValidationError("Invalid trainer ID");
         }

         const trainer = await TrainerManagementModel.getTrainer(new ObjectId(id));

         if(!trainer) {
             throw new ValidationError("Trainer not found");
         }
         const clientId = new ObjectId(body.client_id);

         const newTrainerclients = trainer.assignclient.filter(t => !t.equals(clientId));

         if(!updater || !ObjectId.isValid(updater)) {
             throw new ValidationError("Invalid updater ID");
         }

         if(!ObjectId.isValid(body.client)) {
             throw new ValidationError("Invalid client ID");
         }

         const sanitize = {
             assigned_clients: newTrainerclients,
             updatedAt: new Date(),
             updatedBy: new ObjectId(updater)
         }

         return await AuditLogsService.auditWrap({
             action: "TRAINER_UPDATED",
             entity: "trainers",
             actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type },
             meta: meta,
             summary: `${updater.first_name} ${updater.last_name} (${updater.role} → ${updater.user_type}) removed a client to trainer ${trainer.first_name} ${trainer.last_name}`,
             changes: {
                 patch: {
                     before: trainer.assigned_clients,
                     after: newTrainerclients
                 }
             },
             fn: async () => {
                 return await TrainerManagementModel.removeclient(
                     new ObjectId(id),
                     new ObjectId(body.client),
                     sanitize
                 );
             }
         });

     }

     async updateOwnTrainerProfile(trainerId, body, updater, certificationValue = null) {
         if(!trainerId || !ObjectId.isValid(trainerId)) {
             throw new ValidationError("Invalid trainer ID");
         }

         if(!updater || !ObjectId.isValid(updater.id)) {
             throw new ValidationError("Invalid updater ID");
         }

         // Ensure trainer can only update their own profile
         if(updater.id.toString() !== trainerId.toString()) {
             throw new ValidationError("Unauthorized: Can only update own profile");
         }

         const existingTrainer = await TrainerManagementModel.getTrainer(new ObjectId(trainerId));
         if(!existingTrainer) {
             throw new ValidationError("Trainer not found");
         }

          // Fields that a trainer can update in their own profile
          const allowedFields = [
              "first_name",
              "last_name",
              "phone",
              "specialization",
              "certification",
              "rate",
              "max_hours",
              "bio",
              "availability"
          ];

          const updateData = {};

          for (const key of allowedFields) {
    let value = body[key];

    if (value !== undefined && value !== null) {

        // Parse JSON fields sent through FormData
        if (key === "specialization" || key === "availability") {
            if (typeof value === "string") {
                try {
                    value = JSON.parse(value);
                } catch {
                    throw new ValidationError(`${key} must contain valid JSON`);
                }
            }
        }

        if (
            key === "first_name" ||
            key === "last_name" ||
            key === "phone" ||
            key === "bio"
        ) {
            updateData[key] = String(value).trim();

        } else if (key === "certification") {
            updateData[key] =
                certificationValue ||
                (body.certification ? String(body.certification).trim() : "");

        } else if (key === "specialization") {
            if (!Array.isArray(value)) {
                throw new ValidationError(`${key} must be an array`);
            }

            updateData[key] = value.map(v =>
                String(v).trim().toLowerCase()
            );

        } else if (key === "rate" || key === "max_hours") {
            const num = Number(value);

            if (Number.isNaN(num) || num < 0) {
                throw new ValidationError(
                    `${key} must be a non-negative number`
                );
            }

            updateData[key] = num;

        } else if (key === "availability") {
            if (
                typeof value !== "object" ||
                value === null ||
                Array.isArray(value)
            ) {
                throw new ValidationError(`${key} must be an object`);
            }

            const existingAvailability = existingTrainer.availability || {};
            const sanitizedAvailability = { ...existingAvailability };

            if (value.days !== undefined) {
                sanitizedAvailability.days = Array.isArray(value.days)
                    ? value.days.map(d => String(d).trim().toLowerCase())
                    : [String(value.days).trim().toLowerCase()];
            }

            if (value.time_from !== undefined) {
                sanitizedAvailability.time_from = String(value.time_from).trim();
            }

            if (value.time_to !== undefined) {
                sanitizedAvailability.time_to = String(value.time_to).trim();
            }

            updateData[key] = sanitizedAvailability;
        }
    }
}

         // If a new certification file was uploaded, override with file URL
         if (certificationValue) {
             updateData.certification = certificationValue;
         }

         if(!Object.keys(updateData).length) {
             throw new ValidationError("No valid fields to update");
         }

         const trainerUpdates = getChangedFields(existingTrainer, updateData);

         if(Object.keys(trainerUpdates).length) {
             trainerUpdates.updatedAt = new Date();
             trainerUpdates.updatedBy = new ObjectId(updater.id);
         }

         return await AuditLogsService.auditWrap({
             action: "TRAINER_UPDATED",
             entity: "trainers",
             entity_id: new ObjectId(trainerId),
             actor: { id: new ObjectId(updater.id), role: updater.role, user_type: updater.user_type },
             meta: {},
             summary: `${updater.first_name} ${updater.last_name} updated their own trainer profile`,
             changes: {
                 patch: {
                     before: existingTrainer,
                     after: trainerUpdates
                 }
             },
             fn: async () => {
                 return await TrainerManagementModel.updateTrainerProfile(
                     new ObjectId(trainerId),
                     trainerUpdates
                 );
             }
         });
     }
 }


export default new TrainerService();