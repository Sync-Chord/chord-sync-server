import { Server } from "socket.io";
import { save_message } from "./controllers/messages.js";

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

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
    });
  });
};

export default socketHandler;
