//module imports
import mongoose from "mongoose";

const schema = mongoose.Schema({
  chat_id: { type: mongoose.Types.ObjectId, required: true },
  message: { type: String },
  attachment: { type: String },
  sender: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Messages = mongoose.model("Messages", schema);

export default Messages;
