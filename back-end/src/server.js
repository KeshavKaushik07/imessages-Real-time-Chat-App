import express from "express";
import "dotenv/config";
import connectDB from "./lib/db.js";
// package.json
// "scripts": {
//   "start": "node -r dotenv/config index.js"
// }


const app = express();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    connectDB();
    console.log(`server is running on PORT ${PORT}  `);
})