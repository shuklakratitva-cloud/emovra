import express from "express";
import Entry from "../models/Entry.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const router = express.Router();

function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({msg:"No token"});
  try{ req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }catch{ res.status(401).json({msg:"Invalid"})}
}

router.post("/save", auth, async(req,res)=>{
  const entry = await Entry.create({...req.body, userId:req.user.id});
  res.json(entry);
});
router.get("/my", auth, async(req,res)=>{
  const data = await Entry.find({userId:req.user.id}).sort({timestamp:-1}).limit(50);
  res.json(data);
});
router.get("/admin/all-entries", async(req,res)=>{
  const all = await Entry.find().populate("userId","name age emergencyPhone email").sort({timestamp:-1});
  res.json(all);
});
export default router;