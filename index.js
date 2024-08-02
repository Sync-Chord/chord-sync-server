//module imports
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";

const app = express();

dotenv.config();

//database imports
import connectMongoDB from "./src/database/mongo.js";
import sequelize from "./src/database/postgres.js";

//middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "50mb" }));
app.use(morgan("dev"));

//database connections
connectMongoDB();

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Postgres Connected");
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error);
  }
})();

//health check
app.get("/health_check", (req, res) => {
  res.status(200).send("Working fine!!");
});

//routes import
import auth_route from "./src/routes/auth.js";

//routes
app.use("/auth", auth_route);

//server
app.listen(process.env.PORT, () => {
  console.log(`Server connected at Port: ${process.env.PORT}`);
});
