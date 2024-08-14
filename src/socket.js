import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { save_message } from "./controllers/messages.js";

// Define __dirname in an ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store user socket information
const users = {};

const fetchFullSong = (songId) => {
  const songPath = path.join(__dirname, `../music/${songId}.mp3`);

  if (!fs.existsSync(songPath)) {
    throw new Error("Song not found");
  }

  const songBuffer = fs.readFileSync(songPath);
  return songBuffer;
};

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("user_connected", (userId) => {
      users[userId] = socket.id;
      console.log(`User ID: ${userId} is associated with Socket ID: ${socket.id}`);
    });

    // room creation
    socket.on("create_room", (data) => {
      const { roomId, requestedUserIds } = data;
      console.log(requestedUserIds);
      // Add user to the room
      socket.join(roomId);
      console.log(`Socket ${socket.id} created room ${roomId} and joined`);

      // Notify requested user to join the room
      requestedUserIds.forEach((userId) => {
        const userSocketId = users[userId];
        if (userSocketId) {
          console.log(`invitaion sent to${userId} ->${userSocketId}`);
          io.to(userSocketId).emit("room_invitation", {
            roomId,
            inviterId: socket.id,
          });
        }
      });
    });

    // Handle room invitation acceptance
    socket.on("accept_invitation", (data) => {
      const { roomId, userId } = data;
      const userSocketId = users[userId];
      if (userSocketId) {
        io.sockets.sockets.get(userSocketId)?.join(roomId);
        console.log(`Socket ${userSocketId} accepted invitation to room ${roomId}`);

        // Notify all users in the room that a new user has joined
        io.to(roomId).emit("user_joined_room", {
          roomId,
          userId: userSocketId,
        });

        // Notify all users in the room that the invitation was accepted
        io.to(roomId).emit("invitation_accepted", {
          roomId,
          userId: userSocketId,
        });
      }
    });

    //play music
    socket.on("play_music", (data) => {
      io.to(data.roomId).emit("music_played");
    });

    // Pause music event
    socket.on("pause_music", (data) => {
      io.to(data.roomId).emit("music_paused");
    });

    // Handle song requests
    socket.on("request_song", (data) => {
      const { roomId, songId } = data;

      try {
        const fullSongBuffer = fetchFullSong(songId).toString("base64");

        if (io.sockets.adapter.rooms.has(roomId)) {
          io.to(roomId).emit("receive_full_song", { fullSongBuffer });
        } else {
          socket.emit("receive_full_song", { fullSongBuffer });
        }
      } catch (error) {
        console.error("Error fetching song:", error);
        socket.emit("error_message", "An error occurred while fetching the song.");
      }
    });

    // Handle messages
    socket.on("send_message", async (data) => {
      try {
        await save_message(data, (err, response) => {
          if (err) {
            console.error("Error saving message:", err);
            socket.emit("error_message", err.message);
          } else {
            console.log("Message saved:", response);
            io.emit("receive_message", {
              message: data.message,
              sender: data.user.id,
              chat_id: data.chat_id,
            });
          }
        });
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("error_message", "An error occurred while sending the message.");
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      const disconnectedUserId = Object.keys(users).find((key) => users[key] === socket.id);
      if (disconnectedUserId) {
        delete users[disconnectedUserId];
      }
    });
  });
};

export default socketHandler;
