import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Workflow, Play, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: agents } = trpc.agents.list.useQuery();
  const { data: workflows } = trpc.workflows.list.useQuery();
  const { data: executions } = trpc.executions.list.useQuery();

  const stats = [
    {
      title: "Total Agents",
      value: agents?.length || 0,
      icon: <Bot className="h-4 w-4" />,
      link: "/agents",
    },
    {
      title: "Active Workflows",
      value: workflows?.filter(w => w.isActive).length || 0,
      icon: <Workflow className="h-4 w-4" />,
      link: "/workflows",
    },
    {
      title: "Total Executions",
      value: executions?.length || 0,
      icon: <Play className="h-4 w-4" />,
      link: "/executions",
    },
    {
      title: "Success Rate",
      value: executions?.length
        ? `${Math.round((executions.filter(e => e.status === "completed").length / executions.length) * 100)}%`
        : "0%",
      icon: <TrendingUp className="h-4 w-4" />,
      link: "/executions",
    },
  ];

  const recentExecutions = executions?.slice(0, 5) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your AI orchestration platform
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.link}>
              <Card className="cursor-pointer transition-all hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/agents">
              <Button variant="outline" className="gap-2">
                <Bot className="h-4 w-4" />
                Create Agent
              </Button>
            </Link>
            <Link href="/workflows">
              <Button variant="outline" className="gap-2">
                <Workflow className="h-4 w-4" />
                Build Workflow
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Latest workflow runs</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExecutions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No executions yet</p>
            ) : (
              <div className="space-y-4">
                {recentExecutions.map((execution) => (
                  <Link key={execution.id} href={`/executions/${execution.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-all hover:border-primary cursor-pointer">
                      <div>
                        <p className="font-medium">Execution #{execution.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(execution.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                        execution.status === "completed" ? "bg-green-500/10 text-green-500" :
                        execution.status === "failed" ? "bg-red-500/10 text-red-500" :
                        execution.status === "running" ? "bg-blue-500/10 text-blue-500" :
                        "bg-gray-500/10 text-gray-500"
                      }`}>
                        {execution.status}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
