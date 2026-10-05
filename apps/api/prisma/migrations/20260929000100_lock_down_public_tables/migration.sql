ALTER TABLE "app_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "areas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_history_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_attachments" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE "app_users" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "areas" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "workspaces" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "workspace_members" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "tasks" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "task_participants" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "task_history_entries" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "task_comments" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE "task_attachments" FROM anon, authenticated;