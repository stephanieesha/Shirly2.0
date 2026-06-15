import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { getItem, buyItem, disableItem, enableItem, reset } from '../features/items/itemSlice'
import Spinner from '../components/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function ItemDetailPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { itemId } = useParams()
  const { user } = useSelector((state) => state.auth)
  const { item, isLoading, isError, message } = useSelector((state) => state.items)
  const [showBuyForm, setShowBuyForm] = useState(false)
  const [buyData, setBuyData] = useState({
    name: '', brand: '', unitPrice: '', quantity: '', price: '', frequency: '', comment: ''
  })
  const [chartFilter, setChartFilter] = useState('default')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getItem(itemId))
    return () => dispatch(reset())
  }, [user, navigate, dispatch, itemId])

  useEffect(() => {
    if (isError) toast.error(message)
    if (item) {
      setBuyData({
        name: item.name || '',
        brand: item.brand || '',
        unitPrice: item.unitPrice || '',
        quantity: item.quantity || '',
        price: item.price || '',
        frequency: item.frequency || 'weekly',
        comment: item.comment || '',
      })
    }
  }, [isError, message, item])

  const onChange = (e) => {
    const updated = { ...buyData, [e.target.name]: e.target.value }
    if (e.target.name === 'unitPrice' || e.target.name === 'quantity') {
      const unit = parseFloat(updated.unitPrice) || 0
      const qty = parseFloat(updated.quantity) || 0
      updated.price = (unit * qty).toString()
    }
    setBuyData(updated)
  }

  const onBuySubmit = (e) => {
    e.preventDefault()
    dispatch(buyItem({
      id: itemId,
      itemData: {
        name: buyData.name,
        brand: buyData.brand,
        unitPrice: Number(buyData.unitPrice),
        quantity: Number(buyData.quantity),
        price: Number(buyData.price),
        frequency: buyData.frequency,
        comment: buyData.comment,
      }
    }))
    setShowBuyForm(false)
    toast.success('Purchase recorded!')
  }

  const priceTrend = () => {
    if (!item?.boughtAt || item.boughtAt.length < 2) return null
    const latest = item.boughtAt[0].price
    const previous = item.boughtAt[1].price
    if (!previous) return null
    const pct = Math.round(((latest - previous) / previous) * 100)
    return { pct, latest, previous }
  }

  const trend = priceTrend()

  const onToggleDisable = () => {
    if (item.itemDisabled) {
      dispatch(enableItem(itemId))
        .unwrap()
        .then(() => toast.success(`${item.name} enabled — will appear in shopping lists`))
        .catch(() => toast.error('Failed to enable item'))
    } else {
      dispatch(disableItem(itemId))
        .unwrap()
        .then(() => toast.success(`${item.name} disabled — won't appear in shopping lists`))
        .catch(() => toast.error('Failed to disable item'))
    }
  }

  // Chart helpers
  const availableYears = () => {
    if (!item?.boughtAt) return []
    const years = [...new Set(item.boughtAt.map(e => new Date(e.updatedAt).getFullYear()))]
    return years.sort((a, b) => a - b)
  }

  const getChartData = () => {
    if (!item?.boughtAt || item.boughtAt.length === 0) return []

    if (chartFilter === 'default') {
      return [...item.boughtAt]
        .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
        .map(e => ({
          label: new Date(e.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
          price: e.price || 0,
        }))
    }

    if (chartFilter === 'month') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthly = Array(12).fill(0)
      item.boughtAt.forEach(e => {
        const d = new Date(e.updatedAt)
        if (d.getFullYear() === Number(selectedYear)) {
          monthly[d.getMonth()] += e.price || 0
        }
      })
      return monthNames.map((m, i) => ({ label: m, price: monthly[i] }))
    }

    if (chartFilter === 'year') {
      const yearly = {}
      item.boughtAt.forEach(e => {
        const yr = new Date(e.updatedAt).getFullYear()
        yearly[yr] = (yearly[yr] || 0) + (e.price || 0)
      })
      return Object.entries(yearly)
        .sort(([a], [b]) => a - b)
        .map(([yr, price]) => ({ label: yr.toString(), price }))
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

  if (isLoading || !item) return <Spinner />
  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>

        {/* Item header */}
        <div style={s.heroCard}>
          <div style={s.heroTop}>
            <div>
              <div style={s.itemName}>{item.name}</div>
              <div style={s.itemBrand}>{item.brand || 'No brand'}</div>
            </div>
            <button style={s.buyBtn} onClick={() => setShowBuyForm(!showBuyForm)}>
              {showBuyForm ? 'Cancel' : '🛒 Record purchase'}
            </button>
          </div>
          <div style={s.statsGrid}>
            <div style={s.stat}>
              <div style={s.statLabel}>Current price</div>
              <div style={s.statValue}>₦{(item.price || 0).toLocaleString()}</div>
            </div>
            <div style={s.stat}>
              <div style={s.statLabel}>Unit price</div>
              <div style={s.statValue}>₦{(item.unitPrice || 0).toLocaleString()}</div>
            </div>
            <div style={s.stat}>
              <div style={s.statLabel}>Quantity</div>
              <div style={s.statValue}>{item.quantity}</div>
            </div>
            <div style={s.stat}>
              <div style={s.statLabel}>Frequency</div>
              <div style={s.statValue}>{item.frequency}</div>
            </div>
            <div style={s.stat}>
              <div style={s.statLabel}>Total spent</div>
              <div style={s.statValue}>₦{(item.totalSpent || 0).toLocaleString()}</div>
            </div>
            <div style={s.stat}>
              <div style={s.statLabel}>Price trend</div>
              <div style={{ ...s.statValue, color: trend ? (trend.pct > 0 ? '#B5541E' : '#5A6E2A') : '#9C7E6A' }}>
                {trend ? `${trend.pct > 0 ? '+' : ''}${trend.pct}%` : 'No data'}
              </div>
            </div>
          </div>
          {item.comment && <div style={s.comment}>💬 {item.comment}</div>}
          <div style={s.disableRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.itemDisabled && (
                <span style={s.disabledBadge}>⊘ Disabled — not shown in shopping lists</span>
              )}
            </div>
            <button
              style={{ ...s.toggleBtn, ...(item.itemDisabled ? s.toggleBtnEnable : s.toggleBtnDisable) }}
              onClick={onToggleDisable}
            >
              {item.itemDisabled ? '✓ Enable item' : '⊘ Disable item'}
            </button>
          </div>
        </div>

        {/* Buy form */}
        {showBuyForm && (
          <form onSubmit={onBuySubmit} style={s.formCard}>
            <div style={s.formTitle}>Record a purchase</div>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Name</label>
                <input style={s.input} name='name' value={buyData.name} onChange={onChange} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Brand</label>
                <input style={s.input} name='brand' value={buyData.brand} onChange={onChange} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Unit price (₦)</label>
                <input style={s.input} name='unitPrice' type='number' value={buyData.unitPrice} onChange={onChange} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Quantity</label>
                <input style={s.input} name='quantity' type='number' value={buyData.quantity} onChange={onChange} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Total price (₦)</label>
                <input style={{ ...s.input, background: '#F0E8DC', color: '#8C6F5A' }} name='price' type='number' value={buyData.price} onChange={onChange} readOnly />
              </div>
              <div style={s.field}>
                <label style={s.label}>Frequency</label>
                <select style={s.input} name='frequency' value={buyData.frequency} onChange={onChange}>
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
              <input style={s.input} name='comment' value={buyData.comment} onChange={onChange} placeholder='Any notes?' />
            </div>
            <button type='submit' style={s.submitBtn}>Save purchase</button>
          </form>
        )}

        {/* Price history chart */}
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <span style={s.secTitle}>Price history</span>
            <div style={s.chartControls}>
              {chartFilter === 'month' && years.length > 0 && (
                <select
                  style={s.yearSelect}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
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

          {(chartFilter === 'month' ? chartData.every(d => d.price === 0) : chartData.length === 0) ? (
            <div style={s.chartEmpty}>No purchase data for this period</div>
          ) : (
            <ResponsiveContainer width='100%' height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#E2D5C3' vertical={false} />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 11, fill: '#9C7E6A', fontFamily: 'sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor='end'
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9C7E6A', fontFamily: 'sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₦${v.toLocaleString()}`}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7F0E6' }} />
                <Bar dataKey='price' fill='#C87941' radius={[4, 4, 0, 0]} name='Price paid' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Purchase history */}
        <div>
          <div style={s.secHead}>
            <span style={s.secTitle}>Purchase history</span>
            <span style={s.secCount}>{item.boughtAt?.length || 0} purchases</span>
          </div>
          <div style={s.historyCard}>
            {!item.boughtAt || item.boughtAt.length === 0 ? (
              <div style={s.empty}>No purchases recorded yet</div>
            ) : (
              <>
                <div style={s.historyHeader}>
                  <span>Date</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Total</span>
                </div>
                {item.boughtAt.map((entry, i) => (
                  <div key={i} style={{ ...s.historyRow, background: i % 2 === 0 ? '#fff' : '#FDFAF7' }}>
                    <span style={s.historyDate}>
                      {new Date(entry.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>{entry.quantity}</span>
                    <span>₦{(entry.unitPrice || 0).toLocaleString()}</span>
                    <span style={{ fontWeight: '500' }}>₦{(entry.price || 0).toLocaleString()}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

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
  heroCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '18px' },
  heroTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' },
  itemName: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#2A1E14' },
  itemBrand: { fontSize: '13px', color: '#8C6F5A', marginTop: '2px' },
  buyBtn: { padding: '8px 14px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  stat: { background: '#F7F0E6', borderRadius: '8px', padding: '10px 12px' },
  statLabel: { fontSize: '10px', fontWeight: '500', color: '#8C6F5A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '15px', fontWeight: '500', color: '#2A1E14' },
  comment: { marginTop: '12px', fontSize: '13px', color: '#8C6F5A', fontStyle: 'italic' },
  formCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { fontSize: '14px', fontWeight: '500', color: '#2A1E14' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#8C6F5A' },
  input: { padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '14px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif' },
  submitBtn: { padding: '10px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
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
  // History table
  secHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  secTitle: { fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.6px' },
  secCount: { fontSize: '12px', color: '#C87941', fontWeight: '500' },
  historyCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'hidden' },
  historyHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', background: '#F7F0E6', fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.5px' },
  historyRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '11px 16px', fontSize: '13px', color: '#2A1E14', borderTop: '0.5px solid #F0E8DC' },
  historyDate: { color: '#6B5040' },
  empty: { padding: '30px 16px', fontSize: '13px', color: '#9C7E6A', textAlign: 'center' },
  disableRow: { marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' },
  disabledBadge: { fontSize: '12px', color: '#8C6F5A', background: '#F0E8DC', padding: '4px 10px', borderRadius: '6px', fontStyle: 'italic' },
  toggleBtn: { padding: '6px 14px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  toggleBtnDisable: { background: '#F0E8DC', color: '#8C6F5A' },
  toggleBtnEnable: { background: '#EAF3DE', color: '#27500A' },
}

export default ItemDetailPage
