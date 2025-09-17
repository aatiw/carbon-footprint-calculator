import mongoose, { type ConnectOptions } from "mongoose";
import dotenv from "dotenv";

dotenv.config({debug:false});

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/carbon-footprint-analyzer";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    } as ConnectOptions);

    console.log("Connected to MongoDB");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    process.on("SIGINT", gracefulExit);
    process.on("SIGTERM", gracefulExit);

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}


export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
}


async function gracefulExit() {
  await disconnectDB();
  process.exit(0);
}
