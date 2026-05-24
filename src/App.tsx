import { useState, useEffect, useRef, SVGProps, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Download,
  Mail,
  Linkedin,
  Github,
  Calendar,
  Building2,
  Sparkles,
  Cpu,
  BookOpen,
  CheckCircle2,
  Send,
  ChevronDown,
  Briefcase,
  FileText,
  User,
  GraduationCap,
  Terminal,
  Star,
  Trash2
} from "lucide-react";

import Navbar from "./components/Navbar";
import ParticleBackground from "./components/ParticleBackground";
import SkillCluster from "./components/SkillCluster";
import ProjectShowcase from "./components/ProjectShowcase";
import TalkingAvatar from "./components/TalkingAvatar";
import { ROTATING_ROLES, EXPERIENCE, EDUCATION } from "./data";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  timestamp: string;
  createdBy?: string;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: "default-1",
    name: "Srinivas Rao",
    rating: 5,
    comment: "Incredible full-stack knowledge! Leela designed a highly robust, optimized database adapter during his internship. A highly recommended developer.",
    timestamp: "May 20, 2026, 2:15 PM",
    createdBy: "system"
  }
];

export default function App() {
  const [isLightMode, setIsLightMode] = useState(true);
  const [activeSection, setActiveSection] = useState("hero");
  const [roleIndex, setRoleIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Visitor Gateway and Voice triggers
  const [visitorName, setVisitorName] = useState("Guest Explorer");
  const [hasEntered, setHasEntered] = useState(true);
  const [autoStartSpeech, setAutoStartSpeech] = useState(true);
  const [inputName, setInputName] = useState("");
  const [savedVisitorName, setSavedVisitorName] = useState<string | null>(null);

  // Load returning user name from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("leela_portfolio_visitor_name");
      if (saved && saved !== "Guest Explorer") {
        setSavedVisitorName(saved);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Resume Simulation state
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

  // Contact States
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [savedMessages, setSavedMessages] = useState<any[]>([]);

  // Reviews & Feedback States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReviewIds, setMyReviewIds] = useState<string[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFormSubmitting, setReviewFormSubmitting] = useState(false);
  const [reviewFormSuccess, setReviewFormSuccess] = useState(false);

  // Speech and simulated transactional email notifications
  const [speechTrigger, setSpeechTrigger] = useState<{ text: string; id: number } | null>(null);
  const [simulatedEmail, setSimulatedEmail] = useState<{
    to: string;
    sender: string;
    subject: string;
    body: string;
    timestamp: string;
    id: number;
  } | null>(null);

  // Rotate roles every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROTATING_ROLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Sync visitorName to reviewName form input
  useEffect(() => {
    if (visitorName && visitorName !== "Guest Explorer") {
      setReviewName(visitorName);
    }
  }, [visitorName]);

  // Monitor Scroll Activities
  useEffect(() => {
    const handleScroll = () => {
      // Calculate Scroll Progress
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }

      // Intersection Observer Simulation
      const sections = ["hero", "about", "skills", "experience", "projects", "education", "reviews", "contact"];
      const currentScroll = window.scrollY + window.innerHeight / 3;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (currentScroll >= top && currentScroll < top + height) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Load local messages at startup
    try {
      const saved = localStorage.getItem("leela_portfolio_messages");
      if (saved) setSavedMessages(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }

    // Load user created review IDs at startup
    try {
      const savedIds = localStorage.getItem("leela_portfolio_my_review_ids");
      if (savedIds) setMyReviewIds(JSON.parse(savedIds));
    } catch (e) {
      console.error(e);
    }

    // Load reviews from MongoDB via API
    fetch("/api/reviews")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews(INITIAL_REVIEWS);
        }
      })
      .catch(err => {
        console.warn("API error loading reviews, falling back to local storage:", err);
        try {
          const savedRes = localStorage.getItem("leela_portfolio_reviews");
          if (savedRes) {
            setReviews(JSON.parse(savedRes));
          } else {
            setReviews(INITIAL_REVIEWS);
          }
        } catch (e) {
          setReviews(INITIAL_REVIEWS);
        }
      });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleThemeToggle = () => {
    setIsLightMode(true);
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formMessage) return;

    setIsSubmitting(true);
    const clientName = formName;
    const clientEmail = formEmail;
    const clientMessage = formMessage;
    const currentTimestamp = new Date().toLocaleString();

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          message: clientMessage,
          timestamp: currentTimestamp
        })
      });

      if (!response.ok) {
        throw new Error("Contact API response error");
      }

      const newMessage = {
        name: clientName,
        email: clientEmail,
        message: clientMessage,
        timestamp: currentTimestamp
      };
      
      const updated = [newMessage, ...savedMessages];
      setSavedMessages(updated);
      try {
        localStorage.setItem("leela_portfolio_messages", JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset form variables
      setFormName("");
      setFormEmail("");
      setFormMessage("");

      // Voice Trigger: Say thank you
      const speechMsg = `Message transmitted successfully! Thank you so much for getting in touch, ${clientName}. I have received your message payload, and I will read it carefully and reply via email to ${clientEmail} as soon as possible. Let's create something outstanding together!`;
      setSpeechTrigger({
        text: speechMsg,
        id: Date.now()
      });

      // Smooth scroll back to hero section so user can see and hear the voice assistant say thanks
      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });

      // Set simulated email popup
      setSimulatedEmail({
        to: clientEmail,
        sender: "Leela Vinayak <leelavinayakkothakota@gmail.com>",
        subject: `[PORTFOLIO UPLINK] Connection Established - Thank you, ${clientName}!`,
        body: `Dear ${clientName},\n\nThank you for reaching out through my AI-guided interactive portfolio platform. Your transmission packet was encrypted and logged successfully into my MongoDB database!\n\nHere are your transmission parameters:\n- Date: ${new Date().toLocaleDateString()}\n- Subject Node: MERN & AI Engineering Collaborations\n- Message Draft: "${clientMessage}"\n\nI will review your specifications and formulate a tailored response to correspond with you shortly over email.\n\nThank You,\nLeela Vinayak\nFull Stack Developer & AI Engineer\nHyderabad, TS`,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now()
      });

    } catch (err) {
      console.warn("Contact API transmission failed. Falling back to local storage simulation:", err);
      // Fallback
      const newMessage = {
        name: clientName,
        email: clientEmail,
        message: clientMessage,
        timestamp: currentTimestamp
      };
      
      const updated = [newMessage, ...savedMessages];
      setSavedMessages(updated);
      try {
        localStorage.setItem("leela_portfolio_messages", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      setFormName("");
      setFormEmail("");
      setFormMessage("");

      const speechMsg = `Message transmitted successfully! Thank you so much for getting in touch, ${clientName}. I have received your message payload, and I will read it carefully and reply via email to ${clientEmail} as soon as possible. Let's create something outstanding together!`;
      setSpeechTrigger({
        text: speechMsg,
        id: Date.now()
      });

      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });

      setSimulatedEmail({
        to: clientEmail,
        sender: "Leela Vinayak <leelavinayak@MERNlabs.io>",
        subject: `[PORTFOLIO GATEWAY] Connection Established - Thank you, ${clientName}!`,
        body: `Dear ${clientName},\n\nThank you for reaching out through my AI-guided interactive portfolio platform. Your transmission packet was encrypted and logged successfully into my local buffer.\n\nHere are your transmission parameters:\n- Date: ${new Date().toLocaleDateString()}\n- Subject Node: MERN & AI Engineering Collaborations\n- Message Draft: "${clientMessage}"\n\nI will review your specifications and formulate a tailored technical proposal to correspond with you shortly over email.\n\nThank You,\nLeela Vinayak\nFull Stack Developer & AI Engineer\nHyderabad, TS`,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now()
      });
    } finally {
      setTimeout(() => setSubmitSuccess(false), 4500);
    }
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    const guestName = reviewName.trim() || "Anonymous Explorer";
    if (!reviewComment.trim()) return;

    setReviewFormSubmitting(true);
    const reviewScore = reviewRating;
    const reviewText = reviewComment;

    setTimeout(async () => {
      const reviewId = Math.random().toString(36).substring(7);
      const newReview: Review = {
        id: reviewId,
        name: guestName,
        rating: reviewScore,
        comment: reviewText,
        timestamp: new Date().toLocaleString(),
        createdBy: visitorName
      };

      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReview)
        });

        if (!response.ok) {
          throw new Error("Review post API response error");
        }

        const savedReview = await response.json();
        const updated = [savedReview, ...reviews];
        setReviews(updated);
        localStorage.setItem("leela_portfolio_reviews", JSON.stringify(updated));
      } catch (err) {
        console.warn("MongoDB review save failed, falling back to local memory storage:", err);
        const updated = [newReview, ...reviews];
        setReviews(updated);
        localStorage.setItem("leela_portfolio_reviews", JSON.stringify(updated));
      }
      
      const newMyIds = [reviewId, ...myReviewIds];
      setMyReviewIds(newMyIds);
      localStorage.setItem("leela_portfolio_my_review_ids", JSON.stringify(newMyIds));

      setReviewFormSubmitting(false);
      setReviewFormSuccess(true);

      // Reset form fields but keep visitorName in the name field
      setReviewName(visitorName !== "Guest Explorer" ? visitorName : "");
      setReviewComment("");
      setReviewRating(5);

      // Voice Thanks Trigger
      const speechMsg = `Thank you so much for reviewing my portfolio, ${guestName}! Your feedback and rating of ${reviewScore} stars means an incredible amount to me. I have dispatched a virtual evaluation receipt to your simulation console!`;
      setSpeechTrigger({
        text: speechMsg,
        id: Date.now()
      });

      // Smooth scroll back to hero section so user can see and hear the voice assistant say thanks
      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });

      // Clear layout success indicator
      setTimeout(() => setReviewFormSuccess(false), 4500);
    }, 1200);
  };

  const handleDeleteReview = async (idToDelete: string) => {
    const updatedReviews = reviews.filter(r => r.id !== idToDelete);
    setReviews(updatedReviews);
    
    const updatedMyIds = myReviewIds.filter(id => id !== idToDelete);
    setMyReviewIds(updatedMyIds);
    
    try {
      await fetch(`/api/reviews/${idToDelete}`, {
        method: "DELETE"
      });

      localStorage.setItem("leela_portfolio_reviews", JSON.stringify(updatedReviews));
      localStorage.setItem("leela_portfolio_my_review_ids", JSON.stringify(updatedMyIds));
    } catch (e) {
      console.error("Failed to delete review from MongoDB:", e);
      localStorage.setItem("leela_portfolio_reviews", JSON.stringify(updatedReviews));
      localStorage.setItem("leela_portfolio_my_review_ids", JSON.stringify(updatedMyIds));
    }

    // Voice deletion feedback
    if (typeof (window as any).speakKlvText === "function") {
      (window as any).speakKlvText("Your review has been successfully removed from my system.");
    }
  };

  const clearLoggedMessages = () => {
    setSavedMessages([]);
    localStorage.removeItem("leela_portfolio_messages");
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative select-none ${
      isLightMode 
        ? "bg-slate-50 text-slate-950 grid-bg-light" 
        : "bg-slate-950 text-white grid-bg-dark"
    }`}>
      {/* Absolute Portal/Identity Lock Overlay */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none"
          >
            {/* Futuristic Grid / Particle BG */}
            <div className="absolute inset-0 bg-slate-950 grid-bg-dark opacity-60 z-0" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />

            {/* Content Box */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative max-w-md w-full bg-slate-900/40 border border-purple-500/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl z-10 text-center flex flex-col items-center gap-6"
            >
              {/* Futuristic Terminal Icon badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Terminal className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Leela Vinayak
                </h1>
                <p className="text-xs font-mono tracking-widest text-purple-400 font-semibold uppercase">
                  AI Engineer & Full-Stack Developer
                </p>
              </div>

              {savedVisitorName ? (
                /* RETURNING USER INTERACTIVE WELCOME GATEWAY */
                <div className="w-full flex flex-col items-center gap-5 mt-1">
                  <div className="space-y-1 text-center">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold px-3 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full">
                      ⚡ RETURNING NODE KEY FOUND
                    </span>
                    <p className="text-lg font-sans text-slate-200 font-bold mt-4">
                      Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 tracking-wide">{savedVisitorName}</span>!
                    </p>
                    <p className="text-[11px] text-slate-550 leading-relaxed max-w-[280px] mx-auto mt-2">
                      Ready to re-establish secure communications? Tap the button below to resume the voice-guided interface.
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    <button
                      id="btn-gate-enter"
                      onClick={() => {
                        const finalName = savedVisitorName;
                        setVisitorName(finalName);
                        setHasEntered(true);
                        setAutoStartSpeech(true);
                        
                        // Force unblock Chrome & Safari SpeechSynthesis sandbox rules via synchronous user interaction token
                        if ("speechSynthesis" in window) {
                          try {
                            window.speechSynthesis.cancel();
                            const dummyUtter = new SpeechSynthesisUtterance("");
                            window.speechSynthesis.speak(dummyUtter);
                          } catch (e) {}
                        }

                        if (typeof (window as any).speakKlvText === "function") {
                          // Warm, premium personalized welcome spoken introduction about Leela Vinayak and self assistant KLV
                          const personalizedWelcome = `Welcome back, ${finalName}! It is a privilege to have you return to Leela Vinayak Kothakota's digital workspace. I am KLV, your specialized virtual self-assistant. Let me share some information about Leela, which you can read in the Biography core section. Leela is a passionate Full Stack MERN Developer and an Artificial Intelligence & Machine Learning student with extensive experience building scalable web applications, secure REST APIs, and interactive user interfaces. His academic discipline allows him to view software engineering through a predictive lens, writing application layers structured as scalable pipelines designed to gracefully process smart predictions and live analytical feeds. Feel free to explore, or speak to me directly by clicking the floating microphone below!`;
                          (window as any).speakKlvText(personalizedWelcome);
                        }
                      }}
                      className="w-full py-4 rounded-xl font-display font-medium text-xs tracking-widest uppercase bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/15 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      Resume Secure Connection <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        try {
                          localStorage.removeItem("leela_portfolio_visitor_name");
                        } catch (e) {}
                        setSavedVisitorName(null);
                        setInputName("");
                      }}
                      className="text-[10px] font-mono text-slate-500 hover:text-pink-400 tracking-wider transition-colors cursor-pointer block mx-auto uppercase"
                    >
                      [ SWITCH USER / ENTER NEW IDENTITY ]
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD VISITOR NAME INPUT FORM */
                <>
                  <div className="w-full text-center space-y-1">
                    <p className="text-sm font-sans text-slate-300 font-medium">
                      Initialize Secure Connection
                    </p>
                    <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                      Please enter your name to authenticate and decrypt the digital portfolio feed.
                    </p>
                  </div>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const finalName = inputName.trim() || "Guest Explorer";
                      setVisitorName(finalName);
                      setHasEntered(true);
                      setAutoStartSpeech(true);
                      try {
                        localStorage.setItem("leela_portfolio_visitor_name", finalName);
                      } catch (err) {}
                      
                      // Force unblock Chrome & Safari SpeechSynthesis sandbox rules via synchronous user interaction token
                      if ("speechSynthesis" in window) {
                        try {
                          window.speechSynthesis.cancel();
                          const dummyUtter = new SpeechSynthesisUtterance("");
                          window.speechSynthesis.speak(dummyUtter);
                        } catch (e) {}
                      }

                      // Direct synchronous voice trigger on real click/submit event to bypass browser security locks!
                      if (typeof (window as any).speakKlvText === "function") {
                        const greeting = `Hello, ${finalName}! I am KLV, your specialized virtual self-assistant. Welcome to Leela Vinayak Kothakota's digital portfolio! Leela is a passionate Full Stack MERN Developer and an Artificial Intelligence & Machine Learning student with extensive experience building scalable web applications, secure REST APIs, and interactive user interfaces. His academic discipline allows him to view software engineering through a predictive lens, structured as scalable predictive pipelines rather than just static state containers. I have conversational voice capability to talk, listen, and guide you through Leela's work. If you have any questions, simply click the floating microphone below to speak with me or type in our chat frame. Let's begin the tour!`;
                        (window as any).speakKlvText(greeting);
                      }
                    }} 
                    className="w-full space-y-4"
                  >
                    <div className="relative">
                      <input
                        id="visitor-name-input"
                        type="text"
                        autoFocus
                        placeholder="YOUR IDENTITY / NAME"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        maxLength={30}
                        className="w-full px-5 py-4 pl-12 bg-slate-950/80 border border-purple-500/30 rounded-2xl text-center text-sm tracking-widest font-mono text-purple-300 placeholder-slate-650 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all uppercase"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-purple-400/65" />
                    </div>

                    <button
                      id="btn-gate-enter"
                      type="submit"
                      className="w-full py-4 rounded-xl font-display font-medium text-xs tracking-widest uppercase bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 hover:from-purple-500 hover:via-pink-400 hover:to-cyan-400 text-white shadow-xl shadow-purple-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      Establish Connection <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Quick guest bypass */}
                  <button
                    id="btn-gate-bypass"
                    onClick={() => {
                      const finalName = "Guest Explorer";
                      setVisitorName(finalName);
                      setHasEntered(true);
                      setAutoStartSpeech(true);
                      try {
                        localStorage.setItem("leela_portfolio_visitor_name", finalName);
                      } catch (err) {}

                      // Force unblock Chrome & Safari SpeechSynthesis sandbox rules via synchronous user interaction token
                      if ("speechSynthesis" in window) {
                        try {
                          window.speechSynthesis.cancel();
                          const dummyUtter = new SpeechSynthesisUtterance("");
                          window.speechSynthesis.speak(dummyUtter);
                        } catch (e) {}
                      }

                      // Direct synchronous voice trigger on real click/submit event to bypass browser security locks!
                      if (typeof (window as any).speakKlvText === "function") {
                        const greeting = `Hello, Guest Explorer! I am KLV, your specialized virtual self-assistant. Welcome to Leela Vinayak Kothakota's digital portfolio! Leela is a passionate Full Stack MERN Developer and an Artificial Intelligence & Machine Learning student with extensive experience building scalable web applications, secure REST APIs, and interactive user interfaces. His academic discipline allows him to view software engineering through a predictive lens, structured as scalable predictive pipelines rather than just static state containers. I have conversational voice capability to talk, listen, and guide you through Leela's work. If you have any questions, simply click the floating microphone below to speak with me or type in our chat frame. Let's begin the tour!`;
                        (window as any).speakKlvText(greeting);
                      }
                    }}
                    className="text-xs font-mono text-slate-500 hover:text-purple-400 tracking-wide transition-colors cursor-pointer"
                  >
                    Access as Anonymous Guest_
                  </button>
                </>
              )}
            </motion.div>

            {/* Technical branding indicator at absolute bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-mono text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PORTAL_STABLE // READY TO DECRYPT</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Canvas particles background */}
      <ParticleBackground isLightMode={isLightMode} />

      {/* Navbar Container */}
      <Navbar 
        isLightMode={isLightMode} 
        onThemeToggle={handleThemeToggle} 
        activeSection={activeSection} 
      />

      {/* 
        ========================================================================
        HERO SECTION
        ========================================================================
      */}
      <section 
        id="hero" 
        className="relative min-h-screen flex items-center justify-center pt-28 pb-12 px-6 md:px-12 z-10"
      >
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center justify-center">
          
          {/* Left Column: Premium Interactive AI & Web Developer Artwork */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center w-full order-1 lg:order-1 relative group"
          >
            {/* Outer radial neon backdrop glow */}
            <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-purple-500/10 via-pink-500/15 to-cyan-400/10 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000" />
            
            <div className="relative max-w-[440px] w-full rounded-[32px] border border-purple-500/25 bg-slate-950/80 p-3 shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="relative rounded-[24px] overflow-hidden aspect-square sm:aspect-[4/3] w-full">
                <img
                  src="/leelavinayak.png"
                  alt="Leela Vinayak Kothakota - Full Stack & AI Engineer Profile"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Column: Audio Transcript & Bio Details */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-2">
            {/* Sparkly Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wide flex items-center gap-2 mb-6 border ${
                isLightMode 
                  ? "bg-purple-100/65 border-purple-200 text-purple-700" 
                  : "bg-purple-950/20 border-purple-500/20 text-purple-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              Seeking Summer 2026 AI & Full-Stack Opportunities
            </motion.div>

            {/* Core Human Name / Dynamic Greeting */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`font-display text-4xl md:text-5xl font-extrabold tracking-tight ${
                isLightMode ? "text-slate-900" : "text-white"
              }`}
            >
              Hello, <span className="bg-gradient-to-r from-purple-500 via-pink-400 to-cyan-400 bg-clip-text text-transparent">{visitorName}!</span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`font-display text-3xl md:text-5xl font-extrabold tracking-tight mt-2 ${
                isLightMode ? "text-slate-800" : "text-slate-100"
              }`}
            >
              I am Leela Vinayak Kothakota
            </motion.h2>

            {/* Typing / Card role carousel slider */}
            <div className="h-12 flex items-center mt-3 mb-6">
              <span className="text-lg md:text-2xl font-display font-medium text-slate-400 mr-2">
                Creative
              </span>
              <div className="relative overflow-hidden h-10 flex items-center text-left">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={roleIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="absolute left-0 text-lg md:text-2xl font-display font-black bg-gradient-to-r from-purple-500 via-pink-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap"
                  >
                    {ROTATING_ROLES[roleIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Subtitle intro description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`text-sm md:text-base leading-relaxed mb-8 max-w-xl ${
                isLightMode ? "text-slate-650" : "text-slate-400"
              }`}
            >
              I am a Full Stack MERN Developer and AI & ML student. I engineer robust web solutions in the MERN ecosystem while training neural weights to interpret and forecast complex data models. Passionate code developer with a keen visual layout discipline.
            </motion.p>

            {/* Hero Buttons Block */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center lg:justify-start"
            >
              <a
                id="btn-projects"
                href="#projects"
                className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-display text-sm font-bold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLightMode 
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200" 
                    : "bg-white hover:bg-zinc-100 text-slate-950 shadow-slate-950/50"
                }`}
              >
                View Projects <ArrowRight className="w-4 h-4" />
              </a>

              <a
                id="btn-resume"
                href="/leelavinayak_resume.pdf"
                download="leelavinayak_resume.pdf"
                className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-display text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 border ${
                  isLightMode
                    ? "bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100"
                    : "bg-slate-950/40 border-purple-500/25 text-purple-300 hover:border-purple-400/50 hover:bg-slate-900/35"
                }`}
              >
                <Download className="w-4 h-4" /> Download Resume
              </a>

              <a
                id="btn-contact"
                href="#contact"
                className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-display text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                  isLightMode
                    ? "text-purple-600 hover:bg-stone-100/50"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Contact Me
              </a>
            </motion.div>
          </div>

          {/* Bottom Down pointing chevron icon spanned full grid widths */}
          <div className="col-span-1 lg:col-span-12 flex justify-center mt-4">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="block"
            >
              <a href="#about" title="Scroll Down To Biography">
                <ChevronDown className="w-6 h-6 text-slate-500 hover:text-purple-500 cursor-pointer transition-colors" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        ABOUT ME & IMAGES ATTACHMENT SECTION
        ========================================================================
      */}
      <section 
        id="about" 
        className={`py-24 px-6 md:px-12 relative z-10 border-t ${
          isLightMode ? "border-slate-200/50 bg-white/35" : "border-slate-900/40 bg-slate-950/10"
        }`}
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Custom Section Header */}
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              SYSTEM IDENTIFICATION
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Biography Core <span className="text-purple-500">&amp;</span> Aesthetics
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Bio Card layout */}
            <div className="md:col-span-12 lg:col-span-12">
              <div className={`p-8 md:p-10 rounded-3xl border transition-all ${
                isLightMode
                  ? "bg-white border-slate-200/60 shadow-sm"
                  : "glass glow-purple"
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-950/45 rounded-lg border border-purple-500/20 text-purple-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xl font-display font-bold ${isLightMode ? "text-slate-800" : "text-white"}`}>
                      Behind The Terminal
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">ID // LEELA_VINAYAK.sh</p>
                  </div>
                </div>

                {/* The required professional summary */}
                <p className={`text-base md:text-lg leading-relaxed mb-6 font-sans ${
                  isLightMode ? "text-slate-700 font-light" : "text-slate-200 font-light"
                }`}>
                  I am a passionate Full Stack MERN Developer and Artificial Intelligence &amp; Machine Learning student with experience in building scalable web applications, REST APIs, and interactive user interfaces. I enjoy solving real-world problems through technology and continuously improving my development skills.
                </p>

                <p className={`text-sm leading-relaxed ${
                  isLightMode ? "text-slate-500" : "text-slate-400"
                }`}>
                  My educational discipline allows me to view software engineering through a predictive lens—writing application layers that aren’t just static state engines, but scalable pipelines structured to capture smart predictions and analytical feeds easily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SKILLS DISCIPLINE
        ========================================================================
      */}
      <section id="skills" className="py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              TECHNICAL COMPETENCIES
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Skills <span className="text-purple-500">&amp;</span> Infrastructure
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* Skills bar grids */}
          <SkillCluster isLightMode={isLightMode} />
        </div>
      </section>

      {/* 

EXPERIENCE - INTERNSHIP TIMELINE
        ========================================================================
      */}
      <section 
        id="experience" 
        className={`py-24 px-6 md:px-12 relative z-10 border-t border-b ${
          isLightMode ? "border-slate-200/55 bg-white/30" : "border-slate-900/40 bg-slate-950/10"
        }`}
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              PROFESSIONAL HISTORY
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Experience Timeline
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* Timeline Single Node - Amdox Technologies integration */}
          <div className="relative pl-8 md:pl-12 border-l-2 border-purple-500/25 ml-4 sm:ml-6 pb-2">
            {/* Circular Timeline Node bead with briefing icon */}
            <div className="absolute -left-[17px] top-0.5 rounded-full bg-slate-950 p-1.5 border-2 border-purple-500 hover:scale-110 hover:border-cyan-400 transition text-purple-400">
              <Briefcase className="w-4 h-4 fill-slate-950" />
            </div>

            {/* Exp Timeline Item */}
            {EXPERIENCE.map((exp) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`p-6 md:p-8 rounded-3xl border transition-all ${
                  isLightMode
                    ? "bg-white border-slate-200/60 shadow-sm hover:shadow-md"
                    : "glass glow-blue hover:border-purple-500/20"
                }`}
              >
                {/* Headers */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-500/10">
                  <div>
                    <span className="text-purple-400 font-mono text-[10px] tracking-wide uppercase block">
                      ACTIVE INDUSTRIAL LEAGUE
                    </span>
                    <h3 className={`text-2xl font-display font-extrabold ${
                      isLightMode ? "text-slate-900" : "text-white"
                    }`}>
                      {exp.company}
                    </h3>
                    <p className="text-purple-400 text-sm font-semibold mt-0.5 font-display flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full inline-block animate-ping" />
                      {exp.role}
                    </p>
                  </div>

                  <div className={`shrink-0 font-mono text-xs rounded-xl px-4 py-2 self-start md:self-center flex items-center gap-1.5 border ${
                    isLightMode
                      ? "bg-purple-50 border-purple-100 text-purple-700 font-semibold"
                      : "bg-slate-900 border-slate-800 text-purple-300"
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    {exp.duration}
                  </div>
                </div>

                {/* Bullet Points */}
                <h4 className={`text-xs font-mono tracking-widest uppercase mb-4 ${
                  isLightMode ? "text-slate-500" : "text-slate-400"
                }`}>
                  Core Responsibilities &amp; Code Impact
                </h4>
                
                <ul className="space-y-3.5">
                  {exp.responsibilities.map((resp, idx) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      viewport={{ once: true }}
                      key={idx} 
                      className="flex items-start gap-3.5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                      <span className={`text-sm leading-relaxed ${
                        isLightMode ? "text-slate-600" : "text-slate-200"
                      }`}>
                        {resp}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        PROJECTS SECTION
        ========================================================================
      */}
      <section id="projects" className="py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              PORTFOLIO SHOWCASE
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Selected Web Engineering Projects
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          <ProjectShowcase isLightMode={isLightMode} />
        </div>
      </section>

      {/* 
        ========================================================================
        EDUCATION HISTORY
        ========================================================================
      */}
      <section 
        id="education" 
        className={`py-24 px-6 md:px-12 relative z-10 border-t ${
          isLightMode ? "border-slate-200/50 bg-white/20" : "border-slate-900/40 bg-slate-950/10"
        }`}
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              SCHOLASTIC FILE
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Education Chronicle
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          {/* Education timeline cards column */}
          <div className="relative pl-8 md:pl-12 border-l border-slate-700/50 ml-4 sm:ml-6 space-y-12">
            {EDUCATION.map((edu, idx) => (
              <motion.div
                key={edu.degree}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Chronology bead connector */}
                <div className="absolute -left-[45px] md:-left-[61px] top-1.5 rounded-full bg-slate-950 p-2 border border-slate-700 flex items-center justify-center text-purple-400">
                  <GraduationCap className="w-4 h-4 fill-slate-950" />
                </div>

                <div className={`p-6 md:p-8 rounded-2xl border transition ${
                  isLightMode
                    ? "bg-white border-slate-200/60 shadow-sm"
                    : "glass hover:border-purple-500/20"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 pb-3 border-b border-purple-500/10">
                    <div>
                      <h4 className={`text-lg font-display font-bold ${isLightMode ? "text-slate-900" : "text-white"}`}>
                        {edu.degree}
                      </h4>
                      <p className="text-purple-400 text-xs font-mono font-semibold mt-0.5">{edu.institution}</p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end font-mono text-xs shrink-0">
                      <span className="text-slate-500">{edu.duration}</span>
                      {edu.grade && (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded mt-1.5">
                          {edu.grade}
                        </span>
                      )}
                    </div>
                  </div>

                  {edu.description && (
                    <p className={`text-xs md:text-sm leading-relaxed ${
                      isLightMode ? "text-slate-600" : "text-slate-300"
                    }`}>
                      {edu.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        REVIEWS & TESTIMONIALS SECTION
        ========================================================================
      */}
      <section 
        id="reviews" 
        className={`py-24 px-6 md:px-12 relative z-10 border-t ${
          isLightMode ? "border-slate-200/50 bg-white/10" : "border-slate-900/40 bg-slate-950/20"
        }`}
      >
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              VALUED EVALUATIONS
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Feedbacks &amp; Matrix Reviews
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
            <p className="text-xs font-mono text-slate-500 mt-3 uppercase tracking-wider">
              Displaying the top 10 verified ratings from developers and collaborators
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Form to submit a new review */}
            <div className="lg:col-span-5">
              <div className={`p-8 rounded-3xl border transition ${
                isLightMode ? "bg-white border-slate-200 shadow-lg shadow-slate-100" : "glass glow-purple"
              }`}>
                <h3 className={`text-xl font-display font-bold mb-2 flex items-center gap-2 ${
                  isLightMode ? "text-slate-900" : "text-white"
                }`}>
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Lodge Review
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 mb-6">
                  Add your rating and commentary parameters to help refine our engineering nodes. An attractive thanks email will be simulated to your address automatically!
                </p>

                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-xs font-mono font-semibold uppercase tracking-wider mb-2 ${
                      isLightMode ? "text-slate-600" : "text-slate-400"
                    }`}>
                      Collaborator / Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Liam Patel"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      className={`w-full font-display text-sm px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition ${
                        isLightMode
                          ? "bg-slate-50 border-slate-200 focus:ring-purple-600 focus:border-transparent text-slate-900"
                          : "bg-slate-900/40 border-slate-800 focus:ring-purple-500 focus:border-transparent text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-mono font-semibold uppercase tracking-wider mb-2 ${
                      isLightMode ? "text-slate-600" : "text-slate-400"
                    }`}>
                      Stars Rating Matrix
                    </label>
                    <div className="flex items-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setReviewRating(val)}
                          className={`p-1 hover:scale-115 transition duration-150 cursor-pointer`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              val <= reviewRating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600 hover:text-amber-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                        {reviewRating} / 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-mono font-semibold uppercase tracking-wider mb-2 ${
                      isLightMode ? "text-slate-600" : "text-slate-400"
                    }`}>
                      Evaluation Comments
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your collaboration feel, timeline quality, and code impact..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className={`w-full font-display text-sm px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition resize-none ${
                        isLightMode
                          ? "bg-slate-50 border-slate-200 focus:ring-purple-600 focus:border-transparent text-slate-900"
                          : "bg-slate-900/40 border-slate-800 focus:ring-purple-500 focus:border-transparent text-white"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewFormSubmitting}
                    className={`w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                      isLightMode
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:bg-purple-400"
                        : "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white disabled:opacity-50"
                    }`}
                  >
                    {reviewFormSubmitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCwIcon className="w-4.5 h-4.5 animate-spin" /> Logging Testimonial...
                      </span>
                    ) : reviewFormSuccess ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" /> Evaluation Logged !
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Evaluation Matrix
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Displays Top 10 reviews and ratings */}
            <div className="lg:col-span-7 space-y-6">
              {(() => {
                const filteredReviews = reviews.length > 1
                  ? reviews.filter(rev => rev.id !== "default-1")
                  : reviews;
                
                return (
                  <>
                    <div className="flex items-center justify-between font-mono">
                      <h3 className={`text-sm tracking-wider uppercase font-bold flex items-center gap-2 ${
                        isLightMode ? "text-slate-800" : "text-purple-300"
                      }`}>
                        Testimonial Backpiles ({filteredReviews.length})
                      </h3>
                      <span className="text-xs text-slate-500 uppercase tracking-widest text-right">
                        Refined ordered dates
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredReviews.slice(0, 10).map((rev, index) => {
                        const isMyReview = myReviewIds.includes(rev.id) || (rev.createdBy && rev.createdBy === visitorName && rev.createdBy !== "Guest Explorer");
                        return (
                          <motion.div
                            key={rev.id || index}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                            viewport={{ once: true }}
                            className={`p-5 rounded-2xl border transition hover:translate-x-1 ${
                              isLightMode
                                ? "bg-white border-slate-200/90 shadow-sm"
                                : "bg-slate-900/40 border-purple-500/10 hover:border-purple-500/25"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 border-b border-purple-500/5 pb-2">
                              <div className="flex items-start justify-between w-full sm:w-auto">
                                <div>
                                  <h4 className={`text-sm font-display font-extrabold ${
                                    isLightMode ? "text-slate-900" : "text-white"
                                  }`}>
                                    {rev.name}
                                  </h4>
                                  <span className="text-[10px] font-mono text-slate-500 block">
                                    Logged: {rev.timestamp}
                                  </span>
                                </div>

                                {isMyReview && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="sm:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center border border-transparent hover:border-red-500/25"
                                    title="Delete My Review"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-3 self-start sm:self-center">
                                {/* Display star group */}
                                <div className="flex items-center gap-0.5 bg-amber-500/50 border border-amber-500/10 px-2 py-1 rounded-lg">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3.5 h-3.5 ${
                                        star <= rev.rating
                                          ? "text-amber-400 fill-amber-400"
                                          : "text-slate-600"
                                      }`}
                                    />
                                  ))}
                                </div>

                                {isMyReview && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="hidden sm:flex p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition duration-200 cursor-pointer items-center justify-center border border-transparent hover:border-red-500/25 shadow-sm"
                                    title="Delete My Review"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className={`text-xs md:text-sm leading-relaxed font-sans ${
                              isLightMode ? "text-slate-600" : "text-slate-300"
                            }`}>
                              "{rev.comment}"
                            </p>
                          </motion.div>
                        );
                      })}

                      {filteredReviews.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-purple-500/20 rounded-2xl text-slate-500 text-xs font-mono">
                          NO VERIFIED FEEDBACK LOGS SECURED YET. BE THE FIRST!
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        CONTACT FORM & SIMULATED TRANSMISSION INBOX
        ========================================================================
      */}
      <section id="contact" className="py-24 px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-mono text-xs uppercase tracking-widest block mb-2">
              TRANSMISSION LINK
            </span>
            <h2 className={`text-4xl font-display font-extrabold tracking-tight ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              Let's Develop Together
            </h2>
            <div className="w-16 h-1 bg-purple-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Direct info parameters */}
            <div className="lg:col-span-5 space-y-6">
              <div className={`p-6 rounded-2xl border ${
                isLightMode ? "bg-white border-slate-200" : "glass"
              }`}>
                <h3 className={`text-lg font-display font-bold mb-4 flex items-center gap-2 ${
                  isLightMode ? "text-slate-900" : "text-white"
                }`}>
                  <Briefcase className="w-5 h-5 text-purple-400" /> Contact Specifications
                </h3>
                <p className="text-xs leading-relaxed text-slate-500 mb-6">
                  Ready to optimize product parameters, engineer API pipelines, or request an evaluation? Ping me via the secure transmission form or external networks.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Secure Inbox</span>
                      <a href="mailto:leelavinayakkothakota155@gmail.com" className={`text-sm hover:underline font-semibold ${
                        isLightMode ? "text-slate-800" : "text-white"
                      }`}>
                        leelavinayakkothkota155@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Linkedin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono font-semibold">LinkedIn Profile</span>
                      <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-sm text-purple-400 hover:underline font-semibold">
                        www.linkedin.com/in/leelavinayak
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-zinc-500/10 text-slate-400 border border-slate-800">
                      <Github className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Open-Source Core</span>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-purple-400 hover:underline font-semibold">
                        https://github.com/leelavinayak
                      </a>
                    </div>
                  </div>
                </div>
              </div>


            </div>

            {/* Right Column: Modern contact form */}
            <div className="lg:col-span-7">
              <form 
                id="contact-form"
                onSubmit={handleContactSubmit}
                className={`p-8 rounded-3xl border transition ${
                  isLightMode
                    ? "bg-white border-slate-200 shadow-lg shadow-slate-100"
                    : "glass glow-purple"
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
                      isLightMode ? "text-slate-700" : "text-slate-400"
                    }`}>
                      Full Name
                    </label>
                    <input
                      id="input-name"
                      type="text"
                      required
                      placeholder="e.g. Liam Smith"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={`w-full font-display text-sm px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition ${
                        isLightMode
                          ? "bg-stone-50 border-stone-200 focus:ring-purple-600 focus:border-transparent text-slate-900"
                          : "bg-slate-900/60 border-slate-800 focus:ring-purple-500 focus:border-transparent text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
                      isLightMode ? "text-slate-700" : "text-slate-400"
                    }`}>
                      Email Node URL
                    </label>
                    <input
                      id="input-email"
                      type="email"
                      required
                      placeholder="e.g. liam@google.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className={`w-full font-display text-sm px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition ${
                        isLightMode
                          ? "bg-stone-50 border-stone-200 focus:ring-purple-600 focus:border-transparent text-slate-900"
                          : "bg-slate-900/60 border-slate-800 focus:ring-purple-500 focus:border-transparent text-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className={`block text-xs font-mono font-bold uppercase tracking-wider mb-2 ${
                    isLightMode ? "text-slate-700" : "text-slate-400"
                  }`}>
                    Draft Message
                  </label>
                  <textarea
                    id="input-message"
                    required
                    rows={5}
                    placeholder="Describe your project, timeline requirements, and stack metrics..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className={`w-full font-display text-sm px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition resize-none ${
                      isLightMode
                        ? "bg-stone-50 border-stone-200 focus:ring-purple-600 focus:border-transparent text-slate-900"
                        : "bg-slate-900/60 border-slate-800 focus:ring-purple-500 focus:border-transparent text-white"
                    }`}
                  />
                </div>

                <button
                  id="btn-send-message"
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl font-display font-bold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                    isLightMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 disabled:bg-purple-400"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white disabled:opacity-50"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCwIcon className="w-5 h-5 animate-spin" /> Transmitting Message Node...
                    </span>
                  ) : submitSuccess ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Packet Received!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-semibold">
                      <Send className="w-4.5 h-4.5" /> Initialize Transmission
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        FOOTER CHASE
        ========================================================================
      */}
      <footer className={`py-12 px-6 md:px-12 border-t text-center relative z-10 ${
        isLightMode ? "bg-white border-slate-200/60 text-slate-500" : "bg-slate-950 border-slate-900/40 text-slate-400"
      }`}>
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-xs">
          <div>
            &copy; 2026 Leela Vinayak. All rights secured.
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
            <span>MERN Stack System Status: Active Gateway</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-purple-400">GitHub</a>
            <span>&bull;</span>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-purple-400">LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* 
        ========================================================================
        RESUME PREVIEW MODAL
        ========================================================================
      */}
      <AnimatePresence>
        {resumeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              id="resume-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResumeModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Resume paper content box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className={`relative w-full max-w-3xl rounded-3xl overflow-hidden p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto border bg-slate-950 text-white border-purple-500/20`}
            >
              <button
                id="btn-close-resume"
                className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => setResumeModalOpen(false)}
              >
                <XIcon className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>

              {/* Inner Resume Layout styling */}
              <div className="border border-slate-800 rounded-2xl p-6 md:p-8 bg-slate-900/35 relative overflow-hidden font-sans">
                {/* Decorative watermarked grid */}
                <div className="absolute inset-0 grid-bg-dark pointer-events-none opacity-20" />
                
                {/* Resume Header */}
                <div className="text-center border-b border-slate-800 pb-6 relative z-10">
                  <h3 className="text-3xl font-display font-extrabold text-white">Leela Vinayak</h3>
                  <p className="text-purple-400 font-mono text-xs tracking-wider uppercase mt-1">
                    Full Stack MERN Developer &bull; AI/ML Engineering Lead
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-mono">
                    Hyderabad, TS &bull; dmarri86@gmail.com &bull; github.com/LeelaVinayak
                  </p>
                </div>

                {/* Resume Body sections */}
                <div className="mt-6 space-y-6 relative z-10">
                  {/* Summary */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase border-l-2 border-cyan-400 pl-2 mb-2">
                      Professional Profile
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Passionate and goal-oriented Artificial Intelligence &amp; Machine Learning undergraduate specializing in MERN Stack architectures. Experience solving real-world challenges through reactive web dashboards, secured backend routing layers, and statistical data models.
                    </p>
                  </div>

                  {/* Skills Grid */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase border-l-2 border-cyan-400 pl-2 mb-3">
                      Skill Matrices &amp; Competencies
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-white text-[11px] block text-purple-300 mb-1 font-mono">Languages &amp; Racks</strong>
                        <p className="text-slate-400 text-[11px]">JavaScript, Typescript, SQL, Node.js, Express.js, MongoDB, React, Tailwind CSS</p>
                      </div>
                      <div>
                        <strong className="text-white text-[11px] block text-purple-300 mb-1 font-mono">Systems &amp; Integrations</strong>
                        <p className="text-slate-400 text-[11px]">REST API design, Web Validation engines, Authentication (JWT / OAuth), Git &amp; GitHub</p>
                      </div>
                    </div>
                  </div>

                  {/* Internship */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase border-l-2 border-cyan-400 pl-2 mb-3">
                      Internship Operations
                    </h4>
                    <div>
                      <div className="flex items-center justify-between font-display font-bold text-xs text-white">
                        <span>Full Stack Developer Intern</span>
                        <span className="font-mono text-purple-300 text-[11px]">Jan 2026 - Apr 2026</span>
                      </div>
                      <p className="text-xs font-semibold text-purple-400 font-mono">Amdox Technologies</p>
                      <ul className="text-[11px] text-slate-300 space-y-1 mt-2 list-disc pl-4 leading-relaxed">
                        <li>Built scalable full-stack MERN engines with verified reactive flows.</li>
                        <li>Designed complete API paths validating forms securely.</li>
                        <li>Optimized relational MySQL databases for search queries, shrinking latency logs by 30%.</li>
                      </ul>
                    </div>
                  </div>

                  {/* College Degree */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-cyan-400 tracking-widest uppercase border-l-2 border-cyan-400 pl-2 mb-2">
                      Academic Chronicles
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-white leading-tight">
                          <span>B.Tech in Artificial Intelligence &amp; Machine Learning</span>
                          <span className="font-mono text-purple-300 font-semibold text-[10px]">2024 - Present (Current)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">CGPA: 8.9 / 10</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-white leading-tight">
                          <span>Intermediate MPC (Mathematics, Physics, Chemistry)</span>
                          <span className="font-mono text-purple-300 font-semibold text-[10px]">2022 - 2024</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">Score: 96.5%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom control row */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  id="btn-print-simulation"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white hover:bg-slate-800"
                >
                  Simulation Logger Print
                </button>
                <button
                  id="btn-modal-close-action"
                  onClick={() => setResumeModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 font-display font-bold text-xs text-white"
                >
                  Release Screen Gate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 
        ========================================================================
        SIMULATED EMAIL NOTIFICATION DISPATCH (PREMIUM & OVERLAY)
        ========================================================================
      */}
      <AnimatePresence>
        {simulatedEmail && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-1 bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-500 rounded-2xl shadow-2xl overflow-hidden shadow-purple-500/20">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-slate-950 p-5 rounded-xl border border-slate-900 flex flex-col gap-4 font-sans text-white relative"
            >
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Email Dispatcher Node
                </span>
                <button
                  onClick={() => setSimulatedEmail(null)}
                  className="p-1 hover:bg-slate-900 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-white text-xs"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="font-mono text-[11px] text-slate-400 space-y-1">
                <div>From: <span className="text-purple-300 font-bold">{simulatedEmail.sender}</span></div>
                <div>To: <span className="text-cyan-300">{simulatedEmail.to}</span></div>
                <div>Subject: <span className="text-white font-semibold text-[11px]">{simulatedEmail.subject}</span></div>
                <div>Time: <span>{simulatedEmail.timestamp}</span></div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 max-h-[140px] overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-line custom-scrollbar">
                {simulatedEmail.body}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>SIM_MAIL_CLIENT // v1.1</span>
                <button
                  onClick={() => setSimulatedEmail(null)}
                  className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-display font-medium text-[10px] transition cursor-pointer"
                >
                  Dismiss Transmission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Floating Voice Chat Assistant with Wake Word Controls */}
      <TalkingAvatar 
        visitorName={visitorName} 
        isLightMode={isLightMode} 
        autoStartSpeech={autoStartSpeech} 
        triggerSpeechText={speechTrigger}
        hasEntered={hasEntered}
      />

    </div>
  );
}

// Inline Icons prevents standard module linking failures
function RefreshCwIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M16 3h5v5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 21H3v-5" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
