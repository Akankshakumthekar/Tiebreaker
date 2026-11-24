import { Scale, Loader2 } from 'lucide-react';
import type { WeightedAnalysisSummary } from '../types.ts';

interface VerdictBannerProps {
  summary: WeightedAnalysisSummary;
  onChallengeLeader: () => void;
  isChallenging: boolean;
}

export function VerdictBanner({
  summary,
  onChallengeLeader,
  isChallenging,
}: VerdictBannerProps) {
  if (summary.rankings.length === 0) return null;

  const verdictLabel = summary.isExactTie
    ? 'Exact Tie'
    : summary.isCloseCall
      ? 'Close Call'
      : 'Weighted Leader';

  const verdictColorClass = summary.isExactTie || summary.isCloseCall
    ? 'text-amber-800'
    : 'text-emerald-800';

  return (
    <section
      aria-label="Weighted score summary"
      className="border border-slate-200 rounded-xl bg-slate-50/60 overflow-hidden"
    >
      {/* Top Row: Verdict headline + Action */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`text-xs font-semibold ${verdictColorClass}`}>
            {verdictLabel}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          {summary.leader && (
            <span className="text-sm font-semibold text-slate-900">
              {summary.isExactTie && summary.runnerUp
                ? `${summary.leader.option.name} & ${summary.runnerUp.option.name}`
                : summary.leader.option.name}
            </span>
          )}
          {summary.runnerUp && !summary.isExactTie && (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                +{summary.margin.toFixed(1)} pts ahead of {summary.runnerUp.option.name}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onChallengeLeader}
          disabled={isChallenging}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:border-slate-400 hover:text-slate-900 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          {isChallenging ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Stress-testing...</span>
            </>
          ) : (
            <>
              <Scale className="w-3.5 h-3.5 text-blue-700" />
              <span>{summary.isCloseCall ? 'Run Tiebreaker Challenge' : 'Challenge Leader'}</span>
            </>
          )}
        </button>
      </div>

      {/* Ranked Option Bars */}
      <div className="divide-y divide-slate-200/80">
        {summary.rankings.map((item, idx) => {
          const isLeader = idx === 0 && !summary.isExactTie;
          const barWidth = Math.max(4, Math.min(100, item.normalizedScore));
          return (
            <div
              key={item.option.id}
              className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
            >
              <div className="flex items-baseline gap-3 sm:w-[36%] min-w-0">
                <span className="text-xs font-mono tabular-nums text-slate-400 w-5 shrink-0">
                  #{item.rank}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {item.option.name}
                  </div>
                  {item.option.tagline && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {item.option.tagline}
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontal visual score bar */}
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${
                      isLeader ? 'bg-blue-700' : 'bg-slate-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-end gap-3 w-36 shrink-0 font-mono tabular-nums">
                  <span
                    className={`text-sm font-semibold ${
                      isLeader ? 'text-blue-800' : 'text-slate-800'
                    }`}
                  >
                    {item.normalizedScore.toFixed(1)}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </span>
                  <span className="text-xs text-slate-500 w-14 text-right">
                    {idx === 0 ? 'Top' : `${item.deltaFromLeader.toFixed(1)}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Sensitivity Insight Footer */}
      {summary.sensitivityNote && (
        <div className="px-6 py-3 border-t border-slate-200 bg-white/80 text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800">Sensitivity check: </span>
          {summary.sensitivityNote}
        </div>
      )}
    </section>
  );
}
