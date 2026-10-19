import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import { debuggerLog } from "../utils/debuggerLog.js";
import MembershipModel from "../models/MembershipModel.js";
import MembershipService from "../services/membership.service.js";
dotenv.config();

class MembershipController {

    async requestmembership(req, res, next) {
        try {
            const result = await MembershipService.requestmembership(req.auditMeta, req.body, req.user);

            return res.status(201).json({ message: "Successfully created the membership request", result});
        } catch (error) {
            debuggerLog("requestmembership Controller: ", error);
            next(error)
        }
    }

    async createmembershipRequest(req, res, next) {
        try {
            const result = await MembershipService.createmembershipRequest(req.auditMeta, req.body, req.user);

            return res.status(201).json({ message: "Successfully created the membership request", result});
        } catch (error) {
            debuggerLog("createmembershipRequest Controller: ", error);
            next(error)
        }
    }

    async createmembership(req, res, next) {
        try {
            const result = await MembershipService.createmembership(req.auditMeta, req.user);

            return res.status(201).json({ message: "Successfully created the membership", result});
        } catch (error) {
            debuggerLog("createmembership Controller: ", error);
            next(error)
        }
    }

    async Admincreatemembership(req, res, next) {
        try {
            const result = await MembershipService.Admincreatemembership(req.auditMeta, req.user);

            return res.status(201).json({ message: "Successfully created the membership", result});
        } catch (error) {
            debuggerLog("createmembership Controller: ", error);
            next(error)
        }
    }

    async viewmembership(req, res, next) {
        try {
            const result = await MembershipService.viewmembership(req.params.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewmembership Controller: ", error);
            next(error)
        }
    }

    async viewAllmembership(req, res, next) {
        try {
            
            const result = await MembershipService.viewAllmembership(req.query);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("viewmembership Controller: ", error);
            next(error)
        }
    }

    async updatemembership(req, res, next) {
        try {
            const result = await MembershipService.updatemembership(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the membership", result});
        } catch (error) {
            debuggerLog("updatemembership Controller: ", error);
            next(error)
        }
    }

    async updatemembershipStatus(req, res, next) {
        try {
            const result = await MembershipService.updatemembershipStatus(req.params.id, req.auditMeta, req.body, req.user);

            return res.status(200).json({ message: "Successfully updated the membership status", result});
        } catch (error) {
            debuggerLog("updatemembershipStatus Controller: ", error);
            next(error)
        }
    }

    async requestFreezemembership(req, res, next) {
        try {
            const result = await MembershipService.requestFreezemembership(req.auditMeta, req.body, req.fileUrls, req.user);

            return res.status(200).json({ message: "Successfully requested to freeze the membership", result});
        } catch (error) {
            debuggerLog("requestFreezemembership Controller: ", error);
            next(error)
        }
    }

    async decisionFreezemembership(req, res, next) {
        try {
            const result = await MembershipService.decisionFreezemembership(req.params.id, req.auditMeta, req.user);

            return res.status(200).json({ message: "Successfully freeze the membership", result});
        } catch (error) {
            debuggerLog("decisionFreezemembership Controller: ", error);
            next(error)
        }
    }
    
    async freezemembership(req, res, next) {
        try {
            const result = await MembershipService.freezemembership(req.params.id, req.auditMeta, req.body, req.files, req.user);

            return res.status(200).json({ message: "Successfully freeze the membership", result});
        } catch (error) {
            debuggerLog("freezemembership Controller: ", error);
            next(error)
        }
    }

    async unfreezemembership(req, res, next) {
        try {
            const result = await MembershipService.unfreezemembership(req.params.id, req.auditMeta, req.user);

            return res.status(200).json({ message: "Successfully unfreeze the membership", result});
        } catch (error) {
            debuggerLog("unfreezemembership Controller: ", error);
            next(error)
        }
    }

    async fetchAllmembershipRequests(req, res, next) {
        try {
            const result = await MembershipService.fetchAllmembershipRequests(req.query);
        
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("fetchAllmembershipRequests Controller: ", error);
            next(error)
        }
    }

    async fetchMyActiveMembership(req, res, next) {
        try {
            const result = await MembershipService.fetchMyActiveMembership(req.user.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("fetchMyMembership Controller: ", error);
            next(error)
        }
    }

    async fetchMyLastMembership(req, res, next) {
        try {
            const result = await MembershipService.fetchMyLastMembership(req.user.id);

            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("fetchMyMembership Controller: ", error);
            next(error)
        }
    }
} 

export default new MembershipController();
