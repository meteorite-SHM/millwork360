import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/ToastContext'
import { CNC_STATUSES, fmtDate } from '../lib/utils'

const CNC_STATUS_COLORS = {
  Done: 'var(--green)',
  Run: 'var(--blue)',
  Pause: 'var(--amber)',
  Hold: 'var(--red)',
  Pending: 'var(--text3)',
}

const PROGRAM_STATUSES = ['', 'DONE', 'RUN', 'PENDING']
const ORDER_STATUSES = ['Takeoff','Waiting on MTL','In Production','Ready for CNC','Ready for PH','Finishing','Ready to Ship','Completed','On Hold']

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
        return year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0')
      }
    }
    return null
  }

  async function doImport() {
    const lines = text.trim().split('\n').filter(function(l) { return l.trim() && !l.startsWith('BUILDER') })
    if (!lines.length) return addToast('No data to import', 'error')
    setSaving(true)
    const rows = []
    for (const line of lines) {
      const cols = line.split('\t')
      if (cols.length < 3) continue
      const builder = (cols[0] || '').trim()
      const customer = (cols[1] || '').trim()
      const orderNum = (cols[2] || '').trim()
      const batch = (cols[3] || '').trim()
      const qty = parseInt(cols[4]) || null
      const species = (cols[5] || '').trim()
      const doorStyle = (cols[6] || '').trim()
      const cncDue = parseDate((cols[7] || '').trim())
      const cncStatusRaw = (cols[8] || '').trim()
      const cncReq = (cols[9] || '').trim()
      const cncProgram = (cols[10] || '').trim()
      if (!orderNum || !customer) continue
      rows.push({
        order_number: orderNum,
        customer: customer,
        builder: builder,
        batch: batch || null,
        qty: qty,
        species: species,
        door_style: doorStyle,
        description: doorStyle,
        cnc_due_date: cncDue,
        cnc_status: CNC_STATUSES.includes(cncStatusRaw) ? cncStatusRaw : 'Pending',
        cnc_req: cncReq || null,
        cnc_program: cncProgram || null,
        machine: 'Kerry',
        status: 'Ready for CNC',
      })
    }
    if (!rows.length) {
      addToast('Could not parse rows - make sure you copied directly from Excel', 'error')
      setSaving(false)
      return
    }
    const { error } = await supabase.from('orders').upsert(rows, { onConflict: 'order_number' })
    if (error) addToast(error.message, 'error')
    else { addToast(rows.length + ' orders imported!', 'success'); onImported() }
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={function(e){ if(e.target===e.currentTarget) onClose() }}>
      <div className="modal" style={{maxWidth:700}}>
        <div className="modal-header">
          <h3>Import from Excel</h3>
          <button className="btn btn-sm" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:'13px',color:'var(--text2)',marginBottom:12}}>
            Open your Excel file, select all rows including header, copy with Cmd+C, then paste below:
          </p>
          <textarea
            value={text}
            onChange={function(e){ setText(e.target.value) }}
            placeholder="Paste your Excel data here..."
            style={{width:'100%',minHeight:200,fontFamily:'var(--mono)',fontSize:12}}
          />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doImport} disabled={saving}>
            {saving ? 'Importing...' : 'Import Orders'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CNCScheduleKerryPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['CNC Prep','Ready for CNC','In Production'])
      .eq('machine', 'Kerry')
      .order('cnc_due_date', { ascending: true, nullsFirst: false })
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(function(){ load() }, [])

  async function updateCNCStatus(id, status) {
    setUpdatingId(id)
    const { error } = await supabase.from('orders').update({ cnc_status: status }).eq('id', id)
    if (error) addToast(error.message, 'error')
    else {
      setOrders(function(o){ return o.map(function(x){ return x.id === id ? Object.assign({},x,{cnc_status:status}) : x }) })
      addToast('CNC status updated', 'success')
    }
    setUpdatingId(null)
  }

  async function updateCNCProgram(id, program) {
    const { error } = await supabase.from('orders').update({ cnc_program: program }).eq('id', id)
    if (error) addToast(error.message, 'error')
    else {
      setOrders(function(o){ return o.map(function(x){ return x.id === id ? Object.assign({},x,{cnc_program:program}) : x }) })
      addToast('Program updated', 'success')
    }
  }

  async function updateCNCDue(id, date) {
    const { error } = await supabase.from('orders').update({ cnc_due_date: date || null }).eq('id', id)
    if (error) addToast(error.message, 'error')
    else {
      setOrders(function(o){ return o.map(function(x){ return x.id === id ? Object.assign({},x,{cnc_due_date:date}) : x }) })
      addToast('CNC due date updated', 'success')
    }
  }

  async function updateOrderStatus(id, status) {
    const { error } = await supabase.from('orders').update({ status: status }).eq('id', id)
    if (error) addToast(error.message, 'error')
    else {
      setOrders(function(o){ return o.map(function(x){ return x.id === id ? Object.assign({},x,{status:status}) : x }) })
      addToast('Order status updated', 'success')
    }
  }

  if (loading) return <div className="loading"><div className="spinner"/>Loading...</div>

  const today = new Date().toISOString().split('T')[0]
  const overdue = orders.filter(function(o){ return o.cnc_due_date && o.cnc_due_date < today && o.cnc_status !== 'Done' })
  const readyCount = orders.filter(function(o){ return o.status === 'Ready for CNC' }).length

  const filtered = orders.filter(function(o){
    if (!search) return true
    const s = search.toLowerCase()
    return (o.order_number || '').toLowerCase().includes(s) ||
           (o.customer || '').toLowerCase().includes(s) ||
           (o.batch || '').toLowerCase().includes(s) ||
           (o.builder || '').toLowerCase().includes(s)
  })

  // Sort: Ready for CNC first (by due date), then everything else (by due date)
  const sorted = filtered.slice().sort(function(a, b) {
    const aReady = a.status === 'Ready for CNC' ? 0 : 1
    const bReady = b.status === 'Ready for CNC' ? 0 : 1
    if (aReady !== bReady) return aReady - bReady
    if (!a.cnc_due_date && !b.cnc_due_date) return 0
    if (!a.cnc_due_date) return 1
    if (!b.cnc_due_date) return -1
    return a.cnc_due_date < b.cnc_due_date ? -1 : 1
  })

  const dropdownStyle = {
    padding:'4px 8px',
    borderRadius:'var(--radius)',
    border:'1px solid var(--border2)',
    background:'var(--surface)',
    fontSize:'12px',
    fontWeight:500,
    width:'auto',
    cursor:'pointer'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>CNC Schedule (Kerry)</h1>
          <p>{filtered.length} of {orders.length} orders</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div className="search-bar" style={{minWidth:240}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:14,height:14,color:'var(--text3)',flexShrink:0}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={function(e){ setSearch(e.target.value) }} placeholder="Search order, customer, batch..."/>
          </div>
          <button className="btn" onClick={function(){ setShowImport(true) }}>Import from Excel</button>
        </div>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:16}}>
        <div style={{background:'var(--green-light)',border:'1px solid #C2DFA0',borderRadius:'var(--radius)',padding:'10px 16px',fontSize:'13px',color:'var(--green)',fontWeight:600}}>
          {readyCount} Ready for CNC
        </div>
        {overdue.length > 0 && (
          <div style={{background:'var(--red-light)',border:'1px solid #F7C1C1',borderRadius:'var(--radius)',padding:'10px 16px',fontSize:'13px',color:'var(--red)',fontWeight:600}}>
            {overdue.length} Overdue
          </div>
        )}
        <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 16px',fontSize:'13px',color:'var(--text2)',fontWeight:500}}>
          {orders.length - readyCount} Not Yet Ready
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Builder</th>
                <th>Customer</th>
                <th>Sales Order</th>
                <th>Batch</th>
                <th>Qty</th>
                <th>Species</th>
                <th>Door Style</th>
                <th>Order Status</th>
                <th>CNC Due</th>
                <th>CNC Req</th>
                <th>Program</th>
                <th>CNC Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={12} style={{textAlign:'center',color:'var(--text3)',padding:'40px'}}>
                    No orders found.
                  </td>
                </tr>
              )}
              {sorted.map(function(o, index){
                const isOverdue = o.cnc_due_date && o.cnc_due_date < today && o.cnc_status !== 'Done'
                const isReady = o.status === 'Ready for CNC'
                const prevReady = index > 0 && sorted[index-1].status === 'Ready for CNC'
                const showDivider = !isReady && index > 0 && prevReady
                return [
                  showDivider ? (
                    <tr key={'div-' + o.id}>
                      <td colSpan={12} style={{padding:'4px 18px',background:'var(--surface2)',fontSize:'11px',fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid var(--border)'}}>
                        Not Yet Ready — sorted by CNC due date
                      </td>
                    </tr>
                  ) : null,
                  <tr key={o.id} style={{background: isReady ? '#F0FAE8' : isOverdue ? '#FCEBEB44' : ''}}>
                    <td style={{fontWeight:500,color:'var(--text2)'}}>{o.builder || '-'}</td>
                    <td style={{fontWeight:500}}>{o.customer}</td>
                    <td><span style={{fontFamily:'var(--mono)',fontSize:'12px'}}>{o.order_number}</span></td>
                    <td>{o.batch || '-'}</td>
                    <td style={{textAlign:'center'}}>{o.qty || '-'}</td>
                    <td>{o.species || '-'}</td>
                    <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text2)'}}>{o.door_style || o.description || '-'}</td>
                    <td>
                      <select
                        value={o.status || 'Takeoff'}
                        onChange={function(e){ updateOrderStatus(o.id, e.target.value) }}
                        style={Object.assign({}, dropdownStyle, {background: isReady ? '#E4F5D0' : 'var(--surface)'})}
                      >
                        {ORDER_STATUSES.map(function(s){ return <option key={s} value={s}>{s}</option> })}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={o.cnc_due_date || ''}
                        onChange={function(e){ updateCNCDue(o.id, e.target.value) }}
                        style={{
                          padding:'4px 8px',
                          borderRadius:'var(--radius)',
                          border:'1px solid var(--border2)',
                          background: isOverdue ? 'var(--red-light)' : 'var(--surface)',
                          fontSize:'12px',
                          fontWeight:500,
                          color: isOverdue ? 'var(--red)' : 'var(--text)',
                          cursor:'pointer'
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        defaultValue={o.cnc_req || ''}
                        onBlur={function(e){ updateCNCReq(o.id, e.target.value); e.target.style.border='1px solid transparent'; e.target.style.background='transparent' }}
                        onFocus={function(e){ e.target.style.border='1px solid var(--border2)'; e.target.style.background='var(--surface)' }}
                        style={{padding:'4px 8px',borderRadius:'var(--radius)',border:'1px solid transparent',background:'transparent',fontSize:'12px',color:'var(--text2)',width:'160px',cursor:'text'}}
                      />
                    </td>
                    <td>
                      <select
                        value={o.cnc_program || ''}
                        onChange={function(e){ updateCNCProgram(o.id, e.target.value) }}
                        style={dropdownStyle}
                      >
                        {PROGRAM_STATUSES.map(function(s){ return <option key={s} value={s}>{s === '' ? '-' : s}</option> })}
                      </select>
                    </td>
                    <td>
                      <select
                        value={o.cnc_status || 'Pending'}
                        onChange={function(e){ updateCNCStatus(o.id, e.target.value) }}
                        disabled={updatingId === o.id}
                        style={Object.assign({}, dropdownStyle, {color: CNC_STATUS_COLORS[o.cnc_status || 'Pending']})}
                      >
                        {CNC_STATUSES.map(function(s){ return <option key={s} value={s}>{s}</option> })}
                      </select>
                    </td>
                  </tr>
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && (
        <ImportModal
          onClose={function(){ setShowImport(false) }}
          onImported={function(){ setShowImport(false); load() }}
        />
      )}
    </div>
  )
}
