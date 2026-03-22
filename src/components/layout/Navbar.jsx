"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  FolderGit2,
  TestTube2,
  BookOpen,
  Mail,
  Circle,
  Terminal as TerminalIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useTerminal } from "../../context/TerminalContext";

const navLinks = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Work", href: "/work", icon: FolderGit2 },
  { name: "Lab", href: "/lab", icon: TestTube2 },
  { name: "Journal", href: "/blog", icon: BookOpen },
  { name: "Connect", href: "/contact", icon: Mail },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { toggleTerminalMode } = useTerminal();
  const pathname = usePathname();

  return (
    <>
      {/* ---- Desktop Sidebar ---- */}
      <motion.nav
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="hidden md:flex fixed left-0 top-0 h-screen w-20 lg:w-64 bg-forge-surface/80 backdrop-blur-xl border-r border-forge-muted/20 flex-col justify-between py-8 transition-all duration-300 z-50 overflow-y-auto"
      >
        <div className="flex flex-col items-center lg:items-start px-0 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12" title="Home" aria-label="EmberOS Home">
            <div className="w-10 h-10 relative shrink-0">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" fill="#F97316" />
                <text
                  x="20"
                  y="26"
                  textAnchor="middle"
                  fill="#0A0A0A"
                  fontSize="14"
                  fontWeight="800"
                  fontFamily="Syne"
                >
                  PC
                </text>
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-white hidden lg:block tracking-wide">
              EmberOS
            </span>
          </Link>

          {/* Nav Links */}
          <div className="w-full flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-label={link.name}
                  className={`relative flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl transition-all group ${
                    isActive
                      ? "text-orange-500 bg-orange-500/10"
                      : "text-gray-400 hover:text-white hover:bg-forge-muted/20"
                  }`}
                  title={link.name}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 w-1 h-1/2 bg-orange-500 rounded-r-md hidden lg:block"
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-orange-500" : "group-hover:text-white"
                    }`}
                  />
                  <span className="font-medium text-sm hidden lg:block">
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col items-center lg:items-start px-0 lg:px-8 gap-4">
          <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 mb-4">
            <button
              onClick={toggleTerminalMode}
              className="p-3 bg-forge-muted/10 rounded-xl hover:bg-forge-muted/30 transition-colors group"
              title="Terminal Mode"
              aria-label="Open Terminal"
            >
              <TerminalIcon className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-3 bg-forge-muted/10 rounded-xl hover:bg-forge-muted/30 transition-colors"
              title="Toggle Theme"
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          <div className="flex flex-col items-center lg:flex-row lg:items-center gap-2 p-3 bg-forge-muted/10 rounded-xl w-full justify-center lg:justify-start border border-forge-muted/20 text-xs">
            <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse shrink-0" />
            <span className="text-gray-400 hidden lg:inline">
              Status:{" "}
              <span className="text-white font-medium">Online</span>
            </span>
          </div>
        </div>
      </motion.nav>

      {/* ---- Mobile Bottom Navigation Bar ---- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-forge-surface/95 backdrop-blur-xl border-t border-forge-muted/20 flex items-center justify-around z-50 px-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              aria-label={link.name}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                isActive ? "text-orange-500" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">{link.name}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleTerminalMode}
          aria-label="Open Terminal"
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl text-gray-500 hover:text-orange-500 transition-colors"
        >
          <TerminalIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">CLI</span>
        </button>
      </nav>
    </>
  );
}
