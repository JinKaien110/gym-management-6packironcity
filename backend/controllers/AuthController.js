import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateToken } from "../utils/generateToken.js";
import AuthModel from "../models/AuthModel.js";
import ClientModel from "../models/ClientModel.js";
import TrainerManagementModel from "../models/TrainerManagementModel.js";
import AuthService from "../services/auth.service.js";
import { ValidationError } from "../errors/ValidationError.js";
import { debuggerLog } from "../utils/debuggerLog.js";



dotenv.config();

class AuthController {
    async loginUser(req, res, next) {
        try {
            const result = await AuthService.loginUser(req.auditMeta, req.body);

            res.cookie("token", result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000,
            });

            return res.status(200).json({
                message: "Login successfully",
                user: result.userPayload,
            });

        } catch (error) {
            debuggerLog("loginUser Controller", error);
            next(error);
        }
    }

    async RegisterUser(req, res, next) {
        try {
            const result = await AuthService.RegisterUser(req.auditMeta, req.body);
            return res.status(201).json({
                message: "User registered successfully!",
                user: result
            }); 

        } catch (error) {
            debuggerLog("registerUser Controller", error);
            next(error);
        }
    }

    async Logout(req, res, next) {
        try {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "development",
                sameSite: "strict"
            });

            return res.status(200).json({ message: "Logged out successfully!"});
        } catch (error) {
            debuggerLog("logout Controller", error);
            next(error);
        }
    }

    async Me(req, res, next) {
        try {
            const result = await AuthService.Me(req.user);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("me Controller", error);
            next(error);
        }
    }

    async SingleSourceOfTruth(req, res, next) {
        try {
            const result = await AuthService.SingleSourceOfTruth(req.user);
            return res.status(200).json(result);
        } catch (error) {
            debuggerLog("singleSourceOfTruth Controller", error);
            next(error);
        }
    }
}

export default new AuthController();