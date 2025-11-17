import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  agentTemplates,
  agents,
  workflows,
  workflowExecutions,
  executionLogs,
  agentMessages,
  InsertAgentTemplate,
  InsertAgent,
  InsertWorkflow,
  InsertWorkflowExecution,
  InsertExecutionLog,
  InsertAgentMessage
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Agent Templates
export async function getPublicAgentTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentTemplates).where(eq(agentTemplates.isPublic, true)).orderBy(desc(agentTemplates.createdAt));
}

export async function getUserAgentTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentTemplates).where(eq(agentTemplates.createdBy, userId)).orderBy(desc(agentTemplates.createdAt));
}

export async function createAgentTemplate(template: InsertAgentTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentTemplates).values(template);
  return result;
}

// Agents
export async function getUserAgents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.createdAt));
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agents).values(agent);
  return result;
}

export async function deleteAgent(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agents).where(and(eq(agents.id, id), eq(agents.userId, userId)));
}

// Workflows
export async function getUserWorkflows(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.createdAt));
}

export async function getWorkflowById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWorkflow(workflow: InsertWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workflows).values(workflow);
  return result;
}

export async function updateWorkflow(id: number, userId: number, updates: Partial<InsertWorkflow>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workflows).set(updates).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
}

export async function deleteWorkflow(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
}

// Workflow Executions
export async function getUserExecutions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workflowExecutions).where(eq(workflowExecutions.userId, userId)).orderBy(desc(workflowExecutions.createdAt)).limit(50);
}

export async function getExecutionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createExecution(execution: InsertWorkflowExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workflowExecutions).values(execution);
  return result;
}

export async function updateExecution(id: number, updates: Partial<InsertWorkflowExecution>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workflowExecutions).set(updates).where(eq(workflowExecutions.id, id));
}

// Execution Logs
export async function getExecutionLogs(executionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(executionLogs).where(eq(executionLogs.executionId, executionId)).orderBy(executionLogs.createdAt);
}

export async function createExecutionLog(log: InsertExecutionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(executionLogs).values(log);
}

// Agent Messages
export async function getExecutionMessages(executionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentMessages).where(eq(agentMessages.executionId, executionId)).orderBy(agentMessages.createdAt);
}

export async function createAgentMessage(message: InsertAgentMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentMessages).values(message);
}
