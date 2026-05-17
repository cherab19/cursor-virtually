import { Outlet } from "react-router-dom";

import { AdvertiserSidebar } from "@/components/dashboard/advertiser/AdvertiserSidebar";

export function AdvertiserDashboardLayout() {
  return (
    <div className="mx-auto min-h-[72vh] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start">
        <AdvertiserSidebar />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
