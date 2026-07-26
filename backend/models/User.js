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
    required: [true, "Emergency contact name is required"],
    trim: true
  },
  emergencyPhone: { 
    type: String, 
    required: [true, "Emergency phone is COMPULSORY - needed for RED alert SOS"],
    trim: true,
    validate: [
      {
        validator: function(v) {
          return v && v.trim().length >= 7;
        },
        message: "Emergency phone cannot be empty or ?"
      },
      {
        validator: function(v) {
          // Allows: +1 234-567-8900, +91 9876543210, (020) 1234 5678, 0044 20 1234 5678
          // Counts digits only: must be 7-15 digits total (ITU-T international standard)
          const digitsOnly = v.replace(/\D/g, '');
          return digitsOnly.length >= 7 && digitsOnly.length <= 15;
        },
        message: "Phone must have 7-15 digits (e.g. +1 202-555-0123 or +91 9876543210)"
      },
      {
        validator: function(v) {
          // Only allow +, numbers, spaces, dashes, brackets - no letters or ?
          return /^\+?[\d\s\-\(\)]+$/.test(v);
        },
        message: "Phone can only have numbers, +, spaces, -, () - no letters or ?"
      }
    ]
  },
  countryCode: {
    type: String,
    default: "+91",
    required: false
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