//module imports
import mongoose from "mongoose";

const schema = mongoose.Schema({
  type: { type: String, required: true, enum: ["group", "single"] },
  group_name: { type: String, default: null },
  ids: [
    {
      type: {
        name: { type: String, required: true },
        id: { type: Number, required: true },
      },
    },
  ],
  created_by: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", schema);

export default Chat;
