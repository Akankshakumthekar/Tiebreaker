import { Plus, Trash2, RotateCcw, X } from 'lucide-react';
import type { Decision } from '../types.ts';
import { computeWeightedSummary } from '../utils/scoring.ts';

interface SidebarProps {
  decisions: Decision[];
  activeDecisionId: string | null;
  isCreatingNew: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectDecision: (id: string) => void;
  onStartNew: () => void;
  onDeleteDecision: (id: string) => void;
  onRestoreSamples: () => void;
}

export function Sidebar({
  decisions,
  activeDecisionId,
  isCreatingNew,
  mobileOpen,
  onCloseMobile,
  onSelectDecision,
  onStartNew,
  onDeleteDecision,
  onRestoreSamples,
}: SidebarProps) {
  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-50 border-r border-slate-200">
      {/* Brand Zone: single text element wordmark */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (decisions[0]) {
              onSelectDecision(decisions[0].id);
            } else {
              onStartNew();
            }
            onCloseMobile();
          }}
          className="font-display text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 rounded"
        >
          The Tiebreaker
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Sidebar Action */}
      <div className="p-4 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => {
            onStartNew();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
            isCreatingNew
              ? 'bg-blue-700 text-white'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Decision</span>
        </button>
      </div>

      {/* Saved Decisions List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2 pb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Decisions</span>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {decisions.length}
          </span>
        </div>

        {decisions.length === 0 ? (
          <div className="px-2 py-6 text-xs text-slate-500 leading-relaxed">
            No saved decisions yet. Create a new decision to generate pros &amp; cons, a comparison table, SWOT analysis, and weighted scores.
          </div>
        ) : (
          <ul className="space-y-1">
            {decisions.map((decision) => {
              const isActive = !isCreatingNew && decision.id === activeDecisionId;
              const summary = computeWeightedSummary(decision);
              const leaderText = summary.leader
                ? `${summary.leader.option.name} · ${summary.leader.normalizedScore.toFixed(0)}`
                : `${decision.options.length} options`;

              return (
                <li key={decision.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDecision(decision.id);
                      onCloseMobile();
                    }}
                    className={`w-full text-left px-3 py-2.5 pr-9 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="text-sm font-medium leading-snug line-clamp-2">
                      {decision.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <span>{decision.options.length} options</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate font-mono tabular-nums text-[11px]">
                        {leaderText}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDecision(decision.id);
                    }}
                    title="Delete decision"
                    aria-label={`Delete ${decision.title}`}
                    className="absolute right-2 top-2.5 p-1.5 text-slate-400 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quiet Footer Action */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <span>Saved locally</span>
        <button
          type="button"
          onClick={onRestoreSamples}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Load examples</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[288px] max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
