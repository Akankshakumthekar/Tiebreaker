import type {
  CriterionDriver,
  Decision,
  OptionRanking,
  WeightedAnalysisSummary,
} from '../types.ts';

export function getScoreEntry(decision: Decision, criterionId: string, optionId: string) {
  return decision.scores.find(
    (s) => s.criterionId === criterionId && s.optionId === optionId,
  );
}

export function getScoreValue(decision: Decision, criterionId: string, optionId: string): number {
  const entry = getScoreEntry(decision, criterionId, optionId);
  return entry ? entry.score : 5;
}

export function computeWeightedSummary(decision: Decision): WeightedAnalysisSummary {
  const totalWeight = decision.criteria.reduce((sum, c) => sum + c.weight, 0);
  const maxPossible = totalWeight * 10;

  const unsorted: Omit<OptionRanking, 'rank' | 'deltaFromLeader'>[] = decision.options.map((option) => {
    const rawWeightedSum = decision.criteria.reduce((sum, criterion) => {
      const score = getScoreValue(decision, criterion.id, option.id);
      return sum + criterion.weight * score;
    }, 0);

    const normalizedScore = maxPossible > 0 ? Number(((rawWeightedSum / maxPossible) * 100).toFixed(1)) : 0;
    const weightedAverage10 = totalWeight > 0 ? Number((rawWeightedSum / totalWeight).toFixed(2)) : 0;

    return {
      option,
      rawWeightedSum,
      maxPossible,
      normalizedScore,
      weightedAverage10,
    };
  });

  const sorted = [...unsorted].sort((a, b) => b.normalizedScore - a.normalizedScore);
  const topScore = sorted[0]?.normalizedScore ?? 0;

  const rankings: OptionRanking[] = sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    deltaFromLeader: Number((item.normalizedScore - topScore).toFixed(1)),
  }));

  const leader = rankings[0] ?? null;
  const runnerUp = rankings[1] ?? null;
  const margin = leader && runnerUp ? Number((leader.normalizedScore - runnerUp.normalizedScore).toFixed(1)) : 0;
  const isExactTie = Boolean(leader && runnerUp && margin < 0.05);
  const isCloseCall = Boolean(leader && runnerUp && margin <= 4.0);

  const drivers: CriterionDriver[] = [];
  if (leader && runnerUp && maxPossible > 0) {
    for (const criterion of decision.criteria) {
      const leaderScore = getScoreValue(decision, criterion.id, leader.option.id);
      const runnerUpScore = getScoreValue(decision, criterion.id, runnerUp.option.id);
      const pointAdvantage = Number(
        (((leaderScore - runnerUpScore) * criterion.weight) / maxPossible * 100).toFixed(1),
      );
      drivers.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        weight: criterion.weight,
        leaderScore,
        runnerUpScore,
        pointAdvantage,
      });
    }
    drivers.sort((a, b) => Math.abs(b.pointAdvantage) - Math.abs(a.pointAdvantage));
  }

  let sensitivityNote: string | null = null;
  if (leader && runnerUp && decision.criteria.length > 0) {
    if (isExactTie) {
      sensitivityNote = `${leader.option.name} and ${runnerUp.option.name} are tied at ${leader.normalizedScore.toFixed(1)}/100. Adjust the weight of your most non-negotiable criterion to break the deadlock.`;
    } else {
      // Check if maximizing the runner-up's strongest advantage criterion flips the outcome
      const runnerUpBest = [...drivers]
        .filter((d) => d.pointAdvantage < 0)
        .sort((a, b) => a.pointAdvantage - b.pointAdvantage)[0];

      const leaderBest = [...drivers]
        .filter((d) => d.pointAdvantage > 0)
        .sort((a, b) => b.pointAdvantage - a.pointAdvantage)[0];

      if (runnerUpBest && runnerUpBest.weight < 10) {
        const diffPerWeight = runnerUpBest.runnerUpScore - runnerUpBest.leaderScore;
        const rawGap = leader.rawWeightedSum - runnerUp.rawWeightedSum;
        const neededExtraWeight = Math.ceil((rawGap + 0.01) / diffPerWeight);
        const targetWeight = runnerUpBest.weight + neededExtraWeight;
        if (targetWeight <= 10) {
          sensitivityNote = `Raising "${runnerUpBest.criterionName}" from weight ${runnerUpBest.weight} to ${targetWeight} would flip the winner to ${runnerUp.option.name}.`;
        } else if (leaderBest && leaderBest.weight > 1) {
          const leaderDiff = leaderBest.leaderScore - leaderBest.runnerUpScore;
          const neededDrop = Math.ceil((rawGap + 0.01) / leaderDiff);
          const loweredWeight = leaderBest.weight - neededDrop;
          if (loweredWeight >= 1) {
            sensitivityNote = `Lowering "${leaderBest.criterionName}" from weight ${leaderBest.weight} to ${loweredWeight} would flip the winner to ${runnerUp.option.name}.`;
          } else {
            sensitivityNote = `${leader.option.name} holds a resilient ${margin.toFixed(1)}-point lead — no single criterion weight change flips the outcome.`;
          }
        }
      } else if (leaderBest) {
        sensitivityNote = `${leader.option.name}'s lead is driven most by "${leaderBest.criterionName}" (+${leaderBest.pointAdvantage.toFixed(1)} pts over ${runnerUp.option.name}).`;
      }
    }
  }

  return {
    rankings,
    totalWeight,
    leader,
    runnerUp,
    margin,
    isCloseCall,
    isExactTie,
    drivers,
    sensitivityNote,
  };
}

