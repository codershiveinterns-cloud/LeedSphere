import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
