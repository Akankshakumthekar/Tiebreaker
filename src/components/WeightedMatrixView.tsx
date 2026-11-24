import { useState } from 'react';
import { Plus, Trash2, Loader2, Minus, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { Decision, WeightedAnalysisSummary } from '../types.ts';
import { getScoreEntry } from '../utils/scoring.ts';

interface WeightedMatrixViewProps {
  decision: Decision;
  summary: WeightedAnalysisSummary;
  onUpdateWeight: (criterionId: string, weight: number) => void;
  onUpdateScore: (criterionId: string, optionId: string, score: number) => void;
  onAddCriterion: (name: string, description: string, weight: number) => void;
  onDeleteCriterion: (criterionId: string) => void;
  onEqualizeWeights: () => void;
  onSuggestCriteriaAI: () => void;
  isSuggestingCriteria: boolean;
  onAddOptionManual: (name: string, tagline: string) => void;
  onAddOptionAI: (name: string) => Promise<void>;
  isEvaluatingOption: boolean;
  onDeleteOption: (optionId: string) => void;
}

export function WeightedMatrixView({
  decision,
  summary,
  onUpdateWeight,
  onUpdateScore,
  onAddCriterion,
  onDeleteCriterion,
  onEqualizeWeights,
  onSuggestCriteriaAI,
  isSuggestingCriteria,
  onAddOptionManual,
  onAddOptionAI,
  isEvaluatingOption,
  onDeleteOption,
}: WeightedMatrixViewProps) {
  const [showAddCriterion, setShowAddCriterion] = useState(false);
  const [newCritName, setNewCritName] = useState('');
  const [newCritDesc, setNewCritDesc] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(7);

  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionTagline, setNewOptionTagline] = useState('');

  const [expandedCriterionId, setExpandedCriterionId] = useState<string | null>(null);

  const handleCreateCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newCritName.trim();
    if (!cleaned) return;
    onAddCriterion(cleaned, newCritDesc.trim(), newCritWeight);
    setNewCritName('');
    setNewCritDesc('');
    setNewCritWeight(7);
    setShowAddCriterion(false);
  };

  const handleCreateOptionManual = () => {
    const cleaned = newOptionName.trim();
    if (!cleaned) return;
    onAddOptionManual(cleaned, newOptionTagline.trim());
    setNewOptionName('');
    setNewOptionTagline('');
    setShowAddOption(false);
  };

  const handleCreateOptionAI = async () => {
    const cleaned = newOptionName.trim();
    if (!cleaned) return;
    await onAddOptionAI(cleaned);
    setNewOptionName('');
    setNewOptionTagline('');
    setShowAddOption(false);
  };

  return (
    <div className="space-y-10">
      {/* Matrix Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Weighted Preference Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag importance weights (1–10) and refine option scores to see how your priorities shift the winner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEqualizeWeights}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Equal Weights</span>
          </button>

          <button
            type="button"
            onClick={onSuggestCriteriaAI}
            disabled={isSuggestingCriteria}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50/70 border border-blue-200/80 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {isSuggestingCriteria ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Suggesting...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Suggest Criteria (AI)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAddCriterion((v) => !v);
              setShowAddOption(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Criterion</span>
          </button>

          {decision.options.length < 5 && (
            <button
              type="button"
              onClick={() => {
                setShowAddOption((v) => !v);
                setShowAddCriterion(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Option</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Add Criterion Panel */}
      {showAddCriterion && (
        <form
          onSubmit={handleCreateCriterion}
          className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-4"
        >
          <div className="text-sm font-semibold text-slate-900">New Evaluation Criterion</div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={newCritName}
                onChange={(e) => setNewCritName(e.target.value)}
                placeholder="e.g., Learning curve"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                What does this measure?
              </label>
              <input
                type="text"
                value={newCritDesc}
                onChange={(e) => setNewCritDesc(e.target.value)}
                placeholder="Brief definition for scoring consistently"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Weight: <span className="font-mono tabular-nums font-semibold">{newCritWeight}/10</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={newCritWeight}
                onChange={(e) => setNewCritWeight(Number(e.target.value))}
                className="tiebreaker-slider w-full mt-2"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCriterion(false)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
            >
              Add to Matrix
            </button>
          </div>
        </form>
      )}

      {/* Inline Add Option Panel */}
      {showAddOption && (
        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-4">
          <div className="text-sm font-semibold text-slate-900">Add Another Option to Compare</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Option name</label>
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                disabled={isEvaluatingOption}
                placeholder="e.g., Negotiate 4-day workweek"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Short summary (optional for AI evaluation)
              </label>
              <input
                type="text"
                value={newOptionTagline}
                onChange={(e) => setNewOptionTagline(e.target.value)}
                disabled={isEvaluatingOption}
                placeholder="One-line framing of this option"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddOption(false)}
              disabled={isEvaluatingOption}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateOptionManual}
              disabled={isEvaluatingOption || !newOptionName.trim()}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:border-slate-400 rounded-lg disabled:opacity-50"
            >
              Add Manually
            </button>
            <button
              type="button"
              onClick={handleCreateOptionAI}
              disabled={isEvaluatingOption || !newOptionName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50"
            >
              {isEvaluatingOption ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating across all frameworks...</span>
                </>
              ) : (
                <span>Add &amp; Evaluate with AI</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Matrix Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[740px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-600">
              <th className="py-3.5 px-5 w-[30%]">Criterion</th>
              <th className="py-3.5 px-4 w-[22%]">Importance Weight</th>
              {decision.options.map((opt) => (
                <th key={opt.id} className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center justify-end gap-2 max-w-full">
                    <span className="font-semibold text-slate-900 truncate">{opt.name}</span>
                    {decision.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onDeleteOption(opt.id)}
                        title={`Remove ${opt.name}`}
                        aria-label={`Remove option ${opt.name}`}
                        className="text-slate-400 hover:text-red-700 p-0.5 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {decision.criteria.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + decision.options.length}
                  className="py-10 px-6 text-center text-sm text-slate-500"
                >
                  No scoring criteria yet. Add a criterion or let AI suggest criteria to calculate weighted totals.
                </td>
              </tr>
            ) : (
              decision.criteria.map((criterion) => {
                const weightShare =
                  summary.totalWeight > 0
                    ? Math.round((criterion.weight / summary.totalWeight) * 100)
                    : 0;
                const isExpanded = expandedCriterionId === criterion.id;

                return (
                  <tr key={criterion.id} className="group hover:bg-slate-50/50 transition-colors">
                    {/* Criterion Info */}
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {criterion.name}
                          </div>
                          {criterion.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {criterion.description}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCriterionId(isExpanded ? null : criterion.id)
                            }
                            className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-700 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                <span>Hide score notes</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                <span>Score notes</span>
                              </>
                            )}
                          </button>
                        </div>

                        {decision.criteria.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteCriterion(criterion.id)}
                            aria-label={`Delete ${criterion.name}`}
                            className="p-1 text-slate-300 hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                          {decision.options.map((opt) => {
                            const entry = getScoreEntry(decision, criterion.id, opt.id);
                            return (
                              <div key={opt.id} className="text-xs leading-relaxed">
                                <span className="font-medium text-slate-800">{opt.name}: </span>
                                <span className="text-slate-600">
                                  {entry?.rationale || 'Manual score entry.'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Interactive Weight Slider */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-2">
                        <span className="font-semibold text-slate-900">
                          {criterion.weight}
                          <span className="text-slate-400 font-normal">/10</span>
                        </span>
                        <span className="text-slate-500">{weightShare}% share</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={criterion.weight}
                        aria-label={`Weight for ${criterion.name}`}
                        onChange={(e) => onUpdateWeight(criterion.id, Number(e.target.value))}
                        className="tiebreaker-slider w-full"
                      />
                    </td>

                    {/* Option Scores */}
                    {decision.options.map((opt) => {
                      const entry = getScoreEntry(decision, criterion.id, opt.id);
                      const score = entry?.score ?? 5;
                      const weightedPts = score * criterion.weight;

                      return (
                        <td key={opt.id} className="py-4 px-4 align-top text-right">
                          <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg bg-white p-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateScore(criterion.id, opt.id, Math.max(1, score - 1))
                              }
                              disabled={score <= 1}
                              aria-label={`Decrease score for ${opt.name} on ${criterion.name}`}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-sm font-mono font-semibold tabular-nums text-slate-900">
                              {score}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateScore(criterion.id, opt.id, Math.min(10, score + 1))
                              }
                              disabled={score >= 10}
                              aria-label={`Increase score for ${opt.name} on ${criterion.name}`}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="mt-1.5 text-[11px] font-mono tabular-nums text-slate-400">
                            {weightedPts} wtd pts
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Totals Footer */}
          {decision.criteria.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/90">
                <td className="py-4 px-5 text-sm font-semibold text-slate-900">
                  Weighted Score
                </td>
                <td className="py-4 px-4 text-xs font-mono tabular-nums text-slate-500">
                  Total weight: {summary.totalWeight}
                </td>
                {decision.options.map((opt) => {
                  const ranked = summary.rankings.find((r) => r.option.id === opt.id);
                  const isTop =
                    ranked &&
                    summary.leader &&
                    ranked.option.id === summary.leader.option.id &&
                    !summary.isExactTie;
                  return (
                    <td key={opt.id} className="py-4 px-4 text-right font-mono tabular-nums">
                      <div
                        className={`text-base font-semibold ${
                          isTop ? 'text-blue-700' : 'text-slate-900'
                        }`}
                      >
                        {ranked ? ranked.normalizedScore.toFixed(1) : '0.0'}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Avg {ranked ? ranked.weightedAverage10.toFixed(1) : '0.0'}/10
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Bottom Analytical Row: Driver Attribution + Tiebreaker Guidance / Blind Spots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-2">
        {/* Left: What Creates the Margin */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            What separates the top two options
          </h3>
          {summary.leader && summary.runnerUp ? (
            <>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Point contribution gap between {summary.leader.option.name} and {summary.runnerUp.option.name}.
              </p>
              <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                {summary.drivers.map((driver) => {
                  const favorsLeader = driver.pointAdvantage > 0;
                  const isEven = Math.abs(driver.pointAdvantage) < 0.05;
                  return (
                    <div
                      key={driver.criterionId}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {driver.criterionName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          Weight {driver.weight} · {driver.leaderScore} vs {driver.runnerUpScore}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {isEven ? (
                          <span className="text-xs font-mono tabular-nums text-slate-400">
                            Even (0.0)
                          </span>
                        ) : (
                          <div>
                            <div
                              className={`text-xs font-mono font-semibold tabular-nums ${
                                favorsLeader ? 'text-blue-700' : 'text-amber-700'
                              }`}
                            >
                              {favorsLeader ? '+' : ''}
                              {driver.pointAdvantage.toFixed(1)} pts
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              Favors{' '}
                              {favorsLeader
                                ? summary.leader!.option.name
                                : summary.runnerUp!.option.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              Add at least two options and one criterion to compare score drivers.
            </p>
          )}
        </div>

        {/* Right: Tiebreaker Advice, Blind Spots & Optional Devil's Advocate */}
        <div className="space-y-8">
          {decision.devilsAdvocate && (
            <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-4">
              <div>
                <div className="text-xs font-semibold text-amber-900">
                  Tiebreaker Stress Test · Challenging {decision.devilsAdvocate.targetOptionName}
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900 leading-snug">
                  {decision.devilsAdvocate.headline}
                </p>
              </div>
              <ul className="space-y-3">
                {decision.devilsAdvocate.counterArguments.map((arg, idx) => (
                  <li key={idx} className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">{arg.title}: </span>
                    {arg.detail}
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-amber-200/80 text-sm text-slate-900">
                <span className="font-semibold">Deciding question: </span>
                {decision.devilsAdvocate.decidingQuestion}
              </div>
            </div>
          )}

          {decision.tiebreakerAdvice && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Tiebreaker Guidance</h3>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                {decision.tiebreakerAdvice}
              </p>
            </div>
          )}

          {decision.blindSpots.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Blind Spots to Verify Before Committing
              </h3>
              <ol className="mt-3 space-y-3">
                {decision.blindSpots.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                    <span className="font-mono text-xs tabular-nums text-slate-400 pt-0.5 shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
