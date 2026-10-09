import type { UserTaskSummary } from "@/features/users/schemas/users.schemas";

export type NavigationUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  taskSummary: UserTaskSummary | null;
  isAdmin: boolean;
};

export type WorkspaceNavigationArea = {
  id: string;
  name: string;
  workspaces: Array<{
    id: string;
    name: string;
  }>;
};
