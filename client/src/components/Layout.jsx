import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { BarChart3, LogOut, Sun, Moon, Users, UserCheck } from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Presales</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                {user?.role === 'admin' ? (
                  <Users className="h-4 w-4 mr-2" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">{user?.name}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                  {user?.role}
                </span>
              </div>
              
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="w-full mx-auto py-6 px-6 sm:px-8 lg:px-12">
        {children}
      </main>
    </div>
  )
}

export default Layout