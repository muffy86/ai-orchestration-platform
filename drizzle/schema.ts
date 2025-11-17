import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agent Templates - Reusable agent configurations
 */
export const agentTemplates = mysqlTable("agent_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  role: text("role").notNull(), // Agent's role description
  goal: text("goal").notNull(), // Agent's goal
  backstory: text("backstory"), // Agent's backstory for context
  systemPrompt: text("systemPrompt"), // Custom system prompt
  icon: varchar("icon", { length: 255 }), // Icon identifier
  category: varchar("category", { length: 100 }), // e.g., "research", "writing", "analysis"
  isPublic: boolean("isPublic").default(false).notNull(), // Public templates vs user-created
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentTemplate = typeof agentTemplates.$inferSelect;
export type InsertAgentTemplate = typeof agentTemplates.$inferInsert;

/**
 * Agent Instances - Configured agents ready to be used in workflows
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId"), // Optional reference to template
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  role: text("role").notNull(),
  goal: text("goal").notNull(),
  backstory: text("backstory"),
  systemPrompt: text("systemPrompt"),
  config: json("config").$type<{
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
  }>(), // Agent configuration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Workflows - Multi-agent orchestration definitions
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  orchestrationType: mysqlEnum("orchestrationType", ["sequential", "parallel", "hierarchical"]).notNull(),
  config: json("config").$type<{
    agents: Array<{
      agentId: number;
      order?: number;
      dependencies?: number[];
    }>;
    tasks: Array<{
      id: string;
      agentId: number;
      description: string;
      expectedOutput: string;
    }>;
  }>().notNull(), // Workflow configuration
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Workflow Executions - Track workflow runs
 */
export const workflowExecutions = mysqlTable("workflow_executions", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  input: text("input"), // Input data for the workflow
  output: text("output"), // Final output
  error: text("error"), // Error message if failed
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

/**
 * Execution Logs - Detailed logs for each step
 */
export const executionLogs = mysqlTable("execution_logs", {
  id: int("id").autoincrement().primaryKey(),
  executionId: int("executionId").notNull(),
  agentId: int("agentId"),
  taskId: varchar("taskId", { length: 255 }),
  logType: mysqlEnum("logType", ["info", "error", "warning", "agent_output"]).notNull(),
  message: text("message").notNull(),
  metadata: json("metadata").$type<{
    tokens?: number;
    duration?: number;
    model?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = typeof executionLogs.$inferInsert;

/**
 * Agent Messages - Conversation history between agents
 */
export const agentMessages = mysqlTable("agent_messages", {
  id: int("id").autoincrement().primaryKey(),
  executionId: int("executionId").notNull(),
  fromAgentId: int("fromAgentId"),
  toAgentId: int("toAgentId"),
  role: mysqlEnum("role", ["system", "user", "assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata").$type<{
    taskId?: string;
    tokens?: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;
