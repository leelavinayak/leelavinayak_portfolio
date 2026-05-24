export interface Project {
  id: string;
  title: string;
  category: "MERN Stack" | "JavaScript" | "AI/ML" | "All";
  description: string;
  tags: string[];
  responsibilities?: string[];
  features: string[];
  githubUrl: string;
  liveUrl: string;
}

export interface Skill {
  name: string;
  category: "Frontend" | "Backend" | "Database" | "Tools" | "Other";
  level: number; // For nice progress bar representation (e.g. 90, 85)
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  responsibilities: string[];
}

export interface Education {
  degree: string;
  institution: string;
  duration: string;
  grade?: string;
  description?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
}
