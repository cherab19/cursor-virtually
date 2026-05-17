import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/auth-context";
import { MessagingProvider } from "@/context/messaging-context";
import { AdminDashboardPage } from "@/pages/dashboard/AdminDashboardPage";
import { AdminApprovalsPage } from "@/pages/dashboard/admin/AdminApprovalsPage";
import { AdminOverviewPage } from "@/pages/dashboard/admin/AdminOverviewPage";
import { AdminPaymentsPage } from "@/pages/dashboard/admin/AdminPaymentsPage";
import { AdminUsersPage } from "@/pages/dashboard/admin/AdminUsersPage";
import { AdvertiserApplicationsPage } from "@/pages/dashboard/advertiser/AdvertiserApplicationsPage";
import { AdvertiserCampaignFormPage } from "@/pages/dashboard/advertiser/AdvertiserCampaignFormPage";
import { AdvertiserCampaignListPage } from "@/pages/dashboard/advertiser/AdvertiserCampaignListPage";
import { AdvertiserDashboardLayout } from "@/pages/dashboard/advertiser/AdvertiserDashboardLayout";
import { AdvertiserDiscoverPage } from "@/pages/dashboard/advertiser/AdvertiserDiscoverPage";
import { AdvertiserOverviewPage } from "@/pages/dashboard/advertiser/AdvertiserOverviewPage";
import { AdvertiserPlaceholderPage } from "@/pages/dashboard/advertiser/AdvertiserPlaceholderPage";
import { InfluencerDashboardLayout } from "@/pages/dashboard/influencer/InfluencerDashboardLayout";
import { InfluencerOverviewPage } from "@/pages/dashboard/influencer/InfluencerOverviewPage";
import { InfluencerPlaceholderPage } from "@/pages/dashboard/influencer/InfluencerPlaceholderPage";
import { MessagesInboxPage } from "@/pages/dashboard/messages/MessagesInboxPage";
import { InfluencerProfileSettingsPage } from "@/pages/dashboard/influencer/InfluencerProfileSettingsPage";
import { AuthPage } from "@/pages/AuthPage";
import { DirectoryPage } from "@/pages/DirectoryPage";
import { InfluencerProfilePage } from "@/pages/InfluencerProfilePage";
import { LandingPage } from "@/pages/LandingPage";
import { PricingPage } from "@/pages/PricingPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MessagingProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<LandingPage />} />
              <Route path="directory" element={<DirectoryPage />} />
              <Route
                path="influencer/:id"
                element={<InfluencerProfilePage />}
              />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="auth" element={<AuthPage />} />
            </Route>

            <Route
              path="dashboard/influencer"
              element={
                <ProtectedRoute allowedRoles={["influencer", "admin"]}>
                  <InfluencerDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<InfluencerOverviewPage />} />
              <Route
                path="profile"
                element={<InfluencerProfileSettingsPage />}
              />
              <Route
                path="campaigns"
                element={
                  <InfluencerPlaceholderPage
                    title="Campaigns"
                    description="Browse active briefs and apply in one click once the marketplace ships."
                  />
                }
              />
              <Route
                path="messages"
                element={
                  <MessagesInboxPage dashboardBasePath="/dashboard/influencer" />
                }
              />
              <Route
                path="subscription"
                element={
                  <InfluencerPlaceholderPage
                    title="Subscription"
                    description="Chapa checkout, receipt history, and renewal dates will appear after billing is wired."
                  />
                }
              />
              <Route
                path="analytics"
                element={
                  <InfluencerPlaceholderPage
                    title="Analytics"
                    description="Replace the placeholder hook with time-series queries when telemetry lands."
                  />
                }
              />
            </Route>

            <Route
              path="dashboard/advertiser"
              element={
                <ProtectedRoute allowedRoles={["advertiser", "admin"]}>
                  <AdvertiserDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdvertiserOverviewPage />} />
              <Route path="discover" element={<AdvertiserDiscoverPage />} />
              <Route
                path="campaigns/new"
                element={<AdvertiserCampaignFormPage />}
              />
              <Route
                path="campaigns/:campaignId"
                element={<AdvertiserCampaignFormPage />}
              />
              <Route
                path="campaigns"
                element={<AdvertiserCampaignListPage />}
              />
              <Route
                path="applications"
                element={<AdvertiserApplicationsPage />}
              />
              <Route
                path="messages"
                element={
                  <MessagesInboxPage dashboardBasePath="/dashboard/advertiser" />
                }
              />
              <Route
                path="billing"
                element={
                  <AdvertiserPlaceholderPage
                    title="Billing"
                    description="Invoices, Chapa receipts, and team seats land in the billing phase."
                  />
                }
              />
              <Route
                path="analytics"
                element={
                  <AdvertiserPlaceholderPage
                    title="Analytics"
                    description="Campaign spend, funnel, and cohort charts will connect to warehouse queries later."
                  />
                }
              />
            </Route>

            <Route
              path="dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="approvals" element={<AdminApprovalsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MessagingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
