export function formatCoins(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} GP`;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
