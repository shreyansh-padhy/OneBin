"use client";

import React, { useEffect, useState, useRef } from "react";

interface TeamMember {
  name: string;
  role: string;
  url: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Bhaswath Datla",
    role: "Full-Stack & Systems",
    url: "https://www.linkedin.com/in/bhaswath-datla",
  },
  {
    name: "Shreyansh Padhy",
    role: "ML & Computer Vision",
    url: "https://www.linkedin.com/in/shreyansh-padhy",
  },
  {
    name: "Krishna Pratheek Madamala",
    role: "Engineering",
    url: "https://www.linkedin.com/in/krishna-pratheek-madamala-9a9592264",
  },
  {
    name: "Gaurav Dhongade",
    role: "Engineering",
    url: "https://www.linkedin.com/in/gdhongade",
  },
];

export default function VerticalDock() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure default is light theme and clean up previous system dark-mode preference
    if (!localStorage.getItem("project-theme-default-v2")) {
      localStorage.removeItem("project-theme");
      localStorage.setItem("project-theme-default-v2", "true");
    }

    const savedTheme = localStorage.getItem("project-theme") as "light" | "dark" | null;
    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setIsTeamOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTeamOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("project-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <nav className="vertical-dock" aria-label="Quick links" ref={flyoutRef}>
      {/* GitHub Repo */}
      <a
        href="https://github.com/shreyansh-padhy/OneBin"
        target="_blank"
        rel="noopener noreferrer"
        className="dock-btn"
        aria-label="GitHub Repository"
      >
        <svg viewBox="0 0 24 24" className="dock-icon">
          <path
            fill="currentColor"
            d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
          />
        </svg>
        <span className="dock-tooltip">Repository</span>
      </a>

      {/* LinkedIn Team Toggle */}
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsTeamOpen((prev) => !prev)}
          onMouseEnter={() => setIsTeamOpen(true)}
          className="dock-btn"
          aria-expanded={isTeamOpen}
          aria-haspopup="dialog"
          aria-label="Team LinkedIn Profiles"
        >
          <svg viewBox="0 0 24 24" className="dock-icon">
            <path
              fill="currentColor"
              d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
            />
          </svg>
          <span className="dock-tooltip">Team LinkedIn</span>
        </button>

        {/* LinkedIn Flyout Menu */}
        {isTeamOpen && (
          <div
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-64 rounded-xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 z-50 animate-in fade-in zoom-in-95 duration-150"
            role="menu"
            aria-orientation="vertical"
            aria-label="Team members"
          >
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Team LinkedIn
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                OneBin Team
              </span>
            </div>
            <div className="space-y-1">
              {TEAM_MEMBERS.map((member) => (
                <a
                  key={member.name}
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 group"
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {member.role}
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider Line */}
      <div className="dock-separator" />

      {/* Theme Toggle Button */}
      <button
        id="theme-toggle"
        onClick={toggleTheme}
        className="dock-btn"
        aria-label="Toggle color theme"
      >
        <svg
          id="theme-icon"
          viewBox="0 0 24 24"
          className="dock-icon-stroke"
        >
          {theme === "dark" ? (
            /* Sun Icon */
            <>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </>
          ) : (
            /* Moon Icon */
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          )}
        </svg>
        <span className="dock-tooltip">Switch Theme</span>
      </button>
    </nav>
  );
}
