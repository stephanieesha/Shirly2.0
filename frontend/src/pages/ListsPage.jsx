import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { getListNames, createListName, deleteListName, reset } from '../features/listName/listNameSlice'
import Spinner from '../components/Spinner'

function ListsPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { listNames, isLoading, isError, message } = useSelector((state) => state.listNames)
  const [newName, setNewName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [confirmName, setConfirmName] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    dispatch(getListNames())
    return () => dispatch(reset())
  }, [user, navigate, dispatch])

  useEffect(() => {
    if (isError) toast.error(message)
  }, [isError, message])

  const onSubmit = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    dispatch(createListName({ name: newName.trim() }))
    setNewName('')
    setShowInput(false)
  }

  const onDeleteClick = (id, name) => {
    setConfirmId(id)
    setConfirmName(name)
  }

  const onConfirmDelete = () => {
    dispatch(deleteListName(confirmId))
    setConfirmId(null)
    setConfirmName('')
  }

  const onCancelDelete = () => {
    setConfirmId(null)
    setConfirmName('')
  }

  const categoryIcons = ['🥦', '🧴', '🧺', '👶', '🍖', '🧀', '🫙', '🧹', '💊', '🐾', '🏠', '👗']

  const filteredLists = listNames.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <Spinner />

  return (
    <div style={s.app}>
      {/* Custom confirm modal */}
      {confirmId && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalIcon}>🗑️</div>
            <div style={s.modalTitle}>Delete category?</div>
            <div style={s.modalSub}>
              "<b>{confirmName}</b>" will be removed. This cannot be undone.
            </div>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={onCancelDelete}>Cancel</button>
              <button style={s.confirmBtn} onClick={onConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.topbar}>
        <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <div style={s.logo}>Shirl<span style={s.logoAccent}>y</span></div>
      </div>

      <div style={s.body}>
        <div style={s.pageHead}>
          <div>
            <h1 style={s.pageTitle}>Your categories</h1>
            <p style={s.pageSub}>{listNames.length} categories</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowInput(!showInput)}>
            {showInput ? 'Cancel' : '+ New category'}
          </button>
          <button style={s.binBtn} onClick={() => navigate('/lists/bin')}>🗑️ Bin</button>
        </div>

        <div style={s.searchRow}>
          <input
            style={s.searchInput}
            type='text'
            placeholder='Search categories...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {showInput && (
          <form onSubmit={onSubmit} style={s.inputCard}>
            <input
              style={s.input}
              type='text'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Category name e.g. Groceries'
              autoFocus
            />
            <button type='submit' style={s.submitBtn}>Add</button>
          </form>
        )}

        <div style={s.grid}>
          {filteredLists.length === 0 ? (
            <div style={s.empty}>
              {search ? `No categories matching "${search}"` : 'No categories yet — add one above'}
            </div>
          ) : (
            filteredLists.map((list, index) => (
              <div key={list._id} style={s.card}>
                <div style={s.cardMain} onClick={() => navigate(`/lists/${list._id}/items`)}>
                  <div style={s.icon}>{categoryIcons[index % categoryIcons.length]}</div>
                  <div style={s.cardName}>{list.name}</div>
                  <div style={s.cardSub}>Tap to view items</div>
                </div>
                <button style={s.deleteBtn} onClick={() => onDeleteClick(list._id, list.name)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  app: { fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' },

  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(42, 30, 20, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#FDF8F3', border: '0.5px solid #E2D5C3', borderRadius: '18px', padding: '28px 24px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(42,30,20,0.18)' },
  modalIcon: { fontSize: '32px', marginBottom: '12px' },
  modalTitle: { fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '600', color: '#2A1E14', marginBottom: '8px' },
  modalSub: { fontSize: '13px', color: '#8C6F5A', lineHeight: '1.55', marginBottom: '22px' },
  modalBtns: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '10px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '10px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },

  // Page
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: '#3D2B1F' },
  backBtn: { fontSize: '13px', color: '#C8B09A', background: 'none', border: 'none', cursor: 'pointer' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#FAF0E4' },
  logoAccent: { color: '#C87941' },
  body: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  pageHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '600', color: '#2A1E14', margin: 0 },
  pageSub: { fontSize: '13px', color: '#8C6F5A', marginTop: '3px' },
  addBtn: { padding: '9px 16px', background: '#3D2B1F', color: '#FAF0E4', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  inputCard: { display: 'flex', gap: '10px', background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '12px', padding: '14px' },
  input: { flex: 1, padding: '9px 12px', border: '0.5px solid #D4C4B0', borderRadius: '8px', fontSize: '14px', color: '#2A1E14', background: '#FDFAF7' },
  submitBtn: { padding: '9px 18px', background: '#C87941', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' },
  card: { background: '#fff', border: '0.5px solid #E2D5C3', borderRadius: '14px', overflow: 'hidden', position: 'relative' },
  cardMain: { padding: '16px', cursor: 'pointer' },
  icon: { fontSize: '28px', marginBottom: '10px' },
  cardName: { fontSize: '14px', fontWeight: '500', color: '#2A1E14' },
  cardSub: { fontSize: '12px', color: '#9C7E6A', marginTop: '3px' },
  deleteBtn: { position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#C8A882', fontSize: '14px', cursor: 'pointer', padding: '2px 6px' },
  empty: { padding: '40px 20px', fontSize: '14px', color: '#9C7E6A', textAlign: 'center', gridColumn: '1/-1' },
  searchRow: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: { width: '100%', padding: '10px 40px 10px 14px', border: '0.5px solid #D4C4B0', borderRadius: '10px', fontSize: '14px', color: '#2A1E14', background: '#fff', fontFamily: 'sans-serif', boxSizing: 'border-box' },
  binBtn: { padding: '9px 16px', background: '#F0E8DC', color: '#6B4C35', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  clearBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#9C7E6A', fontSize: '14px', cursor: 'pointer' },
}

export default ListsPage
