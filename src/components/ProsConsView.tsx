import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import type { Decision, ImpactLevel } from '../types.ts';

interface ProsConsViewProps {
  decision: Decision;
  onAddItem: (optionId: string, kind: 'pros' | 'cons', text: string, impact: ImpactLevel) => void;
  onDeleteItem: (optionId: string, kind: 'pros' | 'cons', itemId: string) => void;
}

const IMPACT_LABELS: Record<ImpactLevel, string> = {
  high: 'High impact',
  medium: 'Medium impact',
  low: 'Low impact',
};

export function ProsConsView({
  decision,
  onAddItem,
  onDeleteItem,
}: ProsConsViewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<'all' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<
    Record<string, { text: string; impact: ImpactLevel }>
  >({});

  const visibleOptions =
    selectedOptionId === 'all'
      ? decision.options
      : decision.options.filter((o) => o.id === selectedOptionId);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const getDraft = (key: string) =>
    drafts[key] ?? { text: '', impact: 'medium' as ImpactLevel };

  const updateDraft = (key: string, patch: Partial<{ text: string; impact: ImpactLevel }>) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...getDraft(key), ...patch },
    }));
  };

  const handleSubmit = (
    e: React.FormEvent,
    optionId: string,
    kind: 'pros' | 'cons',
  ) => {
    e.preventDefault();
    const key = `${optionId}-${kind}`;
    const draft = getDraft(key);
    if (!draft.text.trim()) return;
    onAddItem(optionId, kind, draft.text.trim(), draft.impact);
    updateDraft(key, { text: '', impact: 'medium' });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar: Option Filter + Impact Filter + Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Option segmented filter */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedOptionId('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedOptionId === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Options
            </button>
            {decision.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOptionId(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 max-w-[160px] truncate ${
                  selectedOptionId === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>

          {/* Impact filter */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setImpactFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                impactFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Impact
            </button>
            <button
              type="button"
              onClick={() => setImpactFilter('high')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                impactFilter === 'high'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High Impact Only
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter pros & cons..."
            aria-label="Filter pros and cons"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Options Grid */}
      <div
        className={`grid grid-cols-1 gap-8 ${
          visibleOptions.length >= 2 ? 'xl:grid-cols-2' : ''
        }`}
      >
        {visibleOptions.map((option) => {
          const entry = decision.prosCons.find((pc) => pc.optionId === option.id);
          const allPros = entry?.pros ?? [];
          const allCons = entry?.cons ?? [];

          const filteredPros = allPros.filter((item) => {
            if (impactFilter === 'high' && item.impact !== 'high') return false;
            if (normalizedQuery && !item.text.toLowerCase().includes(normalizedQuery)) return false;
            return true;
          });

          const filteredCons = allCons.filter((item) => {
            if (impactFilter === 'high' && item.impact !== 'high') return false;
            if (normalizedQuery && !item.text.toLowerCase().includes(normalizedQuery)) return false;
            return true;
          });

          const proDraftKey = `${option.id}-pros`;
          const conDraftKey = `${option.id}-cons`;
          const proDraft = getDraft(proDraftKey);
          const conDraft = getDraft(conDraftKey);

          return (
            <section
              key={option.id}
              className="border border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col"
            >
              {/* Option Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">{option.name}</h3>
                  <div className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    {allPros.length} pros · {allCons.length} cons
                  </div>
                </div>
                {option.tagline && (
                  <p className="text-xs text-slate-500 mt-1">{option.tagline}</p>
                )}
              </div>

              {/* Pros & Cons Split */}
              <div className="divide-y divide-slate-200 flex-1">
                {/* Pros Block */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-emerald-800">
                      Advantages (Pros)
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      {filteredPros.length}
                    </span>
                  </div>

                  {filteredPros.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      No matching pros for the current filter.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {filteredPros.map((item) => (
                        <li
                          key={item.id}
                          className="group flex items-start gap-3 text-sm text-slate-800 leading-relaxed"
                        >
                          <span
                            aria-hidden="true"
                            className="font-mono text-emerald-700 font-semibold mt-0.5 shrink-0"
                          >
                            +
                          </span>
                          <div className="flex-1 min-w-0">
                            <span>{item.text}</span>
                            <span className="ml-2 text-xs text-slate-400 whitespace-nowrap">
                              · {IMPACT_LABELS[item.impact]}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(option.id, 'pros', item.id)}
                            aria-label="Remove pro"
                            className="p-1 text-slate-300 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add Pro Inline Form */}
                  <form
                    onSubmit={(e) => handleSubmit(e, option.id, 'pros')}
                    className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-2"
                  >
                    <input
                      type="text"
                      value={proDraft.text}
                      onChange={(e) => updateDraft(proDraftKey, { text: e.target.value })}
                      placeholder="Add a pro..."
                      className="flex-1 min-w-[160px] text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                    />
                    <select
                      value={proDraft.impact}
                      aria-label="Pro impact level"
                      onChange={(e) =>
                        updateDraft(proDraftKey, { impact: e.target.value as ImpactLevel })
                      }
                      className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-700 focus:outline-none"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!proDraft.text.trim()}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* Cons Block */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-red-800">
                      Drawbacks (Cons)
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      {filteredCons.length}
                    </span>
                  </div>

                  {filteredCons.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      No matching cons for the current filter.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {filteredCons.map((item) => (
                        <li
                          key={item.id}
                          className="group flex items-start gap-3 text-sm text-slate-800 leading-relaxed"
                        >
                          <span
                            aria-hidden="true"
                            className="font-mono text-red-700 font-semibold mt-0.5 shrink-0"
                          >
                            −
                          </span>
                          <div className="flex-1 min-w-0">
                            <span>{item.text}</span>
                            <span className="ml-2 text-xs text-slate-400 whitespace-nowrap">
                              · {IMPACT_LABELS[item.impact]}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(option.id, 'cons', item.id)}
                            aria-label="Remove con"
                            className="p-1 text-slate-300 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Add Con Inline Form */}
                  <form
                    onSubmit={(e) => handleSubmit(e, option.id, 'cons')}
                    className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-2"
                  >
                    <input
                      type="text"
                      value={conDraft.text}
                      onChange={(e) => updateDraft(conDraftKey, { text: e.target.value })}
                      placeholder="Add a con..."
                      className="flex-1 min-w-[160px] text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                    />
                    <select
                      value={conDraft.impact}
                      aria-label="Con impact level"
                      onChange={(e) =>
                        updateDraft(conDraftKey, { impact: e.target.value as ImpactLevel })
                      }
                      className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-700 focus:outline-none"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!conDraft.text.trim()}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
