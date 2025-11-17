import { invokeLLM } from "./_core/llm";
import * as db from "./db";

interface TaskResult {
  taskId: string;
  agentId: number;
  output: string;
  success: boolean;
  error?: string;
}

export async function executeWorkflow(executionId: number) {
  try {
    // Get execution details
    const execution = await db.getExecutionById(executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }

    // Get workflow details
    const workflow = await db.getWorkflowById(execution.workflowId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Update status to running
    await db.updateExecution(executionId, {
      status: "running",
      startedAt: new Date(),
    });

    await db.createExecutionLog({
      executionId,
      logType: "info",
      message: `Starting workflow: ${workflow.name}`,
    });

    // Execute based on orchestration type
    let results: TaskResult[] = [];
    
    switch (workflow.orchestrationType) {
      case "sequential":
        results = await executeSequential(executionId, workflow, execution.input || "");
        break;
      case "parallel":
        results = await executeParallel(executionId, workflow, execution.input || "");
        break;
      case "hierarchical":
        results = await executeHierarchical(executionId, workflow, execution.input || "");
        break;
    }

    // Check if all tasks succeeded
    const allSucceeded = results.every(r => r.success);
    const finalOutput = results.map(r => `Agent ${r.agentId}: ${r.output}`).join("\n\n");

    // Update execution with results
    await db.updateExecution(executionId, {
      status: allSucceeded ? "completed" : "failed",
      output: finalOutput,
      completedAt: new Date(),
      error: allSucceeded ? undefined : "Some tasks failed",
    });

    await db.createExecutionLog({
      executionId,
      logType: "info",
      message: `Workflow ${allSucceeded ? "completed successfully" : "failed"}`,
    });

  } catch (error) {
    console.error("Workflow execution error:", error);
    await db.updateExecution(executionId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      completedAt: new Date(),
    });

    await db.createExecutionLog({
      executionId,
      logType: "error",
      message: `Workflow failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

async function executeSequential(executionId: number, workflow: any, input: string): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  let currentInput = input;

  // Sort tasks by order
  const tasks = [...workflow.config.tasks].sort((a: any, b: any) => {
    const aAgent = workflow.config.agents.find((ag: any) => ag.agentId === a.agentId);
    const bAgent = workflow.config.agents.find((ag: any) => ag.agentId === b.agentId);
    return (aAgent?.order || 0) - (bAgent?.order || 0);
  });

  for (const task of tasks) {
    const result = await executeTask(executionId, task, currentInput);
    results.push(result);
    
    if (result.success) {
      currentInput = result.output; // Pass output to next task
    } else {
      break; // Stop on first failure
    }
  }

  return results;
}

async function executeParallel(executionId: number, workflow: any, input: string): Promise<TaskResult[]> {
  const tasks = workflow.config.tasks;
  
  // Execute all tasks in parallel
  const results = await Promise.all(
    tasks.map((task: any) => executeTask(executionId, task, input))
  );

  return results;
}

async function executeHierarchical(executionId: number, workflow: any, input: string): Promise<TaskResult[]> {
  // For hierarchical, we'll use a supervisor agent pattern
  // First agent is the supervisor, others are workers
  const tasks = workflow.config.tasks;
  const supervisorTask = tasks[0];
  const workerTasks = tasks.slice(1);

  // Execute supervisor first
  const supervisorResult = await executeTask(executionId, supervisorTask, input);
  
  if (!supervisorResult.success) {
    return [supervisorResult];
  }

  // Execute workers in parallel with supervisor's output
  const workerResults = await Promise.all(
    workerTasks.map((task: any) => executeTask(executionId, task, supervisorResult.output))
  );

  // Combine results
  const combinedOutput = workerResults.map(r => r.output).join("\n\n");
  
  // Final supervisor review
  const finalTask = {
    ...supervisorTask,
    id: `${supervisorTask.id}-final`,
    description: `Review and synthesize the following outputs: ${combinedOutput}`,
  };
  
  const finalResult = await executeTask(executionId, finalTask, combinedOutput);

  return [supervisorResult, ...workerResults, finalResult];
}

async function executeTask(executionId: number, task: any, input: string): Promise<TaskResult> {
  try {
    // Get agent details
    const agent = await db.getAgentById(task.agentId);
    if (!agent) {
      throw new Error(`Agent ${task.agentId} not found`);
    }

    await db.createExecutionLog({
      executionId,
      agentId: agent.id,
      taskId: task.id,
      logType: "info",
      message: `Starting task: ${task.description}`,
    });

    // Build system prompt
    const systemPrompt = agent.systemPrompt || `You are ${agent.role}. ${agent.goal}. ${agent.backstory || ""}`;

    // Build user prompt with task context
    const userPrompt = `Task: ${task.description}\n\nInput: ${input}\n\nExpected Output: ${task.expectedOutput}`;

    // Log the message
    await db.createAgentMessage({
      executionId,
      fromAgentId: null as any,
      toAgentId: agent.id,
      role: "user",
      content: userPrompt,
    });

    // Execute LLM call
    const startTime = Date.now();
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const duration = Date.now() - startTime;
    const rawContent = response.choices[0]?.message?.content;
    const output = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

    // Log the response
    await db.createAgentMessage({
      executionId,
      fromAgentId: agent.id,
      toAgentId: null as any,
      role: "assistant",
      content: output,
      metadata: {
        taskId: task.id,
        tokens: response.usage?.total_tokens,
      },
    });

    await db.createExecutionLog({
      executionId,
      agentId: agent.id,
      taskId: task.id,
      logType: "agent_output",
      message: output,
      metadata: {
        tokens: response.usage?.total_tokens,
        duration,
        model: agent.config?.model || "default",
      },
    });

    return {
      taskId: task.id,
      agentId: agent.id,
      output,
      success: true,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await db.createExecutionLog({
      executionId,
      agentId: task.agentId,
      taskId: task.id,
      logType: "error",
      message: `Task failed: ${errorMessage}`,
    });

    return {
      taskId: task.id,
      agentId: task.agentId,
      output: "",
      success: false,
      error: errorMessage,
    };
  }
}
