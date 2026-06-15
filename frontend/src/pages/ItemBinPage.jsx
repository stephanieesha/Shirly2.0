import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { getItems, enableItem, permanentlyDeleteItem, reset } from '../features/items/itemSlice'
import { getListNames } from '../features/listName/listNameSlice'
import Spinner from '../components/Spinner'

function ItemBinPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { listId } = useParams()
  const { user } = useSelector((state) => state.auth)
  const { items, isLoading, isError, message } = useSelector((state) => state.items)
  const { listNames } = useSelector((state) => state.listNames)
  const [confirmId, setConfirmId] = useState(null)
  const [confirmName, setConfirmName] = useState('')

  const currentList = listNames.find((l) => l._id === listId)
  const deletedItems = (Array.isArray(items) ? items : []).filter((i) => i.itemDisabled)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getItems({ listId, includeDisabled: true }))
    dispatch(getListNames())
    return () => dispatch(reset())
  }, [user, navigate, dispatch, listId])

  useEffect(() => {
    if (isError) toast.error(message)
  }, [isError, message])

  const onRestore = (id, name) => {
    dispatch(enableItem(id))
    toast.success(`"${name}" restored`)
  }

  const onDeleteClick = (id, name) => {
    setConfirmId(id)
    setConfirmName(name)
  }

  const onConfirmDelete = () => {
    dispatch(permanentlyDeleteItem(confirmId))
    toast.success(`"${confirmName}" permanently deleted`)
    setConfirmId(null)
    setConfirmName('')
  }

  const onCancelDelete = () => {
    setConfirmId(null)
    setConfirmName('')
  }

  if (isLoading) return <Spinner />

  return (
    <div style={s.app}>

      {/* Permanent delete modal */}
      {confirmId && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>⚠️</div>
            <div style={s.modalTitle}>Permanently delete?</div>
            <div style={s.modalSub}>
              "<b>{confirmName}</b>" will be gone forever and cannot be recovered.
            </div>
            <div style={s.modalBtns}>
              <button style={s.modalCancelBtn} onClick={onCancelDelete}>Cancel</button>
              <button style={s.modalConfirmBtn} onClick={onConfirmDelete}>Delete forever</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate(`/lists/${listId}/items`)}>← {currentList?.name || 'Items'}</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>🗑️ Item Bin</h1>
            <p style={s.pageSub}>
              {deletedItems.length} deleted {deletedItems.length === 1 ? 'item' : 'items'} in {currentList?.name || 'this category'}
            </p>
          </div>
        </div>

        {deletedItems.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🗑️</div>
            <div style={s.emptyTitle}>Bin is empty</div>
            <div style={s.emptySub}>Deleted items will appear here</div>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.theadRow}>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Brand</th>
                  <th style={s.th}>Price</th>
                  <th style={s.th}>Frequency</th>
                  <th style={s.th}>Deleted</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.map((item, i) => (
                  <tr key={item._id} style={{ ...s.tbodyRow, background: i % 2 === 0 ? '#fff' : '#FDFAF7' }}>
                    <td style={{ ...s.td, fontWeight: '500', color: '#2A1E14' }}>{item.name}</td>
                    <td style={s.td}><span style={s.muted}>{item.brand || '—'}</span></td>
                    <td style={s.td}>₦{(item.price || 0).toLocaleString()}</td>
                    <td style={s.td}><span style={s.freqBadge}>{item.frequency}</span></td>
                    <td style={{ ...s.td, ...s.muted, fontSize: '12px' }}>
                      {new Date(item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={s.restoreBtn} onClick={() => onRestore(item._id, item.name)}>↩ Restore</button>
                        <button style={s.deleteBtn} onClick={() => onDeleteClick(item._id, item.name)}>✕ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  app: { fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(42, 30, 20, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#FDF8F3', border: '0.5px solid #E2D5C3', borderRadius: '18px', padding: '28px 24px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(42,30,20,0.18)' },
  modalIcon: { fontSize: '32px', marginBottom: '12px' },
  modalTitle: { fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '600', color: '#2A1E14', marginBottom: '8px' },
  modalSub: { fontSize: '13px', color: '#8C6F5A', lineHeight: '1.55', marginBottom: '22px' },
  modalBtns: { display: 'flex', gap: '10px' },
  modalCancelBtn: { flex: 1, padding: '10px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  modalConfirmBtn: { flex: 1, padding: '10px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: '#3D2B1F' },
  backBtn: { fontSize: '13px', color: '#C8B09A', background: 'none', border: 'none', cursor: 'pointer' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#FAF0E4' },
  logoAccent: { color: '#C87941' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#2A1E14', margin: 0 },
  pageSub: { fontSize: '13px', color: '#8C6F5A', marginTop: '3px' },
  tableWrap: { border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  theadRow: { background: '#F7F0E6' },
  th: { textAlign: 'left', padding: '9px 14px', fontSize: '11px', fontWeight: '500', color: '#9C7E6A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  tbodyRow: { borderTop: '0.5px solid #E2D5C3' },
  td: { padding: '10px 14px', color: '#2A1E14', verticalAlign: 'middle' },
  muted: { color: '#9C7E6A' },
  freqBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#F7F0E6', color: '#6B4C35' },
  restoreBtn: { padding: '6px 12px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  deleteBtn: { padding: '6px 12px', background: 'none', color: '#C8A882', border: '0.5px solid #E2D5C3', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '36px', marginBottom: '12px' },
  emptyTitle: { fontSize: '16px', fontWeight: '500', color: '#2A1E14', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#9C7E6A' },
}

export default ItemBinPage
