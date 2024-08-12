//module imports
import express from "express";
import multer from "multer";

//function imports
import {
  edit_user_profile,
  send_friend_request,
  respond_to_friend_request,
  get_user_list,
  get_friends_list,
  get_requests,
  delete_request,
  get_user_data,
} from "../controllers/user.js";

//util imports
import authenticator from "../utils/authenticator.js";
import { admin } from "../utils/firebase_config.js";
const bucket = admin.storage().bucket();

// multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // file size
});

const upload_file = async (req, res, next) => {
  try {
    if (req.file) {
      const file_name = `profiles/${req.user.id}/${req.file.originalname}_${Date.now()}`;
      const file = bucket.file(file_name);

      const fileStream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        fileStream.on("error", (err) => {
          console.error("Error uploading file:", err);
          reject(err);
        });

        fileStream.on("finish", async () => {
          try {
            await file.makePublic();
            resolve();
          } catch (error) {
            console.error("Error making file public:", error);
            reject(error);
          }
        });

        fileStream.end(req.file.buffer);
      });

      const url = `https://storage.googleapis.com/${bucket.name}/${file_name}`;
      req.file_url = url;

      next();
    } else {
      next();
    }
  } catch (err) {
    res.status(400).send({
      success: false,
      status: 400,
      action: "upload_file",
      message: err.message,
    });
  }
};

const router = express.Router();

router.patch(
  "/edit_user_profile",
  authenticator,
  upload.single("file"),
  upload_file,
  (req, res) => {
    const data = JSON.parse(req.body.update_data);
    data.file_url = req.file_url;
    data.user = req.user;

    edit_user_profile(data, (error, response) => {
      if (error) {
        return res.status(error.status).send(error);
      }
      return res.status(response.status).send(response);
    });
  }
);

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
  console.log(data);
  data.user = req.user;
  respond_to_friend_request(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.get("/user_list", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  get_user_list(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.get("/friends_list", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  get_friends_list(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.get("/get_requests", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  get_requests(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.get("/get_user_data", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  get_user_data(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

router.delete("/delete_request", authenticator, (req, res) => {
  const data = { ...req.query };
  data.user = req.user;
  delete_request(data, (error, response) => {
    if (error) {
      return res.status(error.status).send(error);
    }
    return res.status(response.status).send(response);
  });
});

export default router;
