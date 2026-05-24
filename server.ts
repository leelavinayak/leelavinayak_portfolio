import express from "express";
import path from "path";
import net from "net";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

dotenv.config();

// MongoDB Setup & Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/leela_portfolio";

// Local in-memory fallbacks in case MongoDB is not running or fails to connect
const localReviews: any[] = [
  {
    id: "default-1",
    name: "Srinivas Rao",
    rating: 5,
    comment: "Incredible full-stack knowledge! Leela designed a highly robust, optimized database adapter during his internship. A highly recommended developer.",
    timestamp: "May 20, 2026, 2:15 PM",
    createdBy: "system"
  }
];
const localContacts: any[] = [];

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000 // Timeout fast if local MongoDB daemon is not running
})
  .then(() => console.log(`[DATABASE] MongoDB connection established successfully to: ${MONGODB_URI}`))
  .catch((err) => {
    console.error("[DATABASE] MongoDB connection error:", err);
    console.warn("[DATABASE] Server will run with local fallback/in-memory seed values.");
  });

// Schema definitions for reviews & contact submissions
const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  timestamp: { type: String, required: true },
  createdBy: { type: String }
});

const Review = mongoose.model("Review", ReviewSchema);

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: String, required: true }
});

const Contact = mongoose.model("Contact", ContactSchema);

