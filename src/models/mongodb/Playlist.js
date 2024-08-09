//module imports
import mongoose from "mongoose";

const schema = mongoose.Schema({
  user_id: { type: String, required: true },
  song_ids: { type: [String] },
  playlist_name: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Playlist = mongoose.model("Playlist", schema);

export default Playlist;
