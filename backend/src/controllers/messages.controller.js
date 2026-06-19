import userModel from "../model/user.model.js";
import messageModel from "../model/message.model.js";

export async function getUsersForSideBar(req,resp) {
    try {
        const loggedInUserId = req.user._id;

        const filtereUsers = await userModel.find({_id : { $ne : loggedInUserId}}).select("-clerkId");

        resp.status(200).json({
            success : true,
            filtereUsers,
        })
    } catch (error) {
        resp.status(500).json({
            success : false,
            message : `error in fetching users API :- ${error} `,
        })
    }
}

export async function getConversationForSideBar(req,resp){
    try {
        const loggedInUserId = req.user._id;

    const conversation = await messageModel.aggregate([
        //1 keep messages only that i send or recive
        { $match : { $or : [ { senderId: loggedInUserId }, { receiverId: loggedInUserId } ] } },
        // 2 collapse them into one row per chat partner , nothing our latest messages time.
        {
            $group: {
                // the partner is the other person on the message (not me)
                _id: { $cond: [ { $eq: ["$senderId",loggedInUserId ] }, "$receiverId","$senderId" ] },
            },
        },
        // 3 put the most recent conversation on the top
        { $sort: { lastMessageAt: -1 } },
        // 4 look up each partner's user profile [comes back as an array]
        { $lookup: { from: "user", localField: "_id", foreignField: "_id", as: "user" } },
        // 5 Hide the private clerk id from all fields
        { $project: { clerkId: 0 } },
        ] );

        res.status(200).json({
            success : true,
            conversation,
        });
    
    } catch (error) {
        return resp.status(500).json({
            success : false,
            message : `error in fetching conversations API :- ${error}`,
        })
    }
}

export async function getMessages(req,resp) {
    try {
        const { id: userToChatId } = req.params;
        const myId = user._id;
        
        const messages = await messageModel.find({
            $or: [
                { senderId: myId , receiverId: userToChatId },
                { senderId: userToChatId , receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        resp.status(200).json({
            success : true,
            messages,
        })
    } catch (error) {
        resp.status(500).json({
            success :false,
            message : `error in fetching user chat API :- ${error}`,
        });
    }
    
}

export async function sendMessage(req,resp) {
    try {
        const { text } = req.body;
        const { id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageURL;
        let videoURL;

        if(req.file){
            if(!hasImageKitConfig()){
                return resp.status(500).json({
                    success : true,
                    message : `Media upload is not configure`,
                });

                const mediaURL = uploadChatMedia(req.file);

                if(req.file.mimetype.startsWith("video/")) videoURL = mediaURL;
                else imageURL = mediaURL;

                const newMessage = new messageModel({
                    senderId,
                    receiverId,
                    text,
                    image:imageURL,
                    video:videoURL,
                });

                await newMessage.save();

                //////////// todo : real time with socket.io 

                resp.status(201).json({
                    success: true,
                    newMessage,
                });
            }
        }
        
    } catch (error) {
        resp.status(500).json({
             success :false,
            message : `error in sending chat data API :- ${error}`,
        });
    }
}