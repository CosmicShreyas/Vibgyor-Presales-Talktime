import React, { useState, useEffect } from 'react'
import { Mail, Send, Calendar, Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const Reports = () => {
  const { user } = useAuth()
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    appPassword: '',
    senderName: ''
  })
  const [reportSchedule, setReportSchedule] = useState({
    daily: false,
    weekly: false,
    monthly: false,
    recipients: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchEmailConfig()
    fetchReportSchedule()
  }, [])

  const fetchEmailConfig = async () => {
    try {
      const response = await axios.get('/api/reports/email-config')
      if (response.data) {
        setEmailConfig({
          email: response.data.email || '',
          appPassword: '', // Never send password back
          senderName: response.data.senderName || ''
        })
      }
    } catch (error) {
      console.error('Error fetching email config:', error)
    }
  }

  const fetchReportSchedule = async () => {
    try {
      const response = await axios.get('/api/reports/schedule')
      if (response.data) {
        setReportSchedule(response.data)
      }
    } catch (error) {
      console.error('Error fetching report schedule:', error)
    }
  }

  const handleSaveEmailConfig = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await axios.post('/api/reports/email-config', emailConfig)
      setMessage({ type: 'success', text: 'Email configuration saved successfully!' })
      // Clear password field after saving
      setEmailConfig(prev => ({ ...prev, appPassword: '' }))
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save email configuration' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await axios.post('/api/reports/schedule', reportSchedule)
      setMessage({ type: 'success', text: 'Report schedule saved successfully!' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save report schedule' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (type) => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await axios.post('/api/reports/generate', { type })
      setMessage({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} report generated and sent!` })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to generate report' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Mail className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
          Reports & Email Configuration
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure email settings and schedule automated reports
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Email Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gmail SMTP Configuration</h3>
        </div>
        
        <form onSubmit={handleSaveEmailConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sender Name
            </label>
            <input
              type="text"
              value={emailConfig.senderName}
              onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
              placeholder="Presales Reports"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This name will appear as the sender in recipient inboxes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gmail Address
            </label>
            <input
              type="email"
              value={emailConfig.email}
              onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gmail App Password
            </label>
            <input
              type="password"
              value={emailConfig.appPassword}
              onChange={(e) => setEmailConfig({ ...emailConfig, appPassword: e.target.value })}
              placeholder="Enter 16-character app password"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Generate an app password from your Google Account settings. 
              <a 
                href="https://myaccount.google.com/apppasswords" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
              >
                Get App Password
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>

      {/* Report Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automated Report Schedule</h3>
        </div>

        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Report Frequency
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportSchedule.daily}
                  onChange={(e) => setReportSchedule({ ...reportSchedule, daily: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Daily Reports (sent every day at 9:00 AM)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportSchedule.weekly}
                  onChange={(e) => setReportSchedule({ ...reportSchedule, weekly: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Weekly Reports (sent every Monday at 9:00 AM)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reportSchedule.monthly}
                  onChange={(e) => setReportSchedule({ ...reportSchedule, monthly: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Monthly Reports (sent on 1st of each month at 9:00 AM)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Recipients
            </label>
            <input
              type="text"
              value={reportSchedule.recipients}
              onChange={(e) => setReportSchedule({ ...reportSchedule, recipients: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Schedule'}
          </button>
        </form>
      </div>

      {/* Manual Report Generation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report Now</h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Generate and send a report immediately to configured recipients
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleGenerateReport('daily')}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Daily Report
          </button>

          <button
            onClick={() => handleGenerateReport('weekly')}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Weekly Report
          </button>

          <button
            onClick={() => handleGenerateReport('monthly')}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Monthly Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reports
