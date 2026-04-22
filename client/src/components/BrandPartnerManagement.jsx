import React, { useState, useEffect } from 'react'
import { Building2, Plus, Edit2, Trash2, Search, X, Eye, EyeOff, Upload } from 'lucide-react'
import BrandPartnerCsvImportModal from './BrandPartnerCsvImportModal'
import NotificationModal from './NotificationModal'

const BrandPartnerManagement = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [brandPartners, setBrandPartners] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' })
  const [formData, setFormData] = useState({
    partnerName: '',
    nickName: '',
    contactPerson1: '',
    phoneNo1: '',
    contactPerson2: '',
    phoneNo2: '',
    email: '',
    password: '',
    address: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    pan: '',
    panDocument: null,
    ifscDocument: null,
    remarks: '',
    paymentTerms: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchBrandPartners()
  }, [])

  const fetchBrandPartners = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/brand-partners', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBrandPartners(data)
      }
    } catch (error) {
      console.error('Error fetching brand partners:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Partner Information
    if (!formData.partnerName.trim()) newErrors.partnerName = 'Partner name is required'
    
    // Contact Information
    if (!formData.contactPerson1.trim()) newErrors.contactPerson1 = 'Contact person 1 is required'
    if (!formData.phoneNo1.trim()) {
      newErrors.phoneNo1 = 'Phone number 1 is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNo1)) {
      newErrors.phoneNo1 = 'Enter valid 10-digit mobile number'
    }
    if (formData.phoneNo2 && !/^[6-9]\d{9}$/.test(formData.phoneNo2)) {
      newErrors.phoneNo2 = 'Enter valid 10-digit mobile number'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter valid email address'
    }
    // Password is required only when creating new partner
    if (!editingId) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    // Address
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    
    // Bank Details
    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required'
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required'
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required'
    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required'
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Enter valid IFSC code (e.g., SBIN0001234)'
    }
    
    // PAN validation (required)
    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required'
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) {
      newErrors.pan = 'Enter valid PAN (e.g., ABCDE1234F)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Prepare form data for submission
      const submitData = { ...formData }
      
      // Remove password if editing and password is empty
      if (editingId && !submitData.password) {
        delete submitData.password
      }
      
      // Convert file inputs to base64 if files are selected
      if (formData.panDocument && formData.panDocument instanceof File) {
        submitData.panDocument = await fileToBase64(formData.panDocument)
      }
      if (formData.ifscDocument && formData.ifscDocument instanceof File) {
        submitData.ifscDocument = await fileToBase64(formData.ifscDocument)
      }
      
      const url = editingId 
        ? `http://localhost:5000/api/brand-partners/${editingId}`
        : 'http://localhost:5000/api/brand-partners'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })
      
      if (response.ok) {
        await fetchBrandPartners()
        setShowModal(false)
        resetForm()
        setNotification({
          isOpen: true,
          title: 'Success!',
          message: editingId ? 'Brand partner updated successfully.' : 'Brand partner created successfully.',
          type: 'success'
        })
      } else {
        const error = await response.json()
        setNotification({
          isOpen: true,
          title: 'Error',
          message: error.message || `Failed to ${editingId ? 'update' : 'create'} brand partner.`,
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error saving brand partner:', error)
      setNotification({
        isOpen: true,
        title: 'Error',
        message: `Failed to ${editingId ? 'update' : 'create'} brand partner. Please try again.`,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      partnerName: '',
      nickName: '',
      contactPerson1: '',
      phoneNo1: '',
      contactPerson2: '',
      phoneNo2: '',
      email: '',
      password: '',
      address: '',
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      pan: '',
      panDocument: null,
      ifscDocument: null,
      remarks: '',
      paymentTerms: ''
    })
    setErrors({})
    setShowPassword(false)
    setEditingId(null)
  }

  const handleEdit = (partner) => {
    setFormData({
      partnerName: partner.partnerName || '',
      nickName: partner.nickName || '',
      contactPerson1: partner.contactPerson1 || '',
      phoneNo1: partner.phoneNo1 || '',
      contactPerson2: partner.contactPerson2 || '',
      phoneNo2: partner.phoneNo2 || '',
      email: partner.email || '',
      password: '', // Don't populate password for security
      address: partner.address || '',
      accountHolderName: partner.accountHolderName || '',
      accountNumber: partner.accountNumber || '',
      bankName: partner.bankName || '',
      ifscCode: partner.ifscCode || '',
      pan: partner.pan || '',
      panDocument: null,
      ifscDocument: null,
      remarks: partner.remarks || '',
      paymentTerms: partner.paymentTerms || ''
    })
    setEditingId(partner._id)
    setShowModal(true)
  }

  const handleDeleteClick = (id) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/brand-partners/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchBrandPartners()
        setNotification({
          isOpen: true,
          title: 'Success!',
          message: 'Brand partner deleted successfully.',
          type: 'success'
        })
      } else {
        const error = await response.json()
        setNotification({
          isOpen: true,
          title: 'Error',
          message: error.message || 'Failed to delete brand partner.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error deleting brand partner:', error)
      setNotification({
        isOpen: true,
        title: 'Error',
        message: 'Failed to delete brand partner. Please try again.',
        type: 'error'
      })
    } finally {
      setShowDeleteConfirm(false)
      setDeleteId(null)
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    
    if (files && files.length > 0) {
      // Handle file inputs
      setFormData(prev => ({ ...prev, [name]: files[0] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const filteredPartners = brandPartners.filter(partner =>
    partner.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.partnerCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.contactPerson1?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Brand Partner Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage brand partners and their configurations
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Brand Partner
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search brand partners..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Brand Partners List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Partner Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Partner Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No brand partners found
                  </td>
                </tr>
              ) : (
                filteredPartners.map(partner => (
                  <tr key={partner._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{partner.partnerCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{partner.partnerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{partner.contactPerson1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{partner.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{partner.phoneNo1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${partner.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {partner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(partner)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(partner._id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Brand Partner' : 'Add Brand Partner'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1">
              {/* Partner Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Partner Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Partner Name *</label>
                    <input
                      type="text"
                      name="partnerName"
                      value={formData.partnerName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.partnerName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.partnerName && <p className="text-red-500 text-xs mt-1">{errors.partnerName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nick Name</label>
                    <input
                      type="text"
                      name="nickName"
                      value={formData.nickName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Partner Code</label>
                    <input
                      type="text"
                      value="Auto-generated (e.g., VP001)"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Will be auto-generated on save</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person 1 *</label>
                    <input
                      type="text"
                      name="contactPerson1"
                      value={formData.contactPerson1}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.contactPerson1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.contactPerson1 && <p className="text-red-500 text-xs mt-1">{errors.contactPerson1}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone No 1 *</label>
                    <input
                      type="text"
                      name="phoneNo1"
                      value={formData.phoneNo1}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phoneNo1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.phoneNo1 && <p className="text-red-500 text-xs mt-1">{errors.phoneNo1}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person 2</label>
                    <input
                      type="text"
                      name="contactPerson2"
                      value={formData.contactPerson2}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone No 2</label>
                    <input
                      type="text"
                      name="phoneNo2"
                      value={formData.phoneNo2}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.phoneNo2 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.phoneNo2 && <p className="text-red-500 text-xs mt-1">{errors.phoneNo2}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password {editingId ? '(leave blank to keep current)' : '*'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={editingId ? 'Leave blank to keep current password' : ''}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.accountHolderName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.accountHolderName && <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number *</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="e.g., SBIN0001234"
                      maxLength="11"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.ifscCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN *</label>
                    <input
                      type="text"
                      name="pan"
                      value={formData.pan}
                      onChange={handleChange}
                      placeholder="e.g., ABCDE1234F"
                      maxLength="10"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.pan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    />
                    {errors.pan && <p className="text-red-500 text-xs mt-1">{errors.pan}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Document</label>
                    <input
                      type="file"
                      name="panDocument"
                      onChange={handleChange}
                      accept="image/*,.pdf"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload PAN card image or PDF</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Document</label>
                    <input
                      type="file"
                      name="ifscDocument"
                      onChange={handleChange}
                      accept="image/*,.pdf"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload cancelled cheque or passbook</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                    <textarea
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Brand Partner' : 'Create Brand Partner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <BrandPartnerCsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={fetchBrandPartners}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Brand Partner
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this brand partner? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandPartnerManagement
