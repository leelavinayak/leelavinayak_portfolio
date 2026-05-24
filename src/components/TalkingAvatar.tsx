import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Terminal, 
  Mic, 
  MicOff, 
  Navigation, 
  Plus, 
  Compass, 
  Activity, 
  Radio, 
  Info,
  X,
  MessageSquare,
  Send,
  CornerDownRight,
  ArrowRight
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "klv";
  text: string;
  timestamp: string;
}

interface TalkingAvatarProps {
  visitorName: string;
  isLightMode: boolean;
  autoStartSpeech: boolean;
  triggerSpeechText?: { text: string; id: number } | null;
  hasEntered: boolean;
}

export default function TalkingAvatar({ visitorName, isLightMode, autoStartSpeech, triggerSpeechText, hasEntered }: TalkingAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [textInput, setTextInput] = useState("");
  const [micAuthorized, setMicAuthorized] = useState<boolean | null>(null);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);
  
  // Chat list session logs
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesRef = useRef<Message[]>(messages);

  // Live Soundwaves/Ripple Simulation scale when speaking/listening
  const [micPulseAmount, setMicPulseAmount] = useState(1);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("klv_voice_muted");
      return saved === "true";
    } catch {
      return false;
    }
  });

  // Keep localStorage unified
  useEffect(() => {
    try {
      localStorage.setItem("klv_voice_muted", String(isMuted));
    } catch {}
  }, [isMuted]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakQueueRef = useRef<string[]>([]);
  const currentQueueIndexRef = useRef<number>(0);
  const ignoreErrorsRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const introSpokenRef = useRef(
    typeof window !== "undefined" && (window as any).klvIntroSpoken === true
  );
  const brokenVoicesRef = useRef<Set<string>>(new Set());
  const voicesLoadedRef = useRef(false);
  const chromeKeepAliveRef = useRef<any>(null);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Clean reset of browser SpeechSynthesis queue on page load/first-mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }, []);

  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Real-time Audio Frequency Equalizer parameters
  const [frequencies, setFrequencies] = useState<number[]>(new Array(24).fill(3));
  const [maleVoicePitch, setMaleVoicePitch] = useState<number>(115);
  const [maleVoiceFormants, setMaleVoiceFormants] = useState<string>("F0: 115 Hz | F1: 530 Hz | F2: 1840 Hz");
  const peakHoldsRef = useRef<number[]>(new Array(24).fill(3));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const activeAnimationRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any active animation
    if (activeAnimationRef.current) {
      cancelAnimationFrame(activeAnimationRef.current);
      activeAnimationRef.current = null;
    }

    let audioContextInstance: AudioContext | null = null;
    let microphoneStreamInstance: MediaStream | null = null;
    let analyserInstance: AnalyserNode | null = null;

    const stopMicrophone = () => {
      if (microphoneStreamInstance) {
        try {
          microphoneStreamInstance.getTracks().forEach(track => track.stop());
        } catch (e) {}
        microphoneStreamInstance = null;
      }
      if (audioContextInstance && audioContextInstance.state !== "closed") {
        try {
          audioContextInstance.close();
        } catch (e) {}
        audioContextInstance = null;
      }
      analyserInstance = null;
    };

    const startMicrophoneAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStreamInstance = stream;
        microphoneStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          startListeningSimulation();
          return;
        }

        audioContextInstance = new AudioCtx();
        audioCtxRef.current = audioContextInstance;

        analyserInstance = audioContextInstance.createAnalyser();
        analyserInstance.fftSize = 64; // Gives 32 frequency bins
        analyserRef.current = analyserInstance;

        const source = audioContextInstance.createMediaStreamSource(stream);
        source.connect(analyserInstance);

        const bufferLength = analyserInstance.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawMicFreqs = () => {
          if (!analyserInstance) return;
          analyserInstance.getByteFrequencyData(dataArray);

          const newFreqs = [];
          for (let i = 0; i < 24; i++) {
            const distanceToCenter = Math.sin((i / 23) * Math.PI);
            const dataIndex = Math.min(
              bufferLength - 1,
              Math.floor((i / 23) * (bufferLength - 1))
            );
            const rawVal = dataArray[dataIndex];
            // Normalize level to a good height range (3px to 48px)
            const height = Math.max(3, Math.round((rawVal / 255) * 40 * distanceToCenter + 3));
            newFreqs.push(height);

            // Maintain peak holding
            if (height >= peakHoldsRef.current[i]) {
              peakHoldsRef.current[i] = height;
            } else {
              peakHoldsRef.current[i] = Math.max(3, peakHoldsRef.current[i] - 0.4);
            }
          }
          setFrequencies(newFreqs);
          activeAnimationRef.current = requestAnimationFrame(drawMicFreqs);
        };

        activeAnimationRef.current = requestAnimationFrame(drawMicFreqs);
      } catch (err) {
        console.warn("Could not establish real microphone analyzer context:", err);
        // Fall back to listening simulation
        startListeningSimulation();
      }
    };

    const startListeningSimulation = () => {
      let phase = 0;
      const drawListeningSim = () => {
        phase += 0.15;
        const newFreqs = [];
        for (let i = 0; i < 24; i++) {
          const distanceToCenter = Math.sin((i / 23) * Math.PI);
          const amplitude = Math.max(3, Math.round((Math.sin(phase + i * 0.45) * 8 + Math.random() * 5 + 8) * distanceToCenter));
          newFreqs.push(amplitude);

          // Maintain peak holding
          if (amplitude >= peakHoldsRef.current[i]) {
            peakHoldsRef.current[i] = amplitude;
          } else {
            peakHoldsRef.current[i] = Math.max(3, peakHoldsRef.current[i] - 0.4);
          }
        }
        setFrequencies(newFreqs);
        activeAnimationRef.current = requestAnimationFrame(drawListeningSim);
      };
      activeAnimationRef.current = requestAnimationFrame(drawListeningSim);
    };

    const startSpeakingSimulation = () => {
      let phase = 0;
      let vowelTimer = 0;
      let currentVowelIndex = 0;

      // Male voice vowel formant registers (Fundamental (F0): ~100-135 Hz)
      // Formants F1, F2, F3 define the distinct vowel qualities
      const maleVowelFormants = [
        { label: "vowel /ɑ/ (father)", formants: [730, 1090, 2440] },
        { label: "vowel /i/ (beet)", formants: [270, 2290, 3010] },
        { label: "vowel /u/ (boot)", formants: [300, 870, 2240] },
        { label: "vowel /æ/ (bat)", formants: [660, 1720, 2410] },
        { label: "vowel /ɛ/ (bet)", formants: [530, 1840, 2480] }
      ];

      const drawSpeakingSim = () => {
        phase += 0.16; // Speed of pitch modulation
        vowelTimer += 1;

        // Cycle vowels to mimic phonetic text reading sequence
        if (vowelTimer > 40) {
          vowelTimer = 0;
          currentVowelIndex = (currentVowelIndex + 1) % maleVowelFormants.length;
        }

        const currentVowel = maleVowelFormants[currentVowelIndex];
        const [targetF1, targetF2, targetF3] = currentVowel.formants;

        // Dynamic pitch contour typical of human conversation inflection (100 Hz to 135 Hz)
        const baseF0 = 112 + Math.sin(phase * 0.55) * 12 + Math.cos(phase * 0.22) * 6;

        const newFreqs = [];
        for (let i = 0; i < 24; i++) {
          const distanceToCenter = Math.sin((i / 23) * Math.PI);
          // Logarithmically map each of the 24 channels from 50Hz to 8000Hz
          // fc(i) = 50 * (8000 / 50) ^ (i / 23)
          const fc = 50 * Math.pow(160, i / 23);

          // F0 Glottal Fundamental frequency resonance envelope
          const f0Diff = Math.abs(fc - baseF0);
          const ampF0 = 22 * Math.exp(-(f0Diff * f0Diff) / (2.2 * baseF0 * baseF0));

          // First 5 vocal harmonics (2F0, 3F0, 4F0, etc.)
          let harmonicsAmp = 0;
          for (let h = 2; h <= 6; h++) {
            const hFreq = baseF0 * h;
            const hDiff = Math.abs(fc - hFreq);
            harmonicsAmp += (18 / h) * Math.exp(-(hDiff * hDiff) / (1.2 * hFreq * hFreq));
          }

          // Vocal tract formants filtering
          // F1: Vowel opening (low frequency body)
          const f1Diff = Math.abs(fc - targetF1);
          const ampF1 = 26 * Math.exp(-(f1Diff * f1Diff) / (0.35 * targetF1 * targetF1));

          // F2: Tongue posture (mid-frequency articulation)
          const f2Diff = Math.abs(fc - targetF2);
          const ampF2 = 20 * Math.exp(-(f2Diff * f2Diff) / (0.22 * targetF2 * targetF2));

          // F3: Voice quality and high format definition
          const f3Diff = Math.abs(fc - targetF3);
          const ampF3 = 15 * Math.exp(-(f3Diff * f3Diff) / (0.16 * targetF3 * targetF3));

          // Consonant burst sibilance (high-frequency fricative air hiss)
          const consonantPulse = Math.abs(Math.sin(phase * 2.2)) * 8;
          const sibilanceHiss = fc > 2500
            ? consonantPulse * Math.exp(-Math.pow(fc - 3800, 2) / (2 * 1200 * 1200))
            : 0;

          const shimmer = Math.random() * 3;

          // Conversational cadence syllable envelope gating
          const syllabicGate = Math.max(0.12, 0.45 + Math.sin(phase * 1.1) * 0.55);

          // Combined physical spectrum
          const rawVocalIntensity = (ampF0 + harmonicsAmp + ampF1 + ampF2 + ampF3 + sibilanceHiss + shimmer) * syllabicGate;
          const height = Math.min(48, Math.max(3, Math.round(rawVocalIntensity * (0.4 + 0.6 * distanceToCenter))));
          newFreqs.push(height);

          // Maintain peak holding
          if (height >= peakHoldsRef.current[i]) {
            peakHoldsRef.current[i] = height;
          } else {
            peakHoldsRef.current[i] = Math.max(3, peakHoldsRef.current[i] - 0.5);
          }
        }

        // Expose parameters to visual diagnostics
        setMaleVoicePitch(Math.round(baseF0));
        setMaleVoiceFormants(`F0 Pitch: ${Math.round(baseF0)}Hz | F1 Vowel: ${Math.round(targetF1)}Hz | F2 Consonant: ${Math.round(targetF2)}Hz`);

        setFrequencies(newFreqs);
        activeAnimationRef.current = requestAnimationFrame(drawSpeakingSim);
      };
      activeAnimationRef.current = requestAnimationFrame(drawSpeakingSim);
    };

    const startWakeWordSimulation = () => {
      let phase = 0;
      const drawWakeWordSim = () => {
        phase += 0.4;
        const newFreqs = [];
        for (let i = 0; i < 24; i++) {
          const distanceToCenter = Math.sin((i / 23) * Math.PI);
          const cyberWave = (Math.sin(phase * 2.0 + i * 0.6) * 18 + Math.random() * 8 + 18) * distanceToCenter;
          const height = Math.max(3, Math.round(cyberWave));
          newFreqs.push(height);

          // Maintain peak holding
          if (height >= peakHoldsRef.current[i]) {
            peakHoldsRef.current[i] = height;
          } else {
            peakHoldsRef.current[i] = Math.max(3, peakHoldsRef.current[i] - 0.6);
          }
        }
        setFrequencies(newFreqs);
        activeAnimationRef.current = requestAnimationFrame(drawWakeWordSim);
      };
      activeAnimationRef.current = requestAnimationFrame(drawWakeWordSim);
    };

    const startStandbySimulation = () => {
      let phase = 0;
      const drawStandbySim = () => {
        phase += 0.04;
        const newFreqs = [];
        for (let i = 0; i < 24; i++) {
          const distanceToCenter = Math.sin((i / 23) * Math.PI);
          const breathe = Math.max(2, Math.round((Math.sin(phase + i * 0.15) * 2.5 + 3.5) * distanceToCenter));
          newFreqs.push(breathe);

          // Quiet standby decays peak holds slowly
          peakHoldsRef.current[i] = Math.max(3, peakHoldsRef.current[i] - 0.25);
        }
        setFrequencies(newFreqs);
        activeAnimationRef.current = requestAnimationFrame(drawStandbySim);
      };
      activeAnimationRef.current = requestAnimationFrame(drawStandbySim);
    };

    // Engine Route Selection
    if (isWakeWordActive) {
      startWakeWordSimulation();
    } else if (isListening) {
      startMicrophoneAnalysis();
    } else if (isSpeaking) {
      startSpeakingSimulation();
    } else {
      startStandbySimulation();
    }

    return () => {
      if (activeAnimationRef.current) {
        cancelAnimationFrame(activeAnimationRef.current);
      }
      stopMicrophone();
    };
  }, [isListening, isSpeaking, isWakeWordActive]);

  const cleanName = visitorName.trim() || "Valued Visitor";
  
  // Default introduction voice prompt
  const defaultSpeechText = `Hello, ${cleanName}! I am KLV, your specialized virtual self-assistant. Leela is a passionate Full Stack MERN Developer and an AI and ML engineering student. He specializes in designing clean React frontends, building secure Node and Express backends, and engineering intelligent machine learning models. His educational background allows him to write application layers that are structured to gracefully capture smart predictions and analytical feeds. Say KLV followed by open about page, or show projects to verbally navigate this portfolio, or chat with me here!`;

  // Autoscroll chat window to bottom on new messages
  useEffect(() => {
    messagesRef.current = messages;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Handle live soundwaves scale
  useEffect(() => {
    let intervalId: any;
    intervalId = setInterval(() => {
      if (isSpeaking) {
        setMicPulseAmount(Math.random() * 0.7 + 0.7);
      } else if (isListening) {
        setMicPulseAmount(Math.random() * 0.25 + 0.85);
      } else {
        setMicPulseAmount(1.0);
      }
    }, 120);

    return () => clearInterval(intervalId);
  }, [isSpeaking, isListening]);

  // Speech Recognition API Initialization - run ONCE on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsRecognitionSupported(false);
      console.warn("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setMicAuthorized(true);
      console.log("KLV Voice Agent online and listening...");
    };

    recognition.onerror = (event: any) => {
      const err = event.error;
      if (err === "no-speech") {
        // "no-speech" is a natural timeout when no vocal sound is detected; suppress console error spam
        console.info("KLV SpeechRecognition: Quiet standby event detected (no speech input).");
        return;
      }
      if (err === "aborted") {
        console.info("KLV SpeechRecognition: Connection aborted or interrupted.");
        return;
      }

      console.error("KLV mic error context:", err);
      if (err === "not-allowed") {
        setMicAuthorized(false);
        setIsListening(false);
        shouldBeListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      if (shouldBeListeningRef.current) {
        // Yield restart of speech recognition while speech synthesis is speaking to bypass mic capturing its own audio output
        const checkAndRestart = () => {
          const isSynthesizerSpeaking = isSpeakingRef.current;
          if (isSynthesizerSpeaking) {
            setTimeout(checkAndRestart, 800);
          } else {
            if (shouldBeListeningRef.current) {
              try {
                recognition.start();
              } catch (e: any) {
                const errorMsg = String(e.message || e).toLowerCase();
                if (errorMsg.includes("already started")) {
                  setIsListening(true);
                } else {
                  console.warn("KLV speech loop retry catch-bypass:", e);
                }
              }
            }
          }
        };
        setTimeout(checkAndRestart, 300);
      } else {
        setIsListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      const lastResultIndex = event.resultIndex;
      const transcript = event.results[lastResultIndex][0].transcript;
      if (transcript && transcript.trim()) {
        processVoiceCommand(transcript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Automatic graceful watchdog to detect if SpeechRecognition service drops and attempt restarting
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      if (!isRecognitionSupported) return;

      const shouldBeListening = shouldBeListeningRef.current;
      const isActuallyListening = isListening;
      const isSynthesizerSpeaking = isSpeakingRef.current;

      // If the agent should be listening, but is not currently, and synthesis is quiet, we attempt a graceful restart
      if (shouldBeListening && !isActuallyListening && !isSynthesizerSpeaking) {
        console.info("KLV Watchdog: SpeechRecognition drop detected. Attempting automatic graceful restart...");
        if (recognitionRef.current) {
          try {
            // First stop standard listening to avoid overlapping handlers or resources
            try {
              recognitionRef.current.stop();
            } catch (e) {}

            setTimeout(() => {
              if (shouldBeListeningRef.current && !isListening) {
                try {
                  recognitionRef.current.start();
                  console.log("KLV Watchdog: SpeechRecognition gracefully restarted successfully.");
                } catch (startErr: any) {
                  const errorMsg = String(startErr.message || startErr).toLowerCase();
                  if (errorMsg.includes("already started")) {
                    setIsListening(true);
                  } else {
                    console.warn("KLV Watchdog restart attempt caught:", startErr);
                  }
                }
              }
            }, 100);
          } catch (e) {
            console.error("KLV Watchdog error in reset cycle:", e);
          }
        }
      }
    }, 4000);

    return () => clearInterval(watchdogInterval);
  }, [isListening, isSpeaking, isRecognitionSupported]);

  const startSpeakingTextRef = useRef<((text: string) => void) | null>(null);
  const addKlvMessageRef = useRef<((text: string) => void) | null>(null);
  const setIsOpenRef = useRef<((open: boolean) => void) | null>(null);
  const setIsMutedRef = useRef<((muted: boolean) => void) | null>(null);

  // Separate Effect to trigger welcome speech only when user submits names on entrance gate
  useEffect(() => {
    if (autoStartSpeech) {
      setIsMuted(false);
      isMutedRef.current = false;
      try {
        localStorage.setItem("klv_voice_muted", "false");
      } catch (e) {}
      const welcomeTimeout = setTimeout(() => {
        setIsOpen(true);
        startListeningLoop();

        // Fallback: If nothing was queued to speak yet, speak the beautiful welcome self-introduction
        const hasSpoken = typeof window !== "undefined" && ((window as any).klvIntroSpoken || introSpokenRef.current);
        if (speakQueueRef.current.length === 0 && !isSpeakingRef.current && !hasSpoken) {
          introSpokenRef.current = true;
          if (typeof window !== "undefined") {
            (window as any).klvIntroSpoken = true;
          }
          const cleanVisitor = visitorName.trim() || "Explorer";
          const introGreeting = `Hello, ${cleanVisitor}! I am KLV, your specialized virtual self-assistant. Welcome to Leela Vinayak Kothakota's digital portfolio! Leela is a passionate Full Stack MERN Developer and an Artificial Intelligence & Machine Learning student with experience building scalable web applications, secure REST APIs, and interactive user interfaces. His scholastic discipline helps him view software through a predictive lens—structuring web modules not as static templates, but as scalable pipelines designed to fetch smart predictions seamlessly. Say KLV followed by open about page, or show projects to verbally navigate, or type inside the chat panel right here. Let's begin the tour!`;
          
          addKlvMessage(introGreeting);
          startSpeakingText(introGreeting);
        }
      }, 350);

      return () => clearTimeout(welcomeTimeout);
    }
  }, [autoStartSpeech, visitorName]);

  // Remote triggers from component triggers in App.tsx
  useEffect(() => {
    if (triggerSpeechText && triggerSpeechText.text) {
      setIsOpen(true);
      addKlvMessage(triggerSpeechText.text);
      startSpeakingText(triggerSpeechText.text);
    }
  }, [triggerSpeechText]);

  // Expose speech synthesis anchor globally using stable refs to protect against state-render race conditions
  useEffect(() => {
    (window as any).speakKlvText = (text: string) => {
      try {
        localStorage.setItem("klv_voice_muted", "false");
      } catch (e) {}
      setIsMutedRef.current?.(false);
      isMutedRef.current = false;
      setIsOpenRef.current?.(true);
      
      // Execute speak synchronously to preserve the browser's user activation/gesture safety token
      addKlvMessageRef.current?.(text);
      startSpeakingTextRef.current?.(text);
    };
    return () => {
      // Leave registered for stable access during transitions
    };
  }, []);

  // Microphone toggle state
  const handleMicToggle = () => {
    if (isListening) {
      stopListeningLoop();
      addKlvMessage("Microphone standby. Speak whenever you are ready.");
      startSpeakingText("Microphone deactivated. Ready on stand-by.");
    } else {
      startListeningLoop();
      addKlvMessage("Microphone online. Say 'KLV' followed by a command.");
      startSpeakingText("Active. I am listening.");
    }
  };

  const startListeningLoop = () => {
    if (!recognitionRef.current) return;
    shouldBeListeningRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      const errorMsg = String(e.message || e).toLowerCase();
      if (errorMsg.includes("already started")) {
        setIsListening(true);
      } else {
        console.error("Listening start failed:", e);
      }
    }
  };

  const stopListeningLoop = () => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Add messages helpers
  const addUserMessage = (text: string) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    if (!isOpenRef.current) {
      setUnreadCount(c => c + 1);
      setShowNotificationBadge(true);
    }
  };

  const addKlvMessage = (text: string) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "klv",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    if (!isOpenRef.current) {
      setUnreadCount(c => c + 1);
      setShowNotificationBadge(true);
    }
  };

  // Welcome announcer on entrance
  const triggerStartupWelcomeVoice = () => {
    const hasSpoken = typeof window !== "undefined" && ((window as any).klvIntroSpoken || introSpokenRef.current);
    if (hasSpoken) {
      startSpeakingText("KLV voice agent at your command. How should I assist you today?");
      return;
    }
    introSpokenRef.current = true;
    if (typeof window !== "undefined") {
      (window as any).klvIntroSpoken = true;
    }
    addKlvMessage(defaultSpeechText);
    startSpeakingText(defaultSpeechText);
  };

  // Quick helper to filter out accidental background noise matches
  const checkKeywordMatch = (text: string): boolean => {
    const keys = ["about", "profile", "who", "skill", "tech", "stack", "expert", "experience", "timeline", "job", "history", "project", "work", "portfolio", "education", "college", "university", "degree", "review", "feedback", "audit", "recommendation", "contact", "mail", "message", "ping", "form", "home", "hero", "top", "gate"];
    return keys.some(key => text.includes(key));
  };

  // Process verbal input commands
  const processVoiceCommand = (rawText: string) => {
    const textSanitized = rawText.toLowerCase().trim();
    if (!textSanitized) return;

    // Filter wake word 'KLV'
    const isWakeWordPresent = 
      textSanitized.includes("klv") || 
      textSanitized.includes("k l v") || 
      textSanitized.includes("kay el vee") ||
      textSanitized.includes("clv") ||
      textSanitized.includes("klb") ||
      textSanitized.includes("kelv") ||
      textSanitized.includes("calv");

    if (isWakeWordPresent) {
      // Wake word triggered - activate premium visual ripple and audio confirmation chime!
      setIsWakeWordActive(true);
      
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioContextFeedback = new AudioCtx();
          const osc = audioContextFeedback.createOscillator();
          const gain = audioContextFeedback.createGain();
          osc.connect(gain);
          gain.connect(audioContextFeedback.destination);
          osc.type = "sine";
          // Cyber wake up chime: starting high and resolving upward
          osc.frequency.setValueAtTime(640, audioContextFeedback.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioContextFeedback.currentTime + 0.15);
          gain.gain.setValueAtTime(0.04, audioContextFeedback.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContextFeedback.currentTime + 0.3);
          osc.start();
          osc.stop(audioContextFeedback.currentTime + 0.3);
        }
      } catch (e) {
        console.warn("Feedback chime bypassed:", e);
      }

      // Dismiss wake-word ripple indicator after a premium 2-second glow period
      setTimeout(() => {
        setIsWakeWordActive(false);
      }, 2000);

      // Extract command after wake word
      const instructionPart = textSanitized
        .replace("klv", "")
        .replace("k l v", "")
        .replace("kay el vee", "")
        .replace("clv", "")
        .replace("klb", "")
        .replace("kelv", "")
        .replace("calv", "")
        .trim();

      addUserMessage(rawText);
      handleDirectNavigation(instructionPart || textSanitized, true);
    } else {
      // No wake-word present. Match against direct registered keywords 
      // to bypass non-actionable background elements
      const matched = checkKeywordMatch(textSanitized);
      if (matched) {
        addUserMessage(rawText);
        handleDirectNavigation(textSanitized, false);
      } else {
        console.log("Filtered background audio level trigger:", rawText);
      }
    }
  };

  // Navigation router matching commands
  const handleDirectNavigation = async (text: string, forceResponse: boolean = false) => {
    let targetSectionId = "";
    let speechReport = "";
    let sectionDisplayName = "";

    const cleanInput = text.toLowerCase().trim();

    if (cleanInput.includes("about") || cleanInput.includes("profile") || cleanInput.includes("who is leela") || cleanInput.includes("biography") || cleanInput.includes("curriculum")) {
      targetSectionId = "about";
      sectionDisplayName = "About Me";
      speechReport = `This is Leela Vinayak Kothakota's Biography. He is a passionate Full Stack MERN Developer and an AI and ML engineering student. He specializes in designing clean React frontends, building secure Node and Express backends, and engineering intelligent machine learning models. His academic discipline helps him view software engineering through a predictive lens—structuring web modules as scalable pipelines designed to gracefully process smart predictions and live analytical feeds.`;
    } else if (cleanInput.includes("skill") || cleanInput.includes("tech") || cleanInput.includes("stack") || cleanInput.includes("expert") || cleanInput.includes("language")) {
      targetSectionId = "skills";
      sectionDisplayName = "Skills Stack";
      speechReport = `Welcome to the Technical Skills Cluster! Here, you can review Leela's proficiency across the full MERN Stack, including React, Node.js, and Express, alongside core databases like MongoDB, MySQL, and PostgreSQL. He also trains deep neural networks and applies strict software speed optimization patterns to boost loading speeds.`;
    } else if (cleanInput.includes("experience") || cleanInput.includes("timeline") || cleanInput.includes("job") || cleanInput.includes("history") || cleanInput.includes("intern")) {
      targetSectionId = "experience";
      sectionDisplayName = "Timeline Roadmap";
      speechReport = `You are now viewing Leela's career timeline. It showcases his tenure at Amdox Technologies as a Full Stack Developer Intern, where he built secure high-throughput REST APIs, optimized MySQL databases, and reduced server-side latencies by thirty percent!`;
    } else if (cleanInput.includes("project") || cleanInput.includes("work") || cleanInput.includes("portfolio")) {
      targetSectionId = "projects";
      sectionDisplayName = "Engineering Projects";
      speechReport = `Here is Leela's interactive Projects Showcase. He has designed several sophisticated production-grade prototypes. You can interact with his Weekly Aptitude Test System, Library Management System, or Digital Logic Gates Simulator. Simply click the filter buttons to explore!`;
    } else if (cleanInput.includes("education") || cleanInput.includes("college") || cleanInput.includes("university") || cleanInput.includes("degree") || cleanInput.includes("grade") || cleanInput.includes("academic") || cleanInput.includes("study") || cleanInput.includes("school")) {
      targetSectionId = "education";
      sectionDisplayName = "Education Node";
      speechReport = `This is Leela's academic education dashboard, illustrating his path in Computer Science and Engineering, specializing in Artificial Intelligence and Machine Learning. He holds an outstanding CGPA of eight point nine out of ten.`;
    } else if (cleanInput.includes("review") || cleanInput.includes("feedback") || cleanInput.includes("audit") || cleanInput.includes("recommendation") || cleanInput.includes("comment") || cleanInput.includes("rating")) {
      targetSectionId = "reviews";
      sectionDisplayName = "Community Reviews Grid";
      speechReport = `We have reached the interactive Ratings and Client Testimonials Grid. Visitors can submit real-time audits, star ratings, and feedback directly. It is perfect for reading verified thoughts from the community.`;
    } else if (cleanInput.includes("contact") || cleanInput.includes("mail") || cleanInput.includes("message") || cleanInput.includes("ping") || cleanInput.includes("form") || cleanInput.includes("hire") || cleanInput.includes("email")) {
      targetSectionId = "contact";
      sectionDisplayName = "Contact Terminal";
      speechReport = `This is the secure Transmission Uplink Form. Feel free to leave Leela a message about job offers, freelance consulting, or collaborations. He'll process your request and respond in under twenty-four hours!`;
    } else if (cleanInput.includes("home") || cleanInput.includes("hero") || cleanInput.includes("top") || cleanInput.includes("gate") || cleanInput.includes("welcome")) {
      targetSectionId = "hero";
      sectionDisplayName = "Main Entrance Gate";
      speechReport = `Transferring view back to the top landing control deck. You can restart the voice tour from here at any time.`;
    }

    if (targetSectionId) {
      addKlvMessage(speechReport);
      startSpeakingText(speechReport);
      
      setTimeout(() => {
        document.getElementById(targetSectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 250);
    } else if (forceResponse) {
      // Dynamic AI chatbot powered by server-side Gemini 3.5-flash
      const messageId = Math.random().toString(36).substring(7);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages(prev => [...prev, {
        id: messageId,
        sender: "klv",
        text: "Analyzing query with Gemini...",
        timestamp
      }]);

      try {
        const apiUrl = `${window.location.origin}/api/chat`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            history: messagesRef.current.map(m => ({ sender: m.sender, text: m.text }))
          })
        });

        if (!response.ok) {
          throw new Error("Chat api response error");
        }

        const data = await response.json();
        const aiResponse = data.text || "I was unable to formulate a response.";

        // Replace loading indicator bubble with the response text
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: aiResponse } : m));

        // Speak response out loud, strip markdown characters for clean pronunciation
        const cleanSpeakText = aiResponse.replace(/[*_`#\-]/g, "").substring(0, 300);
        startSpeakingText(cleanSpeakText);
      } catch (error) {
        console.error("Gemini api error:", error);
        setMessages(prev => prev.map(m => m.id === messageId ? { 
          ...m, 
          text: "I am having trouble routing this to my Gemini voice core right now. Please ensure GEMINI_API_KEY is configured in your Settings > Secrets panel." 
        } : m));
      }
    }
  };

  // Handle Text Submission typing form
  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    const submittedVal = textInput.trim();
    setTextInput("");
    addUserMessage(submittedVal);
    
    // Process matching command layout
    setTimeout(() => {
      handleDirectNavigation(submittedVal.toLowerCase(), true);
    }, 450);
  };

  // Pre-fetch speech voices to warm up SpeechSynthesis cache
  useEffect(() => {
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoadedRef.current = true;
      }
      const handleVoicesChanged = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) {
          voicesLoadedRef.current = true;
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, []);

  // Utility: wait for voices to be available (Chrome loads them asynchronously)
  const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }
      // Voices not loaded yet — wait for the voiceschanged event
      const onVoicesChanged = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          clearTimeout(fallbackTimer);
          resolve(v);
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      // Safety fallback: if voices never load after 3 seconds, proceed with empty (system default)
      const fallbackTimer = setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      }, 3000);
    });
  };

  // Chrome keepalive: prevents Chrome's 15-second auto-pause bug on SpeechSynthesis
  const startChromeKeepAlive = () => {
    stopChromeKeepAlive();
    chromeKeepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        // Calling pause+resume in quick succession keeps Chrome's internal timer from killing synthesis
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);
  };

  const stopChromeKeepAlive = () => {
    if (chromeKeepAliveRef.current) {
      clearInterval(chromeKeepAliveRef.current);
      chromeKeepAliveRef.current = null;
    }
  };

  // Speak synthesizer engine
  const startSpeakingText = (textToSpeak: string) => {
    // Clear any existing speaking queue
    speakQueueRef.current = [];
    currentQueueIndexRef.current = 0;
    stopChromeKeepAlive();

    if (isMutedRef.current) {
      console.log("Speech synthesis muted. Audio output bypassed.");
      return;
    }
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported on this device/browser.");
      return;
    }

    ignoreErrorsRef.current = true;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
    } catch (e) {}

    // Reset ignoreErrorsRef shortly after cancel executes to handle synchronous events
    setTimeout(() => {
      ignoreErrorsRef.current = false;
    }, 120);

    // Split paragraphs into individual natural lookahead sentences safely
    const sentences = textToSpeak
      .replace(/([.!?])\s+/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) {
      setIsSpeaking(false);
      return;
    }

    // Play a premium futuristic synth chime showing connection establishing successfully
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const biquadFilter = audioCtx.createBiquadFilter();
        const gainNode = audioCtx.createGain();
        
        osc1.connect(biquadFilter);
        osc2.connect(biquadFilter);
        biquadFilter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.setValueAtTime(800, audioCtx.currentTime);
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
        
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.25);
        osc2.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Cyber synthesizer chime bypass:", e);
    }

    speakQueueRef.current = sentences;
    
    // Ensure voices are loaded before speaking (critical for Chrome which loads voices asynchronously)
    if (!voicesLoadedRef.current) {
      waitForVoices().then(() => {
        voicesLoadedRef.current = true;
        startChromeKeepAlive();
        speakNextSentence();
      });
    } else {
      startChromeKeepAlive();
      speakNextSentence();
    }
  };

  const getBestMaleVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    // 1. Filter out known broken/blacklisted voices
    const activeVoices = voices.filter(v => !brokenVoicesRef.current.has(v.name));
    
    // 2. EXTREMELY CRITICAL: Inside sandboxed iframe environments (like the AI Studio preview container),
    // remote network-based cloud voices (localService === false) are blocked from loading their speech synthesis chunks
    // by core cross-origin and connection sandboxing rules. This immediately fails or permanently freezes/locks the
    // browser's SpeechSynthesis queue, making the assistant go silent and disabling sound button feedbacks.
    // Therefore, we MUST prioritize strictly local system offline voices (localService === true).
    const localEnglishVoices = activeVoices.filter(v => 
      v.lang.toLowerCase().startsWith("en") && 
      v.localService === true
    );

    const femaleBlacklist = [
      "female", "zira", "hazel", "samantha", "victoria", "karen", "susan", "preeti", 
      "joanna", "microsoft sabina", "clara", "fiona", "moira", "tessa", "veena", 
      "heera", "mei-jia", "sin-ji", "kanya", "elsa", "kalpana", "haruka", "kyoko", 
      "yuna", "ziyu", "chen-chen", "nanami", "da-bin", "ji-min", "sara", "siri", "cortana",
      "kathy", "agnes", "alice", "alva", "amelie", "anna", "carmit", "damayanti", "ellen",
      "emora", "ioana", "katya", "lekha", "luciana", "mariska", "melina", "milena", "monica",
      "nora", "paulina", "satu", "ting-ting", "yelda", "zosia", "zuzana", "whisper", "toy"
    ];

    // Filter local English voices to isolate beautiful warm masculine/baritone profiles
    const localNonFemaleVoices = localEnglishVoices.filter(v => 
      !femaleBlacklist.some(f => v.name.toLowerCase().includes(f))
    );

    const preferredWarmMaleList = [
      "microsoft david",
      "david",
      "microsoft george",
      "george",
      "microsoft ravi",
      "ravi",
      "daniel",
      "alex",
      "natural male",
      "en-us-x-sfg",
      "en-us-x-iol-local",
      "en-us-x-iom-local",
      "en-gb-x-rjs-local",
      "sam",
      "mark",
      "male"
    ];

    // 1. Try to find a custom preferred local male voice
    for (const pref of preferredWarmMaleList) {
      const found = localNonFemaleVoices.find(v => v.name.toLowerCase().includes(pref));
      if (found) return found;
    }

    // 2. Fallback search to any voice name containing masculine signatures in local non-female list
    const genericLocalMale = localNonFemaleVoices.find(v => 
      v.name.toLowerCase().includes("male") || 
      v.name.toLowerCase().includes("david") || 
      v.name.toLowerCase().includes("guy") || 
      v.name.toLowerCase().includes("george") || 
      v.name.toLowerCase().includes("daniel") || 
      v.name.toLowerCase().includes("alex") ||
      v.name.toLowerCase().includes("sam") ||
      v.name.toLowerCase().includes("mark")
    );
    if (genericLocalMale) return genericLocalMale;

    // 3. Fallback to first non-female local English voice
    if (localNonFemaleVoices.length > 0) return localNonFemaleVoices[0];

    // 4. Fallback search to English male voices (even if localService is false/undefined, as some environments are not sandboxed and network voices work perfectly)
    const englishVoices = activeVoices.filter(v => v.lang.toLowerCase().startsWith("en"));
    const nonFemaleEnglishVoices = englishVoices.filter(v => 
      !femaleBlacklist.some(f => v.name.toLowerCase().includes(f))
    );

    for (const pref of preferredWarmMaleList) {
      const found = nonFemaleEnglishVoices.find(v => v.name.toLowerCase().includes(pref));
      if (found) return found;
    }

    const genericMaleVoice = nonFemaleEnglishVoices.find(v => 
      v.name.toLowerCase().includes("male") || 
      v.name.toLowerCase().includes("david") || 
      v.name.toLowerCase().includes("guy") || 
      v.name.toLowerCase().includes("george") || 
      v.name.toLowerCase().includes("daniel") || 
      v.name.toLowerCase().includes("alex")
    );
    if (genericMaleVoice) return genericMaleVoice;

    // 5. Fallback general hierarchies:
    if (nonFemaleEnglishVoices.length > 0) return nonFemaleEnglishVoices[0];
    if (localEnglishVoices.length > 0) return localEnglishVoices[0];
    if (englishVoices.length > 0) return englishVoices[0];

    // 6. Last resort: first available local system voice
    const anyLocalVoices = activeVoices.filter(v => v.localService === true);
    if (anyLocalVoices.length > 0) return anyLocalVoices[0];

    // If activeVoices has other options, use them
    if (activeVoices.length > 0) return activeVoices[0];
    return voices[0] || null;
  };

  const speakNextSentence = () => {
    const queue = speakQueueRef.current;
    const index = currentQueueIndexRef.current;

    if (index >= queue.length) {
      // Completed speaking the whole queue!
      setIsSpeaking(false);
      stopChromeKeepAlive();
      return;
    }

    // Re-check mute state before each sentence (user may have muted mid-speech)
    if (isMutedRef.current) {
      setIsSpeaking(false);
      stopChromeKeepAlive();
      return;
    }

    const sentenceToSpeak = queue[index];
    setCurrentSubtitle(sentenceToSpeak);
    setIsSpeaking(true);

    try {
      // Chrome iframe bugfix: if synthesis is paused, resume first to clear buffer locks
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    // Create utterance for this single sentence chunk (avoids the 15-second Chrome cutoff)
    const utterance = new SpeechSynthesisUtterance(sentenceToSpeak);
    // Set default language so compilation fallback executes immediately before voice lists resolve
    utterance.lang = "en-US";
    utterance.volume = 1.0;
    utterance.rate = 1.02;  // Standard, natural, polished speaking flow
    utterance.pitch = 1.0; // Standard, highly compatible speech pitch to prevent OS exceptions
    
    utteranceRef.current = utterance;
    // Chrome Garbage-Collection Bugfix: lock utterance references securely in a global array
    (window as any).klvUtteranceQueue = (window as any).klvUtteranceQueue || [];
    (window as any).klvUtteranceQueue.push(utterance);
    if ((window as any).klvUtteranceQueue.length > 40) {
      (window as any).klvUtteranceQueue.shift();
    }

    // Set voice selection — retry getVoices if empty (Chrome async loading edge case)
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Force a synchronous re-fetch attempt
      voices = window.speechSynthesis.getVoices();
    }
    const idealMaleVoice = getBestMaleVoice(voices);
    if (idealMaleVoice) {
      utterance.voice = idealMaleVoice;
    }

    // Dynamic, safety-timer trigger backup. Gives the speech plenty of time to finish but steps in of a frozen queue.
    // 36-word sentences take ~15 seconds. Capping watchdog at 45 seconds prevents premature cutoffs!
    const wordsCount = sentenceToSpeak.split(/\s+/).length;
    const estimatedDurationSecs = Math.max(6, Math.ceil(wordsCount * 0.8) + 6);
    
    let isTerminated = false;
    const safetyBackupTimer = setTimeout(() => {
      if (!isTerminated) {
        isTerminated = true;
        console.warn("KLV synthesis watchdog: Fallback safety timer triggered for sentence ", index);

        // Cancel the current stuck utterance so browser SpeechSynthesis can recover
        ignoreErrorsRef.current = true;
        if ("speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
          } catch (e) {}
        }
        setTimeout(() => {
          ignoreErrorsRef.current = false;
        }, 120);

        // Recover state, move forward in queue
        currentQueueIndexRef.current = index + 1;
        speakNextSentence();
      }
    }, estimatedDurationSecs * 1000);

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (!isTerminated) {
        isTerminated = true;
        clearTimeout(safetyBackupTimer);
        currentQueueIndexRef.current = index + 1;
        // Clean natural speech pause between sentences
        setTimeout(speakNextSentence, 150);
      }
    };

    utterance.onerror = (err) => {
      console.warn("Vocal utterance error with voice:", idealMaleVoice?.name, err);
      
      // If we flagged that we are intentionally cancelling, return immediately and do NOT run any retry or blacklisting!
      if (ignoreErrorsRef.current) {
        console.log("Speech cancellation/error event ignored due to active manual cancel/override.");
        return;
      }

      // Check if it was a natural interruption/cancellation
      const errCode = err.error as string;
      const isInterrupted = errCode === "interrupted" || errCode === "canceled" || errCode === "cancelled";
      if (isInterrupted) {
        console.log("Synthesizer naturally interrupted or canceled. Bypassing fallback retry.");
        return;
      }

      // Blacklist the broken voice if it's an actual, persistent browser failure
      if (idealMaleVoice) {
        console.warn(`Blacklisting broken voice: "${idealMaleVoice.name}" due to persistent error:`, err);
        brokenVoicesRef.current.add(idealMaleVoice.name);
      }

      if (!isTerminated) {
        isTerminated = true;
        clearTimeout(safetyBackupTimer);
        
        // Immediate system-default speech synthesis fallback retry for this specific sentence
        console.log("Retrying sentence synthesis using default system voice fallback...");
        try {
          const fallbackUtterance = new SpeechSynthesisUtterance(sentenceToSpeak);
          fallbackUtterance.lang = "en-US";
          fallbackUtterance.volume = 1.0;
          fallbackUtterance.rate = 1.0;
          fallbackUtterance.pitch = 1.0; // Highly compatible
          // No custom `.voice` property to guarantee native system default speaking works perfectly!
          
          fallbackUtterance.onend = () => {
            currentQueueIndexRef.current = index + 1;
            setTimeout(speakNextSentence, 150);
          };
          fallbackUtterance.onerror = (fbErr) => {
            console.warn("Fallback utterance also threw an error:", fbErr);
            currentQueueIndexRef.current = index + 1;
            setTimeout(speakNextSentence, 100);
          };
          
          setTimeout(() => {
            try {
              if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
              }
              window.speechSynthesis.speak(fallbackUtterance);
            } catch (e) {
              console.error("Delayed fallback speak crashed:", e);
              currentQueueIndexRef.current = index + 1;
              setTimeout(speakNextSentence, 100);
            }
          }, 50);
          return;
        } catch (e) {
          console.error("Fallback speech execute failed", e);
        }
        
        currentQueueIndexRef.current = index + 1;
        setTimeout(speakNextSentence, 105);
      }
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (speakErr) {
      console.error("Window speech speak call crashed:", speakErr);
      if (!isTerminated) {
        isTerminated = true;
        clearTimeout(safetyBackupTimer);
        currentQueueIndexRef.current = index + 1;
        setTimeout(speakNextSentence, 100);
      }
    }
  };

  const stopSpeaking = () => {
    ignoreErrorsRef.current = true;
    speakQueueRef.current = [];
    currentQueueIndexRef.current = 0;
    stopChromeKeepAlive();
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
    setTimeout(() => {
      ignoreErrorsRef.current = false;
    }, 120);
  };

  const openAssistantChat = () => {
    const triggerSpeechAfterUnlock = () => {
      // Direct start of continuous voice recognition listening standby
      setTimeout(() => {
        startListeningLoop();
      }, 150);

      const hasSpoken = typeof window !== "undefined" && ((window as any).klvIntroSpoken || introSpokenRef.current);
      if (messages.length === 0 && !hasSpoken) {
        triggerStartupWelcomeVoice();
      } else {
        startSpeakingText("KLV voice agent at your command. How should I assist you today?");
      }
    };

    setIsOpen(true);
    setUnreadCount(0);
    setShowNotificationBadge(false);

    // Guaranteed unmuted state for direct sound output on first-time open experience
    setIsMuted(false);
    isMutedRef.current = false;
    try {
      localStorage.setItem("klv_voice_muted", "false");
    } catch (e) {}

    // Force unblock Chrome & Safari SpeechSynthesis sandbox rules via direct user interaction token.
    // CRITICAL: The dummy utterance must complete (via onend) BEFORE we queue real speech,
    // otherwise Chrome drops the audio context silently.
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        // Use a single space instead of empty string — some browsers skip empty utterances entirely
        const dummyUtter = new SpeechSynthesisUtterance(" ");
        dummyUtter.volume = 0; // Silent unlock
        dummyUtter.onend = () => {
          // NOW the audio context is unlocked — safe to speak real content
          triggerSpeechAfterUnlock();
        };
        dummyUtter.onerror = () => {
          // Even on error, try to speak anyway
          triggerSpeechAfterUnlock();
        };
        window.speechSynthesis.speak(dummyUtter);
      } catch (e) {
        // Fallback: just speak directly
        triggerSpeechAfterUnlock();
      }
    } else {
      triggerSpeechAfterUnlock();
    }
  };

  useEffect(() => {
    startSpeakingTextRef.current = startSpeakingText;
    addKlvMessageRef.current = addKlvMessage;
    setIsOpenRef.current = setIsOpen;
    setIsMutedRef.current = setIsMuted;
  });

  const closeAssistantChat = () => {
    setIsOpen(false);
    stopSpeaking();
  };

  return (
    <div 
      id="klv-floating-chat-container" 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end"
    >
      
      <AnimatePresence>
        {/* Expanded Chat Assistant View */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-[calc(100vw-32px)] max-w-[385px] h-[75vh] sm:h-[610px] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-[0_15px_45px_rgba(147,51,234,0.12)] border border-purple-200/80 flex flex-col backdrop-blur-xl relative bg-white/98 text-slate-850"
          >
            {/* Cyberpunk grid overlay background decoration for high structural finish */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-[32px] z-0" />

            {/* 1. Header with glowing futuristic status bar - Light Mode Theme only */}
            <div className="p-4 border-b border-purple-100 bg-white flex items-center justify-between text-slate-800 relative z-10 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50/20 to-indigo-50/25 opacity-100 pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                {/* Micro pulsating recording orb */}
                <div className="relative">
                  <span className={`absolute -inset-1 rounded-full blur-md opacity-75 ${
                    isListening ? "bg-emerald-400 animate-pulse" : "bg-purple-400 animate-pulse"
                  }`} />
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border border-purple-100 ${
                    isListening ? "bg-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.15)]" : "bg-purple-50 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                  }`}>
                    {isListening ? (
                      <Mic className="w-4 h-4 text-emerald-500 animate-bounce" />
                    ) : (
                      <Radio className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-[10px] font-mono font-black tracking-widest text-purple-700 uppercase flex items-center gap-1">
                    <span>KLV VOICE CORES</span>
                    <span className="text-[7px] text-purple-600 px-1 py-0.2 bg-purple-50 rounded border border-purple-200/60 font-semibold">V2.4</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-emerald-400 animate-ping" : "bg-amber-400 animate-pulse"}`} />
                    <span className="text-[9px] font-mono text-slate-500 tracking-wide font-medium uppercase min-w-[120px]">
                      {isListening ? "VOICE RECOGNITION ONLINE" : "MIC STANDBY // ONLINE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                {/* Voice Feed synthesis toggler (stateful mute/unmute control) */}
                <button
                  type="button"
                  id="btn-voice-mute-toggle"
                  onClick={() => {
                    const nextMuteState = !isMuted;
                    setIsMuted(nextMuteState);
                    isMutedRef.current = nextMuteState;
                    try {
                      localStorage.setItem("klv_voice_muted", String(nextMuteState));
                    } catch (e) {}

                    if (!nextMuteState) {
                      // Instantly say "Voice unmuted." to confirm to the user
                      const fbMsg = "Voice unmuted.";
                      setCurrentSubtitle(fbMsg);
                      if ("speechSynthesis" in window) {
                        try {
                          window.speechSynthesis.cancel();
                          const utterance = new SpeechSynthesisUtterance(fbMsg);
                          utterance.lang = "en-US";
                          utterance.rate = 1.0;
                          utterance.pitch = 1.0;
                          
                          const voices = window.speechSynthesis.getVoices();
                          const idealMaleVoice = getBestMaleVoice(voices);
                          if (idealMaleVoice) {
                            utterance.voice = idealMaleVoice;
                          }
                          
                          utterance.onstart = () => setIsSpeaking(true);
                          utterance.onend = () => setIsSpeaking(false);
                          window.speechSynthesis.speak(utterance);
                        } catch (e) {}
                      }
                    } else {
                      stopSpeaking();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                    isMuted 
                      ? "bg-pink-50 text-pink-600 border-pink-200 shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:bg-pink-100" 
                      : "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/60"
                  }`}
                  title={isMuted ? "Unmute Voice Assistant Feed" : "Mute Voice Assistant Feed"}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 shrink-0 text-pink-500 animate-bounce" />
                      <span className="text-[9px] font-mono leading-none font-black uppercase tracking-widest text-pink-600">MUTED</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span className="text-[9px] font-mono leading-none font-black uppercase tracking-widest text-purple-700">VOICE ON</span>
                    </>
                  )}
                </button>

                {/* Close/Minimize cross */}
                <button
                  type="button"
                  id="btn-voice-chat-close"
                  onClick={closeAssistantChat}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition hover:scale-105 cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable chat dialog message history */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-150 scrollbar-track-transparent z-10 bg-slate-50/40"
            >
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
                  >
                    {msg.sender === "klv" && (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-[9px] font-mono font-black text-white shrink-0 shadow-[0_2px_8px_rgba(139,92,245,0.15)] select-none">
                        K_
                      </div>
                    )}
                    <div className="max-w-[82%] flex flex-col gap-1">
                      <div className="relative group/msg">
                        <div className={`px-4 py-3 rounded-2xl text-[11px] font-sans leading-relaxed tracking-wide ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md"
                            : "bg-purple-50 text-slate-850 rounded-tl-none border border-purple-100/70 pr-8 shadow-sm"
                        }`}>
                          {msg.sender === "klv" && (
                            <div className="text-[7.5px] font-mono font-extrabold text-purple-600 tracking-widest uppercase mb-1 flex items-center gap-1 select-none">
                              <Sparkles className="w-2.5 h-2.5 text-pink-500" />
                              KLV COGNITIVE AGENT
                            </div>
                          )}
                          {msg.text}
                          
                          {msg.sender === "klv" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startSpeakingText(msg.text);
                              }}
                              className="absolute right-2 top-[12px] p-1.5 rounded-lg bg-purple-100/40 text-purple-600 hover:text-purple-800 hover:bg-purple-100 transition duration-200 cursor-pointer flex items-center justify-center opacity-85"
                              title="Speak this message out loud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <span className={`text-[8.5px] font-mono text-slate-500 px-1 ${
                        msg.sender === "user" ? "text-right" : "text-left"
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 3. Center Advanced Male Voice Real-Time Frequency Spectrum Analyzer - Light Mode */}
            <div className={`p-3 border-t border-b border-purple-100 flex flex-col justify-between pointer-events-none select-none relative h-34 overflow-hidden transition-colors duration-500 z-10 ${isWakeWordActive ? "bg-cyan-50/50" : "bg-purple-50/50"}`}>
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent to-transparent animate-pulse transition-all duration-300 ${isWakeWordActive ? "via-cyan-400" : "via-purple-400/40"}`} />
              
              {/* Radial responsive glowing ambient cast */}
              <div className={`absolute w-36 h-36 rounded-full blur-3xl opacity-15 left-1/2 -ml-18 -bottom-14 transition-colors duration-500 ${
                isWakeWordActive ? "bg-cyan-500 animate-pulse" : isSpeaking ? "bg-pink-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]" : isListening ? "bg-emerald-550" : "bg-purple-550"
              }`} />

              {/* Analyzer HUD Telemetry Header */}
              <div className="flex justify-between items-center relative z-10 w-full mb-1 text-[8px] font-mono text-purple-600">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? "bg-pink-500 animate-ping" : "bg-purple-300"}`} />
                  <span className="font-extrabold tracking-widest uppercase">MALE SPEECH TELEMETRY v2.1</span>
                </div>
                {isSpeaking && (
                  <div className="text-[7.5px] font-black tracking-wider text-cyan-600 select-all font-mono uppercase bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                    {maleVoiceFormants}
                  </div>
                )}
              </div>

              {/* Grid-integrated Spectrum Stage */}
              <div className="w-full h-16 flex items-end justify-center gap-[4px] relative bg-white rounded-xl p-1 border border-purple-100 shadow-inner">
                {/* Horizontal Decibel Lines */}
                <div className="absolute inset-x-0 top-2 border-t border-purple-100/40" />
                <div className="absolute inset-x-0 top-6 border-t border-purple-100/40" />
                <div className="absolute inset-x-0 top-10 border-t border-purple-100/40" />
                
                {/* Visual DB Scale Markers on side */}
                <span className="absolute left-1.5 top-1 text-[6.5px] font-mono text-slate-400">0dB</span>
                <span className="absolute left-1.5 top-5 text-[6.5px] font-mono text-slate-400">-12dB</span>
                <span className="absolute left-1.5 top-9 text-[6.5px] font-mono text-slate-400">-24dB</span>

                {frequencies.map((height, i) => {
                  const peakHeight = peakHoldsRef.current[i] || 3;
                  return (
                    <div key={i} className="flex-1 max-w-[5px] h-full flex flex-col justify-end items-center relative gap-0">
                      {/* Floating Peak Hold Capsule Dot */}
                      <motion.div
                        animate={{ bottom: peakHeight }}
                        transition={{ type: "spring", stiffness: 280, damping: 25 }}
                        className={`absolute w-[4px] h-[2px] rounded-full z-20 ${
                          isWakeWordActive
                            ? "bg-cyan-500 shadow-[0_0_3px_rgba(34,211,238,0.5)]"
                            : isSpeaking
                              ? "bg-pink-500 shadow-[0_0_3px_rgba(244,63,94,0.5)]"
                              : isListening
                                ? "bg-emerald-500 shadow-[0_0_3px_rgba(16,185,129,0.5)]"
                                : "bg-purple-300/60"
                        }`}
                      />

                      {/* Frequency Bar Column */}
                      <motion.div
                        animate={{ height }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 20
                        }}
                        className={`w-[4px] rounded-t-full transition-colors duration-400 relative z-10 ${
                          isWakeWordActive
                            ? "bg-gradient-to-t from-cyan-400 via-sky-400 to-cyan-300"
                            : isSpeaking 
                              ? "bg-gradient-to-t from-purple-500 via-indigo-400 to-pink-500" 
                              : isListening 
                                ? "bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-400" 
                                : "bg-purple-100"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Logarithmic Frequency ticks x-axis labels */}
              <div className="w-full flex justify-between px-2 text-[6.5px] font-mono text-slate-400 tracking-widest mt-0.5 select-none relative z-10">
                <span>50Hz</span>
                <span>100Hz</span>
                <span>500Hz</span>
                <span>1.5kHz</span>
                <span>4kHz</span>
                <span>8kHz</span>
              </div>
              
              <div className="text-[9px] font-mono tracking-wider text-center h-4 flex items-center justify-center relative z-10 w-full mt-1.5">
                {!isRecognitionSupported ? (
                  <span className="text-pink-650 font-bold bg-pink-50 px-2 py-0.5 rounded border border-pink-200">⚠️ WEB SPEECH RECOGNITION NOT SUPPORTED</span>
                ) : micAuthorized === false ? (
                  <span className="text-amber-650 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">🔒 MICROPHONE ACCESS BLOCKED // ALLOW IN BROWSER</span>
                ) : isWakeWordActive ? (
                  <span className="text-cyan-600 font-black bg-cyan-100 px-4 py-1 rounded-full border border-cyan-250 animate-pulse tracking-widest flex items-center gap-1.5 shadow-sm">
                    ⚡ KLV WAKE WORD RECOGNIZED // ROUTING COMMAND...
                  </span>
                ) : isListening ? (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-250 animate-pulse tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    LISTENING // SAY "KLV [COMMAND]"
                  </span>
                ) : isSpeaking ? (
                  <span className="text-purple-650 font-semibold tracking-wide flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-pink-500 animate-pulse" />
                    {maleVoicePitch ? `NARRATING PORTFOLIO // PITCH PEAK: ${maleVoicePitch}Hz` : "NARRATING PORTFOLIO DISCOVERY CORE..."}
                  </span>
                ) : (
                  <span className="text-slate-400">STANDBY TRANSCRIPT CAPTURE // MICROPHONE STANDBY</span>
                )}
              </div>
            </div>

            {/* 4. Scrollable prompt chips tray */}
            <div className="px-4 py-3.5 flex gap-2.5 overflow-x-auto select-none border-b border-purple-100 no-scrollbar shrink-0 bg-white z-10">
              {[
                { label: "💬 Go About Page", cmd: "klv open about page" },
                { label: "⚡ Display Skills", cmd: "klv show skills" },
                { label: "🚀 Projects Showcase", cmd: "klv open projects list" },
                { label: "📅 Career timeline", cmd: "klv show my college experience history" },
                { label: "📞 Message Transmission", cmd: "klv contact" },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    addUserMessage(chip.cmd);
                    setTimeout(() => handleDirectNavigation(chip.cmd), 350);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-purple-100 bg-purple-50/50 text-[9px] font-mono text-purple-700 shrink-0 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 cursor-pointer flex items-center gap-1.5 hover:scale-102"
                >
                  <Navigation className="w-2.5 h-2.5 shrink-0 text-cyan-500" />
                  {chip.label}
                </button>
              ))}
            </div>

            {/* 5. Subtitle & Text Command Formulation Bar */}
            <form onSubmit={handleTextSubmit} className="p-3 bg-white border-t border-purple-100 flex items-center gap-2 relative z-10 shrink-0">
              <button
                type="button"
                onClick={handleMicToggle}
                className={`p-3 rounded-xl transition-all duration-300 cursor-pointer active:scale-90 flex items-center justify-center ${
                  isListening 
                    ? "bg-emerald-600 border border-emerald-500 text-white shadow-md" 
                    : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-850 hover:border-purple-300"
                }`}
                title={isListening ? "Click to deactivate voice capture" : "Activate speech commands"}
              >
                {isListening ? <Mic className="w-4 h-4 text-emerald-100" /> : <MicOff className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type command (e.g., 'go to skills')"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-350 placeholder-slate-400 tracking-wide font-sans focus:ring-1 focus:ring-purple-200"
              />

              <button
                type="submit"
                className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-md hover:shadow-purple-505/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating collapsed activation trigger badge */}
      {!isOpen && (
        <div className="relative group mt-3">
          
          {/* Subtle notification popover tooltip to notify user when they first land */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 2.0 }}
                className="hidden sm:block absolute right-16 bottom-2 bg-slate-900/95 text-purple-200 border border-purple-500/30 text-[10px] font-mono px-3.5 py-2.5 rounded-2xl shadow-2xl w-54 shrink-0 pointer-events-none leading-normal select-none"
              >
                <div className="font-bold flex items-center gap-1.5 text-white mb-1 tracking-wider uppercase">
                  <Sparkles className="w-3" />
                  KLV PORTFOLIO SYSTEM
                </div>
                Say <span className="text-pink-400 font-black">"KLV open about page"</span> to verbally command this site!
                
                {/* Micro caret pointing right */}
                <div className="absolute right-[-5px] bottom-5 w-2.5 h-2.5 rotate-45 bg-slate-900 border-r border-t border-purple-500/30" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glowing neon halo rings behind circle button */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 blur-md opacity-35 group-hover:opacity-85 transition duration-500 scale-102" />
          
          {/* Concentric cascading visual confirmation ripples of cyber light when "KLV" is detected */}
          <AnimatePresence>
            {isWakeWordActive && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 3.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
                  className="absolute inset-x-0 inset-y-0 rounded-full border border-cyan-400 bg-cyan-400/10 pointer-events-none z-10"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.7 }}
                  animate={{ scale: 2.7, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity, delay: 0.3 }}
                  className="absolute inset-x-0 inset-y-0 rounded-full border border-purple-500 bg-purple-500/10 pointer-events-none z-10"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity, delay: 0.6 }}
                  className="absolute inset-x-0 inset-y-0 rounded-full border border-pink-500 bg-pink-500/10 pointer-events-none z-10"
                />
              </>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={openAssistantChat}
            className={`relative w-14 h-14 rounded-full bg-slate-950 border flex items-center justify-center text-white cursor-pointer active:scale-95 hover:scale-110 transition duration-300 shadow-[0_5px_22px_rgba(168,85,247,0.4)] ${
              isWakeWordActive ? "border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.7)]" : "border-purple-500/30"
            }`}
            title="Open KLV Voice Assistant Chat"
          >
            {/* Active pulsing notification dot badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-600 border border-slate-950 text-white font-mono text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
            
            {/* Pulsing inner microphone node icon inside collapsed button badge */}
            <div className="relative flex items-center justify-center">
              <Mic className={`w-6 h-6 transition duration-300 ${isWakeWordActive ? "text-cyan-400 animate-pulse scale-110" : "text-purple-350 group-hover:text-cyan-400"}`} />
              <Radio className={`w-9 h-9 absolute text-purple-500/30 ${isWakeWordActive ? "text-cyan-400/50 animate-ping scale-125" : "animate-ping"}`} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
