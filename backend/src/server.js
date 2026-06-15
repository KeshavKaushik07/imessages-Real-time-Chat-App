import express from "express";
import "dotenv/config";
import connectDB from "./lib/db.js";
import colors from 'colors';
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import fs from 'fs';
import path from "path";

const app = express();

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Correctly resolves the absolute public directory path
const publicDir = path.join(process.cwd(), "public");

app.use(express.json());
app.use(clerkMiddleware());

// In production, when serving assets out of /public on the same server,
// we allow requests from FRONTEND_URL *or* self-requests on the same origin.
app.use(cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3001"], 
    credentials: true,
}));

app.get('/health', (req, resp) => {
    resp.status(200).json({ ok: true });
});

// Serve frontend static assets if the folder exists
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    // FIX: The standard, correct wildcard string for Express catch-all routing
    app.get("*", (req, resp) => {
        resp.sendFile(path.join(publicDir, "index.html"), (err) => {
            if (err) {
                resp.status(500).send(err);
            }
        });
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log(`server is running on PORT ${PORT}`.bgGreen);
});