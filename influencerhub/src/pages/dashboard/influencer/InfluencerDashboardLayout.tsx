import { Outlet } from "react-router-dom";

import { InfluencerOnboardingWizard } from "@/components/dashboard/influencer/InfluencerOnboardingWizard";
import { InfluencerSidebar } from "@/components/dashboard/influencer/InfluencerSidebar";
import { useInfluencerMe } from "@/hooks/use-influencer-me";

export function InfluencerDashboardLayout() {
  const infQ = useInfluencerMe();
  const busy = infQ.isLoading;
  const needsOnboarding =
    !busy && (!infQ.data || !infQ.data.onboarding_completed);

  return (
    <div className="mx-auto min-h-[72vh] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start">
        <InfluencerSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
      <InfluencerOnboardingWizard open={needsOnboarding} />
    </div>
  );
}
