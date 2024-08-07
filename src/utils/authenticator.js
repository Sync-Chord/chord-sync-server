import { decode_token } from "./web_tokens.js";

const authenticator = (req, res, next) => {
  const token = req.headers["token"];
  const user_id = req.headers["user"];

  if (!token || !user_id) {
    return res.status(401).send({ message: "Failed to authenticate at lvl 1", status: 401 });
  }

  try {
    const user_details = decode_token(token);
    if (user_details.id !== Number(user_id)) throw new Error("Wrong User Id");
    req.user = user_details;
    next();
  } catch (error) {
    return res.status(401).send({
      message: error.message || "Failed to authenticate at lvl 1",
      status: 401,
    });
  }
};

export default authenticator;
