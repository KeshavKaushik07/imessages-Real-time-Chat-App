import express from 'express';
import { getUsersForSideBar , getConversationForSideBar, getMessages, sendMessage } from '../controllers/messages.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use( protectedRoute );

// /api/messages/users
router.get("/users",getUsersForSideBar);

router.get("/conversation",getConversationForSideBar);

router.get("/:id",getMessages);

router.get("/send/:id", upload.single("media"), sendMessage);

export default router;