import express from 'express';
import userModel from '../model/user.model.js';
import { verifyWebhook } from '@clerk/backend/webhooks';

const router = express.Router();


router.post("/clerk", async (req, resp) => {
    try {
        const signinSecret = process.env.CLERK_WEBHOOK_SIGNIN_SECRET;

        if (!signinSecret) {
            resp.status(503).json({
                success: false,
                message: "webhooks secret not provieded"
            });
            return;
        }

        const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
        const request = new Request("http://internal/webhooks/clerk", {
            method: "POST",
            headers: new Headers(req.headers),
            body: payload,
        });

        const evt = await verifyWebhook(request, { signinSecret });

        if (evt.type == "user.created" || evt.type == "user.updated") {
            const u = evt.data;

            const email = u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ?? u.email_addresses?.[0]?.email_address;

            const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || email?.split("@")[0] || "Clerk User";

            await userModel.findOneAndUpdate(
                { clerkId: u.id },
                {
                    clerkId: u.id,
                    email,
                    fullName,
                    profilePic: u.image_url
                }, { new: true, upsert: true, setDefaultsOnInsert: true });

                if(evt.type == "user.deleted"){
                    await userModel.findOneAndDelete({ clerkId : evt.data.id });
                }

                resp.status(200).json({
                    success : true,
                    message : "user created successfully"
                })
        }

    } catch (err) {
        console.error('Error verifying webhook:', err)
        return res.status(400).send('Error verifying webhook')
    }


});

export default router;

