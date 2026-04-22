import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useAppStore from '../store/useAppStore';
import Sidebar from '../components/Sidebar';
import InnerSidebar from '../components/InnerSidebar';
import Header from '../components/common/Header';
import RightPanel from '../components/RightPanel';
import { Toaster } from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { activeWorkspace } = useAppStore();
  const navigate = useNavigate();
  const [simulatedRole, setSimulatedRole] = useState('Admin');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="h-screen w-full bg-[#0d1117] flex flex-col font-sans">
      <Header simulatedRole={simulatedRole} setSimulatedRole={setSimulatedRole} />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar simulatedRole={simulatedRole} />
        <InnerSidebar />
        <Outlet context={{ simulatedRole, toggleRightPanel: () => setIsRightPanelOpen(p => !p) }} />
        <RightPanel isOpen={isRightPanelOpen} onClose={() => setIsRightPanelOpen(false)} />
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default Dashboard;
