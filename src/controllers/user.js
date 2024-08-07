import User from "../models/postgres/User";
import Friend from "../models/postgres/Friends";
import { Op, where } from "sequelize";

export const edit_user_profile = async (data, cb) => {
  try {
    const update_data = {};

    if (data.email) {
      const found = await User.findOne({
        where: {
          email: data.email,
        },
      });

      if (found) throw new Error("Email Alreday exists");
      update_data.email = data.email;
    }

    if (data.phone_number) {
      const found = await User.findOne({
        where: {
          phone_number: data.phone_number,
        },
      });

      if (found) throw new Error("Phone Number Alreday exists");
      update_data.phone_number = data.phone_number;
    }

    if (data.age) {
      update_data.age = data.age;
    }

    if (data.gender) {
      update_data.gender = data.gender;
    }

    if (data.name) {
      update_data.name = data.name;
    }

    await User.update(update_data, {
      where: {
        id: data.user.id,
      },
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "edit_user_profile",
          message: "User Updated Successfully",
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
          action: "edit_user_profile",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const send_friend_request = async (data, cb) => {
  try {
    if (!data.following) throw new Error("Id Missing");

    const found = await User.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ following: data.following }, { follower: data.user.id }],
          },
          {
            [Op.or]: [{ follower: data.following }, { following: data.user.id }],
          },
        ],
      },
    });

    if (found && found.is_friend) {
      throw new Error("Alreday added to your friend list");
    }

    if (found && !found.is_friend && found.follower === data.user.id)
      throw new Error("Request already sent");

    if (found && !found.is_friend && found.following === data.user.id)
      throw new Error("Friend request already sent from user to you");

    const new_request = new Friend({
      follower: data.user.id,
      following: data.following,
      is_friend: false,
    });

    await new_request.save();

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "send_friend_request",
          message: "Request sent successfully",
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
          action: "send_friend_request",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const accept_request = async (data, cb) => {
  try {
    if (!data.request_id || !data.hasOwnProperty(data.is_friend)) throw new Error("Params missing");

    const found = await Friend.findOne({
      where: {
        id: data.request_id,
      },
    });

    if (!found) throw new Error("Request not found");

    if (found.is_friend) throw new Error("Already added to friends list");

    if (data.is_friend) {
      await Friend.update(
        {
          is_friend: true,
        },
        {
          where: {
            id: data.request_id,
          },
        }
      );
    } else {
      await Friend.destroy({
        where: {
          id: data.request_id,
        },
      });
    }

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "send_friend_request",
          message: "Request status changed",
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
          action: "send_friend_request",
          message: err.message,
        })
        .toJS()
    );
  }
};

//to do
export const get_user_list = async (data, cb) => {
  try {
    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_user_list",
          message: "Request status changed",
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
          action: "get_user_list",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_friends_list = async (data, cb) => {
  try {
    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_user_list",
          message: "Request status changed",
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
          action: "get_user_list",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_friend_profile = async (data, cb) => {
  try {
    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_user_list",
          message: "Request status changed",
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
          action: "get_user_list",
          message: err.message,
        })
        .toJS()
    );
  }
};
