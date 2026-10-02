import React from 'react';
import { Action, Stats } from '../lib/analytics';
import { Section, btnGhost, btnPrimary, fmt, plural } from './ui';

export const PERIODS = [
  { days: 7, chip: '7 jours', phrase: 'Ces 7 derniers jours' },
  { days: 30, chip: '30 jours', phrase: 'Ces 30 derniers jours' },
  { days: 90, chip: '90 jours', phrase: 'Ces 90 derniers jours' },
  { days: 0, chip: 'Tout', phrase: 'Depuis le début' },
];

export const PeriodChips: React.FC<{ period: number; onChange: (d: number) => void }> = ({ period, onChange }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5" role="group" aria-label="Période">
    {PERIODS.map((p) => (
      <button
        key={p.days}
        type="button"
        onClick={() => onChange(p.days)}
        aria-pressed={period === p.days}
        className={`h-11 px-4 rounded-full text-sm whitespace-nowrap cursor-pointer border transition-colors ${period === p.days ? 'bg-encre text-feuille border-encre' : 'bg-feuille border-encre/55 text-encre'}`}
      >
        {p.chip}
      </button>
    ))}
  </div>
);

const levelBar = { good: 'border-malachite', warn: 'border-garance', info: 'border-or' } as const;

interface Props {
  stats: Stats;
  period: number;
  onPeriod: (d: number) => void;
  loading: boolean;
  error: string;
  truncated: boolean;
  onRetry: () => void;
  onAction: (a: Action) => void;
  busy: boolean;
}

