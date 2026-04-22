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
import NotesEditor from './pages/NotesEditor';
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
            {/* Nested routes rendered inside Dashboard's <Outlet /> */}
            <Route index element={<DashboardEmptyState />} />
            
            {/* Real-time Entities */}
            <Route path="channel/:id" element={<ChatWindow />} />
            <Route path="dm/:id" element={<ChatWindow isDM={true} />} />
            <Route path="notes/:id" element={<NotesEditor />} />
            <Route path="team/:id" element={<TeamDetails />} />
            
            {/* Legacy / Main Views */}
            <Route path="channels" element={<ChatWindow />} />
            <Route path="teams" element={<TeamView />} />
            <Route path="projects" element={<ProjectKanban />} />
            <Route path="calendar" element={<CalendarView />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
