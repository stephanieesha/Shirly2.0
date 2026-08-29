import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSelector } from 'react-redux'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ListsPage from './pages/ListsPage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import ShoppingListPage from './pages/ShoppingListPage'
import CategoryBinPage from './pages/CategoryBinPage'
import ItemBinPage from './pages/ItemBinPage'
import ErrorBoundary from './components/ErrorBoundary'

function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  return user ? children : <Navigate to='/login' />
}

function App() {
  return (
    <ErrorBoundary>
      <>
        <Router>
          <Routes>
            <Route path='/' element={<Navigate to='/login' />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/dashboard' element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path='/lists' element={<PrivateRoute><ListsPage /></PrivateRoute>} />
            <Route path='/lists/:listId' element={<PrivateRoute><ListsPage /></PrivateRoute>} />
            <Route path='/lists/:listId/items' element={<PrivateRoute><ItemsPage /></PrivateRoute>} />
            <Route path='/items/:itemId' element={<PrivateRoute><ItemDetailPage /></PrivateRoute>} />
            <Route path='/shopping' element={<PrivateRoute><ShoppingListPage /></PrivateRoute>} />
            <Route path='/lists/bin' element={<PrivateRoute><CategoryBinPage /></PrivateRoute>} />
            <Route path='/lists/:listId/bin' element={<PrivateRoute><ItemBinPage /></PrivateRoute>} />
          </Routes>
        </Router>
        <ToastContainer
          position='top-right'
          autoClose={3000}
          toastStyle={{ background: '#3D2B1F', color: '#FAF0E4' }}
        />
      </>
   </ErrorBoundary>
  )
}

export default App
