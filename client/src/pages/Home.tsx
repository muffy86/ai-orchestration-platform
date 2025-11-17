import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Bot, Workflow, Zap, ArrowRight, GitBranch, Users, BarChart3 } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">Get Started</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400 border border-blue-500/20">
            <Zap className="h-4 w-4" />
            <span>Advanced Multi-Agent AI Orchestration</span>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
            Build Intelligent AI Systems with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Multi-Agent Orchestration
            </span>
          </h1>
          
          <p className="mb-8 text-xl text-slate-400">
            Create sophisticated AI workflows by coordinating multiple specialized agents. 
            From research to content creation, automate complex tasks with intelligent collaboration.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Start Building <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<GitBranch className="h-8 w-8 text-blue-400" />}
            title="Flexible Orchestration"
            description="Choose from sequential, parallel, or hierarchical patterns to coordinate your AI agents based on your workflow needs."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-cyan-400" />}
            title="Specialized Agents"
            description="Create agents with specific roles, goals, and expertise. Each agent focuses on what it does best for optimal results."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-purple-400" />}
            title="Real-time Monitoring"
            description="Track execution progress, view agent conversations, and analyze performance metrics in real-time."
          />
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            What Can You Build?
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <UseCase
              title="Research & Analysis"
              description="Deploy researcher agents to gather data, analyst agents to process it, and writer agents to create comprehensive reports."
            />
            <UseCase
              title="Content Creation"
              description="Coordinate ideation, research, writing, and editing agents to produce high-quality content at scale."
            />
            <UseCase
              title="Customer Service"
              description="Route inquiries through specialized support agents, each handling specific domains for faster resolution."
            />
            <UseCase
              title="Data Processing"
              description="Build pipelines with agents for ingestion, transformation, analysis, and visualization of complex datasets."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to Build Your AI Orchestration System?
          </h2>
          <p className="mb-8 text-lg text-blue-50">
            Start creating intelligent multi-agent workflows in minutes.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2025 {APP_TITLE}. Built with advanced AI orchestration technology.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-slate-700">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

function UseCase({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-6">
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
