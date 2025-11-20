import { Outlet } from 'react-router-dom'
import { useAuth } from '@/layouts/Root'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'

function Layout() {
  const { logout } = useAuth()
  const { user, isAuthenticated } = useSelector((state) => state.user)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with logout button when authenticated */}
      {isAuthenticated && user && (
        <motion.header 
          className="bg-white shadow-sm border-b border-slate-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <ApperIcon name="CheckSquare" className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-slate-900">FlowTrack</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  Welcome, <span className="font-medium">{user.firstName || user.name || 'User'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-600 hover:text-slate-800"
                >
                  <ApperIcon name="LogOut" className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </motion.header>
      )}
      
      <Outlet />
    </div>
  )
}

export default Layout