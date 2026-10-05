import { resolveDashboardPeriod } from "@/features/dashboard/period";
import DashboardPage from "@/features/dashboard/components/dashboard-content";

type DashboardRouteProps = {
  searchParams: Promise<{
    period?: string | string[];
    date?: string | string[];
  }>;
};

export default async function DashboardContent({
  searchParams,
}: DashboardRouteProps) {
  const query = await searchParams;
  const requestedPeriod = Array.isArray(query.period)
    ? query.period[0]
    : query.period;
  const requestedDate = Array.isArray(query.date) ? query.date[0] : query.date;
  const selection = resolveDashboardPeriod(requestedPeriod, requestedDate);

  return <DashboardPage selection={selection} />;
}
