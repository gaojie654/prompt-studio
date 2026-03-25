import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Workspace from './pages/Workspace'
import Prompts from './pages/Prompts'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import OrderManagement from './pages/admin/OrderManagement'
import PromptManagement from './pages/admin/PromptManagement'
import Statistics from './pages/admin/Statistics'
import Settings from './pages/admin/Settings'

function App() {
  return (
    <Routes>
      {/* Public routes with layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="workspace" element={<Workspace />} />
        <Route path="prompts" element={<Prompts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="prompts" element={<PromptManagement />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
