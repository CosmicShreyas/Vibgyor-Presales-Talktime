import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Upload, Search, ChevronLeft, ChevronRight, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react'
import axios from 'axios'
import ConfirmDialog from './ConfirmDialog'

const MappingManagement = () => {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, userId: null, userName: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [refreshing, setRefreshing] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' })
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMappingUsers()
  }, [])

  const fetchMappingUsers = async () => {
    try {
      setRefreshing(true)
      const response = await axios.get('/api/users')
      // Filter only mapping users
      const mappingUsers = response.data.filter(user => user.role === 'mapping')
      setUsers(mappingUsers)
    } catch (error) {
      console.error('Error fetching mapping users:', error)
      setErrorModal({
        isOpen: true,
        title: 'Failed to Load Mapping Users',
        message: error.response?.data?.message || 'Unable to fetch mapping users. Please try again.'
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userData = { ...formData, role: 'mapping' }
      
      if (editingUser) {
        await axios.put(`/api/users/${editingUser._id}`, userData)
        setSuccessModal({
          isOpen: true,
          title: 'User Updated',
          message: `${formData.name} has been successfully updated.`
        })
      } else {
        const response = await axios.post('/api/users', userData)
        setSuccessModal({
          isOpen: true,
          title: 'User Created',
          message: `${formData.name} has been successfully created with Mapping ID: ${response.data.mappingId}`
        })
      }
      
      fetchMappingUsers()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving mapping user:', error)
      setErrorModal({
        isOpen: true,
        title: editingUser ? 'Failed to Update User' : 'Failed to Create User',
        message: error.response?.data?.message || 'An error occurred while saving the mapping user. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/users/${deleteConfirm.userId}`)
      setSuccessModal({
        isOpen: true,
        title: 'User Deleted',
        message: `${deleteConfirm.userName} has been successfully deleted.`
      })
      fetchMappingUsers()
    } catch (error) {
      console.error('Error deleting mapping user:', error)
      setErrorModal({
        isOpen: true,
        title: 'Failed to Delete User',
        message: error.response?.data?.message || 'Unable to delete the mapping user. Please try again.'
      })
    }
  }

  const handleCsvImport = async (e) => {
    e.preventDefault()
    if (!csvFile) return

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('csvFile', csvFile)

    try {
      const response = await axios.post('/api/users/import-mapping', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setImportResult(response.data)
      fetchMappingUsers()
      setCsvFile(null)
      
      if (response.data.success > 0 && response.data.failed === 0) {
        setSuccessModal({
          isOpen: true,
          title: 'Import Successful',
          message: `Successfully imported ${response.data.success} mapping user${response.data.success > 1 ? 's' : ''}.`
        })
        setTimeout(() => {
          setShowImportModal(false)
          setImportResult(null)
        }, 2000)
      } else if (response.data.failed > 0) {
        setTimeout(() => {
          setImportResult(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      setErrorModal({
        isOpen: true,
        title: 'Import Failed',
        message: error.response?.data?.message || 'Failed to import CSV file. Please check the file format and try again.'
      })
      setImportResult({
        success: 0,
        failed: 0,
        errors: [error.response?.data?.message || 'Failed to import CSV']
      })
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' })
    setEditingUser(null)
  }

  const openModal = (user = null) => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: ''
      })
      setEditingUser(user)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  // Filter and paginate users
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.mappingId && user.mappingId.toLowerCase().includes(searchLower))
    )
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Error Modal Component
  const ErrorModal = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl animate-fadeIn">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
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
                className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 rounded-b-lg flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success Modal Component
  const SuccessModal = ({ isOpen, title, message, onClose }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl animate-fadeIn">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
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
                className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 rounded-b-lg flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mapping Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage mapping team members and their login credentials
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchMappingUsers}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh mapping users"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping User
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search mapping users by name, email, or mapping ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Mapping ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.mappingId ? (
                      <span className="px-2 py-1 text-xs font-mono bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 rounded">
                        {user.mappingId}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Generating...</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(user)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                        title="Edit user"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ 
                          isOpen: true, 
                          userId: user._id, 
                          userName: user.name 
                        })}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No mapping users found matching your search' : 'No mapping users yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} mapping users
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[55]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingUser ? 'Edit Mapping User' : 'Add Mapping User'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  disabled={editingUser}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                )}
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mapping ID
                  </label>
                  <input
                    type="text"
                    value={editingUser.mappingId || 'N/A'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Mapping ID is auto-generated and cannot be changed</p>
                </div>
              )}

              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> A unique Mapping ID (VIB2-XXXX) will be automatically generated for this user.
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[55]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Import Mapping Users from CSV
            </h3>
            
            <form onSubmit={handleCsvImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CSV File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="hidden"
                    id="mapping-csv-file-input"
                    required
                  />
                  <label
                    htmlFor="mapping-csv-file-input"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gray-50 dark:bg-gray-700/50"
                  >
                    <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {csvFile ? csvFile.name : 'Choose CSV file or drag here'}
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  CSV should have columns: name, email, password (Mapping ID will be auto-generated)
                </p>
              </div>

              {importResult && (
                <div className={`p-4 rounded-md ${importResult.errors?.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Import Results:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Successfully imported: {importResult.success || 0}
                  </p>
                  {importResult.failed > 0 && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Failed: {importResult.failed}
                    </p>
                  )}
                  {importResult.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Errors:</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false)
                    setCsvFile(null)
                    setImportResult(null)
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !csvFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null, userName: '' })}
        onConfirm={handleDelete}
        title="Delete Mapping User"
        message={`Are you sure you want to delete "${deleteConfirm.userName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ isOpen: false, title: '', message: '' })}
      />
    </div>
  )
}

export default MappingManagement
