import dns from "dns";
dns.setServers(['1.1.1.1', '8.8.8.8']);


import natural from "natural";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected for AI Engine"))
  .catch(err => console.error("❌ MongoDB connection error in AI Engine:", err));

// Define schema (same as your server.js)
const chatSchema = new mongoose.Schema({
  
  question: String,
  answer: String
}, { collection: "qa_pairs" });

const Chat = mongoose.model("Chat", chatSchema);

const countrySchema = new mongoose.Schema({
  country: String,
  budget: String,
  ielts_required: Boolean,
  ielts_band: String,
  visa_ratio: String,
  embassy: String,
  embassy_visits: String,
  bank_statement: String,
  processing_time: String,
  tuition_fee: String,
  application_fee: String
}, { collection: "countries" });

const Country = mongoose.model("Country", countrySchema);

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Function to process a message
export async function processMessage(message) {
  const words = tokenizer.tokenize(message.toLowerCase());
  const stemmed = words.map(w => stemmer.stem(w));

  try {
    // --- Step 1: Check country collection first ---
    const country = await Country.findOne({
      country: { $regex: new RegExp(`^${message}$`, "i") } // case-insensitive match
    });

    if (country) {
      // Return a formatted country info response
      return `Country: ${country.country}
Budget: ${country.budget}
IELTS Required: ${country.ielts_required ? "Yes" : "No"}
Visa Ratio: ${country.visa_ratio}
Processing Time: ${country.processing_time}`;
    }

    // --- Step 2: If not a country, search qa_pairs ---
    const allChats = await Chat.find({});
    let bestMatch = null;
    let maxScore = 0;

    allChats.forEach(chat => {
      const chatWords = tokenizer.tokenize(chat.question.toLowerCase()).map(w => stemmer.stem(w));
      const common = stemmed.filter(w => chatWords.includes(w));
      const score = common.length / chatWords.length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = chat;
      }
    });

    if (bestMatch && maxScore > 0.2) { // threshold to consider a match
      return bestMatch.answer;
    } else {
      return "Sorry, I do not know that yet.";
    }

  } catch (err) {
    console.error("AI Engine error:", err);
    return "Error processing your message.";
  }
}
