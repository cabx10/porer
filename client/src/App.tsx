import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LangProvider } from "./i18n";
import { AuthProvider, RequireAuth } from "./auth";
import { SocketProvider } from "./socket";
import Layout from "./components/Layout";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import ListingForm from "./pages/ListingForm";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Toaster position="top-center" toastOptions={{ className: "!rounded-xl !text-sm !shadow-lg", duration: 3500 }} />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Listings />} />
                <Route path="listings/new" element={<RequireAuth><ListingForm /></RequireAuth>} />
                <Route path="listings/:id" element={<ListingDetail />} />
                <Route path="listings/:id/edit" element={<RequireAuth><ListingForm /></RequireAuth>} />
                <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="messages" element={<RequireAuth><Messages /></RequireAuth>} />
                <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="login" element={<Auth mode="login" />} />
                <Route path="register" element={<Auth mode="register" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </LangProvider>
  );
}
