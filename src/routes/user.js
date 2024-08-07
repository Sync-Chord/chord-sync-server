//module imports
import express from "express";

//function imports
import { edit_user_profile, send_friend_request, accept_request } from "../controllers/user.js";

//util imports
import authenticator from "../utils/authenticator.js";

const router = express.Router();

router.patch("/edit_user_profile", authenticator, (req, res) => {
  const data = { ...req.body };
  data.user = req.user;
  edit_user_profile(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.post("/send_friend_request", authenticator, (req, res) => {
  const data = { ...req.body };
  data.user = req.user;
  send_friend_request(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.patch("/accept_request", authenticator, (req, res) => {
  const data = { ...req.body };
  data.user = req.user;
  accept_request(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
