import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ChatWindow from './components/chat/ChatWindow';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

import TeamView from './pages/TeamView';
import TeamDetails from './pages/TeamDetails';
import ProjectKanban from './pages/ProjectKanban';
import CalendarView from './pages/CalendarView';
import NotesPage from './pages/NotesPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DashboardEmptyState from './pages/DashboardEmptyState';
import TeamSelect from './pages/TeamSelect';
import RequireTeam from './components/auth/RequireTeam';

// Firebase auth — the only auth system in this app.
import FirebaseSignup from './pages/auth/SignupFirebase';
import FirebaseLogin from './pages/auth/LoginFirebase';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import RequireFirebaseAuth from './components/auth/RequireFirebaseAuth';

// Marketing / legal pages — bespoke ones (custom logic, e.g. Contact form,
// long legal text) live as their own files. Everything else flows through
// the content-registry-driven ContentPage so a non-developer can edit the
// site by touching pages/marketing/content.js.
import About from './pages/marketing/About';
import Contact from './pages/marketing/Contact';
import Privacy from './pages/marketing/Privacy';
import Terms from './pages/marketing/Terms';
import Cookies from './pages/marketing/Cookies';
import ContentPage from './pages/marketing/ContentPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Marketing / legal pages */}
          <Route path="/about"    element={<About />} />
          <Route path="/contact"  element={<Contact />} />
          <Route path="/privacy"  element={<Privacy />} />
          <Route path="/terms"    element={<Terms />} />
          <Route path="/cookies"  element={<Cookies />} />

          {/* Product pages — driven by the content registry */}
          <Route path="/overview"     element={<ContentPage slug="overview" />} />
          <Route path="/channels"     element={<ContentPage slug="channels" />} />
          <Route path="/messaging"    element={<ContentPage slug="messaging" />} />
          <Route path="/file-sharing" element={<ContentPage slug="file-sharing" />} />
          <Route path="/search"       element={<ContentPage slug="search" />} />
          <Route path="/security"     element={<ContentPage slug="security" />} />
          <Route path="/roadmap"      element={<ContentPage slug="roadmap" />} />
          <Route path="/changelog"    element={<ContentPage slug="changelog" />} />

          {/* Use cases (Teams column) */}
          <Route path="/use-cases/product"     element={<ContentPage slug="use-cases-product" />} />
          <Route path="/use-cases/engineering" element={<ContentPage slug="use-cases-engineering" />} />
          <Route path="/use-cases/design"      element={<ContentPage slug="use-cases-design" />} />
          <Route path="/use-cases/marketing"   element={<ContentPage slug="use-cases-marketing" />} />
          <Route path="/use-cases/support"     element={<ContentPage slug="use-cases-support" />} />
          <Route path="/use-cases/remote"      element={<ContentPage slug="use-cases-remote" />} />
          <Route path="/use-cases/startups"    element={<ContentPage slug="use-cases-startups" />} />
          <Route path="/use-cases/enterprises" element={<ContentPage slug="use-cases-enterprises" />} />

          {/* Resources */}
          <Route path="/help"            element={<ContentPage slug="help" />} />
          <Route path="/getting-started" element={<ContentPage slug="getting-started" />} />
          <Route path="/docs"            element={<ContentPage slug="docs" />} />
          <Route path="/guides"          element={<ContentPage slug="guides" />} />
          <Route path="/tutorials"       element={<ContentPage slug="tutorials" />} />
          <Route path="/blog"            element={<ContentPage slug="blog" />} />
          <Route path="/community"       element={<ContentPage slug="community" />} />

          {/* Company extras */}
          <Route path="/careers"  element={<ContentPage slug="careers" />} />
          <Route path="/press"    element={<ContentPage slug="press" />} />
          <Route path="/partners" element={<ContentPage slug="partners" />} />

          {/* Public auth pages */}
          <Route path="/login" element={<FirebaseLogin />} />
          <Route path="/signup" element={<FirebaseSignup />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/teams/select" element={<TeamSelect />} />

          {/* Protected routes:
              1. RequireFirebaseAuth → must be signed in AND email-verified.
              2. RequireTeam         → must have a verified team context. */}
          <Route element={<RequireFirebaseAuth />}>
            <Route element={<RequireTeam />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardEmptyState />} />
                <Route path="channel/:id" element={<ChatWindow />} />
                <Route path="dm/:id" element={<ChatWindow isDM={true} />} />
                <Route path="team/:id" element={<TeamDetails />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="notes/:id" element={<NotesPage />} />
                <Route path="channels" element={<ChatWindow />} />
                <Route path="teams" element={<TeamView />} />
                <Route path="projects" element={<ProjectKanban />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
