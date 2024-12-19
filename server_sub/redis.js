// const Redis = require("redis");
// require("dotenv").config();

// const createRedisClient = () => {
//   return Redis.createClient({
//     url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
//   });
// };

// module.exports = createRedisClient;

// const Redis = require("redis");
// require("dotenv").config();

// const createRedisClient = () => {
//   return Redis.createClient({
//     url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
//   });
// };

// module.exports = createRedisClient;

const Redis = require("redis");
require("dotenv").config();

class RedisService {
  constructor() {
    this.client = Redis.createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    this.subscriber = null;
  }

  async connect() {
    await this.client.connect();
    console.log("Connected to Redis Cloud");
  }

  async addToPendingEvents(channel, message) {
    const key = `pending:${channel}`;
    await this.client.lPush(key, JSON.stringify(message));
    console.log(`Event stored in pending list: ${key}`);
  }

  async getPendingEvents(channel) {
    const key = `pending:${channel}`;
    const events = await this.client.lRange(key, 0, -1);
    return events.map((event) => JSON.parse(event));
  }

  async removePendingEvents(channel) {
    const key = `pending:${channel}`;
    await this.client.del(key);
  }

  async publish(channel, message) {
    try {
      const subscribers = await this.client.publish(
        channel,
        JSON.stringify(message)
      );

      // If no active subscribers, store as pending
      if (subscribers === 0) {
        await this.addToPendingEvents(channel, message);
        console.log("No active subscribers, event stored as pending");
      }

      return true;
    } catch (error) {
      console.error("Publish error:", error);
      await this.addToPendingEvents(channel, message);
      return false;
    }
  }

  async subscribe(channel, callback) {
    if (!this.subscriber) {
      this.subscriber = this.client.duplicate();
      await this.subscriber.connect();
    }

    await this.subscriber.subscribe(channel, callback);
  }
}

module.exports = new RedisService();
