export const ORDER_STATUSES = ['Takeoff','Ordered','In Production','Ready to Ship','Completed','On Hold']

export const PO_STATUSES = ['Draft','Sent','Ordered','Partially Received','Received','Cancelled']

export function orderStatusBadge(status) {
  const map = {
    'Takeoff': 'badge-blue',
    'Ordered': 'badge-amber',
    'In Production': 'badge-amber',
    'Ready to Ship': 'badge-green',
    'Completed': 'badge-gray',
    'On Hold': 'badge-red',
  }
  return map[status] || 'badge-gray'
}

export function poStatusBadge(status) {
  const map = {
    'Draft': 'badge-gray',
    'Sent': 'badge-blue',
    'Ordered': 'badge-amber',
    'Partially Received': 'badge-amber',
    'Received': 'badge-green',
    'Cancelled': 'badge-red',
  }
  return map[status] || 'badge-gray'
}

export function invStatus(qty, reorder) {
  if (qty <= 0) return { label: 'Out', cls: 'badge-red', pct: 0 }
  if (qty <= reorder) return { label: 'Low', cls: 'badge-amber', pct: Math.max(8, (qty / (reorder * 2)) * 100) }
  return { label: 'OK', cls: 'badge-green', pct: Math.min(100, (qty / (reorder * 3)) * 100) }
}

export function invBarColor(qty, reorder) {
  if (qty <= 0) return 'var(--red)'
  if (qty <= reorder) return 'var(--amber)'
  return 'var(--green)'
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtMoney(n) {
  if (n == null) return '—'
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
