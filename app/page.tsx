"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  MessageSquare,
  GitCompare,
  BarChart3,
  Compass,
  FileSearch,
  Sparkles,
  ShieldCheck,
  Workflow,
  Sun,
  Moon,
  Home,
} from "lucide-react";
import PolicyFinder from "@/components/features/PolicyFinder";
import QAInterface from "@/components/features/QAInterface";
import PolicyComparator from "@/components/features/PolicyComparator";
import Dashboard from "@/components/features/Dashboard";
import ManualUpload from "@/components/features/ManualUpload";

type TabKey = "search" | "qa" | "compare" | "dashboard";

export default function TeleCompassHome() {
  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const topRef = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<TabKey, React.RefObject<HTMLDivElement>> = {
    search: useRef<HTMLDivElement>(null),
    qa: useRef<HTMLDivElement>(null),
    compare: useRef<HTMLDivElement>(null),
    dashboard: useRef<HTMLDivElement>(null),
  };

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleTabChange = (value: TabKey) => {
    setActiveTab(value);
    scrollToRef(sectionRefs[value]);
  };

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div
      ref={topRef}
      className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as TabKey)}
        className="flex min-h-screen flex-col"
      >
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-red-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
                  TeleCompass
                </h1>
                <p className="text-xs text-muted-foreground">
                  Telehealth Policy Intelligence Platform
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
              <TabsList className="flex w-full flex-wrap justify-center gap-2 rounded-full bg-rose-100/60 p-1 text-sm shadow-sm dark:bg-slate-800/70">
                <TabsTrigger
                  value="search"
                  onClick={() => handleTabChange("search")}
                  className="gap-2 rounded-full px-4 py-2 font-medium text-rose-700 transition-all data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-rose-300"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </TabsTrigger>
                <TabsTrigger
                  value="qa"
                  onClick={() => handleTabChange("qa")}
                  className="gap-2 rounded-full px-4 py-2 font-medium text-rose-700 transition-all data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-rose-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Q&A</span>
                </TabsTrigger>
                <TabsTrigger
                  value="compare"
                  onClick={() => handleTabChange("compare")}
                  className="gap-2 rounded-full px-4 py-2 font-medium text-rose-700 transition-all data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-rose-300"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Compare</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  onClick={() => handleTabChange("dashboard")}
                  className="gap-2 rounded-full px-4 py-2 font-medium text-rose-700 transition-all data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-rose-300"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollToTop}
                className="self-center rounded-full border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-slate-700 dark:text-rose-200 dark:hover:bg-slate-800"
                aria-label="Scroll to top"
              >
                <Home className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="self-center rounded-full border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-slate-700 dark:text-rose-200 dark:hover:bg-slate-800"
                aria-label="Toggle color mode"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto w-full px-4 py-12 space-y-12 flex-1">
          {/* Hero */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-4 py-1 text-sm text-rose-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-rose-200">
              <Compass className="h-4 w-4" />
              Local-first telehealth policy intelligence
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-red-900 sm:text-4xl dark:text-rose-100">
              Navigate state telehealth laws with a single, AI-powered workspace
            </h2>
            <p className="text-base text-muted-foreground sm:text-lg">
              TeleCompass ingests telehealth policy PDFs, extracts structured facts, and equips teams with
              semantic search, trusted Q&A, policy comparisons, and dashboards—powered entirely on your local stack.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => handleTabChange("search")}
              className="bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md hover:from-rose-500 hover:to-red-500"
            >
              Launch App
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const element = document.getElementById("telecompass-services");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-slate-700 dark:text-rose-200 dark:hover:bg-slate-800"
            >
              View Platform Services
            </Button>
          </div>
          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            <div className="rounded-lg border border-rose-100 bg-white/70 px-5 py-4 text-sm text-rose-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-rose-200">
              <span className="font-semibold">51</span> state telehealth policies processed in minutes
            </div>
            <div className="rounded-lg border border-rose-100 bg-white/70 px-5 py-4 text-sm text-rose-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-rose-200">
              <span className="font-semibold">300+</span> structured facts surfaced for instant comparisons
            </div>
            <div className="rounded-lg border border-rose-100 bg-white/70 px-5 py-4 text-sm text-rose-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-rose-200">
              <span className="font-semibold">100%</span> local AI pipeline via Ollama—no external APIs
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section id="telecompass-services" className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold text-red-900 dark:text-rose-100">Everything compliance teams need in one console</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each module is purpose-built to keep clinicians, legal, and operations aligned on evolving state regulations.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Card className="h-full border-rose-100 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center dark:bg-rose-300/20 dark:text-rose-200">
                  <FileSearch className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Policy Finder</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Semantic search with instant context, page-level citations, and state filters.</p>
                <p>Embed ingestion keeps every PDF chunk discoverable within seconds.</p>
              </CardContent>
            </Card>

            <Card className="h-full border-rose-100 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center dark:bg-rose-300/20 dark:text-rose-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">RAG Q&A</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Ask natural questions and receive grounded answers with confidence scoring.</p>
                <p>Every response cites the originating policy lines for auditable compliance.</p>
              </CardContent>
            </Card>

            <Card className="h-full border-rose-100 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center dark:bg-rose-300/20 dark:text-rose-200">
                  <Workflow className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Policy Comparator</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Side-by-side tables that highlight modality, consent, billing, and provider differences.</p>
                <p>Export comparisons to CSV or Excel for board decks and audits.</p>
              </CardContent>
            </Card>

            <Card className="h-full border-rose-100 bg-white/70 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center dark:bg-rose-300/20 dark:text-rose-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Command Center</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Dashboard insights show coverage by state, data freshness, and ingestion health.</p>
                <p>Built for legal defensibility with full processing logs and local data control.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <TabsContent value="search" className="space-y-4">
          <div ref={sectionRefs.search} className="scroll-mt-32">
            <PolicyFinder />
          </div>
        </TabsContent>

        <TabsContent value="qa" className="space-y-4">
          <div ref={sectionRefs.qa} className="scroll-mt-32">
            <QAInterface />
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <div ref={sectionRefs.compare} className="scroll-mt-32">
            <PolicyComparator />
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div ref={sectionRefs.dashboard} className="space-y-4 scroll-mt-32">
            {process.env.NEXT_PUBLIC_ENABLE_UPLOAD === "true" ? <ManualUpload /> : null}
            <Dashboard />
          </div>
        </TabsContent>
        </main>
      </Tabs>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-white/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            TeleCompass © 2024 - AI-powered telehealth policy analysis
          </p>
          <p className="mt-2">
            All rights reserved. Referenced source:{" "}
            <a
              href="https://www.cchpca.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted hover:decoration-solid"
            >
              https://www.cchpca.org/
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
