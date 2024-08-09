// module imorts
import { DataTypes } from "sequelize";
import sequelize from "../../database/postgres.js";
import User from "./User.js";

const Friend = sequelize.define(
  "Friends",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    follower: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    following: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    is_friend: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
      values: ["pending", "accepted"],
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Date.now(),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Date.now(),
    },
  },
  { timestamps: false }
);

User.hasMany(Friend, { foreignKey: "follower", as: "Followers" });
User.hasMany(Friend, { foreignKey: "following", as: "Following" });

Friend.belongsTo(User, { foreignKey: "follower", as: "FollowerUser" });
Friend.belongsTo(User, { foreignKey: "following", as: "FollowingUser" });

export default Friend;
