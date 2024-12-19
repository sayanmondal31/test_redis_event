import express from "express";
// import dotenv and setup
import dotenv from "dotenv";
import redisService from "./redis";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/publish", async (req, res) => {
  await redisService.publish("event:task1", {
    message: "Task 3 is completed",
    timestamp: new Date().toISOString(),
    name: req.body.name,
  });

  res.send("Event published");
});

app.listen(3000, () => {
  redisService.connect();
  console.log("Server pub is running on port 3000");
});
