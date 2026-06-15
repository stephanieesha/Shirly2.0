import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { logout, reset as resetAuth } from '../features/auth/authSlice'
import { getListNames } from '../features/listName/listNameSlice'
import { generateShoppingList, buyItem, reset as resetItems } from '../features/items/itemSlice'
import Spinner from '../components/Spinner'

function DashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { listNames } = useSelector((state) => state.listNames)
  const { shoppingList, isLoading } = useSelector((state) => state.items)
  const [checkedItems, setCheckedItems] = useState({})
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getListNames())
    dispatch(generateShoppingList())
    return () => { dispatch(resetItems()); dispatch(resetAuth()) }
  }, [user, navigate, dispatch])

  const onLogout = () => {
    dispatch(logout())
    dispatch(resetAuth())
    navigate('/login')
  }

  const toggleCheck = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const checkedIds = Object.keys(checkedItems).filter((id) => checkedItems[id])
  const checkedCount = checkedIds.length

  const onSave = async () => {
    if (checkedCount === 0) return
    setIsSaving(true)
    try {
      const promises = checkedIds.map((id) => {
        const item = shoppingList.find((i) => i._id === id)
        if (!item) return null
        return dispatch(buyItem({
          id: item._id,
          itemData: {
            name: item.name,
            brand: item.brand,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            price: item.price,
            frequency: item.frequency,
            comment: item.comment,
            status: 'bought',
          }
        })).unwrap()
      }).filter(Boolean)
      await Promise.all(promises)
      toast.success(`${checkedCount} item${checkedCount > 1 ? 's' : ''} marked as bought!`)
      setCheckedItems({})
      dispatch(generateShoppingList())
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const totalSpend = shoppingList.reduce((sum, item) => sum + (item.price || 0), 0)
  const uncheckedTotal = shoppingList
    .filter((item) => !checkedItems[item._id])
    .reduce((sum, item) => sum + (item.price || 0), 0)

  const priceAlerts = shoppingList.filter((i) => i.priceTrend && i.priceTrend.pct > 0)

  const filteredList = shoppingList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.brand?.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getInitials = (name) => name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '?'

  const monthSpend = shoppingList.reduce((sum, item) => sum + (item.totalSpent || 0), 0)

  if (isLoading) return <Spinner />

  return (
    <div style={s.app}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
        <div style={s.topbarRight}>
          <div style={s.avatar}>{getInitials(user?.name)}</div>
          <button style={s.signout} onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Greeting */}
        <div>
          <h1 style={s.greetingH}>{greeting()}, {user?.name}</h1>
          <p style={s.greetingSub}>{today} · Here's what you need today</p>
        </div>

        {/* Metrics */}
        <div style={s.metrics}>
          <div style={s.metric}>
            <div style={s.metricLabel}>Total spent</div>
            <div style={s.metricValue}>₦{monthSpend.toLocaleString()}</div>
            <div style={s.metricSub}>{listNames.length} categories</div>
          </div>
          <div style={s.metric}>
            <div style={s.metricLabel}>Price alerts</div>
            <div style={{ ...s.metricValue, color: priceAlerts.length > 0 ? '#B5541E' : '#5A6E2A' }}>
              {priceAlerts.length} items
            </div>
            <div style={s.metricSub}>gone up recently</div>
          </div>
          <div style={s.metric}>
            <div style={s.metricLabel}>List ready</div>
            <div style={{ ...s.metricValue, color: '#5A6E2A' }}>{shoppingList.length} items</div>
            <div style={s.metricSub}>suggested for you</div>
          </div>
        </div>

        {/* Price alert banner */}
        {priceAlerts.length > 0 && (
          <div style={s.alert}>
            <div style={s.alertPip}></div>
            <div style={s.alertText}>
              <b>{priceAlerts.length} item{priceAlerts.length > 1 ? 's have' : ' has'} increased in price</b> since your last shop —{' '}
              {priceAlerts.map((i) => `${i.name} (+${i.priceTrend.pct}%)`).join(', ')}
            </div>
          </div>
        )}

        {/* Shopping list */}
        <div>
          <div style={s.secHead}>
            <span style={s.secTitle}>Today's shopping list</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {checkedCount > 0 && (
                <div style={s.saveRow}>
                  <button
                    style={{ ...s.saveBtn, opacity: isSaving ? 0.7 : 1 }}
                    onClick={onSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : `✓ Save ${checkedCount} item${checkedCount > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
              {shoppingList.length > 0 && (
                <button style={s.shopNowBtn} onClick={() => navigate('/shopping')}>
                  🛒 Shop now
                </button>
              )}
            </div>
          </div>
          <div style={s.listCard}>
            <div style={s.listHead}>
              <span style={s.listTitle}>Suggested for you</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={s.badge}>{shoppingList.length} items · ₦{totalSpend.toLocaleString()} est.</span>
                <button style={s.goShopBtn} onClick={() => navigate('/shopping')}>Start →</button>
              </div>
            </div>
            <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #EDE0D0', position: 'relative' }}>
              <input
                style={{ width: '100%', padding: '8px 36px 8px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '13px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif', boxSizing: 'border-box' }}
                type='text'
                placeholder='Search shopping list...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9C7E6A', fontSize: '13px', cursor: 'pointer' }}
                >✕</button>
              )}
            </div>
            {filteredList.length === 0 ? (
              <div style={s.emptyState}>No items due — you're all stocked up!</div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item._id}
                  style={{ ...s.listItem, opacity: checkedItems[item._id] ? 0.5 : 1 }}
                  onClick={() => toggleCheck(item._id)}
                >
                  <div style={s.itemL}>
                    <div style={{ ...s.chk, ...(checkedItems[item._id] ? s.chkDone : {}) }}>
                      {checkedItems[item._id] && <span style={s.tick}>✓</span>}
                    </div>
                    <div>
                      <div style={{ ...s.itemName, textDecoration: checkedItems[item._id] ? 'line-through' : 'none' }}>{item.name}</div>
                      <div style={s.itemMeta}>{item.brand} · {item.quantity} · {item.frequency}</div>
                    </div>
                  </div>
                  <div style={s.itemR}>
                    <div style={s.itemPrice}>₦{item.price.toLocaleString()}</div>
                    {item.priceTrend ? (
                      <div style={{ fontSize: '11px', fontWeight: '500', color: item.priceTrend.pct > 0 ? '#B5541E' : '#5A6E2A' }}>
                        {item.priceTrend.pct > 0 ? '+' : ''}{item.priceTrend.pct}% vs last
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#9C7E6A' }}>first purchase</div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div style={s.listFoot}>
              <span style={s.footLabel}>
                {checkedCount > 0 ? `${checkedCount} checked · remaining` : 'Estimated total'}
              </span>
              <span style={s.footVal}>₦{uncheckedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div style={s.secHead}>
            <span style={s.secTitle}>Your categories</span>
            <button style={s.secAction} onClick={() => navigate('/lists')}>View all</button>
          </div>
          <div style={s.catGrid}>
            {listNames.length === 0 ? (
              <div style={s.emptyState}>No categories yet — go to Lists to add one</div>
            ) : (
              listNames.map((list) => (
                <div key={list._id} style={s.cat} onClick={() => navigate(`/lists/${list._id}`)}>
                  <div style={s.catIcon}>📦</div>
                  <div style={s.catName}>{list.name}</div>
                </div>
              ))
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
  logo: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#FAF0E4' },
  logoAccent: { color: '#C87941' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#C87941', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', color: '#fff' },
  signout: { fontSize: '12px', color: '#C8B09A', background: 'none', border: '0.5px solid #5A3E28', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' },
  greetingH: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#2A1E14', margin: 0 },
  greetingSub: { fontSize: '13px', color: '#8C6F5A', marginTop: '3px' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px' },
  metric: { background: '#F0E8DC', borderRadius: '10px', padding: '14px 16px' },
  metricLabel: { fontSize: '10px', fontWeight: '500', color: '#8C6F5A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' },
  metricValue: { fontSize: '18px', fontWeight: '500', color: '#2A1E14', lineHeight: '1.2' },
  metricSub: { fontSize: '11px', color: '#9C7E6A', marginTop: '2px' },
  alert: { background: '#FDF0E6', border: '0.5px solid #E8C49A', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' },
  alertPip: { width: '7px', height: '7px', borderRadius: '50%', background: '#C87941', marginTop: '4px', flexShrink: 0 },
  alertText: { fontSize: '13px', color: '#6B3E1E', lineHeight: '1.55' },
  secHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  secTitle: { fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.6px' },
  secAction: { fontSize: '12px', color: '#C87941', background: 'none', border: 'none', fontWeight: '500', cursor: 'pointer' },
  saveBtn: { padding: '6px 14px', background: '#5A6E2A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  shopNowBtn: { padding: '6px 12px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  goShopBtn: { padding: '4px 10px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  listCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'hidden' },
  listHead: { padding: '13px 16px', borderBottom: '0.5px solid #EDE0D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontSize: '14px', fontWeight: '500', color: '#2A1E14' },
  badge: { fontSize: '11px', fontWeight: '500', padding: '3px 10px', borderRadius: '999px', background: '#EEE4D4', color: '#5A3E28' },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '0.5px solid #F5EDE0', cursor: 'pointer', transition: 'opacity 0.15s' },
  itemL: { display: 'flex', alignItems: 'center', gap: '10px' },
  chk: { width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #D4C4B0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chkDone: { background: '#5A6E2A', borderColor: '#5A6E2A' },
  tick: { color: '#fff', fontSize: '11px', fontWeight: 'bold' },
  itemName: { fontSize: '14px', fontWeight: '500', color: '#2A1E14' },
  itemMeta: { fontSize: '12px', color: '#9C7E6A', marginTop: '1px' },
  itemR: { textAlign: 'right' },
  itemPrice: { fontSize: '13px', fontWeight: '500', color: '#2A1E14' },
  listFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F7F0E6', borderTop: '0.5px solid #EDE0D0' },
  footLabel: { fontSize: '13px', color: '#9C7E6A' },
  footVal: { fontSize: '15px', fontWeight: '500', color: '#2A1E14' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(136px,1fr))', gap: '10px' },
  cat: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer' },
  catIcon: { fontSize: '24px', marginBottom: '8px' },
  catName: { fontSize: '13px', fontWeight: '500', color: '#2A1E14' },
  emptyState: { padding: '20px 16px', fontSize: '13px', color: '#9C7E6A', textAlign: 'center' },
  saveRow: { display: 'flex', justifyContent: 'flex-end' },
}

export default DashboardPage
