import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DeliveryList from './pages/DeliveryList'
import DeliveryForm from './pages/DeliveryForm'
import DeliveryRequestList from './pages/DeliveryRequestList'
import DeliveryRequestForm from './pages/DeliveryRequestForm'
import OngoingDeliveries from './pages/OngoingDeliveries'
import Summary from './pages/Summary'
import NotFound from './pages/NotFound'
import CompanyDirectory from './pages/CompanyDirectory/CompanyDirectory'
import Settings from './pages/Settings'
import DeliveryDetails from './pages/DeliveryDetails'
import BranchHistory from './pages/BranchHistory'
import WarehouseHistory from './pages/WarehouseHistory'

// Layout
import Layout from './components/Layout'

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading, isAuthenticated, refreshUserData } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  const { user, loading, isAuthenticated, refreshUserData } = useAuth()

  // Set up initial refresh of user data
  useEffect(() => {
    // Only refresh if the user is authenticated
    if (!isAuthenticated) return
    
    // Initial refresh after components mount
    refreshUserData(false)
    
    // Remove the interval-based auto-refresh
  }, [isAuthenticated, refreshUserData])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        
        {/* Summary Page - Available to all users */}
        <Route path="summary" element={<Summary />} />
        
        {/* Delivery Requests - Available to all users */}
        <Route path="delivery-requests" element={<DeliveryRequestList />} />
        <Route path="delivery-requests/new" element={<DeliveryRequestForm />} />
        
        {/* Delivery Details - Available to all users */}
        <Route path="delivery-details/:id" element={<DeliveryDetails />} />
        
        {/* History Pages */}
        <Route path="branch-history" element={<BranchHistory />} />
        <Route path="warehouse-history" element={<WarehouseHistory />} />
        
        {/* Ongoing Deliveries - Available to branch users and admin */}
        <Route path="ongoing-deliveries" element={<OngoingDeliveries />} />
        
        {/* Deliveries - Available to admin and warehouse users */}
        <Route path="deliveries" element={<DeliveryList />} />
        <Route path="deliveries/new" element={<DeliveryForm />} />
        <Route path="deliveries/:id" element={<DeliveryForm />} />
        <Route path="company-directory" element={<CompanyDirectory />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App 