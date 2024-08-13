//module imports
import mongoose from "mongoose";

const schema = mongoose.Schema({
  music_name: { type: String, required: true },
  category: { type: String, required: true },
  artist_name: { type: String, required: true },
  listen_count: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Music = mongoose.model("Music", schema);

export default Music;
