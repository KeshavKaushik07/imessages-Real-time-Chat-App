import userModel from "../model/user.model.js";
import messageModel from "../model/message.model.js";
import { uploadChatMedia, hasImageKitConfig } from '../lib/imagekit.js';

export async function getUsersForSideBar(req, resp) {
    try {
        const loggedInUserId = req.user._id;

        const filtereUsers = await userModel.find({ _id: { $ne: loggedInUserId } }).select("-clerkId");

        resp.status(200).json({
            success: true,
            filtereUsers,
        })
    } catch (error) {
        resp.status(500).json({
            success: false,
            message: `error in fetching users API :- ${error} `,
        })
    }
}

export async function getConversationForSideBar(req, resp) {
    try {
        const loggedInUserId = req.user._id;

        const conversation = await messageModel.aggregate([
            // 1. Keep only the messages I sent or received.
            { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
            // 2. Collapse them into one row per chat partner, noting our latest message time.
            {
                $group: {
                    // The partner is the other person on the message (not me).
                    _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
                    lastMessageAt: { $max: "$createdAt" },
                },
            },
            // 3. Put the most recent conversation at the top.
            { $sort: { lastMessageAt: -1 } },
            // 4. Look up each partner's user profile (comes back as an array).
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            // 5. Pull that profile out of the array and make it the document.
            { $replaceRoot: { newRoot: { $first: "$user" } } },
            // 6. Hide the private clerkId field from the result.
            { $project: { clerkId: 0 } },
        ]);

        resp.status(200).json({
            success: true,
            conversation,
        });

    } catch (error) {
        return resp.status(500).json({
            success: false,
            message: `error in fetching conversations API :- ${error}`,
        })
    }
}

export async function getMessages(req, resp) {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await messageModel.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        resp.status(200).json({
            success: true,
            messages,
        })
    } catch (error) {
        resp.status(500).json({
            success: false,
            message: `error in fetching user chat API :- ${error}`,
        });
    }

}

export async function sendMessage(req, resp) {
    try {
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageURL;
        let videoURL;

        if (req.file) {
            if (!hasImageKitConfig()) {
                return resp.status(500).json({
                    success: false,
                    message: `Media upload is not configure`,
                });
            }

            const mediaURL = await uploadChatMedia(req.file);

            if (req.file.mimetype.startsWith("video/")) videoURL = mediaURL;
            else imageURL = mediaURL;

        }

        if (!text?.trim() && !req.file) {
            return resp.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        const newMessage = new messageModel({
            senderId,
            receiverId,
            text,
            image: imageURL,
            video: videoURL,
        });

        await newMessage.save();

        //////////// todo : real time with socket.io 

        resp.status(201).json({
            success: true,
            newMessage,
        });

    } catch (error) {
        resp.status(500).json({
            success: false,
            message: `error in sending chat data API :- ${error}`,
        });
    }
}