export function exportDecisionToMarkdown(decision: Decision): string {
  const summary = computeWeightedSummary(decision);
  const lines: string[] = [];

  lines.push(`# ${decision.title}`);
  lines.push('');
  if (decision.context) {
    lines.push(`**Context:** ${decision.context}`);
    lines.push('');
  }
  if (decision.summary) {
    lines.push(decision.summary);
    lines.push('');
  }

  lines.push('## Weighted Score Summary');
  lines.push('');
  lines.push('| Rank | Option | Score (/100) | Avg (/10) | Margin |');
  lines.push('| :--- | :--- | ---: | ---: | ---: |');
  for (const r of summary.rankings) {
    const marginText = r.rank === 1 ? 'Leader' : `${r.deltaFromLeader.toFixed(1)}`;
    lines.push(
      `| #${r.rank} | ${r.option.name} | ${r.normalizedScore.toFixed(1)} | ${r.weightedAverage10.toFixed(1)} | ${marginText} |`,
    );
  }
  lines.push('');

  lines.push('## Weighted Scoring Matrix');
  lines.push('');
  const headerCols = ['Criterion', 'Weight', ...decision.options.map((o) => o.name)];
  lines.push(`| ${headerCols.join(' | ')} |`);
  lines.push(`| :--- | ---: | ${decision.options.map(() => '---:').join(' | ')} |`);
  for (const c of decision.criteria) {
    const scores = decision.options.map((o) => `${getScoreValue(decision, c.id, o.id)}/10`);
    lines.push(`| ${c.name} | ${c.weight}/10 | ${scores.join(' | ')} |`);
  }
  lines.push('');

  lines.push('## Pros & Cons');
  lines.push('');
  for (const option of decision.options) {
    const pc = decision.prosCons.find((p) => p.optionId === option.id);
    lines.push(`### ${option.name}`);
    lines.push('**Pros:**');
    for (const pro of pc?.pros ?? []) {
      lines.push(`- ${pro.text} (${pro.impact} impact)`);
    }
    lines.push('');
    lines.push('**Cons:**');
    for (const con of pc?.cons ?? []) {
      lines.push(`- ${con.text} (${con.impact} impact)`);
    }
    lines.push('');
  }

  lines.push('## Comparison Table');
  lines.push('');
  lines.push(`| Dimension | ${decision.options.map((o) => o.name).join(' | ')} |`);
  lines.push(`| :--- | ${decision.options.map(() => ':---').join(' | ')} |`);
  for (const row of decision.comparisonRows) {
    const cells = decision.options.map((o) => (row.values[o.id] ?? '—').replace(/\|/g, '\\|'));
    lines.push(`| ${row.dimension} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  lines.push('## SWOT Analysis');
  lines.push('');
  for (const option of decision.options) {
    const s = decision.swot.find((item) => item.optionId === option.id);
    lines.push(`### ${option.name}`);
    lines.push(`- **Strengths:** ${(s?.strengths ?? []).join('; ')}`);
    lines.push(`- **Weaknesses:** ${(s?.weaknesses ?? []).join('; ')}`);
    lines.push(`- **Opportunities:** ${(s?.opportunities ?? []).join('; ')}`);
    lines.push(`- **Threats:** ${(s?.threats ?? []).join('; ')}`);
    lines.push('');
  }

  if (decision.blindSpots.length > 0) {
    lines.push('## Blind Spots to Verify');
    lines.push('');
    for (const bs of decision.blindSpots) {
      lines.push(`- ${bs}`);
    }
    lines.push('');
  }

  if (decision.tiebreakerAdvice) {
    lines.push('## Tiebreaker Guidance');
    lines.push('');
    lines.push(decision.tiebreakerAdvice);
  }

  return lines.join('\n');
}
