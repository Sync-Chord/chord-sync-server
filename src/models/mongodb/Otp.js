//module imports
import mongoose from "mongoose";

const schema = mongoose.Schema({
  unique_id: { type: String, required: true },
  otp: { type: String, required: true },
  is_used: {
    type: Boolean,
    default: false,
  },
  token: {
    type: String,
  },
  temp_pass: {
    type: String,
  },
  otp_count: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    expires: "10m",
  },
});

const Otp = mongoose.model("Otp", schema);

export default Otp;
