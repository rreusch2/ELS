import { createBrowserRouter, RouterProvider } from "react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { HomePage } from "@/pages/HomePage";
import { ListingsPage } from "@/pages/ListingsPage";
import { ListingDetailPage } from "@/pages/ListingDetailPage";
import { AboutPage } from "@/pages/AboutPage";
import { ContactPage } from "@/pages/ContactPage";
import { RentalCriteriaPage } from "@/pages/RentalCriteriaPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ApplyPage } from "@/pages/apply/ApplyPage";
import { ApplyCanceledPage, ApplySuccessPage } from "@/pages/apply/ApplyResultPages";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminListingsPage } from "@/pages/admin/AdminListingsPage";
import { AdminListingEditPage } from "@/pages/admin/AdminListingEditPage";
import { AdminApplicationsPage } from "@/pages/admin/AdminApplicationsPage";
import { AdminApplicationDetailPage } from "@/pages/admin/AdminApplicationDetailPage";
import { AdminShowingsPage } from "@/pages/admin/AdminShowingsPage";
import { AdminMessagesPage } from "@/pages/admin/AdminMessagesPage";
import { AdminSettingsPage } from "@/pages/admin/AdminSettingsPage";

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/listings", element: <ListingsPage /> },
      { path: "/listings/:slug", element: <ListingDetailPage /> },
      { path: "/apply/success", element: <ApplySuccessPage /> },
      { path: "/apply/canceled", element: <ApplyCanceledPage /> },
      { path: "/apply/:slug", element: <ApplyPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/rental-criteria", element: <RentalCriteriaPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "listings", element: <AdminListingsPage /> },
      { path: "listings/new", element: <AdminListingEditPage /> },
      { path: "listings/:id", element: <AdminListingEditPage /> },
      { path: "applications", element: <AdminApplicationsPage /> },
      { path: "applications/:id", element: <AdminApplicationDetailPage /> },
      { path: "showings", element: <AdminShowingsPage /> },
      { path: "messages", element: <AdminMessagesPage /> },
      { path: "settings", element: <AdminSettingsPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
