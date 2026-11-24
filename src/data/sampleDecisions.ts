import type { Decision } from '../types.ts';

export const SAMPLE_DECISIONS: Decision[] = [
  {
    id: 'sample-career-move',
    title: 'Join a Series A Startup as Founding Engineer vs. Stay as Senior Engineer',
    context:
      'Evaluating a Series A developer-tools startup offer ($175k base + 0.65% equity, hybrid 3 days/week) against staying at an established public tech company ($215k base + $95k/yr liquid RSUs, mostly remote).',
    summary:
      'This choice balances predictable liquid compensation and remote autonomy against accelerated ownership, leadership scope, and asymmetric equity upside over a 3–4 year horizon.',
    createdAt: '2026-11-20T14:30:00.000Z',
    updatedAt: '2026-11-20T14:30:00.000Z',
    options: [
      {
        id: 'opt-startup',
        name: 'Join Series A Startup',
        tagline: 'High ownership, steeper learning curve, concentrated equity risk',
      },
      {
        id: 'opt-bigtech',
        name: 'Stay at Current Company',
        tagline: 'Predictable liquid income, remote flexibility, slower title growth',
      },
    ],
    prosCons: [
      {
        optionId: 'opt-startup',
        pros: [
          {
            id: 'p1',
            text: 'Direct architectural ownership across the core platform with zero bureaucracy.',
            impact: 'high',
          },
          {
            id: 'p2',
            text: '0.65% equity grants meaningful upside if the company reaches Series C or acquisition.',
            impact: 'high',
          },
          {
            id: 'p3',
            text: 'Fast path to Staff/Principal or Engineering Manager scope within 18 months.',
            impact: 'medium',
          },
          {
            id: 'p4',
            text: 'Close exposure to customers, founders, and go-to-market strategy.',
            impact: 'medium',
          },
        ],
        cons: [
          {
            id: 'c1',
            text: 'Immediate $135k drop in liquid annual compensation compared to base + RSU vesting.',
            impact: 'high',
          },
          {
            id: 'c2',
            text: '3-day in-office commute reduces weekly focus time and schedule flexibility.',
            impact: 'medium',
          },
          {
            id: 'c3',
            text: 'Higher runway and product-market-fit risk; equity could realistically expire at $0.',
            impact: 'high',
          },
          {
            id: 'c4',
            text: 'On-call and ambiguous scope can lead to sustained 50+ hour weeks.',
            impact: 'medium',
          },
        ],
      },
      {
        optionId: 'opt-bigtech',
        pros: [
          {
            id: 'p5',
            text: '$310k total liquid compensation funds near-term savings and housing goals effortlessly.',
            impact: 'high',
          },
          {
            id: 'p6',
            text: 'Remote-first cadence preserves 6+ hours per week and low baseline stress.',
            impact: 'high',
          },
          {
            id: 'p7',
            text: 'Mature tooling, mentorship bench, and predictable quarterly review cycles.',
            impact: 'medium',
          },
          {
            id: 'p8',
            text: 'Strong brand resume signal and stability during macro volatility.',
            impact: 'low',
          },
        ],
        cons: [
          {
            id: 'c5',
            text: 'Promotion to Staff Engineer is bottlenecked by org headcount and politics.',
            impact: 'high',
          },
          {
            id: 'c6',
            text: 'Incremental maintenance work risks skill stagnation over the next 2 years.',
            impact: 'medium',
          },
          {
            id: 'c7',
            text: 'Limited influence over product direction or company-level technical bets.',
            impact: 'medium',
          },
        ],
      },
    ],
    comparisonRows: [
      {
        id: 'row-comp',
        dimension: 'Year-1 Liquid Compensation',
        values: {
          'opt-startup': '$175k base cash (equity illiquid)',
          'opt-bigtech': '$310k ($215k base + $95k liquid RSUs)',
        },
      },
      {
        id: 'row-upside',
        dimension: '4-Year Asymmetric Upside',
        values: {
          'opt-startup': 'High ($500k–$2M+ on strong exit, $0 downside)',
          'opt-bigtech': 'Moderate (steady 10–15% annual stock appreciation)',
        },
      },
      {
        id: 'row-autonomy',
        dimension: 'Technical Ownership',
        values: {
          'opt-startup': 'End-to-end architecture & hiring input',
          'opt-bigtech': 'Scoped to one subsystem within larger org',
        },
      },
      {
        id: 'row-lifestyle',
        dimension: 'Work-Life & Flexibility',
        values: {
          'opt-startup': 'Hybrid 3 days in office, intense sprint cadence',
          'opt-bigtech': 'Mostly remote, predictable 40–42 hr weeks',
        },
      },
      {
        id: 'row-growth',
        dimension: 'Career Acceleration (24 mos)',
        values: {
          'opt-startup': 'Rapid generalist growth & leadership credibility',
          'opt-bigtech': 'Deep distributed-systems scale, slower promotion',
        },
      },
      {
        id: 'row-reversibility',
        dimension: 'Reversibility',
        values: {
          'opt-startup': 'High — can return to big tech within 18 months',
          'opt-bigtech': 'Moderate — specific founding offers are rare',
        },
      },
    ],
    swot: [
      {
        optionId: 'opt-startup',
        strengths: [
          'Unmatched ownership over product architecture from day one',
          'Direct mentorship and trust with technical co-founders',
          'Meaningful 0.65% founding equity stake with early exercise option',
        ],
        weaknesses: [
          'Significant near-term cash flow reduction ($135k/yr gap)',
          'Thin operational guardrails and heavier on-call burden',
          'Commute friction three days every week',
        ],
        opportunities: [
          'Grow into Head of Platform or VP Engineering as the team scales',
          'Build a tight network with top VCs and early startup operators',
          'Ship a category-defining developer tool in a fast-growing market',
        ],
        threats: [
          'Runway compression if enterprise sales lag over the next 18 months',
          'Incumbent tech giants cloning the core feature set',
          'Burnout if hiring lags behind customer commitments',
        ],
      },
      {
        optionId: 'opt-bigtech',
        strengths: [
          'Top-decile liquid compensation and comprehensive benefits',
          'Remote autonomy enabling strong personal health and side projects',
          'High institutional trust and established reputation internally',
        ],
        weaknesses: [
          'Slow decision velocity due to multi-team alignment overhead',
          'Limited equity leverage compared to an early-stage stake',
          'Narrowing technical breadth if staying on the same product surface',
        ],
        opportunities: [
          'Transfer internally to a newly funded AI infrastructure team',
          'Use surplus savings and remote time to invest or build independently',
          'Negotiate a retention refresher using the external offer as leverage',
        ],
        threats: [
          'Periodic corporate reorganizations shifting team priorities overnight',
          'Golden handcuffs making future entrepreneurial leaps harder',
          'Gradual erosion of urgency and 0-to-1 execution muscle',
        ],
      },
    ],
    criteria: [
      {
        id: 'crit-growth',
        name: 'Skill & Leadership Growth',
        description: 'Speed of expanding technical breadth, ownership, and senior judgment',
        weight: 9,
      },
      {
        id: 'crit-cash',
        name: 'Near-Term Financial Security',
        description: 'Predictable liquid income and savings rate over the next 24 months',
        weight: 8,
      },
      {
        id: 'crit-balance',
        name: 'Flexibility & Sustainable Pace',
        description: 'Remote autonomy, commute load, and ability to sustain energy long-term',
        weight: 7,
      },
      {
        id: 'crit-upside',
        name: 'Long-Term Financial Upside',
        description: 'Potential for step-change net worth growth over a 4–6 year horizon',
        weight: 6,
      },
      {
        id: 'crit-energy',
        name: 'Day-to-Day Excitement',
        description: 'Intrinsic motivation from the problem space, team speed, and visible impact',
        weight: 8,
      },
      {
        id: 'crit-risk',
        name: 'Downside Protection',
        description: 'Stability of runway, clear role boundaries, and low volatility',
        weight: 5,
      },
    ],
    scores: [
      {
        criterionId: 'crit-growth',
        optionId: 'opt-startup',
        score: 9,
        rationale: 'Founding scope compresses 4 years of architecture and product decisions into 18 months.',
      },
      {
        criterionId: 'crit-growth',
        optionId: 'opt-bigtech',
        score: 6,
        rationale: 'Strong scale exposure, but organizational layers limit broad ownership.',
      },
      {
        criterionId: 'crit-cash',
        optionId: 'opt-startup',
        score: 5,
        rationale: '$175k covers living costs comfortably but leaves $135k/yr on the table.',
      },
      {
        criterionId: 'crit-cash',
        optionId: 'opt-bigtech',
        score: 9,
        rationale: 'Liquid RSUs plus $215k base provide exceptional cash predictability.',
      },
      {
        criterionId: 'crit-balance',
        optionId: 'opt-startup',
        score: 5,
        rationale: 'Three days in office plus startup urgency compress personal time.',
      },
      {
        criterionId: 'crit-balance',
        optionId: 'opt-bigtech',
        score: 9,
        rationale: 'Remote flexibility and mature on-call rotations protect weekly balance.',
      },
      {
        criterionId: 'crit-upside',
        optionId: 'opt-startup',
        score: 8,
        rationale: '0.65% at Series A has realistic 7-figure upside on a strong outcome, though risk-adjusted.',
      },
      {
        criterionId: 'crit-upside',
        optionId: 'opt-bigtech',
        score: 6,
        rationale: 'Compounding high savings is reliable, but lacks asymmetric equity leverage.',
      },
      {
        criterionId: 'crit-energy',
        optionId: 'opt-startup',
        score: 9,
        rationale: 'Direct customer feedback loops and zero red tape maximize daily momentum.',
      },
      {
        criterionId: 'crit-energy',
        optionId: 'opt-bigtech',
        score: 5,
        rationale: 'Familiar codebase and consensus meetings reduce day-to-day spark.',
      },
      {
        criterionId: 'crit-risk',
        optionId: 'opt-startup',
        score: 4,
        rationale: 'Series A companies face real product-market fit and fundraising risk.',
      },
      {
        criterionId: 'crit-risk',
        optionId: 'opt-bigtech',
        score: 8,
        rationale: 'Public company balance sheet and severance protections cushion downside.',
      },
    ],
    blindSpots: [
      'Ask the startup founders for exact current ARR, net burn rate, months of runway, and last-round liquidation preferences before valuing the 0.65% equity.',
      'Test whether an internal transfer to a high-priority 0-to-1 team at your current company captures 70% of the excitement without the $135k pay cut.',
      'Check if you have 12+ months of cash reserves so the lower base salary never creates household stress.',
    ],
    tiebreakerAdvice:
      'Because the weighted totals are nearly neck-and-neck, treat this as a regret-minimization test: if you have 12+ months of savings and no major cash milestone in the next 2 years, the startup leap is far easier to reverse than a missed founding window.',
    devilsAdvocate: null,
  },
  {
    id: 'sample-housing-choice',
    title: 'Buy a Townhouse Now vs. Keep Renting & Invest the Down Payment',
    context:
      'Comparing purchasing a $620k townhouse (20% down, 6.2% mortgage, $380/mo HOA) versus renting a comparable 2BR apartment for $2,950/mo and investing the $140k cash + monthly savings in index funds over a 5-year horizon.',
    summary:
      'Renting preserves liquidity, lower monthly outflow, and mobility over a 5-year window, whereas buying locks in housing stability and leveraged equity appreciation if you plan to stay 7+ years.',
    createdAt: '2026-11-18T09:15:00.000Z',
    updatedAt: '2026-11-18T09:15:00.000Z',
    options: [
      {
        id: 'opt-buy',
        name: 'Buy the Townhouse',
        tagline: 'Fixed principal path, customization freedom, high upfront transaction costs',
      },
      {
        id: 'opt-rent',
        name: 'Rent & Invest',
        tagline: 'Lower monthly cash outflow, full geographic mobility, market liquidity',
      },
      {
        id: 'opt-wait',
        name: 'Rent 18 Months & Re-evaluate',
        tagline: 'Preserve optionality while tracking rates and growing down payment',
      },
    ],
    prosCons: [
      {
        optionId: 'opt-buy',
        pros: [
          {
            id: 'bp1',
            text: 'Full control over renovations, pets, and long-term neighborhood roots.',
            impact: 'high',
          },
          {
            id: 'bp2',
            text: 'Protection against future local rent spikes with a fixed mortgage payment.',
            impact: 'medium',
          },
          {
            id: 'bp3',
            text: 'Potential to refinance later if mortgage rates drop meaningfully.',
            impact: 'medium',
          },
        ],
        cons: [
          {
            id: 'bc1',
            text: 'Monthly all-in cost (~$4,150 with PITI + HOA + upkeep) exceeds rent by ~$1,200/mo.',
            impact: 'high',
          },
          {
            id: 'bc2',
            text: 'Closing and selling costs (8–10% round-trip) penalize selling before year 6.',
            impact: 'high',
          },
          {
            id: 'bc3',
            text: 'Concentrates $140k+ net worth into a single illiquid local property.',
            impact: 'medium',
          },
        ],
      },
      {
        optionId: 'opt-rent',
        pros: [
          {
            id: 'rp1',
            text: 'Invested down payment plus $1,200/mo surplus compounds in liquid diversified equities.',
            impact: 'high',
          },
          {
            id: 'rp2',
            text: 'Zero surprise roof, HVAC, or HOA special assessment expenses.',
            impact: 'medium',
          },
          {
            id: 'rp3',
            text: 'Easy to relocate for career opportunities or lifestyle shifts at lease end.',
            impact: 'high',
          },
        ],
        cons: [
          {
            id: 'rc1',
            text: 'Exposure to annual rent increases and non-renewal risk.',
            impact: 'medium',
          },
          {
            id: 'rc2',
            text: 'Cannot customize the living space or build leveraged real estate equity.',
            impact: 'medium',
          },
        ],
      },
      {
        optionId: 'opt-wait',
        pros: [
          {
            id: 'wp1',
            text: 'Buys time to clarify 5-year career location before locking into transaction costs.',
            impact: 'high',
          },
          {
            id: 'wp2',
            text: 'Lets cash earn risk-free yield while expanding down payment buffer.',
            impact: 'medium',
          },
        ],
        cons: [
          {
            id: 'wc1',
            text: 'Home prices could appreciate faster than savings if rates fall and buyers rush back.',
            impact: 'high',
          },
          {
            id: 'wc2',
            text: 'Delays the emotional peace of settling into a permanent home.',
            impact: 'low',
          },
        ],
      },
    ],
    comparisonRows: [
      {
        id: 'cr-monthly',
        dimension: 'Estimated Monthly Outflow',
        values: {
          'opt-buy': '~$4,150/mo (PITI + HOA + 1% upkeep)',
          'opt-rent': '$2,950/mo + renters insurance',
          'opt-wait': '$2,950/mo while saving $1,200/mo',
        },
      },
      {
        id: 'cr-upfront',
        dimension: 'Upfront Cash Locked',
        values: {
          'opt-buy': '~$142,000 (20% down + closing)',
          'opt-rent': '~$6,000 (deposit + moving)',
          'opt-wait': '~$6,000 (down payment stays liquid)',
        },
      },
      {
        id: 'cr-breakeven',
        dimension: 'Financial Break-Even Horizon',
        values: {
          'opt-buy': '6–8 years in current rate environment',
          'opt-rent': 'Immediate monthly cash advantage',
          'opt-wait': 'Re-assessed at 18 months',
        },
      },
      {
        id: 'cr-mobility',
        dimension: 'Relocation Flexibility',
        values: {
          'opt-buy': 'Low (high selling friction)',
          'opt-rent': 'High (annual lease exit)',
          'opt-wait': 'High over next 18 months',
        },
      },
    ],
    swot: [
      {
        optionId: 'opt-buy',
        strengths: ['Forced equity accumulation', 'Permanent personal space', 'Fixed principal & interest'],
        weaknesses: ['High monthly carrying cost', 'Illiquid capital tie-up', 'Maintenance & HOA obligations'],
        opportunities: ['Refinance if mortgage rates decline', 'Long-term appreciation in transit corridor'],
        threats: ['Job relocation before break-even year', 'Unexpected HOA special assessments'],
      },
      {
        optionId: 'opt-rent',
        strengths: ['Superior 5-year liquidity', 'Predictable capped monthly housing bill', 'Zero maintenance burden'],
        weaknesses: ['No home equity leverage', 'Landlord control over lease terms'],
        opportunities: ['Compound diversified portfolio at historical market rates', 'Capture out-of-state career jumps'],
        threats: ['Rapid local rent inflation', 'Emotional fatigue from temporary housing'],
      },
      {
        optionId: 'opt-wait',
        strengths: ['Preserves optionality', 'Builds larger emergency reserve', 'Avoids rushed purchase'],
        weaknesses: ['Market-timing uncertainty', 'Another year of moving/lease overhead'],
        opportunities: ['Buy with higher certainty on neighborhood & family plans', 'Potential inventory expansion'],
        threats: ['Rate cuts triggering bidding wars and higher purchase prices'],
      },
    ],
    criteria: [
      {
        id: 'hc-wealth',
        name: '5-Year Net Worth Impact',
        description: 'Projected total wealth after equity, investment returns, and transaction costs',
        weight: 9,
      },
      {
        id: 'hc-flex',
        name: 'Geographic & Career Flexibility',
        description: 'Ability to move without taking a financial penalty',
        weight: 8,
      },
      {
        id: 'hc-stability',
        name: 'Home Stability & Customization',
        description: 'Sense of permanence, space ownership, and no landlord uncertainty',
        weight: 7,
      },
      {
        id: 'hc-cashflow',
        name: 'Monthly Cash-Flow Comfort',
        description: 'Breathing room in monthly budget for travel, investing, and emergencies',
        weight: 8,
      },
    ],
    scores: [
      { criterionId: 'hc-wealth', optionId: 'opt-buy', score: 6, rationale: 'Transaction costs and 6.2% interest weigh heavily inside a 5-year horizon.' },
      { criterionId: 'hc-wealth', optionId: 'opt-rent', score: 8, rationale: 'Investing $140k + $1,200/mo typically outperforms buying over 5 years at current price-to-rent ratios.' },
      { criterionId: 'hc-wealth', optionId: 'opt-wait', score: 7, rationale: 'Strong near-term yield, though waiting in cash slightly trails equity investing.' },
      { criterionId: 'hc-flex', optionId: 'opt-buy', score: 3, rationale: 'Selling inside 3–4 years almost guarantees a net loss after fees.' },
      { criterionId: 'hc-flex', optionId: 'opt-rent', score: 9, rationale: 'Annual lease gives maximum career and personal flexibility.' },
      { criterionId: 'hc-flex', optionId: 'opt-wait', score: 8, rationale: 'Keeps options open while setting a deliberate future decision checkpoint.' },
      { criterionId: 'hc-stability', optionId: 'opt-buy', score: 9, rationale: 'Unmatched control over your living environment and neighborhood roots.' },
      { criterionId: 'hc-stability', optionId: 'opt-rent', score: 5, rationale: 'Subject to lease renewals and limited customization.' },
      { criterionId: 'hc-stability', optionId: 'opt-wait', score: 6, rationale: 'Temporary compromise with a clear path to buying later.' },
      { criterionId: 'hc-cashflow', optionId: 'opt-buy', score: 5, rationale: 'Noticeably tighter monthly budget plus unpredictable maintenance.' },
      { criterionId: 'hc-cashflow', optionId: 'opt-rent', score: 9, rationale: 'Keeps ~$1,200/mo free with capped downside.' },
      { criterionId: 'hc-cashflow', optionId: 'opt-wait', score: 8, rationale: 'Comfortable monthly cushion while building reserves.' },
    ],
    blindSpots: [
      'Inspect the townhouse HOA reserve study — underfunded reserves often trigger $15k–$30k special assessments.',
      'Check whether you are truly disciplined about investing the $1,200/mo rent savings automatically each month.',
      'Verify your realistic stay horizon: if you are 90% confident you will stay 8+ years, buying improves substantially.',
    ],
    tiebreakerAdvice:
      'Your stay horizon is the decisive variable: under 5 years strongly favors Rent & Invest; 8+ years of high-confidence roots shifts the math toward Buying.',
    devilsAdvocate: null,
  },
];
