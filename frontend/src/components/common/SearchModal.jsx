import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Users, Hash, Lock, MessageSquare, FileText, User as UserIcon,
  Loader2, CornerDownLeft, ArrowUp, ArrowDown, Clock, Trash2,
} from 'lucide-react';
import useSearchStore from '../../store/useSearchStore';
import useAppStore from '../../store/useAppStore';

/* -------- helpers -------- */

const categoryMeta = {
  teams:    { label: 'Teams',    icon: Users,         empty: 'No teams' },
  channels: { label: 'Channels', icon: Hash,          empty: 'No channels' },
  messages: { label: 'Messages', icon: MessageSquare, empty: 'No messages' },
  notes:    { label: 'Notes',    icon: FileText,      empty: 'No notes' },
  users:    { label: 'People',   icon: UserIcon,      empty: 'No people' },
};

const escapeRe = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wraps occurrences of `query` in text with <mark>. Case-insensitive.
const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = String(text).split(new RegExp(`(${escapeRe(query)})`, 'ig'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-200 rounded px-0.5">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
};

// Best-effort text excerpt from tiptap JSON (used for messages/notes).
const extractExcerpt = (content) => {
  if (typeof content === 'string') return content;
  if (!content || typeof content !== 'object') return '';
  let out = '';
  const walk = (node) => {
    if (!node) return;
    if (typeof node.text === 'string') out += node.text + ' ';
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  walk(content);
  return out.trim();
};

/* -------- component -------- */

const SearchModal = () => {
  const navigate = useNavigate();
  const { activeWorkspace, setActiveTeam, setActiveChannel, teams } = useAppStore();
  const {
    isOpen, query, results, isSearching, recent,
    setQuery, close, runSearch, recordRecent, clearRecent,
  } = useSearchStore();

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevFlatLen, setPrevFlatLen] = useState(0);

  /* flatten grouped results into a navigable list */
  const flat = useMemo(() => {
    const order = ['teams', 'channels', 'messages', 'notes', 'users'];
    const out = [];
    order.forEach((cat) => {
      (results[cat] || []).forEach((item) => out.push({ category: cat, item }));
    });
    return out;
  }, [results]);

  /* open/close: focus management */
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [isOpen]);

  /* debounced search */
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      runSearch(query, activeWorkspace?._id);
    }, 300);
    return () => clearTimeout(t);
  }, [query, isOpen, activeWorkspace?._id, runSearch]);

  /* reset selection when result count changes — "adjust state during render" pattern */
  if (prevFlatLen !== flat.length) {
    setPrevFlatLen(flat.length);
    setActiveIndex(0);
  }

  /* scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  /* route to selection */
  const goTo = (entry) => {
    if (!entry) return;
    const { category, item } = entry;
    recordRecent(query);
    close();

    switch (category) {
      case 'teams': {
        const full = teams.find((t) => t._id === item._id) || item;
        setActiveTeam(full);
        navigate(`/dashboard/team/${item._id}`);
        break;
      }
      case 'channels': {
        setActiveChannel({ _id: item._id, name: item.name, type: item.type, isPrivate: item.isPrivate });
        navigate(`/dashboard/channel/${item._id}`);
        break;
      }
      case 'messages': {
        // Navigate to the parent channel; chat view will scroll/load normally.
        const channelId = item.channelId?._id || item.channelId;
        if (channelId) navigate(`/dashboard/channel/${channelId}?message=${item._id}`);
        break;
      }
      case 'notes': {
        navigate(`/dashboard/notes/${item._id}`);
        break;
      }
      case 'users': {
        navigate(`/dashboard/dm/${item._id}`);
        break;
      }
      default: break;
    }
  };

  /* keyboard nav */
  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (!flat.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % flat.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + flat.length) % flat.length); }
    else if (e.key === 'Enter')   { e.preventDefault(); goTo(flat[activeIndex]); }
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const totalResults = flat.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[70vh]"
        onKeyDown={onKeyDown}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-gray-800">
          <Search size={18} className="text-slate-400 dark:text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams, channels, messages, notes, people..."
            className="flex-1 bg-transparent text-[15px] text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 outline-none"
          />
          {isSearching && <Loader2 size={16} className="animate-spin text-slate-400 dark:text-gray-500 shrink-0" />}
          {query && !isSearching && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              title="Clear"
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={close}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 rounded px-1.5 py-0.5"
          >
            Esc
          </button>
        </div>

        {/* Results / states */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {!hasQuery ? (
            <RecentSearches recent={recent} onPick={setQuery} onClear={clearRecent} />
          ) : isSearching && totalResults === 0 ? (
            <ResultsSkeleton />
          ) : totalResults === 0 ? (
            <EmptyState query={query} />
          ) : (
            <GroupedResults
              results={results}
              query={query}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onSelect={goTo}
              startIndexFor={(cat) => flat.findIndex((e) => e.category === cat)}
            />
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-gray-800 text-[11px] text-slate-500 dark:text-gray-500 bg-slate-50 dark:bg-[#0d1117]/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> navigate</span>
            <span className="inline-flex items-center gap-1"><CornerDownLeft size={11} /> open</span>
            <span className="inline-flex items-center gap-1">esc close</span>
          </div>
          <span>{totalResults > 0 ? `${totalResults} result${totalResults === 1 ? '' : 's'}` : ''}</span>
        </div>
      </div>
    </div>
  );
};

/* -------- sub-components -------- */

const RecentSearches = ({ recent, onPick, onClear }) => {
  if (!recent.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <Search size={20} className="text-slate-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Start typing to search</p>
        <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Find teams, channels, messages, notes, and people</p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 flex items-center gap-1.5">
          <Clock size={11} /> Recent
        </span>
        <button
          onClick={onClear}
          className="text-[11px] text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 inline-flex items-center gap-1 transition-colors"
          title="Clear recent searches"
        >
          <Trash2 size={11} /> Clear
        </button>
      </div>
      <div className="flex flex-col">
        {recent.map((term) => (
          <button
            key={term}
            onClick={() => onPick(term)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <Clock size={14} className="text-slate-400 dark:text-gray-500" />
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};

const EmptyState = ({ query }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center animate-fade-in">
    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-3">
      <Search size={20} className="text-slate-400 dark:text-gray-500" />
    </div>
    <p className="text-sm font-medium text-slate-700 dark:text-gray-300">No results found</p>
    <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
      Nothing matches <span className="text-slate-700 dark:text-gray-300 font-medium">"{query}"</span>
    </p>
  </div>
);

const ResultsSkeleton = () => (
  <div className="flex flex-col gap-1.5 p-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
        <div className="ls-skeleton bg-slate-200/80 dark:bg-gray-700/50 rounded-lg w-8 h-8" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="ls-skeleton bg-slate-200/80 dark:bg-gray-700/50 rounded h-3 w-1/2" />
          <div className="ls-skeleton bg-slate-200/80 dark:bg-gray-700/50 rounded h-2.5 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const GroupedResults = ({ results, query, activeIndex, onHover, onSelect, startIndexFor }) => {
  const categories = ['teams', 'channels', 'messages', 'notes', 'users'];
  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => {
        const items = results[cat] || [];
        if (!items.length) return null;
        const Meta = categoryMeta[cat];
        const start = startIndexFor(cat);
        return (
          <div key={cat}>
            <div className="px-2 pt-1.5 pb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
              <Meta.icon size={11} /> {Meta.label}
            </div>
            <div className="flex flex-col">
              {items.map((item, i) => {
                const idx = start + i;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item._id || `${cat}-${i}`}
                    data-idx={idx}
                    onMouseEnter={() => onHover(idx)}
                    onClick={() => onSelect({ category: cat, item })}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <ResultItem category={cat} item={item} query={query} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ResultItem = ({ category, item, query }) => {
  switch (category) {
    case 'teams':
      return (
        <>
          <IconBubble tone="indigo"><Users size={15} /></IconBubble>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-gray-100 truncate"><Highlight text={item.name} query={query} /></p>
            <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
              {item.description || 'Team'}
            </p>
          </div>
        </>
      );
    case 'channels':
      return (
        <>
          <IconBubble tone="slate">{(item.isPrivate || item.type === 'private') ? <Lock size={14} /> : <Hash size={15} />}</IconBubble>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-gray-100 truncate">
              #<Highlight text={item.name} query={query} />
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
              {item.teamId?.name ? `in ${item.teamId.name}` : 'Channel'}
            </p>
          </div>
        </>
      );
    case 'messages': {
      const excerpt = item.content || '';
      return (
        <>
          <IconBubble tone="purple"><MessageSquare size={14} /></IconBubble>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-gray-100 truncate">
              <Highlight text={excerpt} query={query} />
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
              {item.senderName || 'Someone'}{item.channelId?.name ? ` · #${item.channelId.name}` : ''}
            </p>
          </div>
        </>
      );
    }
    case 'notes': {
      const excerpt = extractExcerpt(item.content);
      return (
        <>
          <IconBubble tone="amber"><FileText size={15} /></IconBubble>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-gray-100 truncate"><Highlight text={item.title || 'Untitled'} query={query} /></p>
            {excerpt && (
              <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
                {excerpt.slice(0, 80)}{excerpt.length > 80 ? '…' : ''}
              </p>
            )}
          </div>
        </>
      );
    }
    case 'users':
      return (
        <>
          {item.avatar ? (
            <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <IconBubble tone="emerald"><UserIcon size={15} /></IconBubble>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-gray-100 truncate"><Highlight text={item.name} query={query} /></p>
            <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
              <Highlight text={item.email} query={query} />
            </p>
          </div>
        </>
      );
    default: return null;
  }
};

const IconBubble = ({ tone = 'slate', children }) => {
  const tones = {
    indigo:  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    slate:   'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300',
    purple:  'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
    amber:   'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  };
  return (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
};

export default SearchModal;
