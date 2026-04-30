import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SiteLayout from '@/components/layout/SiteLayout';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import Shop from '@/pages/Shop';
import Booking from '@/pages/Booking';
import MasonChat from '@/pages/MasonChat';
import Apply from '@/pages/Apply';
import Dashboard from '@/pages/Dashboard';
import Legal from '@/pages/Legal';
import Leads from '@/pages/Leads';
import Contact from '@/pages/Contact';
import Pricing from '@/pages/Pricing';
import ClientDashboard from '@/pages/ClientDashboard';
import TrainerHub from '@/pages/TrainerHub';
import GetStarted from '@/pages/GetStarted';
import AccountSettings from '@/pages/AccountSettings';
import ClientSuccess from '@/pages/ClientSuccess';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/mason" element={<MasonChat />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/legal/:page" element={<Legal />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-dashboard" element={<ClientDashboard />} />
        <Route path="/trainer" element={<TrainerHub />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/success" element={<ClientSuccess />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App