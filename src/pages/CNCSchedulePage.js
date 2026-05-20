import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/ToastContext'
import { CNC_STATUSES, cncStatusBadge, fmtDate } from '../lib/utils'

const CNC_STATUS_COLORS = {
  'Done': 'var(--green)',
  'Run': 'var(--blue)',
  'Pause': 'var(--amber)',
  'Hold': 'var(--red)',
  'Pending': 'var(--text3)',
}

function ImportModal({ onClose, onImported }) {
  const { addToast } = useToast()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  function parseDate(str) {
    if (!str) return null
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
    const parts = str.trim().split('-')
    if (parts.length === 2) {
      const day = parseInt(parts[0])
      const month = months[parts[1]]
      if (!isNaN(day) && month !== undefined) {
        const year = new Date().getFullYear()
        return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      }
    }
    return null
  }

  async function doImport() {
    const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('BUILDER'))
    if (!lines.length) return addToast('No data to import', 'error')
    setSaving(true)
    const rows = []
    for (const line of lines) {
      const cols = line.split('\t')
      if (cols.length < 3) continue
      const builder = cols[0]?.trim()
      const customer = cols[1]?.trim()
      const orderNum = cols[2]?.trim()
      const batch = cols[3]?.trim()
      const qty = parseInt(cols[4]) || null
      const species = cols[5]?.trim()
      const doorStyle = cols[6]?.trim()
      const cncDue = parseDate(cols[7]?.trim())
      const cncStatus = cols[8]?.trim() || 'Pending'
      const cncReq = cols[9]?.trim()
      const cncProgram = cols[10]?.trim()
      if (!orderNum || !customer) continue
      rows.push({
        order_number: orderNum,
        customer,
        builder,
        batch: batch || null,
        qty,
        species,
        door_style: doorStyle,
        description: doorStyle,
        cnc_due_date: cncDue,
        cnc_status: CNC_STATUSES.includes(cncStatus) ? cncStatus : 'Pending',
        cnc_req: cncReq || null,
        cnc_program: cncProgram || null,
        status: 'Ready for CNC',
      })
    }
    if (!rows.length) { addToast('Could not parse any rows — make sure you copied directly from Excel', 'error'); setSaving(false); return }
    const { error } = await supabase.from('orders').upsert(rows, { onConflict: 'order_number' })
    if (error) addToast(error.message, 'error')
    else { addToast(`${rows.length} orders imported!`, 'success'); onImported() }
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:700}}>
        <div className="modal-header">
          <h3>Import from Excel</h3>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:'13px',color:'var(--text2)',marginBottom:12}}>
            Open your Excel file, select all rows (including header), copy (Cmd+C), then paste below:
          </p>
          <textarea
            value={text}
            onChange={e=>setText(e.target.value)}
            placeholder="Paste your Excel data here..."
            style={{width:'100%',minHeight:200,fontFamily:'var(--mono)',fontSize:12}}
          />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doImport} disabled={saving}>{saving?'Importing…':'Import Orders'}</button>
        </div>
      </div>
    </div>
  )
}

export default function CNCSchedulePage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['CNC Prep','Ready for CNC','In Production'])
      .order('cnc_due_date', { ascending: true, nullsFirst: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateCNCStatus(id, status) {
    setUpdatingId(id)
    const { error } = await supabase.from('orders').update({ cnc_status: status }).eq('id', id)
    if (error) addToast(error.message, 'error')
    else {
      setOrders(o => o.map(x => x.id === id ? {...x, cnc_status: status} : x))
      addToast('CNC status updated', 'success')
    }
    setUpdatingId(null)
  }

  if (loading) return <div className="loading"><div className="spinner"/>Loading…</div>

  const today = new Date().toISOString().split('T')[0]
  const overdue = orders.filter(o => o.cnc_due_date && o.cnc_due_date < today && o.cnc_status !== 'Done')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>CNC Schedule</h1>
          <p>{orders.length} orders · {overdue.length > 0 ? <span style={{color:'var(--red)'}}>{overdue.length} overdue</span> : 'all on schedule'}</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={() => setShowImport(true)}>⬆ Import from Excel</button>
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{background:'var(--red-light)',border:'1px solid #F7C1C1',borderRadius:'var(--radius)',padding:'10px 16px',marginBottom:16,fontSize