import { Project, Skill, Experience, Education } from "./types";

export const ROTATING_ROLES = [
  "MERN Stack Developer",
  "AI & ML Student",
  "Full Stack Developer",
  "Problem Solver"
];

export const PROJECTS: Project[] = [
  {
    id: "aptitude-test-system",
    title: "Weekly Aptitude Test System",
    category: "MERN Stack",
    description: "An advanced, fully secure weekly evaluation ecosystem designed for institutes. Includes modern AI-based question generation and proctoring tracking to prevent academic dishonesty.",
    tags: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS", "Gemini API"],
    features: [
      "AI-driven automated aptitude question formulation",
      "Robust anti-cheating framework (tab focus monitoring & webcam proctoring UI)",
      "Timed test execution with auto-submission upon expiry",
      "Dynamic data analytics charts for individual & overall student performance statistics"
    ],
    githubUrl: "#",
    liveUrl: "https://vemu-quiz-craft.onrender.com"
  },
  {
    id: "library-management",
    title: "Library Management System",
    category: "MERN Stack",
    description: "A comprehensive solution for absolute book ledger control with strict JWT security and dual-portal dashboards for admins and students.",
    tags: ["React", "Express.js", "Node.js", "MongoDB", "JSON Web Tokens", "Tailwind CSS"],
    features: [
      "Secure JSON Web Token (JWT) identity verification and authorization levels",
      "Complete book circulation registry (one-click request, issue & return flow)",
      "Interactive analytics panel showing active inventory, overdues, and user logs",
      "Faceted search and filter suite for library-wide catalog querying"
    ],
    githubUrl: "#",
    liveUrl: "https://vemu-library-management-system-ni7c.onrender.com"
  },
  {
    id: "logic-gates-simulator",
    title: "Digital Logic Gates Simulator",
    category: "JavaScript",
    description: "An interactive, visual educational emulator that lets computer science students arrange circuits and observe cascading binary state outputs in real-time.",
    tags: ["HTML5", "CSS3", "Vanilla JavaScript", "Canvas API", "Interactivity"],
    features: [
      "Dynamic interactive dragging and node connection of basic logic gates (AND, OR, NOT, NAND, NOR, XOR)",
      "Real-time visual propagation of active (high) and inactive (low) logic levels",
      "Truth table auto-evaluation & simulation validation states",
      "Zero-dependency, pure Vanilla JS engine built for extreme performance"
    ],
    githubUrl: "#",
    liveUrl: "https://leelavinayak.github.io/Digital-Logic-Gates/"
  },
  {
    id: "the-vibe-co",
    title: "The Vibe Co.",
    category: "MERN Stack",
    description: "A modern event services marketplace where users can discover, compare, and instantly book event service professionals for weddings, parties, and corporate events.",
    tags: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS", "Booking System"],
    features: [
      "Local event vendor discovery with searchable service categories",
      "Instant booking and availability matching for event professionals",
      "Streamlined user workflow for requesting quotes and managing event plans",
      "Responsive marketplace interface built for seamless mobile and desktop use"
    ],
    githubUrl: "#",
    liveUrl: "https://the-vibe-co.onrender.com"
  }
];

export const SKILLS: Skill[] = [
  // Frontend
  { name: "HTML5", category: "Frontend", level: 95 },
  { name: "CSS3", category: "Frontend", level: 90 },
  { name: "JavaScript (ES6+)", category: "Frontend", level: 92 },
  { name: "React.js", category: "Frontend", level: 90 },
  { name: "Tailwind CSS", category: "Frontend", level: 95 },
  
  // Backend
  { name: "Node.js", category: "Backend", level: 88 },
  { name: "Express.js", category: "Backend", level: 88 },
  { name: "Java", category: "Backend", level: 85 },
  
  // Database
  { name: "MongoDB", category: "Database", level: 85 },
  { name: "MySQL", category: "Database", level: 82 },
  
  // Tools
  { name: "Git & GitHub", category: "Tools", level: 90 },
  { name: "VS Code", category: "Tools", level: 94 },
  { name: "Postman", category: "Tools", level: 88 },
  { name: "Gemini AI API", category: "Tools", level: 95 },
  { name: "Claude AI", category: "Tools", level: 92 },
  { name: "DeepSeek", category: "Tools", level: 88 },
  
  // Other
  { name: "REST APIs", category: "Other", level: 92 },
  { name: "Authentication (JWT & OAuth)", category: "Other", level: 87 },
  { name: "Responsive Design", category: "Other", level: 95 }
];

export const EXPERIENCE: Experience[] = [
  {
    company: "Amdox Technologies",
    role: "Full Stack Developer Intern",
    duration: "Jan 2026 – Apr 2026",
    responsibilities: [
      "Built and optimized scalable MERN Stack web applications with active state persistence",
      "Developed secure, high-throughput REST APIs validating models with Joi/Zod",
      "Designed and coded responsive UI components using Tailwind CSS and React",
      "Queried, updated, and optimized relational MySQL databases to boost search efficiency",
      "Identified and refactored crucial server bottlenecks, reducing backend latency by over 30%"
    ]
  }
];

export const EDUCATION: Education[] = [
  {
    degree: "B.Tech in Artificial Intelligence & Machine Learning",
    institution: "Vemu Institute Of Technology",
    duration: "2024 – Present",
    grade: "CGPA: 7.7 / 10",
    description: "Deep immersion into deep learning algorithms, statistical data models, natural language processing, neural network topologies, and high-performance full-stack web computing systems."
  },
  {
    degree: "Intermediate Board (MPC)",
    institution: "Sri Chaitanya Junior College",
    duration: "2022 – 2024",
    grade: "Percentage: 82%",
    description: "Rigorous focus on advanced calculus, coordinate geometry, classical thermodynamics, electromagnetism, and systemic inorganic synthesis."
  },
  {
    degree: "Secondary School Certificate (SSC)",
    institution: "Gitam High School Tirupati",
    duration: "2022 Graduate",
    grade: "7.2/10",
    description: "Exceptional mastery of core physical sciences, algebra, language models, and foundational algorithm structures."
  }
];
