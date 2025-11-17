import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Agent Templates
  agentTemplates: router({
    listPublic: publicProcedure.query(async () => {
      return await db.getPublicAgentTemplates();
    }),
    listMine: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAgentTemplates(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        role: z.string(),
        goal: z.string(),
        backstory: z.string().optional(),
        systemPrompt: z.string().optional(),
        icon: z.string().optional(),
        category: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createAgentTemplate({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // Agents
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAgents(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgentById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        role: z.string(),
        goal: z.string(),
        backstory: z.string().optional(),
        systemPrompt: z.string().optional(),
        templateId: z.number().optional(),
        config: z.object({
          model: z.string().optional(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional(),
          tools: z.array(z.string()).optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createAgent({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAgent(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Workflows
  workflows: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWorkflows(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getWorkflowById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        orchestrationType: z.enum(["sequential", "parallel", "hierarchical"]),
        config: z.object({
          agents: z.array(z.object({
            agentId: z.number(),
            order: z.number().optional(),
            dependencies: z.array(z.number()).optional(),
          })),
          tasks: z.array(z.object({
            id: z.string(),
            agentId: z.number(),
            description: z.string(),
            expectedOutput: z.string(),
          })),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createWorkflow({
          ...input,
          userId: ctx.user.id,
          isActive: true,
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        config: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateWorkflow(id, ctx.user.id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWorkflow(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Workflow Executions
  executions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserExecutions(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getExecutionById(input.id);
      }),
    getLogs: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExecutionLogs(input.executionId);
      }),
    getMessages: protectedProcedure
      .input(z.object({ executionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExecutionMessages(input.executionId);
      }),
    execute: protectedProcedure
      .input(z.object({
        workflowId: z.number(),
        input: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create execution record
        const result = await db.createExecution({
          workflowId: input.workflowId,
          userId: ctx.user.id,
          input: input.input,
          status: "pending",
        });
        
        // Start execution asynchronously
        const executionId = Number((result as any).insertId);
        
        // Import and start execution
        const { executeWorkflow } = await import("./workflowEngine");
        executeWorkflow(executionId).catch(console.error);
        
        return { executionId };
      }),
  }),
});

export type AppRouter = typeof appRouter;
