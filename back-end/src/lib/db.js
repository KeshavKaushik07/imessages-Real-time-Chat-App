import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const URL = process.env.MONGO_DB_URL;
        
        if (!URL)
            throw new Error("MONGO_DB_URL is required");

        await mongoose.connect(URL);

        console.log("Connected to DB")
    } catch (err) {

        console.error("MongoDB connection error", err);

        process.exit(1);

        // 1 -- failed , 0 -- success;
    }
}

export default connectDB;