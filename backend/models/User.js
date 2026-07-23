import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  name: {type:String, required:true},
  email: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  age: {type:Number, required:true},
  emergencyName: String,
  emergencyPhone: {type:String, required:true},
  createdAt: {type:Date, default:Date.now}
});
export default mongoose.model("User", UserSchema);