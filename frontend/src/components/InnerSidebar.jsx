import { NavLink } from 'react-router-dom';
import { Hash, Users, FolderKanban, Calendar, Lock, Plus, FileText, Star, Clock, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

const navItem = (isActive) =>
  isActive
    ? 'bg-indigo-600 text-white'
    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#202632] hover:text-slate-900 dark:hover:text-gray-200';

const subItem = (isActive) =>
  isActive
    ? 'bg-indigo-600 text-white'
    : 'text-slate-500 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-[#202632] hover:text-slate-800 dark:hover:text-gray-300';

const InnerSidebar = () => {
  const {
    activeWorkspace, activeChannel, setActiveChannel,
    teams, setActiveTeam, starredTeams, recentItems, reorderTeams,
    getTeamChannels, activeTeam,
  } = useAppStore();

  const [orderedTeams, setOrderedTeams] = useState([]);
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => {
    setOrderedTeams(Array.isArray(teams) ? teams : []);
  }, [teams]);

  useEffect(() => {
    if (activeTeam?._id) {
      setExpandedTeams(prev => ({ ...prev, [activeTeam._id]: true }));
    }
  }, [activeTeam?._id]);

  if (!activeWorkspace) {
    return (
      <div className="w-64 bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-gray-800 flex flex-col items-center justify-center p-6 text-center shrink-0 transition-colors duration-200">
        <Hash size={48} className="text-slate-300 dark:text-gray-700 mb-4" />
        <h3 className="text-slate-700 dark:text-gray-300 font-medium mb-1">No Workspace</h3>
        <p className="text-slate-400 dark:text-gray-600 text-sm">Select or create a workspace to view contents.</p>
      </div>
    );
  }

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

  const sections = [
    { name: 'Core Views', items: [
      { id: 'teams', icon: Users, label: 'Teams', to: '/dashboard/teams' },
      { id: 'projects', icon: FolderKanban, label: 'Projects', to: '/dashboard/projects' },
      { id: 'calendar', icon: Calendar, label: 'Calendar', to: '/dashboard/calendar' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics', to: '/dashboard/analytics' },
      { id: 'notes', icon: FileText, label: 'Notes', to: '/dashboard/notes' },
    ]}
  ];

  const safeStarredTeams = Array.isArray(starredTeams) ? starredTeams : [];
  const starredList = orderedTeams.filter(t => safeStarredTeams.includes(t._id));
  const safeRecentItems = Array.isArray(recentItems) ? recentItems : [];
  const activeChannelId = activeChannel?._id;

  return (
    <div className="w-64 flex-shrink-0 bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-gray-800 flex flex-col h-full overflow-y-auto transition-colors duration-200">
      <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-gray-800 font-semibold text-slate-900 dark:text-white shadow-sm shrink-0">
        <h2 className="truncate">{activeWorkspace?.name}</h2>
      </div>

      <div className="py-4 flex flex-col gap-6">

        {sections.map(section => (
          <div key={section.name}>
            <div className="px-4 mb-2 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">{section.name}</div>
            <div className="space-y-0.5 px-2">
              {section.items.map(item => (
                <NavLink key={item.id} to={item.to}
                  className={({ isActive }) => `flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${navItem(isActive)}`}>
                  <item.icon size={16} className="opacity-70" />{item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Starred */}
        {starredList.length > 0 && (
          <div>
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star size={12} className="text-yellow-500" /> Starred
              </h3>
            </div>
            <div className="space-y-0.5 px-2">
              {starredList.map(st => (
                <NavLink key={`star_${st._id}`} to={`/dashboard/team/${st._id}`} onClick={() => setActiveTeam(st)}
                  className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${navItem(isActive)}`}>
                  <Star size={14} className="opacity-70 text-yellow-500 dark:text-yellow-400" fill="currentColor" />
                  <span className="truncate">{st.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Teams + Channels */}
        {orderedTeams.length > 0 && (
          <div>
            <div className="px-4 flex items-center justify-between group mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Teams & Channels</h3>
              <NavLink to="/dashboard/teams" className="text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`rounded-md transition-colors ${snapshot.isDragging ? 'opacity-80 ring-1 ring-indigo-500 z-10 bg-slate-100 dark:bg-[#202632]' : ''}`}>
                              <div className="flex items-center">
                                <button onClick={() => toggleTeamExpand(team._id)} className="p-1 text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 shrink-0 transition-colors">
                                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                <NavLink to={`/dashboard/team/${team._id}`} onClick={() => setActiveTeam(team)}
                                  className={({ isActive }) => `flex-1 flex items-center gap-2 px-1 py-1.5 rounded-md text-sm font-medium transition-colors ${navItem(isActive && !snapshot.isDragging)}`}>
                                  <Users size={14} className="opacity-70 text-indigo-500 dark:text-indigo-400" />
                                  <span className="truncate">{team.name}</span>
                                  {teamChs.length > 0 && <span className="ml-auto text-[10px] text-slate-400 dark:text-gray-600">{teamChs.length}</span>}
                                </NavLink>
                              </div>
                              {isExpanded && teamChs.length > 0 && (
                                <div className="ml-4 pl-2 border-l border-slate-200 dark:border-gray-800/50 space-y-0.5 mt-0.5 mb-1">
                                  {teamChs.map(ch => (
                                    <NavLink key={ch._id} to={`/dashboard/channel/${ch._id}`} onClick={() => setActiveChannel(ch)}
                                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium transition-colors ${subItem(activeChannelId === ch._id)}`}>
                                      {ch.type === 'private' || ch.isPrivate ? <Lock size={12} className="opacity-70" /> : <Hash size={12} className="opacity-70" />}
                                      <span className="truncate">{ch.name}</span>
                                    </NavLink>
                                  ))}
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

        {/* Recent */}
        {safeRecentItems.length > 0 && (
          <div>
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} /> Recent
              </h3>
            </div>
            <div className="space-y-0.5 px-2">
              {safeRecentItems.map(item => (
                <NavLink key={`recent_${item.id}`} to={item.type === 'team' ? `/dashboard/team/${item.id}` : `/dashboard/channel/${item.id}`}
                  className={({ isActive }) => `w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${navItem(isActive)}`}>
                  {item.type === 'team'
                    ? <Users size={14} className="opacity-70 text-slate-400 dark:text-gray-500" />
                    : <Hash size={14} className="opacity-70 text-slate-400 dark:text-gray-500" />}
                  <span className="truncate">{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InnerSidebar;
