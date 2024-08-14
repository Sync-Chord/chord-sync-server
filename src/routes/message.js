//module imports
import express from "express";

//function imports
import { save_message, create_chat, get_chats, get_messages } from "../controllers/messages.js";
import authenticator from "../utils/authenticator.js";

const router = express.Router();

router.post("/create_chat", authenticator, (req, res) => {
  const data = { ...req.body };
  console.log(data);
  data.user = req.user;
  create_chat(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.get("/get_chats", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  get_chats(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.get("/get_messages", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  get_messages(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
