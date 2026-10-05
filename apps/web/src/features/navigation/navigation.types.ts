export type NavigationUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
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
