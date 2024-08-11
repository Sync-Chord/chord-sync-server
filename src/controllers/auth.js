//model imports
import User from "../models/postgres/User.js";
import Otp from "../models/mongodb/Otp.js";

//utils import
import response_structure from "../utils/response.js";
import { create_token, decode_token } from "../utils/web_tokens.js";
import { compare, encrypt, generate_otp } from "../utils/password.js";
import { send_email, send_message_to_phone } from "../utils/send_messages.js";

//module imports
import { Op } from "sequelize";

// constant variables
const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   /^(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/
//   /^(\+91|\+91\-|0)?[789]\d{9}$/
const phone_number_regex = /^[0]?[6789]\d{9}$/;

export const generate_otp_register = async (data, cb) => {
  try {
    if (!data.name || !data.unique_id || !data.password)
      throw new Error("Params Missing");

    const user_data = {
      name: data.name,
    };

    if (email_regex.test(data.unique_id)) {
      user_data.email = data.unique_id;
    } else if (phone_number_regex.test(data.unique_id)) {
      user_data.phone_number = data.unique_id;
    } else {
      throw new Error("Invalid Phone or Email");
    }

    const found = await User.findOne({
      where: {
        [Op.or]: [{ email: data.unique_id }, { phone_number: data.unique_id }],
      },
    });

    if (
      found &&
      (found.email === data.unique_id || found.phone_number === data.unique_id)
    )
      throw new Error("Email or Phone Already Exists");

    const hashed_pass = await encrypt(data.password);

    const token = create_token(user_data);

    const otp = generate_otp(6);

    const hashed_otp = await encrypt(otp);

    const new_otp = new Otp({
      temp_pass: hashed_pass,
      otp: hashed_otp,
      token,
      unique_id: data.unique_id,
    });

    const promises = [new_otp.save()];

    const message = `Dear ${user_data.name},

Your OTP for Chord Sync Hub is [${otp}]. It is valid for 10 minutes. Please do not share this code with anyone.

Thank you,
Chord Sync Hub Team`;

    if (user_data.email) {
      const subject = "Your Chord Sync Hub OTP Code";
      promises.push(send_email([user_data.email], subject, message));
    } else if (user_data.phone_number) {
      promises.push(send_message_to_phone(user_data.phone_number, message));
    }

    await Promise.all(promises);

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "generate_otp",
          message: "OTP Sent Successfully",
          data: token,
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
          action: "generate_otp",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const resend_otp = async (data, cb) => {
  try {
    if (!data.token) throw new Error("Params Missing");

    const user_data = decode_token(data.token);

    if (!user_data) throw new Error("Invalid token");

    const found_otp = await Otp.findOne({
      token: data.token,
      unique_id: user_data.email ? user_data.email : user_data.phone_number,
      is_used: false,
    }).sort({ updatedAt: -1 });

    if (!found_otp) throw new Error("Invalid token");

    if (found_otp && found_otp.otp_count >= 3)
      throw new Error("Maximum OTP Sent!! Please Try Again After 10 Mins");

    const { iat, exp, ...remaining_data } = user_data;
    const new_token = create_token(remaining_data);

    const new_otp = generate_otp(6);

    const hashed_otp = await encrypt(new_otp);

    const promises = [
      Otp.findByIdAndUpdate(found_otp._id, {
        otp: hashed_otp,
        otp_count: found_otp.otp_count + 1,
        token: new_token,
      }),
    ];

    const message = `Dear ${user_data.name},

Your OTP for Chord Sync Hub is [${new_otp}]. It is valid for 10 minutes. Please do not share this code with anyone.

Thank you,
Chord Sync Hub Team`;

    if (user_data.email) {
      const subject = "Your Chord Sync Hub OTP Code";

      promises.push(send_email([user_data.email], subject, message));
    } else if (user_data.phone_number) {
      promises.push(send_message_to_phone(user_data.phone_number, message));
    }

    await Promise.all(promises);

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "resend_otp",
          message: "OTP Resent Successfully",
          data: new_token,
        })
        .toJS()
    );
  } catch (err) {
    return cb(
      response_structure
        .merge({
          success: false,
          status: 400,
          action: "resend_otp",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const register_user = async (data, cb) => {
  try {
    if (!data.token && !data.otp) throw new Error("Params Missing");

    const user_data = decode_token(data.token);

    if (!user_data) throw new Error("Invalid Token");

    const found_otp = await Otp.findOne({
      unique_id: user_data.email ? user_data.email : user_data.phone_number,
      is_used: false,
    }).sort({ updatedAt: -1 });

    if (!found_otp) throw new Error("No OTP Found");

    const otp_matched = await compare(data.otp, found_otp.otp);

    if (!otp_matched) throw new Error("Wrong OTP");

    const [new_user, updated_otp] = await Promise.all([
      User.create({
        ...user_data,
        password: found_otp.temp_pass,
        unique_id: user_data.email ? "email" : "phone_number",
      }),
      Otp.findByIdAndUpdate(found_otp._id, { is_used: true }),
    ]);

    const { password, ...rest } = new_user.dataValues;

    const token = create_token({
      id: rest.id,
      name: rest.name,
      email: rest.email,
      age: rest.age,
      gender: rest.gender,
      phone_number: rest.phone_number,
      is_admin: rest.is_admin,
      is_active: rest.is_active,
      unique_id: rest.email ? "email" : "phone_number",
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "generate_otp",
          message: "User Registered Successfully",
          data: {
            token,
            user: rest,
          },
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
          action: "generate_otp",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const sign_in = async (data, cb) => {
  try {
    if (!data.unique_id || !data.password) throw new Error("Param Missing");

    const user_found = await User.findOne({
      where: {
        [Op.or]: [{ email: data.unique_id }, { phone_number: data.unique_id }],
      },
    });

    if (!user_found) throw new Error("Invalid Email or Phone Number");

    const valiid_pass = await compare(data.password, user_found.password);

    if (!valiid_pass) throw new Error("Invalid Password");

    const { password, ...rest } = user_found.dataValues;

    const token = create_token({
      id: rest.id,
      name: rest.name,
      email: rest.email,
      age: rest.age,
      gender: rest.gender,
      phone_number: rest.phone_number,
      is_admin: rest.is_admin,
      is_active: rest.is_active,
      unique_id: rest.unique_id,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "sign_in",
          message: "User Logged In Successfully",
          data: {
            token,
            user: rest,
          },
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
          action: "sign_in",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const generate_otp_sign_in = async (data, cb) => {
  try {
    if (!data.unique_id) throw new Error("Params Missing");

    const user_data = {};

    if (email_regex.test(data.unique_id)) {
      user_data.email = data.unique_id;
    } else if (phone_number_regex.test(data.unique_id)) {
      user_data.phone_number = data.unique_id;
    } else {
      throw new Error("Invalid Phone or Email");
    }

    const found = await User.findOne({
      where: {
        [Op.or]: [{ email: data.unique_id }, { phone_number: data.unique_id }],
      },
    });

    if (!found) throw new Error("Email or Phone Not Found");

    const token = create_token(user_data);

    const otp = generate_otp(6);

    const hashed_otp = await encrypt(otp);

    const new_otp = new Otp({
      otp: hashed_otp,
      token,
      unique_id: data.unique_id,
    });

    const promises = [new_otp.save()];

    const message = `Dear ${user_data.name},

Your OTP for Chord Sync Hub is [${otp}]. It is valid for 10 minutes. Please do not share this code with anyone.

Thank you,
Chord Sync Hub Team`;

    if (user_data.email) {
      const subject = "Your Chord Sync Hub OTP Code";
      promises.push(send_email([user_data.email], subject, message));
    } else if (user_data.phone_number) {
      promises.push(send_message_to_phone(user_data.phone_number, message));
    }

    await Promise.all(promises);

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "sign_in",
          message: "User Logged In Successfully",
          data: token,
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
          action: "sign_in",
          message: err.message,
        })
        .toJS()
    );
  }
};

export const sign_in_by_otp = async (data, cb) => {
  try {
    if (!data.token || !data.otp) throw new Error("Params Missing");

    const user_data = decode_token(data.token);

    if (!user_data) throw new Error("Invalid Token");

    const found_otp = await Otp.findOne({
      unique_id: user_data.email ? user_data.email : user_data.phone_number,
      is_used: false,
    }).sort({ updatedAt: -1 });

    if (!found_otp) throw new Error("No OTP Found");

    const otp_matched = await compare(data.otp, found_otp.otp);

    if (!otp_matched) throw new Error("Wrong OTP");

    const search_data = {};
    if (user_data.email) {
      search_data.email = user_data.email;
    } else {
      user.search_data = user_data.phone_number;
    }

    const [user, updated_otp] = await Promise.all([
      User.findOne({ where: search_data }),
      Otp.findByIdAndUpdate(found_otp._id, { is_used: true }),
    ]);

    const { password, ...rest } = user.dataValues;

    const token = create_token({
      id: rest.id,
      name: rest.name,
      email: rest.email,
      age: rest.age,
      gender: rest.gender,
      phone_number: rest.phone_number,
      is_admin: rest.is_admin,
      is_active: rest.is_active,
      unique_id: rest.unique_id,
    });

    return cb(
      null,
      response_structure
        .merge({
          success: true,
          status: 200,
          action: "sign_in",
          message: "User Logged In Successfully",
          data: {
            token,
            user: rest,
          },
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
          action: "sign_in",
          message: err.message,
        })
        .toJS()
    );
  }
};
