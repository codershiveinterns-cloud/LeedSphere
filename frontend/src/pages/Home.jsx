import { Link } from 'react-router-dom';
import { ArrowRight, FileText, MessageSquare, Layers } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0e1116] flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -m-32 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -m-32 w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />

      {/* Navbar */}
      <nav className="w-full relative z-10 px-8 py-6 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Layers size={18} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Leedsphere</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">SignIn</Link>
          <Link to="/register" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full relative z-10 flex flex-col items-center justify-center px-4 py-20 text-center mx-auto max-w-5xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-indigo-400 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          V1 is now LIVE
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight">
          Where your team's <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            best work happens.
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mb-12">
          Leedsphere brings all your team's communication, rich-text documents, and project management together in one beautiful, real-time platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 text-lg group">
            Start Collaboration
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Feature Grid preview */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
          <div className="p-8 rounded-3xl bg-[#161b22] border border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Real-time Chat</h3>
            <p className="text-gray-400 leading-relaxed">Instantly communicate with anyone in your workspace via highly organized channels backed by WebSockets.</p>
          </div>
          <div className="p-8 rounded-3xl bg-[#161b22] border border-gray-800">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
              <FileText size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Rich-Text Notes</h3>
            <p className="text-gray-400 leading-relaxed">Ditch the external wikis. Work tightly with your peers with Notion-like block documents natively located in your channels.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
