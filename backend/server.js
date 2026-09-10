import express from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./config/db.js";

import AuthRoutes from "./routes/authroutes.js";
import AdminRoutes from "./routes/adminroutes.js";
import ClientRoutes from "./routes/client.route.js";
import PlanRoutes from "./routes/planroute.js";
import PricingRoutes from "./routes/pricingroutes.js";
import TrainerRoutes from "./routes/trainerroutes.js";
import membershipRoutes from "./routes/membershiproutes.js";
import PaymentRoutes from "./routes/paymentroutes.js";
import AIRoutes from "./routes/airoutes.js";
import ClassRoutes from "./routes/classroutes.js";
import ClassScheduleRoutes from "./routes/classscheduleroutes.js";
import BookingRoutes from "./routes/bookingroutes.js";
import DiscountRoutes from "./routes/discountroute.js";
import AuditLogsRoutes from "./routes/auditlogroutes.js";
import AdminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import membershipConfigRoutes from "./routes/membership.config.route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { auditMeta } from "./middleware/auditMeta.js";
import "./cron/classSchedule.js";
import "./cron/dailypass.job.js";
import "./cron/reminder.job.js";
import "./cron/membership.job.js";


dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(auditMeta)

app.use('/api', AuthRoutes);
app.use('/api', AdminRoutes);
app.use('/api',  ClientRoutes);
app.use('/api',  PlanRoutes);
app.use('/api',  PricingRoutes);
app.use('/api', TrainerRoutes);
app.use('/api', membershipRoutes);
app.use('/api', PaymentRoutes);
app.use('/api', AIRoutes);
app.use('/api', ClassRoutes);
app.use('/api', ClassScheduleRoutes);
app.use('/api', BookingRoutes);
app.use('/api', DiscountRoutes);
app.use('/api', AuditLogsRoutes);
app.use('/api', AdminDashboardRoutes);
app.use('/api', membershipConfigRoutes);

app.use(errorHandler)
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});
