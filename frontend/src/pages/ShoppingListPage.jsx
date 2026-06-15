import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { generateShoppingList, buyItem, skipItem, createItem, reset } from '../features/items/itemSlice'
import { getItems } from '../features/items/itemSlice'
import { createListName, getListNames } from '../features/listName/listNameSlice'
import Spinner from '../components/Spinner'

function ShoppingListPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { shoppingList, items, isLoading, isError, message } = useSelector((state) => state.items)
  const { listNames } = useSelector((state) => state.listNames)

  const [pending, setPending] = useState([])
  const [completed, setCompleted] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingSort, setPendingSort] = useState({ key: null, dir: 'asc' })
  const [completedSort, setCompletedSort] = useState({ key: null, dir: 'asc' })

  // Manual add state
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [addMode, setAddMode] = useState('existing') // 'existing' | 'new'
  const [selectedItemId, setSelectedItemId] = useState('')
  const [newItemData, setNewItemData] = useState({ name: '', unitPrice: '', quantity: '', price: '', frequency: 'weekly', comment: '' })
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isNewCategory, setIsNewCategory] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(generateShoppingList())
    dispatch(getListNames())
    dispatch(getItems({ listId: undefined, includeDisabled: false }))
    return () => dispatch(reset())
  }, [user, navigate, dispatch])

  useEffect(() => {
    if (isError) toast.error(message)
  }, [isError, message])

  useEffect(() => {
    if (shoppingList && shoppingList.length > 0) {
      const withEdits = shoppingList.map(item => ({
        ...item,
        _editUnitPrice: item.unitPrice || '',
        _editQuantity: item.quantity || '',
        _editPrice: item.price || '',
        _editFrequency: item.frequency || 'weekly',
        _editComment: item.comment || '',
      }))
      setPending(withEdits)
      setCompleted([])
    }
  }, [shoppingList])

  // Items not already on the list
  const pendingIds = new Set(pending.map(i => i._id))
  const completedIds = new Set(completed.map(i => i._id))
  const availableItems = (Array.isArray(items) ? items : []).filter(i =>
    !pendingIds.has(i._id) && !completedIds.has(i._id) && !i.itemDisabled
  )

  const onFieldChange = (id, field, value) => {
    setPending(prev => prev.map(item => {
      if (item._id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === '_editUnitPrice' || field === '_editQuantity') {
        const unit = parseFloat(field === '_editUnitPrice' ? value : item._editUnitPrice) || 0
        const qty = parseFloat(field === '_editQuantity' ? value : item._editQuantity) || 0
        updated._editPrice = (unit * qty).toString()
      }
      return updated
    }))
  }

  const onNewItemChange = (e) => {
    const updated = { ...newItemData, [e.target.name]: e.target.value }
    if (e.target.name === 'unitPrice' || e.target.name === 'quantity') {
      const unit = parseFloat(e.target.name === 'unitPrice' ? e.target.value : newItemData.unitPrice) || 0
      const qty = parseFloat(e.target.name === 'quantity' ? e.target.value : newItemData.quantity) || 0
      updated.price = (unit * qty).toString()
    }
    setNewItemData(updated)
  }

  // Add existing item to list
  const onAddExisting = () => {
    if (!selectedItemId) return
    const item = availableItems.find(i => i._id === selectedItemId)
    if (!item) return
    setPending(prev => [...prev, {
      ...item,
      _editUnitPrice: item.unitPrice || '',
      _editQuantity: item.quantity || '',
      _editPrice: item.price || '',
      _editFrequency: item.frequency || 'weekly',
      _editComment: item.comment || '',
    }])
    setSelectedItemId('')
    toast.success(`${item.name} added to list`)
  }

  // Add new item — creates in DB then adds to list
  const onAddNew = async () => {
    if (!newItemData.name.trim()) { toast.error('Item name is required'); return }

    let listId = selectedCategoryId

    if (isNewCategory) {
      if (!newCategoryName.trim()) { toast.error('Category name is required'); return }
      try {
        const result = await dispatch(createListName({ name: newCategoryName })).unwrap()
        listId = result._id
        setNewCategoryName('')
        setIsNewCategory(false)
        toast.success(`Category "${newCategoryName}" created`)
      } catch {
        toast.error('Failed to create category')
        return
      }
    }

    if (!listId) { toast.error('Please select or create a category'); return }

    try {
      const result = await dispatch(createItem({
        listId,
        name: newItemData.name,
        unitPrice: Number(newItemData.unitPrice),
        quantity: Number(newItemData.quantity),
        price: Number(newItemData.price),
        frequency: newItemData.frequency,
        comment: newItemData.comment,
      })).unwrap()

      setPending(prev => [...prev, {
        ...result,
        _editUnitPrice: result.unitPrice || '',
        _editQuantity: result.quantity || '',
        _editPrice: result.price || '',
        _editFrequency: result.frequency || 'weekly',
        _editComment: result.comment || '',
      }])
      setNewItemData({ name: '', unitPrice: '', quantity: '', price: '', frequency: 'weekly', comment: '' })
      setSelectedCategoryId('')
      setShowAddPanel(false)
      toast.success(`${result.name} created and added to list`)
    } catch {
      toast.error('Failed to create item')
    }
  }

  const onBought = (item) => {
    setPending(prev => prev.filter(p => p._id !== item._id))
    setCompleted(prev => {
      const bought = prev.filter(i => i._status === 'bought')
      const skipped = prev.filter(i => i._status === 'skipped')
      return [...bought, { ...item, _status: 'bought' }, ...skipped]
    })
  }

  const onSkip = (item) => {
    setPending(prev => prev.filter(p => p._id !== item._id))
    setCompleted(prev => [...prev, { ...item, _status: 'skipped' }])
  }

  const onUndo = (item) => {
    setCompleted(prev => prev.filter(c => c._id !== item._id))
    setPending(prev => [...prev, { ...item }])
  }

  const onSaveFinish = async () => {
    if (completed.length === 0) return
    setIsSaving(true)
    try {
      const promises = completed.map(item => {
        if (item._status === 'bought') {
          return dispatch(buyItem({
            id: item._id,
            itemData: {
              name: item.name,
              brand: item.brand,
              unitPrice: Number(item._editUnitPrice),
              quantity: Number(item._editQuantity),
              price: Number(item._editPrice),
              frequency: item._editFrequency,
              comment: item._editComment,
              status: 'bought',
            }
          })).unwrap()
        } else {
          return dispatch(skipItem(item._id)).unwrap()
        }
      })
      await Promise.all(promises)
      toast.success('Shopping trip saved!')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to save some items. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const sortItems = (items, sort) => {
    if (!sort.key) return items
    return [...items].sort((a, b) => {
      const av = sort.key === 'name' ? a.name.toLowerCase() : (Number(a._editPrice) || 0)
      const bv = sort.key === 'name' ? b.name.toLowerCase() : (Number(b._editPrice) || 0)
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
  }

  const toggleSort = (current, setCurrent, key) => {
    if (current.key === key) {
      setCurrent({ key, dir: current.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      setCurrent({ key, dir: 'asc' })
    }
  }

  const sortIcon = (sort, key) => {
    if (sort.key !== key) return ' ↕'
    return sort.dir === 'asc' ? ' ↑' : ' ↓'
  }

  const estTotal = pending.reduce((sum, i) => sum + (Number(i._editPrice) || 0), 0)
  const totalSpent = completed
    .filter(i => i._status === 'bought')
    .reduce((sum, i) => sum + (Number(i._editPrice) || 0), 0)

  const summaryText = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const lines = pending.map(i => {
      const comment = i._editComment ? `  (${i._editComment})` : ''
      return `• ${i.name} — ₦${Number(i._editPrice).toLocaleString()}${comment}`
    })
    return [`Shopping list — ${today}`, '', ...lines, '', `Est. total: ₦${estTotal.toLocaleString()}`].join('\n')
  }

  const onCopySummary = () => {
    navigator.clipboard.writeText(summaryText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (isLoading) return <Spinner />

  return (
    <div style={s.app}>
      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>

        {/* Page header */}
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Shopping list</h1>
            <p style={s.pageSub}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button style={s.addItemBtn} onClick={() => setShowAddPanel(!showAddPanel)}>
              {showAddPanel ? 'Cancel' : '+ Add item'}
            </button>
            {pending.length > 0 && (
              <button style={s.summaryBtn} onClick={() => setShowSummary(!showSummary)}>
                {showSummary ? 'Hide summary' : '📋 Summary'}
              </button>
            )}
          </div>
        </div>

        {/* Manual add panel */}
        {showAddPanel && (
          <div style={s.addPanel}>
            <div style={s.addTabs}>
              <button
                style={{ ...s.addTab, ...(addMode === 'existing' ? s.addTabActive : {}) }}
                onClick={() => setAddMode('existing')}
              >From my items</button>
              <button
                style={{ ...s.addTab, ...(addMode === 'new' ? s.addTabActive : {}) }}
                onClick={() => setAddMode('new')}
              >New item</button>
            </div>

            {addMode === 'existing' ? (
              <div style={s.addRow}>
                <select
                  style={s.addSelect}
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  <option value=''>Select an item...</option>
                  {availableItems.map(i => (
                    <option key={i._id} value={i._id}>{i.name} {i.brand ? `(${i.brand})` : ''}</option>
                  ))}
                </select>
                <button style={s.addConfirmBtn} onClick={onAddExisting}>Add to list</button>
              </div>
            ) : (
              <div style={s.newItemForm}>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Item name *</label>
                    <input style={s.input} name='name' value={newItemData.name} onChange={onNewItemChange} placeholder='e.g. Bread' />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Unit price (₦)</label>
                    <input style={s.input} name='unitPrice' type='number' value={newItemData.unitPrice} onChange={onNewItemChange} placeholder='0' />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Quantity</label>
                    <input style={s.input} name='quantity' type='number' value={newItemData.quantity} onChange={onNewItemChange} placeholder='1' />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Total (auto)</label>
                    <input style={{ ...s.input, background: '#F0E8DC', color: '#8C6F5A' }} name='price' type='number' value={newItemData.price} readOnly />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Frequency</label>
                    <select style={s.input} name='frequency' value={newItemData.frequency} onChange={onNewItemChange}>
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
                  <div style={s.field}>
                    <label style={s.label}>Comment</label>
                    <input style={s.input} name='comment' value={newItemData.comment} onChange={onNewItemChange} placeholder='Notes...' />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Category *</label>
                  {!isNewCategory ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select style={{ ...s.input, flex: 1 }} value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                        <option value=''>Select category...</option>
                        {listNames.map(l => (
                          <option key={l._id} value={l._id}>{l.name}</option>
                        ))}
                      </select>
                      <button style={s.newCatBtn} onClick={() => setIsNewCategory(true)}>+ New</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        style={{ ...s.input, flex: 1 }}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder='New category name...'
                      />
                      <button style={s.newCatBtn} onClick={() => setIsNewCategory(false)}>← Back</button>
                    </div>
                  )}
                </div>
                <button style={s.addConfirmBtn} onClick={onAddNew}>Create & add to list</button>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={s.statsRow}>
          <div style={s.statChip}>
            <span style={s.statNum}>{pending.length}</span>
            <span style={s.statLabel}>to buy</span>
          </div>
          <div style={s.statChip}>
            <span style={s.statNum}>₦{estTotal.toLocaleString()}</span>
            <span style={s.statLabel}>est. remaining</span>
          </div>
          <div style={s.statChip}>
            <span style={s.statNum}>{completed.filter(i => i._status === 'bought').length}</span>
            <span style={s.statLabel}>bought</span>
          </div>
          <div style={s.statChip}>
            <span style={s.statNum}>{completed.filter(i => i._status === 'skipped').length}</span>
            <span style={s.statLabel}>skipped</span>
          </div>
          <div style={{ ...s.statChip, marginLeft: 'auto' }}>
            <span style={{ ...s.statNum, color: '#C87941' }}>₦{totalSpent.toLocaleString()}</span>
            <span style={s.statLabel}>spent so far</span>
          </div>
        </div>

        {/* Summary panel */}
        {showSummary && (
          <div style={s.summaryCard}>
            <div style={s.summaryHeader}>
              <span style={s.secTitle}>Trip summary</span>
              <button style={s.copyBtn} onClick={onCopySummary}>{copied ? '✓ Copied!' : '⎘ Copy'}</button>
            </div>
            <pre style={s.summaryText}>{summaryText()}</pre>
          </div>
        )}

        {pending.length === 0 && completed.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>🛒</div>
            <div style={s.emptyTitle}>No items due</div>
            <div style={s.emptySub}>All your items are stocked up. Add items manually or check back later.</div>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionHead}>
                  <span style={s.secTitle}>To buy</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={s.secCount}>{pending.length} items</span>
                    <button style={{ ...s.sortBtn, ...(pendingSort.key === 'name' ? s.sortBtnActive : {}) }} onClick={() => toggleSort(pendingSort, setPendingSort, 'name')}>Name{sortIcon(pendingSort, 'name')}</button>
                    <button style={{ ...s.sortBtn, ...(pendingSort.key === 'price' ? s.sortBtnActive : {}) }} onClick={() => toggleSort(pendingSort, setPendingSort, 'price')}>Price{sortIcon(pendingSort, 'price')}</button>
                  </div>
                </div>
                <div style={s.tableWrap}>
                  <div style={s.tableHeader}>
                    <span style={{ ...s.th, flex: 2 }}>Item</span>
                    <span style={s.th}>Unit ₦</span>
                    <span style={s.th}>Qty</span>
                    <span style={s.th}>Total</span>
                    <span style={{ ...s.th, flex: 2 }}>Comment</span>
                    <span style={{ ...s.th, flex: 1.5 }}></span>
                  </div>
                  {sortItems(pending, pendingSort).map((item) => (
                    <div key={item._id} style={s.tableRow}>
                      <div style={{ flex: 2 }}>
                        <div style={s.itemName}>{item.name}</div>
                        <div style={s.itemMeta}>
                          {item.brand && `${item.brand} · `}{item._editFrequency}
                          {item.priceTrend && (
                            <span style={{ color: item.priceTrend.pct > 0 ? '#B5541E' : '#5A6E2A', marginLeft: '6px', fontSize: '11px' }}>
                              {item.priceTrend.pct > 0 ? `↑${item.priceTrend.pct}%` : `↓${Math.abs(item.priceTrend.pct)}%`}
                            </span>
                          )}
                        </div>
                      </div>
                      <input style={s.cellInput} type='number' value={item._editUnitPrice} onChange={(e) => onFieldChange(item._id, '_editUnitPrice', e.target.value)} />
                      <input style={{ ...s.cellInput, width: '52px' }} type='number' value={item._editQuantity} onChange={(e) => onFieldChange(item._id, '_editQuantity', e.target.value)} />
                      <span style={s.priceCell}>₦{(Number(item._editPrice) || 0).toLocaleString()}</span>
                      <input style={{ ...s.cellInput, flex: 2 }} type='text' value={item._editComment} onChange={(e) => onFieldChange(item._id, '_editComment', e.target.value)} placeholder='Notes...' />
                      <div style={{ display: 'flex', gap: '6px', flex: 1.5, justifyContent: 'flex-end' }}>
                        <button style={s.boughtBtn} onClick={() => onBought(item)}>✓ Bought</button>
                        <button style={s.skipBtn} onClick={() => onSkip(item)}>✗ Skip</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div style={s.section}>
                <div style={s.sectionHead}>
                  <span style={s.secTitle}>Completed</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={s.secCount}>{completed.length} items</span>
                    <button style={{ ...s.sortBtn, ...(completedSort.key === 'name' ? s.sortBtnActive : {}) }} onClick={() => toggleSort(completedSort, setCompletedSort, 'name')}>Name{sortIcon(completedSort, 'name')}</button>
                    <button style={{ ...s.sortBtn, ...(completedSort.key === 'price' ? s.sortBtnActive : {}) }} onClick={() => toggleSort(completedSort, setCompletedSort, 'price')}>Price{sortIcon(completedSort, 'price')}</button>
                  </div>
                </div>
                <div style={s.tableWrap}>
                  <div style={s.tableHeader}>
                    <span style={{ ...s.th, flex: 2 }}>Item</span>
                    <span style={s.th}>Unit ₦</span>
                    <span style={s.th}>Qty</span>
                    <span style={s.th}>Total</span>
                    <span style={{ ...s.th, flex: 2 }}>Comment</span>
                    <span style={{ ...s.th, flex: 1.5 }}></span>
                  </div>
                  {sortItems(completed, completedSort).map((item, i) => (
                    <div key={i} style={{ ...s.tableRow, background: item._status === 'bought' ? '#F7FBF2' : '#FDFAF7', opacity: item._status === 'skipped' ? 0.6 : 1 }}>
                      <div style={{ flex: 2 }}>
                        <div style={{ ...s.itemName, textDecoration: item._status === 'skipped' ? 'line-through' : 'none', color: item._status === 'skipped' ? '#9C7E6A' : '#2A1E14' }}>{item.name}</div>
                        <div style={s.itemMeta}>{item.brand && `${item.brand} · `}{item._editFrequency}</div>
                      </div>
                      <span style={{ ...s.priceCell, color: '#9C7E6A' }}>{item._status === 'bought' ? `₦${(Number(item._editUnitPrice) || 0).toLocaleString()}` : '—'}</span>
                      <span style={{ ...s.priceCell, color: '#9C7E6A' }}>{item._status === 'bought' ? item._editQuantity : '—'}</span>
                      <span style={{ ...s.priceCell, color: '#9C7E6A' }}>{item._status === 'bought' ? `₦${(Number(item._editPrice) || 0).toLocaleString()}` : '—'}</span>
                      <span style={{ ...s.priceCell, flex: 2, color: '#9C7E6A', fontStyle: 'italic', fontSize: '12px' }}>{item._editComment || '—'}</span>
                      <div style={{ flex: 1.5, display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {item._status === 'bought' ? <span style={s.boughtBadge}>✓ Bought</span> : <span style={s.skippedBadge}>✗ Skipped</span>}
                        <button style={s.undoBtn} onClick={() => onUndo(item)} title='Undo'>↩</button>
                      </div>
                    </div>
                  ))}
                  <div style={s.totalRow}>
                    <span style={s.totalLabel}>
                      Total spent
                      {completed.filter(i => i._status === 'skipped').length > 0 && (
                        <span style={s.skippedNote}> · {completed.filter(i => i._status === 'skipped').length} skipped, not counted</span>
                      )}
                    </span>
                    <span style={s.totalVal}>₦{totalSpent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {pending.length === 0 && completed.length > 0 && (
              <div style={s.finishRow}>
                <div>
                  <div style={s.finishTitle}>All done! 🎉</div>
                  <div style={s.finishSub}>{completed.filter(i => i._status === 'bought').length} bought · {completed.filter(i => i._status === 'skipped').length} skipped · ₦{totalSpent.toLocaleString()} spent</div>
                </div>
                <button style={{ ...s.finishBtn, opacity: isSaving ? 0.7 : 1 }} onClick={onSaveFinish} disabled={isSaving}>
                  {isSaving ? 'Saving...' : '✓ Save & Finish'}
                </button>
              </div>
            )}

            {pending.length > 0 && completed.length > 0 && (
              <div style={s.midSaveRow}>
                <span style={s.midSaveNote}>Done shopping early?</span>
                <button style={{ ...s.finishBtn, fontSize: '12px', padding: '8px 16px', opacity: isSaving ? 0.7 : 1 }} onClick={onSaveFinish} disabled={isSaving}>
                  {isSaving ? 'Saving...' : '✓ Save & Finish'}
                </button>
              </div>
            )}
          </>
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
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '600', color: '#2A1E14', margin: 0 },
  pageSub: { fontSize: '13px', color: '#8C6F5A', marginTop: '3px' },
  addItemBtn: { padding: '8px 14px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  summaryBtn: { padding: '8px 14px', background: '#F7F0E6', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '13px', color: '#6B5040', cursor: 'pointer' },
  // Add panel
  addPanel: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '16px' },
  addTabs: { display: 'flex', background: '#F7F0E6', borderRadius: '8px', padding: '2px', marginBottom: '14px', width: 'fit-content' },
  addTab: { padding: '6px 14px', background: 'none', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#9C7E6A', cursor: 'pointer', fontFamily: 'sans-serif' },
  addTabActive: { background: '#3D2B1F', color: '#FAF0E4', fontWeight: '500' },
  addRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  addSelect: { flex: 1, padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '14px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif' },
  addConfirmBtn: { padding: '9px 16px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  newItemForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#8C6F5A' },
  input: { padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '14px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif' },
  newCatBtn: { padding: '9px 12px', background: 'none', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '13px', color: '#6B5040', cursor: 'pointer', whiteSpace: 'nowrap' },
  // Stats
  statsRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  statChip: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'baseline', gap: '5px' },
  statNum: { fontSize: '16px', fontWeight: '500', color: '#2A1E14' },
  statLabel: { fontSize: '11px', color: '#9C7E6A' },
  // Summary
  summaryCard: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'hidden' },
  summaryHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F7F0E6', borderBottom: '0.5px solid #E2D5C3' },
  summaryText: { padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#2A1E14', lineHeight: '1.9', whiteSpace: 'pre', overflowX: 'auto', margin: 0 },
  copyBtn: { padding: '5px 12px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  // Sections
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  secTitle: { fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.6px' },
  secCount: { fontSize: '12px', color: '#C87941', fontWeight: '500' },
  sortBtn: { padding: '3px 8px', background: 'none', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '11px', color: '#9C7E6A', cursor: 'pointer', fontFamily: 'sans-serif' },
  sortBtnActive: { background: '#F7F0E6', color: '#3D2B1F', borderColor: '#C8A882', fontWeight: '500' },
  tableWrap: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'hidden' },
  tableHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: '#F7F0E6', borderBottom: '0.5px solid #E2D5C3' },
  th: { flex: 1, fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', borderTop: '0.5px solid #F0E8DC', background: '#fff' },
  itemName: { fontSize: '13px', fontWeight: '500', color: '#2A1E14' },
  itemMeta: { fontSize: '11px', color: '#9C7E6A', marginTop: '2px' },
  cellInput: { flex: 1, padding: '5px 8px', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '13px', color: '#2A1E14', background: '#FDFAF7', fontFamily: 'sans-serif', minWidth: '0' },
  priceCell: { flex: 1, fontSize: '13px', color: '#2A1E14' },
  boughtBtn: { padding: '5px 10px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' },
  skipBtn: { padding: '5px 10px', background: 'none', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '12px', color: '#9C7E6A', cursor: 'pointer', whiteSpace: 'nowrap' },
  boughtBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#EAF3DE', color: '#27500A', fontWeight: '500' },
  skippedBadge: { display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#F1EFE8', color: '#5F5E5A' },
  undoBtn: { padding: '3px 8px', background: 'none', border: '0.5px solid #D4C4B0', borderRadius: '6px', fontSize: '13px', color: '#9C7E6A', cursor: 'pointer' },
  totalRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F7F0E6', borderTop: '0.5px solid #E2D5C3' },
  totalLabel: { fontSize: '12px', color: '#6B5040', fontWeight: '500' },
  totalVal: { fontSize: '15px', fontWeight: '500', color: '#2A1E14' },
  skippedNote: { fontSize: '11px', color: '#9C7E6A', fontWeight: '400' },
  finishRow: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  finishTitle: { fontSize: '15px', fontWeight: '500', color: '#2A1E14', marginBottom: '3px' },
  finishSub: { fontSize: '12px', color: '#9C7E6A' },
  finishBtn: { padding: '10px 24px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  midSaveRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '4px 0' },
  midSaveNote: { fontSize: '12px', color: '#9C7E6A' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '36px', marginBottom: '12px' },
  emptyTitle: { fontSize: '16px', fontWeight: '500', color: '#2A1E14', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#9C7E6A' },
}

export default ShoppingListPage
