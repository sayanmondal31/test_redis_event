import express from "express";
import dotenv from "dotenv";
import redisService from "./redis";

dotenv.config();

const app = express();
app.use(express.json());

class Subscriber {
  constructor() {
    this.isProcessing = false;
    this.channelName = "event:task1";
  }

  async processPendingEvents() {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      const pendingEvents = await redisService.getPendingEvents(
        this.channelName
      );
      console.log(`Found ${pendingEvents.length} pending events`);

      for (const event of pendingEvents) {
        await this.processEvent(event);
      }

      if (pendingEvents.length > 0) {
        await redisService.removePendingEvents(this.channelName);
      }
    } catch (error) {
      console.error("Error processing pending events:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processEvent(event) {
    console.log("Processing event:", event);
    // Add event processing logic here
  }

  async start() {
    try {
      await redisService.connect();

      // Initial pending events check
      await this.processPendingEvents();

      // Subscribe to new events
      await redisService.subscribe(this.channelName, async (message) => {
        const event = JSON.parse(message);
        console.log("Received real-time event:", event);
        await this.processEvent(event);
      });

      // Regular check for pending events
      setInterval(() => this.processPendingEvents(), 5000);
    } catch (error) {
      console.error("Subscriber error:", error);
      setTimeout(() => this.start(), 5000);
    }
  }
}

const subscriber = new Subscriber();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3001, () => {
  console.log("Server sub is running on port 3001");
  subscriber.start().catch(console.error);
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await redisService.client.quit();
  process.exit(0);
});
