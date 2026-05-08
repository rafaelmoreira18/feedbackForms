export function questionAvgColor(avg: number, max: number): { barColor: string; badge: string } {
  const pct = avg / max
  if (pct >= 0.75) return { barColor: '#52a350', badge: 'bg-green-base/10 text-green-base border border-green-base/30' }
  if (pct >= 0.5)  return { barColor: '#facc15', badge: 'bg-yellow-50 text-yellow-600 border border-yellow-300' }
  return { barColor: '#e74c3c', badge: 'bg-red-base/10 text-red-base border border-red-base/30' }
}

export function avgColor(avg: number, max: number): string {
  const pct = avg / max
  if (pct >= 0.75) return 'bg-green-base/10 text-green-base border border-green-base/30'
  if (pct >= 0.5)  return 'bg-yellow-50 text-yellow-600 border border-yellow-300'
  return 'bg-red-base/10 text-red-base border border-red-base/30'
}

export function npsColor(v: number): string {
  if (v >= 9) return 'bg-green-base/10 text-green-base border border-green-base/30'
  if (v >= 7) return 'bg-yellow-50 text-yellow-600 border border-yellow-300'
  return 'bg-red-base/10 text-red-base border border-red-base/30'
}
