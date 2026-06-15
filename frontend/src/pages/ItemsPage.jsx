import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { getItems, createItem, deleteItem, updateItem, reset } from '../features/items/itemSlice'
import { getListNames } from '../features/listName/listNameSlice'
import Spinner from '../components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function ItemsPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { listId } = useParams()
  const { user } = useSelector((state) => state.auth)
  const { items, isLoading, isError, message } = useSelector((state) => state.items)
  const { listNames } = useSelector((state) => state.listNames)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [confirmName, setConfirmName] = useState('')
  const [formData, setFormData] = useState({
    name: '', brand: '', unitPrice: '', quantity: '', price: '', frequency: 'weekly', comment: ''
  })
  const [chartFilter, setChartFilter] = useState('default')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  const currentList = listNames.find((l) => l._id === listId)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getItems({ listId }))
    dispatch(getListNames())
    return () => dispatch(reset())
  }, [user, navigate, dispatch, listId])

  useEffect(() => {
    if (isError) toast.error(message)
  }, [isError, message])

  const onChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value }
    if (e.target.name === 'unitPrice' || e.target.name === 'quantity') {
      const unit = parseFloat(updated.unitPrice) || 0
      const qty = parseFloat(updated.quantity) || 0
      updated.price = (unit * qty).toString()
    }
    setFormData(updated)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    dispatch(createItem({
      listId,
      name: formData.name,
      brand: formData.brand,
      unitPrice: Number(formData.unitPrice),
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      frequency: formData.frequency,
      comment: formData.comment,
    }))
    setFormData({ name: '', brand: '', unitPrice: '', quantity: '', price: '', frequency: 'weekly', comment: '' })
    setShowForm(false)
  }

  const onDelete = (id, name) => {
    setConfirmId(id)
    setConfirmName(name)
  }

  const onConfirmDelete = () => {
    dispatch(deleteItem(confirmId))
    setConfirmId(null)
    setConfirmName('')
  }

  const onCancelDelete = () => {
    setConfirmId(null)
    setConfirmName('')
  }

  // Inline edit handlers
  const startEdit = (item, e) => {
    e.stopPropagation()
    setEditingId(item._id)
    setEditData({
      brand: item.brand || '',
      unitPrice: item.unitPrice || '',
      quantity: item.quantity || '',
      price: item.price || '',
      frequency: item.frequency || 'weekly',
      comment: item.comment || '',
    })
  }

  const onEditChange = (e) => {
    const updated = { ...editData, [e.target.name]: e.target.value }
    if (e.target.name === 'unitPrice' || e.target.name === 'quantity') {
      const unit = parseFloat(updated.unitPrice) || 0
      const qty = parseFloat(updated.quantity) || 0
      updated.price = (unit * qty).toString()
    }
    setEditData(updated)
  }

  const saveEdit = (itemId, e) => {
    e.stopPropagation()
    dispatch(updateItem({
      id: itemId,
      itemData: {
        brand: editData.brand,
        unitPrice: Number(editData.unitPrice),
        quantity: Number(editData.quantity),
        price: Number(editData.price),
        frequency: editData.frequency,
        comment: editData.comment,
      }
    }))
    setEditingId(null)
    toast.success('Item updated!')
  }

  const cancelEdit = (e) => {
    e.stopPropagation()
    setEditingId(null)
  }

  // Sorting
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIcon = (key) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const getSortValue = (item, key) => {
    switch (key) {
      case 'createdAt': return item.createdAt ? new Date(item.createdAt).getTime() : 0
      case 'name': return item.name?.toLowerCase() || ''
      case 'unitPrice': return item.unitPrice || 0
      case 'price': return item.price || 0
      case 'frequency': return item.frequency?.toLowerCase() || ''
      case 'lastBought': return item.boughtAt?.[0]?.updatedAt ? new Date(item.boughtAt[0].updatedAt).getTime() : 0
      default: return item.name?.toLowerCase() || ''
    }
  }

  const filteredItems = (Array.isArray(items) ? items : [])
    .filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase()) ||
      item.comment?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = getSortValue(a, sortKey)
      const bv = getSortValue(b, sortKey)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  // Chart helpers
  const safeItems = Array.isArray(items) ? items : []
  const availableYears = () => {
    const years = new Set()
    safeItems.forEach(item => {
      item.boughtAt?.forEach(e => years.add(new Date(e.updatedAt).getFullYear()))
    })
    return [...years].sort((a, b) => a - b)
  }

  const getChartData = () => {
    if (safeItems.length === 0) return []

    if (chartFilter === 'default') {
      return safeItems
        .filter(item => (item.totalSpent || 0) > 0)
        .map(item => ({ label: item.name, spent: item.totalSpent || 0 }))
        .sort((a, b) => b.spent - a.spent)
    }

    if (chartFilter === 'month') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthly = Array(12).fill(0)
      safeItems.forEach(item => {
        item.boughtAt?.forEach(e => {
          const d = new Date(e.updatedAt)
          if (d.getFullYear() === Number(selectedYear)) {
            monthly[d.getMonth()] += e.price || 0
          }
        })
      })
      return monthNames.map((m, i) => ({ label: m, spent: monthly[i] }))
    }

    if (chartFilter === 'year') {
      const yearly = {}
      safeItems.forEach(item => {
        item.boughtAt?.forEach(e => {
          const yr = new Date(e.updatedAt).getFullYear()
          yearly[yr] = (yearly[yr] || 0) + (e.price || 0)
        })
      })
      return Object.entries(yearly)
        .sort(([a], [b]) => a - b)
        .map(([yr, spent]) => ({ label: yr.toString(), spent }))
    }

    return []
  }

  const chartData = getChartData()
  const years = availableYears()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={s.tooltip}>
          <div style={s.tooltipLabel}>{label}</div>
          <div style={s.tooltipValue}>₦{payload[0].value.toLocaleString()}</div>
        </div>
      )
    }
    return null
  }

  if (isLoading) return <Spinner />
  return (
    <div style={s.app}>
            {confirmId && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>🗑️</div>
            <div style={s.modalTitle}>Delete item?</div>
            <div style={s.modalSub}>"<b>{confirmName}</b>" will be removed.</div>
            <div style={s.modalBtns}>
              <button style={s.modalCancelBtn} onClick={onCancelDelete}>Cancel</button>
              <button style={s.modalConfirmBtn} onClick={onConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate('/lists')}>← Categories</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>{currentList?.name || 'Items'}</h1>
            <p style={s.pageSub}>{safeItems.length} items tracked</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add item'}
          </button>
          <button style={s.binBtn} onClick={() => navigate(`/lists/${listId}/bin`)}>🗑️ Bin</button>
        </div>

        <div style={s.searchRow}>
          <input
            style={s.searchInput}
            type='text'
            placeholder='Search items...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {showForm && (
          <form onSubmit={onSubmit} style={s.formCard}>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Item name *</label>
                <input style={s.input} name='name' value={formData.name} onChange={onChange} placeholder='e.g. Indomie noodles' required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Brand</label>
                <input style={s.input} name='brand' value={formData.brand} onChange={onChange} placeholder='e.g. Dangote' />
              </div>
              <div style={s.field}>
                <label style={s.label}>Unit price (₦)</label>
                <input style={s.input} name='unitPrice' type='number' value={formData.unitPrice} onChange={onChange} placeholder='0' />
              </div>
              <div style={s.field}>
                <label style={s.label}>Quantity</label>
                <input style={s.input} name='quantity' type='number' value={formData.quantity} onChange={onChange} placeholder='1' />
              </div>
              <div style={s.field}>
                <label style={s.label}>Total price (₦) — auto calculated</label>
                <input
                  style={{ ...s.input, background: '#F0E8DC', color: '#8C6F5A' }}
                  name='price' type='number' value={formData.price} onChange={onChange} placeholder='0' readOnly
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Frequency</label>
                <select style={s.input} name='frequency' value={formData.frequency} onChange={onChange}>
                  <option value='Nill'>Nill</option>
                  <option value='Everyday'>Everyday</option>
                  <option value='Every 2 days'>Every 2 days</option>
                  <option value='Every 3 days'>Every 3 days</option>
                  <option value='weekly'>Weekly</option>
                  <option value='Every 2 weeks'>Every 2 weeks</option>
                  <option value='monthly'>Monthly</option>
                  <option value='Every 2 months'>Every 2 months</option>
                  <option value='Every 3 months'>Every 3 months</option>
                  <option value='Every 6 months'>Every 6 months</option>
                  <option value='Yearly'>Yearly</option>
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Comment</label>
              <input style={s.input} name='comment' value={formData.comment} onChange={onChange} placeholder='e.g. the chicken flavour' />
            </div>
            <button type='submit' style={s.submitBtn}>Save item</button>
          </form>
        )}

        {/* Spending chart */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.secTitle}>
              {chartFilter === 'default' ? 'Total spent by item' : chartFilter === 'month' ? 'Monthly spending' : 'Yearly spending'}
            </span>
            <div style={s.chartControls}>
              {chartFilter === 'month' && years.length > 0 && (
                <select style={s.yearSelect} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
              <div style={s.filterTabs}>
                {['default', 'month', 'year'].map(f => (
                  <button
                    key={f}
                    style={{ ...s.filterTab, ...(chartFilter === f ? s.filterTabActive : {}) }}
                    onClick={() => setChartFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(chartFilter === 'month' ? chartData.every(d => d.spent === 0) : chartData.length === 0) ? (
            <div style={s.chartEmpty}>No spending data for this period</div>
          ) : (
            <ResponsiveContainer width='100%' height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: chartFilter === 'default' ? 50 : 20 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#E2D5C3' vertical={false} />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 11, fill: '#9C7E6A', fontFamily: 'sans-serif' }}
                  axisLine={false} tickLine={false}
                  angle={chartFilter === 'default' ? -40 : 0}
                  textAnchor={chartFilter === 'default' ? 'end' : 'middle'}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9C7E6A', fontFamily: 'sans-serif' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `₦${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7F0E6' }} />
                <Bar dataKey='spent' fill='#C87941' radius={[4, 4, 0, 0]} name='Total spent' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Items table */}
        {filteredItems.length === 0 ? (
          <div style={s.empty}>
            {search ? `No items matching "${search}"` : 'No items yet — add one above'}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.theadRow}>
                  <th style={s.th} onClick={() => handleSort('name')}>Name{sortIcon('name')}</th>
                  <th style={s.th}>Brand</th>
                  <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => handleSort('unitPrice')}>Unit price{sortIcon('unitPrice')}</th>
                  <th style={s.th}>Qty</th>
                  <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => handleSort('price')}>Price{sortIcon('price')}</th>
                  <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => handleSort('frequency')}>Frequency{sortIcon('frequency')}</th>
                  <th style={s.th}>Comment</th>
                  <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => handleSort('lastBought')}>Last bought{sortIcon('lastBought')}</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, i) => {
                  const isEditing = editingId === item._id
                  const rowBg = i % 2 === 0 ? '#fff' : '#FDFAF7'
                  const lastBought = item.boughtAt?.[0]?.updatedAt
                    ? new Date(item.boughtAt[0].updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'

                  return (
                    <tr key={item._id} style={{ ...s.tbodyRow, background: rowBg, opacity: item.itemDisabled ? 0.45 : 1 }}>
                      {/* Name — never editable */}
                      <td style={{ ...s.td, fontWeight: '500', color: '#2A1E14' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.name}
                          {item.itemDisabled && <span style={s.disabledTag}>disabled</span>}
                        </div>
                      </td>

                      {/* Brand */}
                      <td style={s.td}>
                        {isEditing
                          ? <input style={s.cellInput} name='brand' value={editData.brand} onChange={onEditChange} />
                          : <span style={s.muted}>{item.brand || '—'}</span>}
                      </td>

                      {/* Unit price */}
                      <td style={s.td}>
                        {isEditing
                          ? <input style={s.cellInput} name='unitPrice' type='number' value={editData.unitPrice} onChange={onEditChange} />
                          : `₦${(item.unitPrice || 0).toLocaleString()}`}
                      </td>

                      {/* Quantity */}
                      <td style={s.td}>
                        {isEditing
                          ? <input style={{ ...s.cellInput, width: '60px' }} name='quantity' type='number' value={editData.quantity} onChange={onEditChange} />
                          : <span style={s.muted}>{item.quantity}</span>}
                      </td>

                      {/* Price — auto calc when editing */}
                      <td style={s.td}>
                        {isEditing
                          ? <input style={{ ...s.cellInput, background: '#F0E8DC', color: '#8C6F5A' }} name='price' type='number' value={editData.price} readOnly />
                          : `₦${(item.price || 0).toLocaleString()}`}
                      </td>

                      {/* Frequency */}
                      <td style={s.td}>
                        {isEditing ? (
                          <select style={s.cellInput} name='frequency' value={editData.frequency} onChange={onEditChange}>
                            <option value='Nill'>Nill</option>
                            <option value='Everyday'>Everyday</option>
                            <option value='Every 2 days'>Every 2 days</option>
                            <option value='Every 3 days'>Every 3 days</option>
                            <option value='weekly'>Weekly</option>
                            <option value='Every 2 weeks'>Every 2 weeks</option>
                            <option value='monthly'>Monthly</option>
                            <option value='Every 2 months'>Every 2 months</option>
                            <option value='Every 3 months'>Every 3 months</option>
                            <option value='Every 6 months'>Every 6 months</option>
                            <option value='Yearly'>Yearly</option>
                          </select>
                        ) : (
                          <span style={s.freqBadge}>{item.frequency}</span>
                        )}
                      </td>

                      {/* Comment */}
                      <td style={s.td}>
                        {isEditing
                          ? <input style={s.cellInput} name='comment' value={editData.comment} onChange={onEditChange} placeholder='Notes...' />
                          : <span style={{ ...s.muted, fontStyle: 'italic' }}>{item.comment || '—'}</span>}
                      </td>

                      {/* Last bought — never editable */}
                      <td style={{ ...s.td, ...s.muted, fontSize: '12px' }}>{lastBought}</td>

                      {/* Actions */}
                      <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={s.saveBtn} onClick={(e) => saveEdit(item._id, e)}>Save</button>
                            <button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button style={s.detailBtn} onClick={(e) => { e.stopPropagation(); navigate(`/items/${item._id}`) }} title='View details'>···</button>
                            <button style={s.editBtn} onClick={(e) => startEdit(item, e)} title='Edit'>✏️</button>
                            <button style={s.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(item._id, item.name) }} title='Delete'>✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(42, 30, 20, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#FDF8F3', border: '0.5px solid #E2D5C3', borderRadius: '18px', padding: '28px 24px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(42,30,20,0.18)' },
  modalIcon: { fontSize: '32px', marginBottom: '12px' },
  modalTitle: { fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '600', color: '#2A1E14', marginBottom: '8px' },
  modalSub: { fontSize: '13px', color: '#8C6F5A', lineHeight: '1.55', marginBottom: '22px' },
  modalBtns: { display: 'flex', gap: '10px' },
  modalCancelBtn: { flex: 1, padding: '10px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  modalConfirmBtn: { flex: 1, padding: '10px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  app: { fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: '#3D2B1F' },
  backBtn: { fontSize: '13px', color: '#C8B09A', background: 'none', border: 'none', cursor: 'pointer' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#FAF0E4' },
  logoAccent: { color: '#C87941' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#2A1E14', margin: 0 },
  pageSub: { fontSize: '13px', color: '#8C6F5A', marginTop: '3px' },
  addBtn: { padding: '9px 16px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  formCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#8C6F5A' },
  input: { padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '14px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif' },
  submitBtn: { padding: '10px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  // Chart
  chartCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '18px' },
  chartHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' },
  chartControls: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  filterTabs: { display: 'flex', background: '#F7F0E6', borderRadius: '8px', padding: '2px' },
  filterTab: { padding: '5px 12px', background: 'none', border: 'none', borderRadius: '6px', fontSize: '12px', color: '#9C7E6A', cursor: 'pointer', fontFamily: 'sans-serif' },
  filterTabActive: { background: '#3D2B1F', color: '#FAF0E4', fontWeight: '500' },
  yearSelect: { padding: '5px 10px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '12px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif', cursor: 'pointer' },
  chartEmpty: { padding: '40px 20px', fontSize: '13px', color: '#9C7E6A', textAlign: 'center' },
  tooltip: { background: '#3D2B1F', borderRadius: '8px', padding: '8px 12px', border: 'none' },
  tooltipLabel: { fontSize: '11px', color: '#C8B09A', marginBottom: '2px' },
  tooltipValue: { fontSize: '14px', fontWeight: '600', color: '#FAF0E4' },
  secTitle: { fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.6px' },
  disabledTag: { fontSize: '10px', color: '#9C7E6A', background: '#F0E8DC', padding: '1px 6px', borderRadius: '4px', fontWeight: '400' },
  // Table
  tableWrap: { border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  theadRow: { background: '#F7F0E6' },
  th: { textAlign: 'left', padding: '9px 14px', fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' },
  tbodyRow: { borderTop: '0.5px solid #E2D5C3' },
  td: { padding: '10px 14px', color: '#2A1E14', verticalAlign: 'middle' },
  muted: { color: '#9C7E6A' },
  freqBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#F7F0E6', color: '#6B4C35' },
  cellInput: { padding: '5px 8px', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '13px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif', width: '100%', minWidth: '80px' },
  detailBtn: { background: 'none', border: '0.5px solid #D4C4B0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', padding: '3px 8px', color: '#8C6F5A', fontWeight: '500' },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '3px 5px', borderRadius: '4px' },
  deleteBtn: { background: 'none', border: 'none', color: '#C8A882', fontSize: '13px', cursor: 'pointer', padding: '3px 5px', borderRadius: '4px' },
  saveBtn: { padding: '4px 10px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  cancelBtn: { padding: '4px 10px', background: 'none', color: '#9C7E6A', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  searchRow: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { width: '100%', padding: '10px 40px 10px 14px', border: '0.5px solid #D4C4B0', borderRadius: '10px', fontSize: '14px', color: '#2A1E14', background: '#fff', fontFamily: 'sans-serif', boxSizing: 'border-box' },
  clearBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#9C7E6A', fontSize: '14px', cursor: 'pointer' },
  empty: { padding: '40px 20px', fontSize: '14px', color: '#9C7E6A', textAlign: 'center' },
  binBtn: { padding: '9px 16px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
}

export default ItemsPage
