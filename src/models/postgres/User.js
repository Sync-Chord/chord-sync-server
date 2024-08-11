//module imports
import { DataTypes } from "sequelize";

//datebase imports
import sequelize from "../../database/postgres.js";

const User = sequelize.define(
  "Users",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      defaultValue: null,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      unique: true,
      defaultValue: null,
    },
    profile_photo: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    age: { type: DataTypes.INTEGER, defaultValue: null },
    gender: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    unique_id: {
      type: DataTypes.STRING,
      values: ["email", "phone_number"],
      allowNull: false,
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

export default User;
