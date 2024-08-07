//module imports
import { DataTypes } from "sequelize";

//datebase imports
import sequelize from "../../database/postgres.js";

//model imports
import User from "./User.js";

const Friend = sequelize.define(
  "Friends",
  {
    follower: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
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

export default Friend;
