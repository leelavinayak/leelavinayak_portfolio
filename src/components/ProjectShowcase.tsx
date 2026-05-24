import { useState, SVGProps } from "react";
import { Project } from "../types";
import { PROJECTS } from "../data";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Github, Sparkles, CheckCircle2, RefreshCw, Layers, ShieldCheck, Terminal, Code2 } from "lucide-react";

export default function ProjectShowcase({ isLightMode }: { isLightMode: boolean }) {
  const [filter, setFilter] = useState<"All" | "MERN Stack" | "JavaScript">("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = PROJECTS.filter((proj) => {
    if (filter === "All") return true;
    return proj.category === filter;
  });

  const filterCategories: ("All" | "MERN Stack" | "JavaScript")[] = ["All", "MERN Stack", "JavaScript"];

  return (
    <div id="project-showcase-engine" className="container mx-auto px-4 max-w-6xl">
      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {filterCategories.map((cat) => (
          <button
            key={cat}
            id={`filter-${cat.toLowerCase().replace(" ", "-")}`}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2.5 rounded-full font-display text-xs font-semibold tracking-wide transition-all duration-300 pointer-events-auto cursor-pointer ${
              filter === cat
                ? isLightMode
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-105"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/15 scale-105 border border-purple-400/20"
                : isLightMode
                ? "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {cat === "All" && <Layers className="w-3.5 h-3.5" />}
              {cat === "MERN Stack" && <Terminal className="w-3.5 h-3.5" />}
              {cat === "JavaScript" && <Code2Icon className="w-3.5 h-3.5" />}
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Grid List of Projects */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              key={project.id}
              className={`group relative rounded-2xl overflow-hidden flex flex-col justify-between border h-full transition-all duration-300 hover:-translate-y-2 cursor-pointer ${
                isLightMode
                  ? "bg-white border-slate-200 shadow-md shadow-slate-100 hover:shadow-xl hover:shadow-slate-200/50"
                  : "bg-slate-950/65 backdrop-blur-md border-purple-500/10 hover:border-purple-500/25 shadow-lg hover:shadow-purple-500/10"
              }`}
              onClick={() => setSelectedProject(project)}
            >
              {/* Card Accent Glow */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Category tag */}
              <div className="p-6 pb-0 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider font-semibold border ${
                  project.category === "MERN Stack"
                    ? "bg-purple-950/35 text-purple-300 border-purple-500/20"
                    : "bg-blue-950/35 text-blue-300 border-blue-500/20"
                }`}>
                  {project.category}
                </span>
                <span className="text-slate-500 text-xs font-mono">0{idx + 1}</span>
              </div>

              {/* Title & Description */}
              <div className="p-6">
                <h4 className={`text-xl font-display font-bold mb-3 group-hover:text-purple-400 transition-colors ${
                  isLightMode ? "text-slate-900" : "text-white"
                }`}>
                  {project.title}
                </h4>
                <p className={`text-sm line-clamp-3 leading-relaxed ${
                  isLightMode ? "text-slate-600" : "text-slate-300"
                }`}>
                  {project.description}
                </p>

                {/* Tags preview */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag} 
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        isLightMode 
                          ? "bg-stone-100 text-stone-600" 
                          : "bg-slate-900/80 text-purple-300"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="text-[10px] font-mono text-slate-500 self-center">
                      +{project.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Action Footer */}
              <div className={`p-6 pt-3 mt-auto flex items-center justify-between border-t ${
                isLightMode ? "border-slate-100" : "border-slate-900"
              }`} onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-purple-400 font-mono hover:underline cursor-pointer flex items-center gap-1" onClick={() => setSelectedProject(project)}>
                  Analyze Specs &rarr;
                </span>

                <div className="flex items-center gap-3">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2 rounded-lg border transition-all ${
                      isLightMode
                        ? "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/20"
                    }`}
                    title="Source Repository"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href={project.liveUrl}
                    className={`p-2 rounded-lg border transition-all ${
                      isLightMode
                        ? "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-purple-500/20"
                    }`}
                    title="Live Simulation Demo"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modern Glass Detail Dialog */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className={`relative w-full max-w-2xl rounded-3xl overflow-hidden p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto border ${
                isLightMode 
                  ? "bg-white border-slate-200 text-slate-800" 
                  : "bg-slate-950 border-purple-500/20 text-white"
              }`}
            >
              <button
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-500/10 transition-colors"
                onClick={() => setSelectedProject(null)}
              >
                <XIcon className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>

              {/* Title Header */}
              <div className="mb-6">
                <span className="text-purple-400 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 animate-ping" /> Project Specification Profile
                </span>
                <h3 className="text-2xl font-display font-extrabold tracking-tight">
                  {selectedProject.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedProject.category === "MERN Stack" 
                      ? "bg-purple-900/30 text-purple-300"
                      : "bg-blue-900/30 text-blue-300"
                  }`}>
                    {selectedProject.category}
                  </span>
                  <span className="text-slate-500 font-mono text-xs">ID: {selectedProject.id}</span>
                </div>
              </div>

              {/* Detailed parameters */}
              <div className="space-y-6">
                <div>
                  <h5 className="font-display font-semibold text-sm uppercase tracking-wide text-slate-400 mb-1.5">
                    Concept Scope
                  </h5>
                  <p className={`text-sm leading-relaxed ${isLightMode ? "text-slate-700" : "text-slate-200"}`}>
                    {selectedProject.description}
                  </p>
                </div>

                {/* Core Specifications */}
                <div>
                  <h5 className="font-display font-semibold text-sm uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Key Features & System Modules
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.features.map((feat) => (
                      <div 
                        key={feat}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          isLightMode 
                            ? "bg-slate-50 border-slate-100" 
                            : "bg-slate-900/40 border-slate-800"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <span className={isLightMode ? "text-slate-700" : "text-slate-300"}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deep-dive technologies */}
                <div>
                  <h5 className="font-display font-semibold text-sm uppercase tracking-wide text-slate-400 mb-2">
                    Architectural Stack
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag) => (
                      <span 
                        key={tag}
                        className={`text-xs font-mono px-3 py-1 rounded-full border ${
                          isLightMode 
                            ? "bg-purple-50 text-purple-700 border-purple-100" 
                            : "bg-purple-950/20 text-purple-300 border-purple-500/20"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-900">
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-mono text-xs flex items-center gap-2 transition"
                >
                  <Github className="w-4 h-4" /> Source Code
                </a>
                <a
                  href={selectedProject.liveUrl}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-display font-semibold text-xs flex items-center gap-2 transition shadow-md"
                >
                  <ExternalLink className="w-4 h-4" /> Launch Demo
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Minimal embedded Icons prevents missing exports
function Code2Icon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
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
