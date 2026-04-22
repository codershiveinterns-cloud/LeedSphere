import { NavLink, useNavigate } from 'react-router-dom';
import { Hash, Users, FolderKanban, Calendar, Lock, Plus, FileText, Star, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

const InnerSidebar = () => {
  const {
    activeWorkspace, activeChannel, setActiveChannel,
    teams, setActiveTeam, starredTeams, recentItems, reorderTeams,
    getTeamChannels, activeTeam,
  } = useAppStore();
  const navigate = useNavigate();

  const [orderedTeams, setOrderedTeams] = useState([]);
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => {
    setOrderedTeams(Array.isArray(teams) ? teams : []);
  }, [teams]);

  // Auto-expand the active team
  useEffect(() => {
    if (activeTeam?._id) {
      setExpandedTeams(prev => ({ ...prev, [activeTeam._id]: true }));
    }
  }, [activeTeam?._id]);

  if (!activeWorkspace) {
    return (
      <div className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col items-center justify-center p-6 text-center shrink-0">
        <Hash size={48} className="text-gray-700 mb-4" />
        <h3 className="text-gray-300 font-medium mb-1">No Workspace</h3>
        <p className="text-gray-600 text-sm">Select or create a workspace to view contents.</p>
      </div>
    );
  }

  const mockDms = [
    { id: 'dm1', name: 'Alice Adams', status: 'online' },
    { id: 'dm2', name: 'Bob Brown', status: 'offline' },
    { id: 'dm3', name: 'Charlie Clark', status: 'idle' }
  ];

  const mockNotes = [
    { id: 'note1', title: 'Q3 Roadmap' },
    { id: 'note2', title: 'API Architecture' }
  ];

  const onTeamDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedTeams);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setOrderedTeams(items);
    reorderTeams(items);
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const handleChannelClick = (channel) => {
    // Normalize to ensure _id exists
    const normalized = { ...channel, _id: channel._id || channel.id };
    setActiveChannel(normalized);
  };

  const sections = [
    { name: 'Core Views', items: [
      { id: 'teams', icon: Users, label: 'Teams & Merges', to: '/dashboard/teams' },
      { id: 'projects', icon: FolderKanban, label: 'Project Kanban', to: '/dashboard/projects' },
      { id: 'calendar', icon: Calendar, label: 'Meetings Calendar', to: '/dashboard/calendar' },
    ]}
  ];

  const safeStarredTeams = Array.isArray(starredTeams) ? starredTeams : [];
  const starredList = orderedTeams.filter(t => safeStarredTeams.includes(t._id));
  const safeRecentItems = Array.isArray(recentItems) ? recentItems : [];
  const activeChannelId = activeChannel?._id || activeChannel?.id;

  return (
    <div className="w-64 flex-shrink-0 bg-[#161b22] border-r border-gray-800 flex flex-col h-full overflow-y-auto">
      <div className="h-14 flex items-center px-4 border-b border-gray-800 font-semibold text-white shadow-sm shrink-0">
        <h2 className="truncate">{activeWorkspace?.name}</h2>
      </div>

      <div className="py-4 flex flex-col gap-6">

        {/* Feature Navigation */}
        {sections.map(section => (
          <div key={section.name}>
            <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.name}
            </div>
            <div className="space-y-0.5 px-2">
              {section.items.map(item => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) => `flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                  }`}
                >
                  <item.icon size={16} className="opacity-70" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Starred Teams */}
        {starredList.length > 0 && (
          <div>
            <div className="px-4 flex items-center justify-between group mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star size={12} className="text-yellow-500" /> Starred
              </h3>
            </div>
            <div className="space-y-0.5 px-2">
              {starredList.map(st => (
                <NavLink
                  key={`star_${st._id}`}
                  to={`/dashboard/team/${st._id}`}
                  onClick={() => setActiveTeam(st)}
                  className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                  }`}
                >
                  <Star size={14} className="opacity-70 text-yellow-400" fill="currentColor" />
                  <span className="truncate">{st.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Teams + Their Channels (Draggable) */}
        {orderedTeams.length > 0 && (
          <div>
            <div className="px-4 flex items-center justify-between group mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teams & Channels</h3>
              <NavLink to="/dashboard/teams" className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100">
                <Plus size={16} />
              </NavLink>
            </div>
            <DragDropContext onDragEnd={onTeamDragEnd}>
              <Droppable droppableId="teamsList">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5 px-2 min-h-[20px]">
                    {orderedTeams.map((team, index) => {
                      const teamChs = getTeamChannels(team._id);
                      const isExpanded = expandedTeams[team._id] || false;

                      return (
                        <Draggable key={team._id} draggableId={team._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-md transition-colors ${snapshot.isDragging ? 'opacity-80 ring-1 ring-indigo-500 z-10 bg-[#202632]' : ''}`}
                            >
                              {/* Team row */}
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleTeamExpand(team._id)}
                                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                                >
                                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                <NavLink
                                  to={`/dashboard/team/${team._id}`}
                                  onClick={() => setActiveTeam(team)}
                                  className={({ isActive }) => `flex-1 flex items-center gap-2 px-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive && !snapshot.isDragging ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                                  }`}
                                >
                                  <Users size={14} className="opacity-70 text-indigo-400" />
                                  <span className="truncate">{team.name}</span>
                                  {teamChs.length > 0 && (
                                    <span className="ml-auto text-[10px] text-gray-600">{teamChs.length}</span>
                                  )}
                                </NavLink>
                              </div>

                              {/* Channels under this team */}
                              {isExpanded && teamChs.length > 0 && (
                                <div className="ml-4 pl-2 border-l border-gray-800/50 space-y-0.5 mt-0.5 mb-1">
                                  {teamChs.map(ch => {
                                    const chId = ch._id || ch.id;
                                    const isActive = activeChannelId === chId;
                                    return (
                                      <NavLink
                                        key={chId}
                                        to={`/dashboard/channel/${chId}`}
                                        onClick={() => handleChannelClick(ch)}
                                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
                                          isActive ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-[#202632] hover:text-gray-300'
                                        }`}
                                      >
                                        {ch.type === 'private' ? <Lock size={12} className="opacity-70" /> : <Hash size={12} className="opacity-70" />}
                                        <span className="truncate">{ch.name}</span>
                                      </NavLink>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Recently Viewed */}
        {safeRecentItems.length > 0 && (
          <div>
            <div className="px-4 flex items-center justify-between group mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} /> Recent
              </h3>
            </div>
            <div className="space-y-0.5 px-2">
              {safeRecentItems.map(item => (
                <NavLink
                  key={`recent_${item.id}`}
                  to={item.type === 'team' ? `/dashboard/team/${item.id}` : `/dashboard/channel/${item.id}`}
                  className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                  }`}
                >
                  {item.type === 'team' ? <Users size={14} className="opacity-70 text-gray-500" /> : <Hash size={14} className="opacity-70 text-gray-500" />}
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Direct Messages List */}
        <div>
          <div className="px-4 flex items-center justify-between group mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direct Messages</h3>
            <button className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5 px-2">
            {mockDms.map(dm => (
              <NavLink
                key={dm.id}
                to={`/dashboard/dm/${dm.id}`}
                className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                }`}
              >
                <div className="relative flex items-center justify-center w-4 h-4">
                  <div className="w-full h-full bg-indigo-500/20 text-indigo-400 rounded-sm flex items-center justify-center text-[9px] font-bold">
                    {dm.name.charAt(0)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#161b22] ${
                    dm.status === 'online' ? 'bg-emerald-500' :
                    dm.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></span>
                </div>
                <span className="truncate">{dm.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Notes / Docs List */}
        <div>
          <div className="px-4 flex items-center justify-between group mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes & Docs</h3>
            <button className="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-0.5 px-2">
            {mockNotes.map(note => (
              <NavLink
                key={note.id}
                to={`/dashboard/notes/${note.id}`}
                className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#202632] hover:text-gray-200'
                }`}
              >
                <FileText size={14} className="opacity-70 text-indigo-400" />
                <span className="truncate">{note.title}</span>
              </NavLink>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InnerSidebar;
