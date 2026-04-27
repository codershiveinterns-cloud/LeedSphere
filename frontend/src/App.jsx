import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ChatWindow from './components/chat/ChatWindow';
import ErrorBoundary from './components/ErrorBoundary';

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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

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
