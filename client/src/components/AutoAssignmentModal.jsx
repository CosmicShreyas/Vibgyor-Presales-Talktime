import React, { useState, useEffect } from 'react'
import { X, Users, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

const AutoAssignmentModal = ({ isOpen, onClose, users, projectSources = [] }) => {
  const [settings, setSettings] = useState(null)
  const [excludedEmployees, setExcludedEmployees] = useState([])
  const [sourceAssignments, setSourceAssignments] = useState([])
  const [csvFileAssignments, setCsvFileAssignments] = useState([])
  const [csvFiles, setCsvFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultMessage, setResultMessage] = useState({ type: '', title: '', message: '' })

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
      fetchCsvFiles()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/auto-assignment')
      setSettings(response.data)
      setExcludedEmployees(response.data.excludedEmployees.map(e => e._id))
      setSourceAssignments(response.data.sourceAssignments || [])
      setCsvFileAssignments(response.data.csvFileAssignments || [])
    } catch (error) {
      console.error('Error fetching auto-assignment settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCsvFiles = async () => {
    try {
      const response = await axios.get('/api/auto-assignment/csv-files')
      setCsvFiles(response.data)
    } catch (error) {
      console.error('Error fetching CSV files:', error)
    }
  }

  const showResult = (type, title, message) => {
    setResultMessage({ type, title, message })
    setShowResultModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put('/api/auto-assignment', {
        excludedEmployees,
        sourceAssignments,
        csvFileAssignments
      })
      showResult('success', 'Settings Saved', 'Auto-assignment settings have been saved successfully.')
    } catch (error) {
      console.error('Error saving auto-assignment settings:', error)
      showResult('error', 'Save Failed', error.response?.data?.message || 'Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleProcessDocuments = async () => {
    setSaving(true)
    try {
      // First save the settings
      await axios.put('/api/auto-assignment', {
        excludedEmployees,
        sourceAssignments,
        csvFileAssignments
      })

      // Then trigger the assignment process
      const response = await axios.post('/api/auto-assignment/process-unassigned')
      
      if (response.data.success) {
        const { assignedCount, failedCount } = response.data
        const message = failedCount > 0 
          ? `Successfully assigned ${assignedCount} lead(s). ${failedCount} lead(s) failed to assign.`
          : `Successfully assigned ${assignedCount} lead(s).`
        
        showResult('success', 'Processing Complete', message)
        
        // Refresh page after showing success
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        showResult('error', 'No Leads to Process', 'No unassigned leads found to process.')
      }
    } catch (error) {
      console.error('Error processing documents:', error)
      showResult('error', 'Processing Failed', error.response?.data?.message || 'Failed to process documents. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleEmployee = (employeeId) => {
    setExcludedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const isEmployeeExcluded = (employeeId) => {
    return excludedEmployees.includes(employeeId)
  }

  const handleSourceAssignment = (sourceName, employeeId) => {
    setSourceAssignments(prev => {
      const existing = prev.find(sa => sa.sourceName === sourceName)
      if (existing) {
        if (employeeId === '') {
          // Remove assignment
          return prev.filter(sa => sa.sourceName !== sourceName)
        } else {
          // Update assignment
          return prev.map(sa => 
            sa.sourceName === sourceName 
              ? { ...sa, assignedTo: employeeId }
              : sa
          )
        }
      } else {
        // Add new assignment
        if (employeeId !== '') {
          return [...prev, { sourceName, assignedTo: employeeId }]
        }
        return prev
      }
    })
  }

  const getSourceAssignment = (sourceName) => {
    const assignment = sourceAssignments.find(sa => sa.sourceName === sourceName)
    return assignment?.assignedTo?._id || assignment?.assignedTo || ''
  }

  const handleCsvFileAssignment = (csvFileName, employeeId) => {
    setCsvFileAssignments(prev => {
      const existing = prev.find(ca => ca.csvFileName === csvFileName)
      if (existing) {
        if (employeeId === '') {
          // Remove assignment
          return prev.filter(ca => ca.csvFileName !== csvFileName)
        } else {
          // Update assignment
          return prev.map(ca => 
            ca.csvFileName === csvFileName 
              ? { ...ca, assignedTo: employeeId }
              : ca
          )
        }
      } else {
        // Add new assignment
        if (employeeId !== '') {
          return [...prev, { csvFileName, assignedTo: employeeId }]
        }
        return prev
      }
    })
  }

  const getCsvFileAssignment = (csvFileName) => {
    const assignment = csvFileAssignments.find(ca => ca.csvFileName === csvFileName)
    return assignment?.assignedTo?._id || assignment?.assignedTo || ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Auto Assignment Settings
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  How to Use Auto Assignment
                </h4>
                <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Import your CSV files (with or without "Assign To" column)</li>
                  <li>Configure assignments below (CSV file-specific or round-robin)</li>
                  <li>Click "Process Documents" to assign all unassigned leads</li>
                </ol>
              </div>

              {/* Employee List */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Employee Availability
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Toggle employees on/off for auto-assignment. Disabled employees will be skipped in the rotation.
                </p>
                
                <div className="space-y-2">
                  {users.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive).map((user) => {
                    const isExcluded = isEmployeeExcluded(user._id)
                    return (
                      <div
                        key={user._id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isExcluded
                            ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            isExcluded ? 'bg-gray-400' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleEmployee(user._id)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            isExcluded
                              ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isExcluded ? 'Disabled' : 'Active'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {users.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No active employees found
                  </p>
                )}
              </div>

              {/* Source-Wise Assignment */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Source-Specific Assignments
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Assign specific sources to specific employees. These take priority over round-robin assignment.
                </p>
                
                <div className="space-y-2">
                  {projectSources.map((source) => (
                    <div
                      key={source._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </p>
                        {source.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {source.description}
                          </p>
                        )}
                      </div>
                      <select
                        value={getSourceAssignment(source.name)}
                        onChange={(e) => handleSourceAssignment(source.name, e.target.value)}
                        className="ml-4 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Auto Assign (default)</option>
                        {users.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive).map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {projectSources.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No project sources found. Create sources first to assign them.
                  </p>
                )}
              </div>

              {/* CSV File-Wise Assignment */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  CSV File-Specific Assignments
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Assign specific CSV files to specific employees. These take highest priority over source and round-robin assignments.
                </p>
                
                <div className="space-y-2">
                  {csvFiles.map((csvFile) => (
                    <div
                      key={csvFile}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                          {csvFile}
                        </p>
                      </div>
                      <select
                        value={getCsvFileAssignment(csvFile)}
                        onChange={(e) => handleCsvFileAssignment(csvFile, e.target.value)}
                        className="ml-4 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Auto Assign (default)</option>
                        {users.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive).map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {csvFiles.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No CSV files imported yet. Import CSV files to assign them.
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Assignment Priority
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Priority 1: CSV file-specific assignments (highest priority)</li>
                  <li>• Priority 2: Source-specific assignments</li>
                  <li>• Priority 3: Round-robin assignment (if no specific assignment)</li>
                  <li>• Disabled employees are automatically skipped in round-robin</li>
                  <li>• Round-robin continues from where it left off</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={handleProcessDocuments}
              disabled={saving || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Processing...' : 'Process Documents'}
            </button>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              resultMessage.type === 'success' 
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center">
                {resultMessage.type === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                )}
                <h3 className={`text-lg font-semibold ${
                  resultMessage.type === 'success'
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {resultMessage.title}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowResultModal(false)
                  if (resultMessage.type === 'success' && resultMessage.title === 'Settings Saved') {
                    onClose()
                  }
                }}
                className={`${
                  resultMessage.type === 'success'
                    ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
                    : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300">
                {resultMessage.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowResultModal(false)
                  if (resultMessage.type === 'success' && resultMessage.title === 'Settings Saved') {
                    onClose()
                  }
                }}
                className={`px-4 py-2 rounded-md ${
                  resultMessage.type === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutoAssignmentModal
