//module imports
import bcrypt from "bcrypt";

export const encrypt = async (text) => {
  try {
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashed_text = await bcrypt.hash(text, salt);
    return hashed_text;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const compare = async (plain_text, hashed_text) => {
  try {
    const matched = await bcrypt.compare(plain_text, hashed_text);
    return matched;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const generate_otp = (length) => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString();
};
