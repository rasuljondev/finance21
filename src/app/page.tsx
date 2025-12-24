"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BackgroundMeteorsDots } from '@/components/ui/BackgroundMeteorsDots';
import { LogIn, Shield, Award, Users, Clock, BarChart3, Mail, Phone, Sun, Moon } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const Reveal = ({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transform-gpu transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
};

const HeroBrand = () => {
  const fullLeft = "Finance";
  const fullRight = "21";

  const [spread, setSpread] = useState(false);
  const [leftText, setLeftText] = useState(fullLeft.slice(0, 1));
  const [rightText, setRightText] = useState(fullRight.slice(0, 1));

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) {
      setSpread(true);
      setLeftText(fullLeft);
      setRightText(fullRight);
      return;
    }

    const t1 = window.setTimeout(() => setSpread(true), 220);

    let raf = 0;
    const charMs = 70;
    const startTypingAt = performance.now() + 520;
    let lastL = 1;
    let lastR = 1;

    const tick = (now: number) => {
      if (now >= startTypingAt) {
        const elapsed = now - startTypingAt;
        const step = 1 + Math.floor(elapsed / charMs);

        const nextL = Math.min(fullLeft.length, step);
        const nextR = Math.min(fullRight.length, step);

        if (nextL !== lastL) {
          lastL = nextL;
          setLeftText(fullLeft.slice(0, nextL));
        }
        if (nextR !== lastR) {
          lastR = nextR;
          setRightText(fullRight.slice(0, nextR));
        }

        if (nextL >= fullLeft.length && nextR >= fullRight.length) {
          return; // done
        }
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(t1);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className="relative inline-block align-middle">
      <span className="invisible whitespace-nowrap">
        <span className="text-gray-900 dark:text-white">Finance</span>{" "}
        <span className="text-blue-600 dark:text-blue-400">21</span>
      </span>

      <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap">
        <span
          className={`inline-block text-gray-900 dark:text-white transition-transform duration-500 ease-out ${
            spread ? "-translate-x-6" : "translate-x-0"
          }`}
        >
          {leftText}
        </span>

        <span
          className={`inline-block transition-[width] duration-500 ease-out ${
            spread ? "w-4" : "w-0"
          }`}
          aria-hidden="true"
        />

        <span
          className={`inline-block text-blue-600 dark:text-blue-400 transition-transform duration-500 ease-out ${
            spread ? "translate-x-2" : "translate-x-0"
          }`}
        >
          {rightText}
        </span>
      </span>
    </span>
  );
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300">
      {/* AppBar/Menu Bar */}
      <header className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-6 lg:px-8 ${scrolled ? "pt-3" : "pt-10"}`}>
        <div className="max-w-screen-2xl mx-auto">
          <div
            className={`mx-auto w-full transition-all duration-500 ease-out will-change-transform ${
              scrolled
                ? "max-w-4xl rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl"
                : "max-w-screen-2xl rounded-none bg-transparent border border-transparent shadow-none backdrop-blur-0"
            }`}
          >
            <div
              className={`flex items-center justify-between transition-all duration-300 ${
                scrolled ? "h-12 px-2 sm:px-3" : "h-16 px-4 sm:px-6"
              }`}
            >
              {/* Left: Logo + Nav */}
              <div className={`flex items-center transition-all duration-300 ${scrolled ? "gap-3" : "gap-6"}`}>
                <div className="flex items-center shrink-0">
                  <div className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm transition-all duration-300 ${scrolled ? "h-8 w-8" : "h-10 w-10"}`} />
                </div>

                <nav className={`hidden md:flex items-center transition-all duration-300 ${scrolled ? "gap-1" : "gap-4"}`}>
                  <button
                    type="button"
                    onClick={() => scrollToId("home")}
                    className={`rounded-lg font-medium text-gray-700 hover:text-gray-900 hover:bg-white/60 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700/40 transition-all duration-300 ${
                      scrolled ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId("why-us")}
                    className={`rounded-lg font-medium text-gray-700 hover:text-gray-900 hover:bg-white/60 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700/40 transition-all duration-300 ${
                      scrolled ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                    }`}
                  >
                    Features
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId("contact-us")}
                    className={`rounded-lg font-medium text-gray-700 hover:text-gray-900 hover:bg-white/60 dark:text-gray-200 dark:hover:text-white dark:hover:bg-gray-700/40 transition-all duration-300 ${
                      scrolled ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
                    }`}
                  >
                    Contact
                  </button>
                </nav>
              </div>

              {/* Icons and Login Button */}
              <div className={`flex items-center shrink-0 transition-all duration-300 ${scrolled ? "gap-2" : "gap-6"}`}>
                <div className="flex justify-center p-1 rounded-2xl">
                  <ThemeToggle />
                </div>

                <Button
                  size={scrolled ? "sm" : "md"}
                  onClick={() => router.push("/login")}
                  leftIcon={<LogIn className="w-4 h-4" />}
                  className={`transition-all duration-300 ${
                    scrolled
                      ? "bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-1.5"
                      : "bg-blue-600/80 text-white hover:bg-blue-700"
                  }`}
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <BackgroundMeteorsDots className="flex-1 flex items-center justify-center relative overflow-hidden min-h-screen pt-28 sm:pt-32">
        <div id="home" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 text-center scroll-mt-28">
          <div className="mb-8">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">
              <HeroBrand />
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed transition-colors">
              Modern online accounting platform
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed transition-colors">
              Finance21 — makes it easy for your company to manage accounting,
              handle documents, and automate processes.
            </p>
          </div>
        </div>
      </BackgroundMeteorsDots>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal delayMs={0}>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
                Why Choose Us?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
                Increase your company&apos;s efficiency with us
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Reveal delayMs={0}>
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Secure Platform</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  Your data is protected with high-level security measures.
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={80}>
              <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Quality Guarantee</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  Our services meet international standards.
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={160}>
              <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Multi-User System</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  Manage different access levels for employees.
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={0}>
              <div className="p-6 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Time Saving</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  Save significant time with automated processes.
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={80}>
              <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Analytics</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  View all reports in a convenient and visual format.
                </p>
              </div>
            </Reveal>

            <Reveal delayMs={160}>
              <div className="p-6 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Quick Support</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                  Our technical support team is always ready to help.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 transition-colors scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal delayMs={0}>
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
                Contact
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
                Have questions? Get in touch with us
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-12">
            <Reveal delayMs={0}>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Contacts</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors">Email</h4>
                      <p className="text-gray-600 dark:text-gray-300 transition-colors">info@finance21.uz</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 transition-colors">Phone</h4>
                      <p className="text-gray-600 dark:text-gray-300 transition-colors">+998992200880</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Send Message</h3>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="example@mail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                      placeholder="Leave your message..."
                    ></textarea>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Send
                  </Button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal delayMs={0} className="border-t border-gray-800 py-8 text-center text-sm text-gray-400">
                    <p>&copy; 2025 Finance21. All rights reserved.</p>
          </Reveal>
        </div>
      </footer>
    </div>
  );
}
