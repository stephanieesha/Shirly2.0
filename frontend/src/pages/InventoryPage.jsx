import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { getItems, setStock, reset } from '../features/items/itemSlice'
import { getListNames } from '../features/listName/listNameSlice'
import Spinner from '../components/Spinner'

function InventoryPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { items, isLoading, isError, message } = useSelector((state) => state.items)
  const { listNames } = useSelector((state) => state.listNames)
  const [search, setSearch] = useState('')
  const [listFilter, setListFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortMode, setSortMode] = useState('name-asc')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getItems())
    dispatch(getListNames())
    return () => dispatch(reset())
  }, [user, navigate, dispatch])

  useEffect(() => {
    if (isError) toast.error(message)
  }, [isError, message])

  const listNameById = useMemo(() => {
    const map = {}
    listNames.forEach((l) => { map[l._id] = l.displayName || l.name || 'Uncategorised' })
    return map
  }, [listNames])

  const safeItems = Array.isArray(items) ? items : []

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = safeItems.filter((item) => {
      if (listFilter !== 'all' && item.listName !== listFilter) return false
      if (stockFilter === 'in' && (item.stock || 0) <= 0) return false
      if (stockFilter === 'out' && (item.stock || 0) > 0) return false
      if (!q) return true
      return item.name?.toLowerCase().includes(q)
    })

    const byName = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    const byList = (a, b) => {
      const la = listNameById[a.listName] || ''
      const lb = listNameById[b.listName] || ''
      return la.localeCompare(lb, undefined, { sensitivity: 'base' }) || byName(a, b)
    }

    const sorted = [...filtered]
    if (sortMode === 'name-asc') sorted.sort(byName)
    if (sortMode === 'name-desc') sorted.sort((a, b) => byName(b, a))
    if (sortMode === 'list') sorted.sort(byList)
    return sorted
  }, [safeItems, search, listFilter, stockFilter, sortMode, listNameById])

  // Group headers only when sorting by list
  const groups = useMemo(() => {
    if (sortMode !== 'list') return null
    const result = []
    visibleItems.forEach((item) => {
      const label = listNameById[item.listName] || 'Uncategorised'
      const last = result[result.length - 1]
      if (last && last.label === label) last.items.push(item)
      else result.push({ label, items: [item] })
    })
    return result
  }, [visibleItems, sortMode, listNameById])

  const inStockCount = safeItems.filter((i) => (i.stock || 0) > 0).length

  const changeStock = (item, next) => {
    const value = Math.max(0, Math.floor(Number(next) || 0))
    if (value === (item.stock || 0)) return
    dispatch(setStock({ id: item._id, stock: value }))
  }

  if (isLoading && safeItems.length === 0) return <Spinner />

  const renderRow = (item, i) => {
    const stock = item.stock || 0
    return (
      <tr key={item._id} style={{ ...s.tbodyRow, background: i % 2 === 0 ? '#fff' : '#FDFAF7' }}>
        <td style={{ ...s.td, fontWeight: '500', color: '#2A1E14' }}>{item.name}</td>
        <td style={s.td}><span style={s.muted}>{listNameById[item.listName] || '—'}</span></td>
        <td style={s.td}>
          <div style={s.stockControls}>
            <button style={s.stepBtn} onClick={() => changeStock(item, stock - 1)} disabled={stock <= 0} aria-label='Decrease stock'>−</button>
            <input
              style={s.stockInput}
              type='number'
              min='0'
              value={stock}
              onChange={(e) => changeStock(item, e.target.value)}
              aria-label='Stock count'
            />
            <button style={s.stepBtn} onClick={() => changeStock(item, stock + 1)} aria-label='Increase stock'>+</button>
          </div>
        </td>
      </tr>
    )
  }

  const tableHead = (
    <thead>
      <tr style={s.theadRow}>
        <th style={s.th}>Name</th>
        <th style={s.th}>List</th>
        <th style={s.th}>In stock</th>
      </tr>
    </thead>
  )

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate('/lists')}>← Categories</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Inventory</h1>
            <p style={s.pageSub}>{safeItems.length} items · {inStockCount} in stock</p>
          </div>
        </div>

        <div style={s.controls}>
          <input
            style={s.searchInput}
            type='text'
            placeholder='Search items...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={s.select} value={listFilter} onChange={(e) => setListFilter(e.target.value)}>
            <option value='all'>All lists</option>
            {listNames.map((l) => (
              <option key={l._id} value={l._id}>{l.displayName || l.name}</option>
            ))}
          </select>
          <select style={s.select} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value='all'>All stock</option>
            <option value='in'>In stock</option>
            <option value='out'>Out of stock</option>
          </select>
          <select style={s.select} value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value='name-asc'>Name (A–Z)</option>
            <option value='name-desc'>Name (Z–A)</option>
            <option value='list'>By list, then name</option>
          </select>
        </div>

        {visibleItems.length === 0 ? (
          <div style={s.empty}>
            {safeItems.length === 0 ? 'No items yet. Add some from a list first.' : 'No items match these filters.'}
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              {tableHead}
              {groups ? (
                groups.map((group) => (
                  <tbody key={group.label}>
                    <tr><td colSpan={3} style={s.groupHeader}>{group.label} · {group.items.length}</td></tr>
                    {group.items.map(renderRow)}
                  </tbody>
                ))
              ) : (
                <tbody>{visibleItems.map(renderRow)}</tbody>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  app: { fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: '#3D2B1F' },
  backBtn: { fontSize: '13px', color: '#C8B09A', background: 'none', border: 'none', cursor: 'pointer' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#FAF0E4' },
  logoAccent: { color: '#C87941' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#2A1E14', margin: 0 },
  pageSub: { fontSize: '13px', color: '#8C6F5A', marginTop: '3px' },
  controls: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  searchInput: { flex: '1 1 200px', padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '14px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif' },
  select: { padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '13px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif', cursor: 'pointer' },
  tableWrap: { border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'auto', background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  theadRow: { background: '#F7F0E6' },
  th: { textAlign: 'left', padding: '9px 14px', fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  groupHeader: { padding: '10px 14px', background: '#F7F0E6', fontFamily: 'Georgia, serif', fontWeight: '600', color: '#3D2B1F', borderTop: '0.5px solid #E2D5C3' },
  tbodyRow: { borderTop: '0.5px solid #E2D5C3' },
  td: { padding: '10px 14px', color: '#2A1E14', verticalAlign: 'middle' },
  muted: { color: '#9C7E6A' },
  stockControls: { display: 'flex', alignItems: 'center', gap: '6px' },
  stepBtn: { width: '28px', height: '28px', border: '0.5px solid #D4C4B0', borderRadius: '6px', background: '#F7F0E6', color: '#6B4C35', cursor: 'pointer', fontSize: '15px' },
  stockInput: { width: '64px', padding: '5px 8px', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '13px', textAlign: 'center', color: '#2A1E14', background: '#FDFAF7' },
  empty: { padding: '40px 20px', fontSize: '13px', color: '#9C7E6A', textAlign: 'center', background: '#fff', borderRadius: '14px', border: '0.5px solid #E2D5C3' },
}

export default InventoryPage
