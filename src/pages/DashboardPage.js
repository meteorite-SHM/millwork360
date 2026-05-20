import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ORDER_STATUSES, PO_STATUSES, ORDER_TYPES, fmt } from '../lib/supabase';
import { useAuth } from '../App';

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pos, setPos] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [o, p, i] = await Promise.all([
        supabase.from('orders').select('*').not('status', 'in', '("complete","shipped")').order('due_date'),
        supabase.from('purchase_orders').select('*, vendors(name)').not('status', 'in', '("received","cancelled")').order('created_at', { ascending: false }).limit(5),
        supabase.from('inventory').select('*').order('name'),
      ]);
      setOrders(o.data || []);
      setPos(p.data || []);
      setInventory(i.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const activeOrders = orders.length;
  const pendingShip  = orders.filter(o => o.status === 'ready_to_ship').length;
  const overdueOrders = orders.filter(o => fmt.isOverdue(o.due_date) && o.status !== 'complete').length;
  const openPOs       = pos.length;
  const lowStock      = inventory.filter(i => i.quantity <= i.reorder_threshold).length;

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Dashboard</span>
        <div className="topbar-actions">
          {profile?.role === 'office' && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/orders')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New order
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Active orders</div>
            <div className="stat-value">{activeOrders}</div>
            <div className="stat-sub">{overdueOrders > 0 ? <span className="text-danger">{overdueOrders} overdue</span> : 'All on track'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ready to ship</div>
            <div className="stat-value">{pendingShip}</div>
            <div className="stat-sub text-sec">Awaiting pickup/carrier</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open POs</div>
            <div className="stat-value">{openPOs}</div>
            <div className="stat-sub text-sec">
              {fmt.currency(pos.reduce((s, p) => s + (p.total_amount || 0), 0))} total
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low stock alerts</div>
            <div className="stat-value" style={{ color: lowStock > 0 ? 'var(--danger)' : 'var(--success)' }}>{lowStock}</div>
            <div className="stat-sub">{lowStock > 0 ? <span className="text-danger">Reorder needed</span> : <span className="text-success">All stocked</span>}</div>
          </div>
        </div>

        {/* Main panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 16 }}>
          {/* Order table */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Active orders
              </div>
              <button className="link-btn" onClick={() => navigate('/orders')}>View all →</button>
            </div>
            {orders.length === 0 ? (
              <div className="empty-state">No active orders</div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th>Order #</th><th>Customer</th><th>Type</th><th>Due</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {orders.slice(0, 8).map(o => {
                    const s = ORDER_STATUSES[o.status] || {};
                    const overdue = fmt.isOverdue(o.due_date) && !['complete','shipped'].includes(o.status);
                    return (
                      <tr key={o.id}>
                        <td><span className="mono text-accent" style={{ fontSize: 12 }}>{o.order_number}</span></td>
                        <td>{o.customer_name}</td>
                        <td className="text-sec">{ORDER_TYPES[o.order_type] || o.order_type}</td>
                        <td style={{ color: overdue ? 'var(--danger)' : 'var(--text-sec)', fontSize: 12 }}>
                          {overdue ? '⚠ ' : ''}{fmt.date(o.due_date)}
                        </td>
                        <td>
                          <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Recent POs */}
            {profile?.role === 'office' && (
              <div className="card">
                <div className="card-head">
                  <div className="card-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                    Open POs
                  </div>
                  <button className="link-btn" onClick={() => navigate('/purchase-orders')}>+ New PO</button>
                </div>
                {pos.length === 0 ? <div className="empty-state" style={{ padding: 24 }}>No open POs</div> : (
                  <div>
                    {pos.map(p => {
                      const s = PO_STATUSES[p.status] || {};
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.vendors?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              <span className="mono">{p.po_number}</span>
                              {p.expected_date ? ` · Due ${fmt.date(p.expected_date)}` : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt.currency(p.total_amount)}</div>
                            <span className="badge" style={{ background: s.bg, color: s.color, fontSize: 9, marginTop: 3 }}>{s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inventory alerts */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  Inventory alerts
                </div>
                <button className="link-btn" onClick={() => navigate('/inventory')}>View all →</button>
              </div>
              {inventory.filter(i => i.quantity <= i.reorder_threshold * 1.5).slice(0, 6).map(item => {
                const pct = Math.min(100, Math.round((item.quantity / (item.reorder_threshold * 2)) * 100));
                const color = item.quantity <= item.reorder_threshold ? 'var(--danger)' : item.quantity <= item.reorder_threshold * 1.3 ? 'var(--warning)' : 'var(--success)';
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</div>
                    </div>
                    <div className="inv-bar-wrap">
                      <div className="inv-bar" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div style={{ fontSize: 11, color, minWidth: 28, textAlign: 'right' }}>{pct}%</div>
                  </div>
                );
              })}
              {inventory.filter(i => i.quantity <= i.reorder_threshold * 1.5).length === 0 && (
                <div className="empty-state" style={{ padding: 24 }}>All items well stocked</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
