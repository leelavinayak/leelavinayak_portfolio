import { useState, useEffect } from "react";
import { Sun, Moon, Menu, X, Terminal, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  isLightMode: boolean;
  onThemeToggle: () => void;
  activeSection: string;
}

export default function Navbar({ isLightMode, onThemeToggle, activeSection }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Hero", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Projects", href: "#projects" },
    { label: "Education", href: "#education" },
    { label: "Reviews", href: "#reviews" },
    // { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      <header
        id="main-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? isLightMode
              ? "py-3 bg-white/70 backdrop-blur-md shadow-md border-b border-gray-200/55"
              : "py-3 bg-slate-950/70 backdrop-blur-md shadow-lg border-b border-purple-500/10"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo / Brand */}
          <a href="#hero" className="flex items-center gap-2 group">
            <div className={`p-1.5 rounded-lg border transition-all duration-300 ${
              isLightMode 
                ? "bg-purple-100 border-purple-300 text-purple-700 group-hover:bg-purple-200" 
                : "bg-slate-900 border-purple-500/30 text-purple-400 group-hover:border-cyan-400/50"
            }`}>
              <img src="leelavinayak.png" alt="" width={40} height={40}/>
              {/* <Cpu className="w-5 h-5 animate-pulse" /> */}
            </div>
            <span className={`font-display font-bold text-lg tracking-tight transition-colors ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}>
              <span className="text-purple-500">Kothakota </span>Leela<span className=""></span>Vinayak
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.href.slice(1);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative px-4 py-1.5 rounded-full font-display text-sm font-medium transition-colors ${
                    isActive
                      ? isLightMode
                        ? "text-purple-700 bg-purple-50"
                        : "text-cyan-400 bg-slate-900/60"
                      : isLightMode
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeBubble"
                      className={`absolute inset-0 rounded-full -z-10 border ${
                        isLightMode 
                          ? "border-purple-200 bg-purple-50/20" 
                          : "border-purple-500/20 bg-purple-950/10"
                      }`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Actions - Theme selection is removed to lock in light mode */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="#contact"
              className="px-5 py-2 rounded-full font-display text-xs font-semibold tracking-wide transition-all bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-purple-500/20"
            >
              Get In Touch
            </a>
          </div>

          {/* Mobile Right Controls - Theme selection is removed to lock in light mode */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border bg-stone-50 border-stone-200 text-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-0 top-[60px] z-40 lg:hidden p-6 flex flex-col justify-between ${
              isLightMode ? "bg-white/95 backdrop-blur-md" : "bg-slate-950/95 backdrop-blur-md"
            }`}
          >
            <div className="space-y-4 my-auto">
              {navItems.map((item, idx) => (
                <motion.a
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-2xl font-display font-medium py-2 border-b transition-colors ${
                    isLightMode
                      ? "text-slate-800 border-slate-100 hover:text-purple-600"
                      : "text-slate-200 border-slate-900 hover:text-cyan-400"
                  }`}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-4">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-purple-600 text-white font-display font-semibold shadow-md"
              >
                Let's Talk
              </a>
              <p className="text-[10px] font-mono text-slate-500">
                L. VINAYAK // SECURE CORE // v1.0.4
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
