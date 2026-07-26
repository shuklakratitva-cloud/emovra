import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, "Password is required"] 
  },
  age: { 
    type: Number, 
    required: [true, "Age is required"],
    min: [10, "Age must be at least 10"],
    max: [100, "Enter valid age"]
  },
  emergencyName: { 
    type: String,
    required: false,
    default: "",
    trim: true
  },
  emergencyPhone: { 
    type: String, 
    required: false,
    default: "",
    trim: true
  },
  countryCode: {
    type: String,
    default: "+91"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  }
});

export default mongoose.model("User", UserSchema);