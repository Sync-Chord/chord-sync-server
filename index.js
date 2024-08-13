import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import http from "http";

// Import your modules
import connectMongoDB from "./src/database/mongo.js";
import sequelize from "./src/database/postgres.js";
import socketHandler from "./src/socket.js";

// Import routes
import auth_route from "./src/routes/auth.js";
import playlist_route from "./src/routes/playlist.js";
import user_route from "./src/routes/user.js";
import chat_route from "./src/routes/message.js"

const app = express()
dotenv.config()

// Middlewares
app.use(cors())
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }))
app.use(morgan("dev"))

// Create an HTTP server
const server = http.createServer(app)

// Initialize socket.io
socketHandler(server)

// Database connections
connectMongoDB()
;(async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync({ force: false })
    console.log("Database synchronized.")
    console.log("Postgres Connected")
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error)
  }
})()

// Health check
app.get("/health_check", (req, res) => {
  res.status(200).send("Working fine!!")
})

// Use routes
app.use("/auth", auth_route)
app.use("/playlist", playlist_route)
app.use("/user", user_route)
app.use("/chat", chat_route)


// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server connected at Port: ${process.env.PORT}`);
});
