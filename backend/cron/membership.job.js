import cron from 'node-cron';
import MembershipModel from '../models/MembershipModel.js';
import { connectDB } from '../config/db.js';


cron.schedule('0 0 * * *', async () => {
    try {
        const { db } = await connectDB();
        
        const today = new Date();
        await db.collection("memberships").updateMany(
            { 
                end_date: { $lt: today },
                status: "active",
                is_frozen: false
            },
            { $set: { status: "expired" } }
        );
        console.log("Memberships updated successfully");
        
    } catch (error) {
        console.error("Error updating memberships: ", error);
    }
});