// Nodemailer Helper: Sends notification email to owner and thank you email to visitor
async function sendContactEmails(details: { name: string; email: string; message: string; timestamp: string }) {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailTo = process.env.EMAIL_TO || "leelavinayakkothakota@gmail.com";

  if (!smtpUser || !smtpPass) {
    console.warn("[MAIL SERVICE] SMTP user or password not configured in .env. Email transmission skipped (simulated successfully).");
    return { simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  // 1. Email notification to the portfolio owner (Leela)
  const ownerMailOptions = {
    from: `"[PORTFOLIO NOTIFICATION]" <${smtpUser}>`,
    to: emailTo,
    subject: `[NEW CONTACT NODE] Message from ${details.name}`,
    text: `Hello Leela,\n\nYou have received a new contact submission on your interactive portfolio:\n\n- Collaborator: ${details.name}\n- Email: ${details.email}\n- Date: ${details.timestamp}\n- Message:\n"${details.message}"\n\nBest regards,\nKLV Assistant Terminal`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #6d28d9; margin-top: 0; font-family: monospace; border-bottom: 2px solid #ddd; padding-bottom: 8px;">[NEW CONTACT MESSAGE]</h2>
        <p style="color: #334155;">Hello Leela,</p>
        <p style="color: #334155;">A new collaborator has initiated a transmission node:</p>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Name:</strong> ${details.name}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${details.email}" style="color: #2563eb; text-decoration: none;">${details.email}</a></p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${details.timestamp}</p>
          <p style="margin: 12px 0 4px 0;"><strong>Message Payload:</strong></p>
          <p style="margin: 0; font-style: italic; color: #475569; background-color: #f1f5f9; padding: 10px; border-radius: 6px; border-left: 3px solid #8b5cf6;">"${details.message}"</p>
        </div>
        <p style="color: #334155; margin-top: 24px;">Thanks &amp; Regards,</p>
        <p style="font-size: 11px; color: #64748b; margin-top: 4px; margin-bottom: 0;">Interactive Portfolio Express Server</p>
      </div>
    `
  };

  // 2. Thank You Email to the sender/collaborator
  const visitorMailOptions = {
    from: `"Leela Vinayak Kothakota" <${smtpUser}>`,
    to: details.email,
    subject: `[PORTFOLIO UPLINK] Connection Established - Thank you, ${details.name}!`,
    text: `Dear ${details.name},\n\nThank you for reaching out through my AI-guided interactive portfolio platform! I have received your message payload successfully.\n\nHere is your message: "${details.message}"\n\nI will review your message and respond directly to your address within 24 hours.\n\nThank You,\nLeela Vinayak Kothakota\nFull Stack Developer & AI/ML Undergraduate`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; background-color: #faf5ff;">
        <h2 style="color: #7c3aed; margin-top: 0; text-align: center;">Connection Established Successfully!</h2>
        <p style="color: #334155; font-size: 15px;">Dear <strong>${details.name}</strong>,</p>
        <p style="color: #334155; line-height: 1.6;">Thank you for visiting my AI-guided digital portfolio and submitting a message! Your communication packet has been securely registered into my MongoDB database ledger.</p>
        <div style="background-color: #ffffff; border-left: 4px solid #c084fc; padding: 16px; margin: 20px 0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <p style="margin: 0; font-size: 10px; font-family: monospace; color: #a21caf; text-transform: uppercase; font-weight: bold; letter-spacing: 0.1em; margin-bottom: 6px;">Your Transmission Payload</p>
          <p style="margin: 0; font-style: italic; color: #4b5563; font-size: 13.5px; line-height: 1.5;">"${details.message}"</p>
        </div>
        <p style="color: #334155; line-height: 1.6;">I review all technical collaboration plans, job offers, and project proposals personally. You can expect a direct response to your email address (<a href="mailto:${details.email}" style="color: #8b5cf6; text-decoration: none; font-weight: bold;">${details.email}</a>) shortly.</p>
        <hr style="border: 0; border-top: 1px solid #e8dff5; margin: 24px 0;" />
        <p style="margin: 0; color: #334155; font-size: 14px; margin-bottom: 12px; font-weight: 500;">Thank You,</p>
        <p style="margin: 0; color: #1e1b4b; font-weight: bold;">Leela Vinayak Kothakota</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280; font-family: monospace;">Full Stack MERN Developer &amp; AI Engineer</p>
      </div>
    `
  };

  await Promise.all([
    transporter.sendMail(ownerMailOptions),
    transporter.sendMail(visitorMailOptions)
  ]);

  return { success: true };
}

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function isPortAvailable(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort: number) {
  for (let port = startPort; port < startPort + 10; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found starting from ${startPort}`);
}

async function createViteMiddleware(app: express.Express) {
  const hmrBasePort = parsePort(process.env.VITE_WS_PORT, 24678);
  const hmrPort = await findAvailablePort(hmrBasePort);

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        host: "localhost",
        port: hmrPort,
        clientPort: hmrPort,
      },
    },
    appType: "spa",
  });

  app.use(vite.middlewares);

  if (hmrPort !== hmrBasePort) {
    console.log(`Vite HMR port ${hmrBasePort} was busy. Using ${hmrPort} instead.`);
  }
}

const app = express();
app.use(express.json());

  // Initialize Gemini AI Client lazily or check for API key
  let aiClient: GoogleGenAI | null = null;
  const getAiClient = () => {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      aiClient = new GoogleGenAI({
        apiKey: apiKey || "",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  };

  // API Route for conversation with Gemini
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "No message provided" });
      }

      // Check if GEMINI_API_KEY is configured
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({
          text: `Hi there! I would love to answer your question: "${message}". However, my Gemini AI brain needs an API Key to think. Please configure the GEMINI_API_KEY under the Settings > Secrets panel of your AI Studio environment to enable my fully conversational intelligence! Until then, I can still help you navigate Leela's profile sections.`
        });
      }

      // Initialize AI client
      const ai = getAiClient();

      const systemInstruction = `You are KLV, Leela Vinayak Kothakota's specialized virtual voice and chat assistant.
Leela is a talented Full Stack MERN Developer and AI/ML undergraduate with a CGPA of 8.9/10, who interned at Amdox Technologies from January to April 2026. He is an Artificial Intelligence and Machine Learning student.
His key portfolio projects are:
1. Weekly Aptitude Test System - dynamically auto-generates aptitude questions using Gemini AI API, includes anti-cheating browser tab-focus tracking and webcam proctoring.
2. Library Management System - JWT-secured double-portal digital ledger for student/admin book circulation registry.
3. Digital Logic Gates Simulator - created with pure HTML5 Canvas and Vanilla JavaScript for computer science students to drag, drop, and wire interactive logic gates (AND, OR, NOT, etc.).

Since you are his personal assistant, you should be extremely helpful, conversational, and energetic. Please note: you are capable of answering ANY general question, explaining concepts, writing scripts, solving math, or having any casual conversation the user wishes!
Keep your replies relative to the user's intent. If they ask a general topic not about Leela, answer it with high intelligence and detail. Ensure the reply remains concise enough (typically 1-3 crisp paragraphs) to fit nicely in a mobile chat bubble. Use Markdown for neat spacing.`;

      // Map conversation history to GoogleGenAI expected parts structure
      // Format: contents: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
      const chatContents: any[] = [];
      
      if (Array.isArray(history)) {
        // limit history items to keep payload lightweight and fast
        const recentHistory = history.slice(-12);
        recentHistory.forEach((msg: any) => {
          chatContents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        });
      }

      // Append the current message
      chatContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ text: response.text || "I apologize, but I couldn't formulate a response." });
    } catch (error: any) {
      console.error("Gemini AI API Error:", error);
      return res.status(500).json({ error: error.message || "Failed to generate response using Gemini" });
    }
  });

  // API Route: GET all reviews from MongoDB
  app.get("/api/reviews", async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.warn("[DATABASE] MongoDB is offline. Returning local reviews database fallback.");
        let filteredLocal = localReviews;
        if (localReviews.length > 1) {
          filteredLocal = localReviews.filter(rev => rev.id !== "default-1");
        }
        return res.json(filteredLocal);
      }
      let dbReviews: any[] = await Review.find().lean();
      if (dbReviews.length === 0) {
        // Seeding database with initial default review
        const initialSeed = {
          id: "default-1",
          name: "Srinivas Rao",
          rating: 5,
          comment: "Incredible full-stack knowledge! Leela designed a highly robust, optimized database adapter during his internship. A highly recommended developer.",
          timestamp: "May 20, 2026, 2:15 PM",
          createdBy: "system"
        };
        await Review.create(initialSeed);
        dbReviews = [initialSeed];
      }
      
      // If there are visitor-added reviews, remove the initial demo review
      if (dbReviews.length > 1) {
        dbReviews = dbReviews.filter(rev => rev.id !== "default-1");
      }
      
      return res.json(dbReviews);
    } catch (error: any) {
      console.error("[DATABASE] Error fetching reviews, falling back to local list:", error);
      let filteredLocal = localReviews;
      if (localReviews.length > 1) {
        filteredLocal = localReviews.filter(rev => rev.id !== "default-1");
      }
      return res.json(filteredLocal);
    }
  });

  // API Route: POST a new review to MongoDB
  app.post("/api/reviews", async (req, res) => {
    try {
      const { id, name, rating, comment, timestamp, createdBy } = req.body;
      if (!id || !name || !rating || !comment || !timestamp) {
        return res.status(400).json({ error: "Missing required review parameters." });
      }
      if (mongoose.connection.readyState !== 1) {
        const newReview = { id, name, rating, comment, timestamp, createdBy };
        localReviews.push(newReview);
        console.warn("[DATABASE] MongoDB is offline. Saved review locally in-memory.");
        return res.status(201).json(newReview);
      }
      const newReview = await Review.create({ id, name, rating, comment, timestamp, createdBy });
      return res.status(201).json(newReview);
    } catch (error: any) {
      console.error("[DATABASE] Error saving review, falling back to local array:", error);
      const { id, name, rating, comment, timestamp, createdBy } = req.body;
      const newReview = { id, name, rating, comment, timestamp, createdBy };
      localReviews.push(newReview);
      return res.status(201).json(newReview);
    }
  });

  // API Route: DELETE a review from MongoDB by custom ID
  app.delete("/api/reviews/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (mongoose.connection.readyState !== 1) {
        const index = localReviews.findIndex(r => r.id === id);
        if (index === -1) {
          return res.status(404).json({ error: "Review not found." });
        }
        localReviews.splice(index, 1);
        console.warn("[DATABASE] MongoDB is offline. Deleted review locally in-memory.");
        return res.json({ success: true, message: "Review deleted successfully (in-memory)." });
      }
      const result = await Review.findOneAndDelete({ id });
      if (!result) {
        return res.status(404).json({ error: "Review not found." });
      }
      return res.json({ success: true, message: "Review deleted successfully." });
    } catch (error: any) {
      console.error("[DATABASE] Error deleting review, falling back to local array deletion:", error);
      const { id } = req.params;
      const index = localReviews.findIndex(r => r.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Review not found." });
      }
      localReviews.splice(index, 1);
      return res.json({ success: true, message: "Review deleted successfully (in-memory)." });
    }
  });

  // API Route: POST contact details, save to MongoDB, trigger emails
  app.post("/api/contacts", async (req, res) => {
    try {
      const { name, email, message, timestamp } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required contact parameters." });
      }
      const formattedTimestamp = timestamp || new Date().toLocaleString();
      
      let savedContact;
      if (mongoose.connection.readyState !== 1) {
        savedContact = { name, email, message, timestamp: formattedTimestamp };
        localContacts.push(savedContact);
        console.warn("[DATABASE] MongoDB is offline. Logged contact transmission in-memory.");
      } else {
        // Save contact payload to MongoDB
        savedContact = await Contact.create({
          name,
          email,
          message,
          timestamp: formattedTimestamp
        });
      }

      // Send automated emails using Nodemailer
      let emailResult: any = { simulated: true };
      try {
        emailResult = await sendContactEmails({
          name,
          email,
          message,
          timestamp: formattedTimestamp
        });
      } catch (mailErr) {
        console.error("[MAIL SERVICE] Failed to execute email transmission:", mailErr);
      }

      return res.status(201).json({
        success: true,
        contact: savedContact,
        emailResult
      });
    } catch (error: any) {
      console.error("[DATABASE] Error saving contact request, falling back to local array:", error);
      const { name, email, message, timestamp } = req.body;
      const formattedTimestamp = timestamp || new Date().toLocaleString();
      const savedContact = { name, email, message, timestamp: formattedTimestamp };
      localContacts.push(savedContact);
      return res.status(201).json({
        success: true,
        contact: savedContact,
        emailResult: { simulated: true }
      });
    }
  });

  // For Vercel Serverless environment, we do not serve static files or listen
  // because Vercel serves the static files in 'dist' natively at the edge.
  if (!process.env.VERCEL) {
    const startLocalServer = async () => {
      const desiredPort = parsePort(process.env.PORT, 3000);
      const PORT = await findAvailablePort(desiredPort);
      
      if (process.env.NODE_ENV !== "production") {
        await createViteMiddleware(app);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    };
    startLocalServer();
  }

export default app;
