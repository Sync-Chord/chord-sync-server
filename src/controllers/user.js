import User from "../models/postgres/User.js";
import Friend from "../models/postgres/Friends.js";
import { Op, Sequelize } from "sequelize";
import sequelize from "../database/postgres.js";
import response_structure from "../utils/response.js";

export const edit_user_profile = async (data, cb) => {
  try {
    const update_data = {};

    if (data.file_url) {
      update_data.profile_photo = data.file_url;
    }

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

    const result = await User.update(update_data, {
      where: {
        id: data.user.id,
      },
      returning: true,
      plain: true,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "edit_user_profile",
          message: "User Updated Successfully",
          data: result[1],
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
    if (!data.following) throw new Error("Following ID is missing");

    const existing_request = await Friend.findOne({
      where: {
        [Op.or]: [
          { follower: data.user.id, following: data.following },
          { follower: data.following, following: data.user.id },
        ],
      },
    });

    if (existing_request) {
      if (existing_request.status === "accepted") {
        throw new Error("Already friends");
      }
      if (existing_request.follower === data.user.id) {
        throw new Error("Request already sent");
      }
      if (existing_request.following === data.user.id) {
        throw new Error("Friend request already received");
      }
    }

    await Friend.create({
      follower: data.user.id,
      following: data.following,
      status: "pending",
    });

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
    console.error(err);
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

export const respond_to_friend_request = async (data, cb) => {
  try {
    if (!data.request_id || !data.hasOwnProperty("accept")) throw new Error("Params missing");

    const request = await Friend.findOne({
      where: {
        id: data.request_id,
      },
    });

    if (!request) throw new Error("Request not found");

    if (request.status === "accepted") throw new Error("Already added to friends list");

    if (data.accept) {
      await request.update({
        status: "accepted",
        is_friend: true,
      });
    } else {
      await request.destroy();
    }

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "respond_to_friend_request",
          message: "Request status changed",
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
          action: "respond_to_friend_request",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_user_list = async (data, cb) => {
  try {
    const [sub_query_res] = await sequelize.query(`
      SELECT DISTINCT
        CASE
          WHEN "follower" = ${data.user.id} THEN "following"
          ELSE "follower"
        END AS user_id
      FROM "Friends"
      WHERE ("follower" = ${data.user.id} OR "following" = ${data.user.id})
        AND "status" IN ('accepted', 'pending')
    `);

    const excluded_user_ids = sub_query_res.map((row) => row.user_id);

    const whereClause = {
      id: {
        [Op.notIn]: [...excluded_user_ids, data.user.id],
      },
      is_active: true,
    };

    if (data.keyword) {
      whereClause.name = {
        [Op.iLike]: `%${data.keyword}%`,
      };
    }

    const users = await User.findAll({
      attributes: ["id", "name", "email", "profile_photo", [sequelize.literal("NULL"), "status"]],
      where: whereClause,
      limit: Number(data.limit) || 10,
      offset: Number(data.offset) || 0,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_filtered_users",
          message: "Request successful",
          data: users,
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
          action: "get_filtered_users",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_friends_list = async (data, cb) => {
  try {
    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { follower: data.user.id, status: "accepted" },
          { following: data.user.id, status: "accepted" },
        ],
      },
      include: [
        {
          model: User,
          as: "FollowerUser",
          attributes: ["id", "name", "email", "profile_photo"],
        },
        {
          model: User,
          as: "FollowingUser",
          attributes: ["id", "name", "email", "profile_photo"],
        },
      ],
    });

    const friends_data = friends.map((friend) => {
      const is_follower = friend.follower === data.user.id;
      return {
        ...(is_follower ? friend.FollowingUser : friend.FollowerUser).toJSON(),
        status: friend.status,
        friendId: friend.id,
      };
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_friends",
          message: "Request successful",
          data: friends_data,
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
          action: "get_friends",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_requests = async (data, cb) => {
  try {
    const sent_requests = await Friend.findAll({
      where: {
        follower: data.user.id,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "FollowingUser",
          attributes: ["id", "name", "email", "profile_photo"],
        },
      ],
    });

    const received_request = await Friend.findAll({
      where: {
        following: data.user.id,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "FollowerUser",
          attributes: ["id", "name", "email", "profile_photo"],
        },
      ],
    });

    const requests = {
      sent: sent_requests.map((request) => ({
        id: request.id,
        status: request.status,
        user: request.FollowingUser,
      })),
      received: received_request.map((request) => ({
        id: request.id,
        status: request.status,
        user: request.FollowerUser,
      })),
    };

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_requests",
          message: "Requests retrieved successfully",
          data: requests,
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
          action: "get_requests",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const delete_request = async (data, cb) => {
  try {
    if (!data.request_id) {
      throw new Error("Request ID is missing");
    }

    const request = await Friend.findOne({
      where: {
        id: data.request_id,
        follower: data.user.id,
        status: "pending",
      },
    });

    if (!request) {
      throw new Error("Request not found or you do not have permission to delete this request");
    }

    await Friend.destroy({
      where: {
        id: data.request_id,
      },
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "delete_request",
          message: "Request deleted successfully",
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
          action: "delete_request",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const get_user_data = async (data, cb) => {
  try {
    let response_data;

    if (data.type === "friends") {
      const friends = await Friend.findAll({
        where: {
          [Op.or]: [
            { follower: data.user.id, status: "accepted" },
            { following: data.user.id, status: "accepted" },
          ],
        },
        include: [
          {
            model: User,
            as: "FollowerUser",
            attributes: ["id", "name", "email", "profile_photo"],
          },
          {
            model: User,
            as: "FollowingUser",
            attributes: ["id", "name", "email", "profile_photo"],
          },
        ],
        limit:data.limit||10,
        offset:data.offset||0
      });

      const friends_data = friends.map((friend) => {
        const is_follower = friend.follower === data.user.id;
        return {
          ...(is_follower ? friend.FollowingUser : friend.FollowerUser).toJSON(),
          status: friend.status,
          friendId: friend.id,
        };
      });

      response_data = friends_data;
    } else if (data.type === "sent") {
      const sent_requests = await Friend.findAll({
        where: {
          follower: data.user.id,
          status: "pending",
        },
        include: [
          {
            model: User,
            as: "FollowingUser",
            attributes: ["id", "name", "email", "profile_photo"],
          },
        ],
        limit:data.limit||10,
        offset:data.offset||0
      });

      const sent_data = sent_requests.map((request) => ({
        id: request.id,
        status: request.status,
        user: request.FollowingUser,
      }));

      response_data = sent_data;
    } else if (data.type === "requests") {
      const received_requests = await Friend.findAll({
        where: {
          following: data.user.id,
          status: "pending",
        },
        include: [
          {
            model: User,
            as: "FollowerUser",
            attributes: ["id", "name", "email", "profile_photo"],
          },
        ],
        limit: data.limit || 10,
        offset: data.offset || 0,
      })

      const received_data = received_requests.map((request) => ({
        id: request.id,
        status: request.status,
        user: request.FollowerUser,
      }));

      response_data = received_data;
    } else {
      throw new Error("Invalid type");
    }

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "get_user_data",
          message: "Request successful",
          data: response_data,
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
          action: "get_user_data",
          message: err.message,
        })
        .toJS()
    );
  }
};
