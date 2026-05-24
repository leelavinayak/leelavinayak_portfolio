import { useState } from "react";
import { Skill } from "../types";
import { SKILLS } from "../data";
import { motion } from "motion/react";
import { Layout, Server, Database, Wrench, Globe, CheckCircle2, Award } from "lucide-react";

export default function SkillCluster({ isLightMode }: { isLightMode: boolean }) {
  const [activeCategory, setActiveCategory] = useState<"All" | "Frontend" | "Backend" | "Database" | "Tools" | "Other">("All");

  const categories = ["All", "Frontend", "Backend", "Database", "Tools", "Other"];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Frontend": return <Layout className="w-4 h-4 text-pink-400" />;
      case "Backend": return <Server className="w-4 h-4 text-blue-400" />;
      case "Database": return <Database className="w-4 h-4 text-emerald-400" />;
      case "Tools": return <Wrench className="w-4 h-4 text-amber-400" />;
      default: return <Globe className="w-4 h-4 text-purple-400" />;
    }
  };

  const filteredSkills = SKILLS.filter((s) => {
    if (activeCategory === "All") return true;
    return s.category === activeCategory;
  });

  return (
    <div id="skills-core-grid" className="max-w-6xl mx-auto px-4">
      {/* Category Navigation Pills */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`skill-filter-${cat.toLowerCase()}`}
            onClick={() => setActiveCategory(cat as any)}
            className={`px-4.5 py-1.5 rounded-full font-display text-xs font-semibold tracking-wide transition-all ${
              activeCategory === cat
                ? isLightMode
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/10 border border-purple-400/20 scale-105"
                : isLightMode
                ? "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50"
                : "bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {cat !== "All" && getCategoryIcon(cat)}
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Skills Bar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill, idx) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, x: -15, y: 15 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            className={`p-5 rounded-2xl border transition-all duration-300 group ${
              isLightMode
                ? "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                : "bg-slate-950/45 backdrop-blur-md border-purple-500/10 hover:border-purple-500/20 hover:bg-slate-950/80"
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${
                  isLightMode 
                    ? "bg-purple-50 border-purple-100 text-purple-600" 
                    : "bg-purple-950/40 border-purple-500/15 text-purple-400"
                }`}>
                  {getCategoryIcon(skill.category)}
                </div>
                <span className={`font-display text-sm font-bold tracking-tight ${
                  isLightMode ? "text-slate-900" : "text-white"
                }`}>
                  {skill.name}
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded-md border border-purple-500/10">
                {skill.level}% Optimized
              </span>
            </div>

            {/* Glowing Custom Progress Gauge */}
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${
              isLightMode ? "bg-slate-100" : "bg-slate-900"
            }`}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${skill.level}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.1 }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  skill.category === "Frontend"
                    ? "from-pink-500 to-purple-500"
                    : skill.category === "Backend"
                    ? "from-blue-500 to-indigo-500"
                    : skill.category === "Database"
                    ? "from-emerald-500 to-teal-500"
                    : skill.category === "Tools"
                    ? "from-amber-500 to-orange-500"
                    : "from-purple-500 to-blue-500"
                }`}
              />
            </div>

            {/* Micro details */}
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                {skill.category}
              </span>
              <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto Verified
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Adaptive Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`mt-10 p-6 rounded-3xl border border-dashed flex flex-col md:flex-row items-center justify-between gap-6 ${
          isLightMode
            ? "bg-purple-50/40 border-purple-200/60"
            : "bg-slate-950/20 border-purple-500/10"
        }`}
      >
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="p-3 bg-purple-600/10 rounded-full text-purple-400 border border-purple-500/25">
            <Award className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h5 className={`font-display font-extrabold text-sm ${isLightMode ? "text-slate-800" : "text-white"}`}>
              Full-Stack & Intelligent Node Mastery
            </h5>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed mt-0.5">
              Leela Vinayak holds key capabilities in connecting relational or document datastores to highly structured API systems while integrating models for deep analytical problem-solving.
            </p>
          </div>
        </div>
        <div className="shrink-0 text-center font-mono">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Overall Sync Integrity</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            91.4%
          </span>
        </div>
      </motion.div>
    </div>
  );
}
