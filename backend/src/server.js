import express from "express";
import "dotenv/config";
import connectDB from "./lib/db.js";
import colors from 'colors';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url"; // <-- 1. Add this import

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// 2. Add these two lines to track the true location of your server file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. FIX: Steps out of 'dist' (or 'src' locally) into the root folder where 'public' is guaranteed to exist
const publicDir = path.join(__dirname, "../public");

app.use(express.json());
app.use(clerkMiddleware());

app.use(cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3001"], 
    credentials: true,
}));

app.get('/health', (req, resp) => {
    resp.status(200).json({ ok: true });
});

// Serve frontend static assets
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    app.get("*", (req, resp) => {
        resp.sendFile(path.join(publicDir, "index.html"), (err) => {
            if (err) {
                resp.status(500).send(err);
            }
        });
    });
} else {
    // Helpful log to see inside Render dashboard if it still can't find it
    console.log(`[Warning]: Public directory not found at path: ${publicDir}`.red);
}

app.listen(PORT, () => {
    connectDB();
    console.log(`server is running on PORT ${PORT}`.bgGreen);
});