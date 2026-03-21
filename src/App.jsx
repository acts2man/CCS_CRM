import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SignDocument from '@/pages/SignDocument';
import TimeOffAction from '@/pages/TimeOffAction';
import TimeOffRequest from '@/pages/TimeOffRequest';
import { ImpersonationProvider } from '@/lib/ImpersonationContext';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import Layout from './layout';
import ParentLayout from '@/components/layouts/ParentLayout';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => {
  const { user } = useAuth();
  
  if (!Layout) return <>{children}</>;
  
  // Use ParentLayout only for parents
  if (user?.role === 'parent') {
    return <ParentLayout>{children}</ParentLayout>;
  }
  
  // Use main Layout for everyone else
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Public routes bypass auth entirely
  if (window.location.pathname === '/time-off-request' || window.location.pathname === '/time-off-action') {
    return (
      <Routes>
        <Route path="/time-off-request" element={<TimeOffRequest />} />
        <Route path="/time-off-action" element={<TimeOffAction />} />
      </Routes>
    );
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (skip for public paths)
  const isPublicPath = ['/time-off-request', '/time-off-action'].some(p => window.location.pathname.startsWith(p));
  if (authError && !isPublicPath) {
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
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/sign-document" element={<SignDocument />} />
      <Route path="/time-off-action" element={<TimeOffAction />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <ImpersonationProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
          <ImpersonationBanner />
        </QueryClientProvider>
      </ImpersonationProvider>
    </AuthProvider>
  )
}

export default App