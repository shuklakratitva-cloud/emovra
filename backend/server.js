import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import dataRoutes from "./routes/data.js"
import { connectDB } from "./config/db.js"
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(()=>console.log("MongoDB connected"));

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

app.get("/", (req,res)=>res.send("MindGuard Backend Running"));

app.listen(process.env.PORT||5000, ()=>console.log("Server on 5000"));