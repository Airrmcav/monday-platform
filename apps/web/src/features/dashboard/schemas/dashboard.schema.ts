import { z } from "zod";

const dashboardTaskStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
]);

const dashboardTaskPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

const dashboardHistoryActionSchema = z.enum([
  "CREATED",
  "UPDATED",
  "STATUS_CHANGED",
  "BLOCKED",
  "UNBLOCKED",
  "BLOCK_REASON_CHANGED",
]);

const dashboardTaskItemSchema = z.strictObject({
  id: z.uuid(),
  title: z.string().min(1),
  dueAt: z.iso.datetime({
    offset: true,
  }),
  priority: dashboardTaskPrioritySchema,
  status: dashboardTaskStatusSchema,
  workspace: z.strictObject({
    id: z.uuid(),
    name: z.string().min(1),
    area: z.strictObject({
      id: z.uuid(),
      name: z.string().min(1),
    }),
  }),
});

const dashboardActivitySchema = z.strictObject({
  id: z.uuid(),
  action: dashboardHistoryActionSchema,
  actorName: z.string().min(1),
  createdAt: z.iso.datetime({
    offset: true,
  }),
  task: z.strictObject({
    id: z.uuid(),
    title: z.string().min(1),
    workspace: z.strictObject({
      id: z.uuid(),
      name: z.string().min(1),
    }),
  }),
});

export const dashboardSummarySchema = z.strictObject({
  viewer: z.strictObject({
    name: z.string().min(1),
    isAdmin: z.boolean(),
  }),

  metrics: z.strictObject({
    activeWorkspaces: z.number().int().nonnegative(),
    totalTasks: z.number().int().nonnegative(),
    activeTasks: z.number().int().nonnegative(),
    completedTasks: z.number().int().nonnegative(),
    overdueTasks: z.number().int().nonnegative(),
    dueNextSevenDays: z.number().int().nonnegative(),
    urgentTasks: z.number().int().nonnegative(),
    completionRate: z.number().int().min(0).max(100),
  }),

  tasksByStatus: z.strictObject({
    PENDING: z.number().int().nonnegative(),
    IN_PROGRESS: z.number().int().nonnegative(),
    IN_REVIEW: z.number().int().nonnegative(),
    COMPLETED: z.number().int().nonnegative(),
  }),

  tasksByPriority: z.strictObject({
    LOW: z.number().int().nonnegative(),
    NORMAL: z.number().int().nonnegative(),
    HIGH: z.number().int().nonnegative(),
    URGENT: z.number().int().nonnegative(),
  }),

  attentionTasks: z.array(dashboardTaskItemSchema).max(5),

  upcomingTasks: z.array(dashboardTaskItemSchema).max(5),

  recentActivity: z.array(dashboardActivitySchema).max(6),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
