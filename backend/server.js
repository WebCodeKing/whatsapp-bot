import dns from "dns";
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { processMessage } from "../ai/aiEngine.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const chatSchema = new mongoose.Schema({ question: String, answer: String });
const Chat = mongoose.model("Chat", chatSchema);

async function test() {
  try {
    const doc = await Chat.findOne({});
    console.log("Found document:", doc);
  } catch (err) {
    console.error("Query error:", err);
  } finally {
    mongoose.connection.close();
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const answer = await processMessage(message);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));