import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { authService } from './services/api'
import Login from './pages/Login'
import Dashboard from './pages/dashboard'
import Employees from './pages/Employees'
import Indicators from './pages/Indicators'
import Feedbacks from './pages/Feedbacks'
import Users from './pages/Users'
import Areas from './pages/Areas'

function PrivateRoute({ children }: { children: JSX.Element }) {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/areas"
          element={
            <PrivateRoute>
              <Areas />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoute>
              <Employees />
            </PrivateRoute>
          }
        />
        <Route
          path="/indicators"
          element={
            <PrivateRoute>
              <Indicators />
            </PrivateRoute>
          }
        />
        <Route
          path="/feedbacks"
          element={
            <PrivateRoute>
              <Feedbacks />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
