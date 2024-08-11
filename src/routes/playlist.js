//module imports
import express from "express";

//function imports
import { add_song_to_playlist, create_playlist, delete_playlist } from "../controllers/playlist.js";

//util imports
import authenticator from "../utils/authenticator.js";

const router = express.Router();

router.post("/create_palylist", authenticator, (req, res) => {
  const data = { ...req.body };
  data.user = req.user;
  create_playlist(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.patch("/add_song_to_palylist", authenticator, (req, res) => {
  const data = { ...req.body };
  data.user = req.user;
  add_song_to_playlist(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.patch("/delete_playlist", authenticator, (req, res) => {
  const data = { ...req.body };
  data.user = req.user;
  delete_playlist(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
