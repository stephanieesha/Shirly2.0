import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { getDeletedListNames, restoreListName, permanentlyDeleteListName, reset } from '../features/listName/listNameSlice'
import Spinner from '../components/Spinner'

function CategoryBinPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { deletedListNames, isLoading, isError, message } = useSelector((state) => state.listNames)
  const [confirmId, setConfirmId] = useState(null)
  const [confirmName, setConfirmName] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getDeletedListNames())
    return () => dispatch(reset())
  }, [user, navigate, dispatch])

  useEffect(() => {
    if (isError) toast.error(message)
  }, [isError, message])

  const onRestore = (id, name) => {
    dispatch(restoreListName(id))
    toast.success(`"${name}" restored`)
  }

  const onDeleteClick = (id, name) => {
    setConfirmId(id)
    setConfirmName(name)
  }

  const onConfirmDelete = () => {
    dispatch(permanentlyDeleteListName(confirmId))
    toast.success(`"${confirmName}" permanently deleted`)
    setConfirmId(null)
    setConfirmName('')
  }

  const onCancelDelete = () => {
    setConfirmId(null)
    setConfirmName('')
  }

  const categoryIcons = ['🥦', '🧴', '🧺', '👶', '🍖', '🧀', '🫙', '🧹', '💊', '🐾', '🏠', '👗']

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
        <button style={s.backBtn} onClick={() => navigate('/lists')}>← Categories</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>🗑️ Category Bin</h1>
            <p style={s.pageSub}>{deletedListNames.length} deleted {deletedListNames.length === 1 ? 'category' : 'categories'}</p>
          </div>
        </div>

        {deletedListNames.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🗑️</div>
            <div style={s.emptyTitle}>Bin is empty</div>
            <div style={s.emptySub}>Deleted categories will appear here</div>
          </div>
        ) : (
          <div style={s.grid}>
            {deletedListNames.map((list, index) => (
              <div key={list._id} style={s.card}>
                <div style={s.icon}>{categoryIcons[index % categoryIcons.length]}</div>
                <div style={s.cardName}>{list.name}</div>
                <div style={s.cardSub}>
                  Deleted {new Date(list.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={s.btnRow}>
                  <button style={s.restoreBtn} onClick={() => onRestore(list._id, list.name)}>↩ Restore</button>
                  <button style={s.deleteBtn} onClick={() => onDeleteClick(list._id, list.name)}>✕ Delete</button>
                </div>
              </div>
            ))}
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' },
  card: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.8 },
  icon: { fontSize: '28px' },
  cardName: { fontSize: '14px', fontWeight: '500', color: '#2A1E14' },
  cardSub: { fontSize: '11px', color: '#9C7E6A' },
  btnRow: { display: 'flex', gap: '6px', marginTop: '8px' },
  restoreBtn: { flex: 1, padding: '7px 10px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  deleteBtn: { flex: 1, padding: '7px 10px', background: 'none', color: '#C8A882', border: '0.5px solid #E2D5C3', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '36px', marginBottom: '12px' },
  emptyTitle: { fontSize: '16px', fontWeight: '500', color: '#2A1E14', marginBottom: '6px' },
  emptySub: { fontSize: '13px', color: '#9C7E6A' },
}

export default CategoryBinPage
