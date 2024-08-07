//model imports
import Playlist from "../models/mongodb/Playlist.js";

//util imports
import response_structure from "../utils/response.js";

export const create_playlist = async (data, cb) => {
  try {
    if (!data.playlist_name) throw new Error("Playlist name required!");

    const found = await Playlist.findOne({
      user_id: data.user.id,
      playlist_name: data.playlist_name.trim(),
    });

    if (found) throw new Error("Playlist name alreday exists!");

    const new_playlist = new Playlist({
      user_id: data.user.id,
      playlist_name: data.playlist_name.trim(),
    });

    new_playlist.save();

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "create_playlist",
          message: "Playlist created successfully",
        })
        .toJS()
    );
  } catch (err) {
    console.log(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "create_playlist",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const add_song_to_playlist = async (data, cb) => {
  try {
    if (!data.playlist_id || !data.song_id) throw new Error("Params missing");

    const found = Playlist.findOne({
      _id: data.playlist_id,
    });

    if (!found) throw new Error("Wrong Playlist id");

    if (found.user_id !== data.user.id)
      throw new Error("You dont have access to add song to this playlist");

    if (found.song_ids.find(data.song_id)) throw new Error("Songs alreday exists in playlist");

    found.song_ids.push(data.song_id);

    await Playlist.findByIdAndUpdate(
      {
        _id: found._id,
      },
      {
        song_ids: found.song_ids,
      }
    );

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "add_song_to_playlist",
          message: "Playlist created successfully",
        })
        .toJS()
    );
  } catch (err) {
    console.log(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "add_song_to_playlist",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const delete_playlist = async (data, cb) => {
  try {
    if (!data.playlist_id) throw new Error("Params missing");

    const found = Playlist.findOne({
      _id: data.playlist_id,
    });

    if (!found) throw new Error("Wrong Playlist id");

    if (found.user_id !== data.user.id)
      throw new Error("You dont have access to delete this playlist");

    await Playlist.findByIdAndDelete({
      _id: found._id,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "delete_playlist",
          message: "Playlist deleted successfully",
        })
        .toJS()
    );
  } catch (err) {
    console.log(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "delete_playlist",
          message: err.message,
        })
        .toJS()
    );
  }
};
