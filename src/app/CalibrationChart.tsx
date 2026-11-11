import { useId, useState } from 'react';
import { binJudgements, mostPointsSide, type Judgement } from '@/engine/calibration';
import { brierMean } from '@/engine/scoring';
import { useT } from '@/i18n/useT';

/**
 * Calibration chart (design §6): confidence (x) vs. share correct (y) in three
 * confidence bins, one series in --accent, a dashed diagonal "perfectly
 * calibrated" reference, direct labels only for points far from the diagonal,
 * and a table alternative that is always in the DOM for screen readers.
 */
export function CalibrationChart({ judgements }: { judgements: Judgement[] }) {
  const { t } = useT();
  const id = useId();
  const [showTable, setShowTable] = useState(false);
  const bins = binJudgements(judgements);
  const brier = brierMean(judgements);
  const side = mostPointsSide(bins);

  // SVG geometry (4:3), numbers in viewBox units.
  const W = 360;
  const H = 270;
  const L = 44;
  const R = 12;
  const T = 16;
  const B = 40;
  const x = (pct: number) => L + ((pct - 50) / 50) * (W - L - R);
  const y = (pct: number) => T + (1 - pct / 100) * (H - T - B);
  // Point labels sit on the point but are pulled inward near the edges so they are never cut off.
  const labelAnchor = (px: number) => (px > W - R - 40 ? 'end' : px < L + 40 ? 'start' : 'middle');
  const labelX = (px: number) => (px > W - R - 40 ? W - R : px < L + 40 ? L + 2 : px);
  const maxN = Math.max(0, ...bins.map((b) => b.n));
  const pts = bins.map((b) => ({ ...b, px: x(b.meanConfidence), py: y(b.accuracy), far: Math.abs(b.meanConfidence - b.accuracy) >= 15 }));

  return (
    <figure className="w-full max-w-[360px]" data-testid="calibration-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ direction: 'ltr' }} role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-table`}>
        <title id={`${id}-title`}>{t('calib.title')}</title>
        {/* axes */}
        <line x1={L} y1={y(0)} x2={W - R} y2={y(0)} stroke="var(--border)" />
        <line x1={L} y1={y(0)} x2={L} y2={T} stroke="var(--border)" />
        {[50, 60, 70, 80, 90, 100].map((v) => (
          <g key={v}>
            <line x1={x(v)} y1={y(0)} x2={x(v)} y2={y(0) + 4} stroke="var(--border)" />
            <text x={x(v)} y={y(0) + 16} textAnchor="middle" fontSize="11" fill="var(--fg-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {v}%
            </text>
          </g>
        ))}
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={L - 4} y1={y(v)} x2={L} y2={y(v)} stroke="var(--border)" />
            <text x={L - 7} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--fg-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {v}%
            </text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" fontSize="12" fill="var(--fg-muted)">
          {t('calib.xAxis')}
        </text>
        <text x={12} y={(T + y(0)) / 2} textAnchor="middle" fontSize="12" fill="var(--fg-muted)" transform={`rotate(-90 12 ${(T + y(0)) / 2})`}>
          {t('calib.yAxis')}
        </text>
        {/* reference diagonal */}
        <line x1={x(50)} y1={y(50)} x2={x(100)} y2={y(100)} stroke="var(--fg-muted)" strokeDasharray="4 4" />
        <text x={x(100) - 4} y={y(100) + 12} textAnchor="end" fontSize="11" fill="var(--fg-muted)">
          {t('calib.reference')}
        </text>
        <text x={x(100) - 4} y={y(0) - 8} textAnchor="end" fontSize="11" fill="var(--fg-muted)">
          {t('calib.overZone')}
        </text>
        <text x={x(50) + 4} y={T + 12} textAnchor="start" fontSize="11" fill="var(--fg-muted)">
          {t('calib.underZone')}
        </text>
        {/* series */}
        {pts.length >= 2 && <polyline points={pts.map((p) => `${p.px},${p.py}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="1.5" />}
        {pts.map((p) => (
          <g key={p.id}>
            <circle cx={p.px} cy={p.py} r="4" fill="var(--accent)">
              <title>{t('calib.point', { conf: Math.round(p.meanConfidence), acc: Math.round(p.accuracy), n: p.n })}</title>
            </circle>
            {(p.far || p.n === maxN) && (
              <text x={labelX(p.px)} y={p.meanConfidence > p.accuracy ? p.py - 10 : p.py + 18} textAnchor={labelAnchor(p.px)} fontSize="11" fill="var(--fg)">
                {t('calib.pointShort', { conf: Math.round(p.meanConfidence), acc: Math.round(p.accuracy) })}
                <tspan x={labelX(p.px)} dy="12" fill="var(--fg-muted)">
                  {t('calib.pointN', { n: p.n })}
                </tspan>
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-sm" data-testid="calibration-caption">
        {brier === null ? t('calib.empty') : `${t('calib.brier', { b: brier.toFixed(2) })} ${t(`calib.side.${side ?? 'ok'}`)}`}
      </figcaption>
      <button type="button" className="mt-2 text-xs text-accent-ink underline" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable} data-testid="toggle-calib-table">
        {t('calib.showTable')}
      </button>
      <table id={`${id}-table`} className={`mt-2 w-full text-xs ${showTable ? '' : 'sr-only'}`}>
        <caption className="text-start text-fg-muted">{t('calib.tableCaption')}</caption>
        <thead>
          <tr className="text-start text-fg-muted">
            <th className="py-1 text-start">{t('calib.col.range')}</th>
            <th className="py-1 text-start">{t('calib.col.n')}</th>
            <th className="py-1 text-start">{t('calib.col.correct')}</th>
            <th className="py-1 text-start">{t('calib.col.acc')}</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((b) => (
            <tr key={b.id} className="border-t border-border">
              <td className="py-1">
                <bdi>
                  {b.lo}–{b.hi}%
                </bdi>
              </td>
              <td className="py-1">
                <bdi>{b.n}</bdi>
              </td>
              <td className="py-1">
                <bdi>{b.correct}</bdi>
              </td>
              <td className="py-1">
                <bdi>{Math.round(b.accuracy)}%</bdi>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
