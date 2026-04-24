// Shared theme tokens — light first, dark override via `dark:` variants.
// Import with: `import UI from '@/styles/ui'` or relative path.
// Compose tokens with cn/clsx or plain template strings.

const UI = {
  // ---------- Surfaces ----------
  appBg:          'bg-[#f5f6f8] dark:bg-[#0d1117]',
  surface:        'bg-white dark:bg-[#161b22]',
  surfaceSubtle:  'bg-slate-50 dark:bg-[#0d1117]',
  surfaceRaised:  'bg-white dark:bg-[#1c212b]',
  surfaceHover:   'hover:bg-slate-50 dark:hover:bg-[#0d1117]/60',

  // ---------- Borders ----------
  border:         'border border-slate-200 dark:border-gray-800',
  borderStrong:   'border border-slate-300 dark:border-gray-700',
  borderSubtle:   'border border-slate-100 dark:border-gray-800/60',
  borderHover:    'hover:border-slate-300 dark:hover:border-gray-700',
  divide:         'divide-slate-100 dark:divide-gray-800',

  // ---------- Text ----------
  textPrimary:    'text-slate-900 dark:text-gray-100',
  textBody:       'text-slate-700 dark:text-gray-200',
  textMuted:      'text-slate-500 dark:text-gray-400',
  textSubtle:     'text-slate-400 dark:text-gray-500',
  textFaint:      'text-slate-300 dark:text-gray-600',

  // ---------- Inputs ----------
  input:          'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors',
  inputBare:      'bg-transparent text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 outline-none',

  // ---------- Buttons ----------
  btnPrimary:     'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50',
  btnBlue:        'bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-50',
  btnGhost:       'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-all duration-150 active:scale-95',
  btnDanger:      'text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors',
  iconBtn:        'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800/80 transition-all duration-150 active:scale-90',

  // ---------- Shapes ----------
  card:           'rounded-xl shadow-sm',
  cardLg:         'rounded-2xl shadow-sm',

  // ---------- Accents / brand ----------
  accent:         'text-indigo-600 dark:text-indigo-400',
  accentBg:       'bg-indigo-50 dark:bg-indigo-500/10',
  accentBgHover:  'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
  accentBorder:   'border-indigo-200 dark:border-indigo-500/20',
  ring:           'ring-1 ring-slate-200 dark:ring-gray-800',

  // ---------- State ----------
  danger:         'text-red-600 dark:text-red-400',
  dangerBg:       'bg-red-50 dark:bg-red-500/10',
  success:        'text-emerald-600 dark:text-emerald-400',
  successBg:      'bg-emerald-50 dark:bg-emerald-500/10',
  warning:        'text-amber-600 dark:text-amber-400',
  warningBg:      'bg-amber-50 dark:bg-amber-500/10',

  // ---------- Motion ----------
  transition:     'transition-colors duration-200',

  // ---------- Skeleton ----------
  skeleton:       'ls-skeleton bg-slate-200/80 dark:bg-gray-700/50 rounded-lg',
};

export default UI;
