import mongoose from "mongoose";
import Chat from "../models/mongodb/Chat.js";
import Message from "../models/mongodb/Message.js";
import response_structure from "../utils/response.js";

export const create_chat = async (data, cb) => {
  try {
    if (
      !data.type ||
      !data.ids ||
      data.ids.length < 1 ||
      (data.type === "group" && !data.group_name)
    )
      throw new Error("Params missing");

    const new_chat = new Chat({
      type: data.type,
      group_name: data.group_name || null,
      ids: [...data.ids, { id: data.user.id, name: data.user.name }],
      created_by: data.user.id,
    });

    const result = await new_chat.save();

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "create_chat",
          message: "chat created successfully",
          data: result,
        })
        .toJS()
    );
  } catch (err) {
    console.error(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "create_chat",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_chats = async (data, cb) => {
  try {
    if (!data.type) throw new Error("Params missing");

    const where_data = {
      "ids.id": { $in: [data.user.id] },
      type: data.type,
    };
    const result = await Chat.find(where_data);

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_chats",
          message: "chats fetched successfully",
          data: result,
        })
        .toJS()
    );
  } catch (err) {
    console.error(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "get_chats",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const save_message = async (data, cb) => {
  try {
    if ((!data.message && !data.attachment_url) || !data.chat_id) throw new Error("Params missing");

    const new_message = new Message({
      sender: data.user.id,
      chat_id: data.chat_id,
      message: data.message || null,
      attachment: data.attachment_url || null,
    });

    const result = new_message.save();

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "save_message",
          message: "message sent",
          data: result,
        })
        .toJS()
    );
  } catch (err) {
    console.error(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "save_message",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_messages = async (data, cb) => {
  try {
    if (!data.chat_id) throw new Error("params missing");

    const result = await Message.find({
      chat_id: data.chat_id,
    })
      .sort({ createdAt: -1 })
      .skip(data.offset || 0)
      .limit(data.limit || 10)

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_messages",
          message: "ok",
          data: result,
        })
        .toJS()
    );
  } catch (err) {
    console.error(err);
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "get_messages",
          message: err.message,
        })
        .toJS()
    );
  }
};