export const Overview: React.FC<Props> = ({ stats, period, onPeriod, loading, error, truncated, onRetry, onAction, busy }) => {
  const phrase = PERIODS.find((p) => p.days === period)?.phrase ?? '';
  const top = stats.ranked.find((s) => s.demands + s.views > 0);
  const todo = stats.insights.filter((i) => i.action).slice(0, 4);
  const maxDemand = Math.max(1, ...stats.ranked.map((s) => s.demands));
  const maxDay = Math.max(1, ...stats.daily.map((d) => Math.max(d.visits, d.demands)));

  const figures = [
    { label: 'Visites de la boutique', value: stats.visits },
    { label: 'Fiches produit ouvertes', value: stats.views },
    { label: 'Clics Commander', value: stats.orders },
    { label: 'Clics Commander en gros', value: stats.wholesale },
  ];

  return (
    <div>
      <h1 className="font-display text-[1.75rem] sm:text-4xl font-semibold leading-[1.15] text-encre max-w-xl">
        {phrase} : {plural(stats.demands, 'clic', 'clics')} pour commander.
      </h1>
      <div className="mt-4"><PeriodChips period={period} onChange={onPeriod} /></div>

      {error && (
        <div role="alert" className="mt-5 rounded-lg bg-garance/10 border border-garance/30 p-4 text-sm text-garance flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={onRetry} className="h-10 px-4 rounded-full bg-garance text-white font-medium cursor-pointer shrink-0">Réessayer</button>
        </div>
      )}
      {loading && <p className="mt-5 text-sm text-encre/75" role="status">Chargement des chiffres…</p>}
      {truncated && <p className="mt-5 text-sm text-encre/75">Beaucoup d'activité : seuls les 20 000 gestes les plus récents sont comptés. Choisissez une période plus courte.</p>}

      {top ? (
        <div className="mt-7 relative">
          <img src={top.product.images[0]} alt="" className="w-full aspect-[4/3] sm:aspect-[2/1] object-cover rounded-md bg-papier" />
          <div
            className="absolute -bottom-6 left-3 sm:left-5 bg-feuille pl-9 pr-9 py-3 max-w-[85%]"
            style={{ clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)' }}
          >
            <span className="absolute left-3 top-3 w-3 h-3 rounded-full bg-papier border border-encre/55" aria-hidden="true" />
            <div className="text-xs text-encre/75">La plus demandée, réf. {top.product.reference}</div>
            <div className="font-display text-xl font-semibold leading-tight text-encre">{top.product.name}</div>
            <div className="text-sm text-encre/80">
              {plural(top.demands, 'demande', 'demandes')}
              {top.wholesale > 0 && ` dont ${top.wholesale} en gros`}, {plural(top.views, 'vue', 'vues')}
            </div>
          </div>
        </div>
      ) : (
        !loading && !error && (
          <p className="mt-7 rounded-lg bg-feuille border border-encre/15 p-4 text-sm text-encre/80 max-w-prose">
            Aucune activité sur cette période. Partagez le lien de la boutique dans vos statuts WhatsApp : la pièce la plus demandée apparaîtra ici.
          </p>
        )
      )}

      <dl className={`${top ? 'mt-14' : 'mt-8'} grid grid-cols-2 sm:grid-cols-4 gap-x-6`}>
        {figures.map((f) => (
          <div key={f.label} className="py-3 border-t border-encre/20">
            <dd className="font-display text-4xl font-semibold tabular-nums text-encre">{fmt(f.value)}</dd>
            <dt className="text-sm text-encre/70 leading-snug">{f.label}</dt>
          </div>
        ))}
      </dl>
      {stats.visits > 0 && <p className="mt-2 text-sm text-encre/70">Sur 100 visites, {stats.per100} clics pour commander sur WhatsApp.</p>}

      <Section title="À faire maintenant" hint="Chaque conseil vient des gestes de vos clientes et s'applique en un geste.">
        {todo.length === 0 ? (
          <p className="text-sm text-encre/70">Rien à corriger pour le moment. Les conseils apparaissent quand les clientes ouvrent et commandent vos produits.</p>
        ) : (
          <ul className="space-y-3">
            {todo.map((i) => (
              <li key={i.id} className={`bg-feuille rounded-xl border-l-4 ${levelBar[i.level]} pl-4 pr-4 py-4`}>
                <h3 className="font-display text-lg font-semibold leading-snug text-encre">{i.title}</h3>
                <p className="mt-1 text-[15px] text-encre/80 leading-relaxed max-w-prose">{i.text}</p>
                {i.action && (
                  <button type="button" disabled={busy} onClick={() => onAction(i.action!)} className={`mt-3 h-11 px-5 text-sm ${i.level === 'warn' ? btnPrimary : btnGhost}`}>
                    {busy && i.action.kind === 'patch' ? 'Un instant…' : i.action.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Les plus demandées" hint="Barre dorée : clics Commander. Barre verte : clics Commander en gros.">
        <ol className="space-y-4">
          {stats.ranked.slice(0, 6).map((s, i) => (
            <li key={s.product.id} className="grid grid-cols-[1.25rem_3rem_1fr] items-center gap-3">
              <span className="font-display text-lg text-encre/75 tabular-nums">{i + 1}</span>
              <img src={s.product.images[0]} alt="" loading="lazy" decoding="async" className="w-12 h-12 rounded-md object-cover bg-papier" />
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium text-encre">{s.product.name}</span>
                  <span className="text-sm text-encre/70 tabular-nums shrink-0">{plural(s.demands, 'demande', 'demandes')}</span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-encre/10 overflow-hidden flex" role="presentation">
                  <span className="bg-or h-full" style={{ width: `${(s.orders / maxDemand) * 100}%` }} />
                  <span className="bg-malachite h-full" style={{ width: `${(s.wholesale / maxDemand) * 100}%` }} />
                </div>
                <div className="mt-1 text-xs text-encre/75">
                  {plural(s.views, 'vue', 'vues')}
                  {s.product.soldOut && ', épuisée'}
                  {s.product.hidden && ', masquée'}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Jour après jour">
        <div className="flex items-end gap-1.5 h-32" role="img" aria-label="Visites et clics pour commander par jour">
          {stats.daily.map((d) => (
            <div key={d.label} className="flex-1 h-full flex items-end gap-0.5" title={`${d.label} : ${d.visits} visites, ${d.demands} clics`}>
              <span className="flex-1 rounded-t-sm bg-encre/25" style={{ height: `${(d.visits / maxDay) * 100}%`, minHeight: d.visits ? 3 : 0 }} />
              <span className="flex-1 rounded-t-sm bg-or" style={{ height: `${(d.demands / maxDay) * 100}%`, minHeight: d.demands ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          {stats.daily.map((d) => (
            <span key={d.label} className="flex-1 text-center text-xs text-encre/75">{d.short}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-encre/70">Gris : visites. Or : clics pour commander.</p>
      </Section>
    </div>
  );
};
