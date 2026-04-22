import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react'

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success', // 'success', 'error', 'warning'
  buttonText = 'OK'
}) => {
  if (!isOpen) return null

  const typeStyles = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    error: {
      icon: XCircle,
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    }
  }

  const styles = typeStyles[type]
  const IconComponent = styles.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-scaleIn">
        <div className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-3`}>
              <IconComponent className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium text-white ${styles.button} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
