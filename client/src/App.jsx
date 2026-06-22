import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import Oferta from './pages/Oferta'

import ProtectedRoute from './components/ProtectedRoute'

import {
  AuthProvider
} from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<NotFound />}
          />

          <Route path="/oferta" element={<Oferta />} />
          
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App