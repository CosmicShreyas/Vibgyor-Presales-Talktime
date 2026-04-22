import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Phone, Building, User, Upload, Search, ChevronLeft, ChevronRight, AlertTriangle, X, RefreshCw, Trash, CheckCircle, XCircle, FolderPlus, ChevronDown, ChevronUp, List, Grid, Users } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import ConfirmDialog from './ConfirmDialog'
import CsvImportModal from './CsvImportModal'
import AutoAssignmentModal from './AutoAssignmentModal'
import LeadsGroupedView from './LeadsGroupedView'
import LeadsFlatView from './LeadsFlatView'

const ClientManagement = ({ onUpdate, onSwitchToUnassigned }) => {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, clientId: null, clientName: '' })
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [selectedLeads, setSelectedLeads] = useState([])
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false)
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false)
  const [projectSources, setProjectSources] = useState([])
  const [editingSource, setEditingSource] = useState(null)
  const [sourceFormData, setSourceFormData] = useState({ name: '', description: '' })
  const [savingSource, setSavingSource] = useState(false)
  const [deleteSourceConfirm, setDeleteSourceConfirm] = useState({ isOpen: false, sourceId: null, sourceName: '' })
  const [viewMode, setViewMode] = useState('grouped') // 'grouped' or 'flat'
  const [expandedGroups, setExpandedGroups] = useState({}) // Track which groups are expanded
  const [leadsWithErrors, setLeadsWithErrors] = useState(() => {
    // Load errors from localStorage on mount
    const saved = localStorage.getItem('leadsWithErrors')
    return saved ? JSON.parse(saved) : []
  })
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    assignedTo: '',
    status: 'pending',
    priority: 'medium',
    notes: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    description: '',
    source: '',
    budget: '',
    tags: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      // Check cache for mapping sync
      const lastSyncTime = localStorage.getItem('mappingLeadsLastSync')
      const cachedLeads = localStorage.getItem('mappingLeadsCached')
      const now = Date.now()
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
      
      // Sync mapping leads if cache is expired or doesn't exist (admin only)
      if (user.role === 'admin') {
        if (!lastSyncTime || (now - parseInt(lastSyncTime)) > CACHE_DURATION) {
          await syncMappingLeads()
          localStorage.setItem('mappingLeadsLastSync', now.toString())
          localStorage.setItem('mappingLeadsCached', 'true')
        }
        await fetchUsers()
      }
      
      // Then fetch all clients
      await fetchClients()
      await fetchProjectSources()
    }
    
    initializeData()
  }, [user.role])

  // Save errors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('leadsWithErrors', JSON.stringify(leadsWithErrors))
  }, [leadsWithErrors])

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' })
    }, 4000)
  }

  const syncMappingLeads = async () => {
    try {
      const response = await axios.post('/api/mapping-sync/sync')
      
      if (response.data.success) {
        const { imported, updated, skipped } = response.data
        
        // Update cache timestamp
        localStorage.setItem('mappingLeadsLastSync', Date.now().toString())
        localStorage.setItem('mappingLeadsCached', 'true')
        
        // Show toast notification if any leads were synced
        if (imported > 0 || updated > 0) {
          showToast(
            `Mapping sync: ${imported} new, ${updated} updated, ${skipped} skipped`,
            'success'
          )
        }
      }
    } catch (error) {
      console.error('Error syncing mapping leads:', error)
      // Don't show error toast to avoid annoying users on every page load
      // Only log to console
    }
  }

  const fetchClients = async () => {
    try {
      setRefreshing(true)
      const response = await axios.get('/api/clients')
      setClients(response.data)
      
      // Invalidate mapping cache if data changed
      if (response.data.some(c => c.importMethod === 'mapping')) {
        localStorage.setItem('mappingLeadsLastSync', Date.now().toString())
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive))
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProjectSources = async () => {
    try {
      const response = await axios.get('/api/project-sources')
      setProjectSources(response.data)
    } catch (error) {
      console.error('Error fetching project sources:', error)
    }
  }

  const handleSourceSubmit = async (e) => {
    e.preventDefault()
    setSavingSource(true)

    try {
      if (editingSource) {
        await axios.put(`/api/project-sources/${editingSource._id}`, sourceFormData)
        showToast('Source updated successfully', 'success')
      } else {
        await axios.post('/api/project-sources', sourceFormData)
        showToast('Source created successfully', 'success')
      }
      
      fetchProjectSources()
      setSourceFormData({ name: '', description: '' })
      setEditingSource(null)
    } catch (error) {
      console.error('Error saving source:', error)
      showToast(error.response?.data?.message || 'Failed to save source', 'error')
    } finally {
      setSavingSource(false)
    }
  }

  const handleDeleteSource = async () => {
    try {
      await axios.delete(`/api/project-sources/${deleteSourceConfirm.sourceId}`)
      fetchProjectSources()
      setDeleteSourceConfirm({ isOpen: false, sourceId: null, sourceName: '' })
      showToast('Source deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting source:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete source'
      setDeleteSourceConfirm({ isOpen: false, sourceId: null, sourceName: '' })
      showToast(errorMessage, 'error')
    }
  }

  const openSourceEdit = (source) => {
    setEditingSource(source)
    setSourceFormData({ name: source.name, description: source.description || '' })
  }

  const cancelSourceEdit = () => {
    setEditingSource(null)
    setSourceFormData({ name: '', description: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate phone numbers
      const phoneValidation = validatePhoneNumber(formData.phone)
      if (!phoneValidation.valid) {
        showToast(`Phone number error: ${phoneValidation.message}`, 'error')
        setLoading(false)
        return
      }

      // Validate alternate phone if provided
      if (formData.alternatePhone) {
        const altPhoneValidation = validatePhoneNumber(formData.alternatePhone)
        if (!altPhoneValidation.valid) {
          showToast(`Alternate phone number error: ${altPhoneValidation.message}`, 'error')
          setLoading(false)
          return
        }
      }

      const submitData = { ...formData }
      if (user.role !== 'admin') {
        submitData.assignedTo = user.id
      }

      if (editingClient) {
        await axios.put(`/api/clients/${editingClient._id}`, submitData)
        showToast('Lead updated successfully', 'success')
      } else {
        await axios.post('/api/clients', submitData)
        showToast('Lead created successfully', 'success')
      }
      
      fetchClients()
      onUpdate()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving client:', error)
      showToast(error.response?.data?.message || 'Failed to save lead', 'error')
    } finally {
      setLoading(false)
    }
  }

  const validatePhoneNumber = (phone) => {
    if (!phone) return { valid: false, message: 'Phone number is required' }
    
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length < 10) {
      return { valid: false, message: `Too short (${cleaned.length} digits)` }
    } else if (cleaned.length > 11) {
      return { valid: false, message: `Too long (${cleaned.length} digits)` }
    } else if (cleaned.length === 11) {
      if (cleaned.startsWith('080')) {
        return { valid: true, isLandline: true }
      } else {
        return { valid: false, message: `Invalid 11-digit number (must start with 080)` }
      }
    }
    
    return { valid: true }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/clients/${deleteConfirm.clientId}`)
      fetchClients()
      onUpdate()
      showToast('Lead deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting client:', error)
      showToast('Failed to delete lead', 'error')
    }
  }

  const handleDeleteAll = async () => {
    try {
      if (selectedLeads.length > 0) {
        // Delete selected leads
        await Promise.all(
          selectedLeads.map(clientId =>
            axios.delete(`/api/clients/${clientId}`)
          )
        )
        
        const count = selectedLeads.length
        setSelectedLeads([])
        showToast(`Successfully deleted ${count} lead${count > 1 ? 's' : ''}`, 'success')
      } else {
        // Delete all clients
        await axios.delete('/api/clients/all/delete-all')
        
        // Clear error tracking
        setLeadsWithErrors([])
        localStorage.removeItem('leadsWithErrors')
        
        showToast('All leads deleted successfully', 'success')
      }
      
      fetchClients()
      onUpdate()
      setDeleteAllConfirm(false)
    } catch (error) {
      console.error('Error deleting clients:', error)
      showToast('Failed to delete leads. Please try again.', 'error')
    }
  }

  const handleCsvImport = async (leads, fileName) => {
    setImporting(true)
    setImportResult(null)

    try {
      // Check if this CSV file was imported before
      const existingImport = clients.find(c => 
        c.importMethod === 'csv' && 
        c.csvFileName === fileName
      )
      
      let csvImportId
      if (existingImport) {
        // Reuse the existing CSV Import ID for the same file
        csvImportId = existingImport.csvImportId
        console.log(`📥 Re-importing CSV file "${fileName}" with existing ID: ${csvImportId}`)
      } else {
        // Generate new CSV Import ID for new file
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 6).toUpperCase()
        csvImportId = `CSV-${timestamp}-${random}`
        console.log(`📥 Starting new CSV import with ID: ${csvImportId}`)
      }

      // Ensure "CSV Imports" project source exists
      let csvImportsSource = projectSources.find(s => s.name === 'CSV Imports')
      
      if (!csvImportsSource) {
        try {
          const sourceResponse = await axios.post('/api/project-sources', {
            name: 'CSV Imports',
            description: 'Automatically created for CSV imported leads'
          })
          csvImportsSource = sourceResponse.data
          // Refresh project sources list
          await fetchProjectSources()
        } catch (error) {
          console.error('Error creating CSV Imports source:', error)
          // Continue even if source creation fails
        }
      }

      let successCount = 0
      let failedCount = 0
      const errors = []
      const importedLeadsWithErrors = []
      let unassignedCount = 0

      for (const lead of leads) {
        try {
          // IMPORTANT: NO automatic assignment during import
          // All leads with empty "Assign To" are marked as unassigned
          let assignedToId = user.id // Admin as placeholder only
          let isUnassigned = true // Default to unassigned
          
          // Only assign if CSV explicitly has "Assign To" value
          if (lead.assignTo && lead.assignTo.trim() !== '') {
            // Try to find the employee
            const employee = users.find(u => 
              u.name.toLowerCase() === lead.assignTo.toLowerCase().trim() ||
              u.email.toLowerCase() === lead.assignTo.toLowerCase().trim()
            )
            
            if (employee) {
              // Employee found - assign it
              assignedToId = employee._id
              isUnassigned = false
            } else {
              // Employee not found - keep as unassigned
              console.log(`⚠️ Employee "${lead.assignTo}" not found - marking as unassigned`)
              isUnassigned = true
            }
          } else {
            // No "Assign To" value - mark as unassigned
            isUnassigned = true
            unassignedCount++
          }

          // Prepare lead data for API
          const leadData = {
            name: lead.name,
            phone: lead.phone,
            alternatePhone: lead.alternatePhone || '',
            email: lead.email || '',
            company: lead.company || '',
            address: lead.address || '',
            city: lead.city || '',
            state: lead.state || '',
            description: lead.description || '',
            source: 'CSV Imports',
            budget: lead.budget || '',
            tags: lead.tags || '',
            assignedTo: assignedToId, // Admin as placeholder
            status: lead.status || 'pending',
            priority: 'medium',
            notes: lead.notes || '',
            importMethod: 'csv',
            csvFileName: fileName,
            csvImportId: csvImportId,
            importedAt: new Date(),
            isUnassigned: isUnassigned
          }

          const response = await axios.post('/api/clients', leadData)
          successCount++
          
          // Track leads with validation errors
          if (lead.hasPhoneError || lead.hasAltPhoneError) {
            importedLeadsWithErrors.push({
              id: response.data._id,
              name: lead.name,
              phone: lead.phone,
              hasPhoneError: lead.hasPhoneError,
              phoneErrorMessage: lead.phoneErrorMessage,
              hasAltPhoneError: lead.hasAltPhoneError,
              altPhoneErrorMessage: lead.altPhoneErrorMessage
            })
          }
        } catch (error) {
          failedCount++
          errors.push(`${lead.name}: ${error.response?.data?.message || error.message}`)
        }
      }

      setImportResult({
        success: successCount,
        failed: failedCount,
        errors: errors.slice(0, 10)
      })

      // Store leads with errors for highlighting
      setLeadsWithErrors(importedLeadsWithErrors)

      fetchClients()
      onUpdate()

      setTimeout(() => {
        setShowImportModal(false)
        setImportResult(null)
      }, 3000)
    } catch (error) {
      console.error('Error importing leads:', error)
      setImportResult({
        success: 0,
        failed: leads.length,
        errors: [error.response?.data?.message || 'Failed to import leads']
      })
    } finally {
      setImporting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      assignedTo: user.role === 'admin' ? '' : user.id,
      status: 'pending',
      priority: 'medium',
      notes: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      description: '',
      source: '',
      budget: '',
      tags: ''
    })
    setEditingClient(null)
  }

  const openModal = (client = null) => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        company: client.company || '',
        assignedTo: client.assignedTo._id,
        status: client.status,
        priority: client.priority,
        notes: client.notes || '',
        alternatePhone: client.alternatePhone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        description: client.description || '',
        source: client.source || '',
        budget: client.budget || '',
        tags: client.tags || ''
      })
      setEditingClient(client)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
      'no-response': 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
      'not-interested': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      'qualified': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      'number-inactive': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
      'number-switched-off': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200',
      'on-hold': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      'no-requirement': 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
      'follow-up': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200',
      'disqualified': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      'disconnected': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200',
      'already-finalised': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      // Legacy statuses for backward compatibility
      'contacted': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      'interested': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200',
      'closed': 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200'
    }
    return colors[status] || colors.pending
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200',
      medium: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
      high: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
    }
    return colors[priority] || colors.medium
  }

  // Filter and paginate clients - exclude unassigned leads from main view
  const filteredClients = clients.filter(client => {
    // Exclude unassigned leads from main dashboard
    if (client.isUnassigned === true) {
      return false
    }
    
    const searchLower = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchQuery) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.company && client.company.toLowerCase().includes(searchLower))
    )
  })

  // Count unassigned leads
  const unassignedLeads = filteredClients.filter(client => client.isUnassigned === true)
  const unassignedCount = unassignedLeads.length

  // Create hierarchical grouping structure
  const hierarchicalGroups = {}
  const csvGroups = {} // Group by CSV file (fileName + importId)
  const manualLeads = []
  const brandPartnerGroups = {} // Group by brand partner
  const facebookCampaigns = {}
  const instagramCampaigns = {}
  const mappingLeads = [] // Mapping leads

  filteredClients.forEach(client => {
    // Check if this is a Brand Partner lead
    if (client.source === 'Brand Partners' && client.metadata?.brandPartnerName) {
      const brandPartnerName = client.metadata.brandPartnerName
      const brandPartnerCode = client.metadata.brandPartnerCode || 'Unknown'
      
      if (!brandPartnerGroups[brandPartnerName]) {
        brandPartnerGroups[brandPartnerName] = {
          name: brandPartnerName,
          code: brandPartnerCode,
          leads: []
        }
      }
      brandPartnerGroups[brandPartnerName].leads.push(client)
    }
    // Check if this is a CSV import from client dashboard (not brand partner)
    else if (client.importMethod === 'csv' && client.csvFileName && client.csvImportId && client.source !== 'Brand Partners') {
      // Create a unique key for this CSV file: fileName + importId
      const csvFileKey = `csv-${client.csvFileName}-${client.csvImportId}`
      
      if (!csvGroups[csvFileKey]) {
        csvGroups[csvFileKey] = {
          fileName: client.csvFileName,
          importId: client.csvImportId,
          leads: []
        }
      }
      csvGroups[csvFileKey].leads.push(client)
    } else if (client.importMethod === 'facebook') {
      const campaignId = client.metadata?.facebookCampaignId || 'unknown'
      const campaignName = client.metadata?.facebookCampaignName || 'Unknown Campaign'
      const key = `facebook-campaign-${campaignId}-${campaignName}`
      
      if (!facebookCampaigns[key]) {
        facebookCampaigns[key] = []
      }
      facebookCampaigns[key].push(client)
    } else if (client.importMethod === 'instagram') {
      const campaignId = client.metadata?.facebookCampaignId || 'unknown'
      const campaignName = client.metadata?.facebookCampaignName || 'Unknown Campaign'
      const key = `instagram-campaign-${campaignId}-${campaignName}`
      
      if (!instagramCampaigns[key]) {
        instagramCampaigns[key] = []
      }
      instagramCampaigns[key].push(client)
    } else if (client.importMethod === 'mapping') {
      mappingLeads.push(client)
    } else {
      manualLeads.push(client)
    }
  })

  // Build hierarchical structure for Brand Partners
  if (Object.keys(brandPartnerGroups).length > 0) {
    hierarchicalGroups['brand-partners'] = {
      type: 'parent',
      name: 'Brand Partners',
      subCategories: {}
    }

    // Add each brand partner as a subcategory
    Object.keys(brandPartnerGroups).forEach(brandPartnerName => {
      const brandPartner = brandPartnerGroups[brandPartnerName]
      const key = `bp-${brandPartner.code}`
      
      hierarchicalGroups['brand-partners'].subCategories[key] = {
        name: `${brandPartner.name} (${brandPartner.code})`,
        children: {
          [key]: brandPartner.leads
        }
      }
    })
  }

  // Build hierarchical structure for CSV imports
  if (Object.keys(csvGroups).length > 0) {
    hierarchicalGroups['databases'] = {
      type: 'parent',
      name: 'Databases',
      subCategories: {
        'csv-imports': {
          name: 'CSV Imports',
          children: {}
        }
      }
    }

    // Add each CSV file as a child under CSV Imports
    Object.keys(csvGroups).forEach(csvFileKey => {
      const csvFile = csvGroups[csvFileKey]
      hierarchicalGroups['databases'].subCategories['csv-imports'].children[csvFileKey] = csvFile.leads
    })
  }

  // Add manual leads as single-level group
  if (manualLeads.length > 0) {
    hierarchicalGroups['manual'] = {
      type: 'single',
      leads: manualLeads
    }
  }

  // Add mapping leads as single-level group
  if (mappingLeads.length > 0) {
    hierarchicalGroups['mapping'] = {
      type: 'single',
      leads: mappingLeads
    }
  }

  // Add Facebook campaigns as single-level groups
  Object.keys(facebookCampaigns).forEach(key => {
    hierarchicalGroups[key] = {
      type: 'single',
      leads: facebookCampaigns[key]
    }
  })

  // Add Instagram campaigns as single-level groups
  Object.keys(instagramCampaigns).forEach(key => {
    hierarchicalGroups[key] = {
      type: 'single',
      leads: instagramCampaigns[key]
    }
  })

  // Sort group keys: brand-partners first, then manual, then mapping, then databases, then campaigns
  const sortedGroupKeys = Object.keys(hierarchicalGroups).sort((a, b) => {
    if (a === 'brand-partners') return -1
    if (b === 'brand-partners') return 1
    if (a === 'manual') return -1
    if (b === 'manual') return 1
    if (a === 'mapping') return -1
    if (b === 'mapping') return 1
    if (a === 'databases') return -1
    if (b === 'databases') return 1
    if (a.startsWith('facebook-campaign-') && !b.startsWith('facebook-campaign-')) return -1
    if (b.startsWith('facebook-campaign-') && !a.startsWith('facebook-campaign-')) return 1
    return a.localeCompare(b)
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  // Check if a lead has errors
  const hasLeadError = (clientId) => {
    return leadsWithErrors.some(lead => lead.id === clientId)
  }

  const getLeadError = (clientId) => {
    return leadsWithErrors.find(lead => lead.id === clientId)
  }

  // Multi-select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      if (viewMode === 'grouped') {
        // In grouped mode, select all visible leads from expanded groups
        const visibleLeads = sortedGroupKeys
          .filter(key => expandedGroups[key])
          .flatMap(key => {
            const group = hierarchicalGroups[key]
            if (group.type === 'parent') {
              // For parent groups, get all leads from all children
              const allLeads = []
              Object.keys(group.subCategories).forEach(subKey => {
                Object.keys(group.subCategories[subKey].children).forEach(childKey => {
                  allLeads.push(...group.subCategories[subKey].children[childKey])
                })
              })
              return allLeads
            } else {
              // For single-level groups
              return group.leads
            }
          })
          .map(client => client._id)
        setSelectedLeads(visibleLeads)
      } else {
        setSelectedLeads(paginatedClients.map(client => client._id))
      }
    } else {
      setSelectedLeads([])
    }
  }

  const handleSelectLead = (clientId) => {
    setSelectedLeads(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId)
      } else {
        return [...prev, clientId]
      }
    })
  }

  const handleBulkAssign = async () => {
    if (!bulkAssignTo || selectedLeads.length === 0) {
      showToast('Please select an employee and at least one lead', 'error')
      return
    }

    setBulkAssigning(true)
    try {
      // Update all selected leads - clear isUnassigned flag
      await Promise.all(
        selectedLeads.map(clientId =>
          axios.put(`/api/clients/${clientId}`, { 
            assignedTo: bulkAssignTo,
            isUnassigned: false 
          })
        )
      )

      // Refresh the list
      await fetchClients()
      onUpdate()

      // Clear selection and close modal
      const count = selectedLeads.length
      setSelectedLeads([])
      setShowBulkAssignModal(false)
      setBulkAssignTo('')

      showToast(`Successfully assigned ${count} lead${count > 1 ? 's' : ''}`, 'success')
    } catch (error) {
      console.error('Error bulk assigning leads:', error)
      showToast('Failed to assign leads. Please try again.', 'error')
    } finally {
      setBulkAssigning(false)
    }
  }

  const handleDeleteSourceLeads = async (leads, sourceName) => {
    if (!window.confirm(`Are you sure you want to delete all ${leads.length} lead(s) from "${sourceName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await Promise.all(
        leads.map(lead => axios.delete(`/api/clients/${lead._id}`))
      )
      
      // Clear cache if deleting mapping leads
      if (leads.some(l => l.importMethod === 'mapping')) {
        localStorage.removeItem('mappingLeadsLastSync')
        localStorage.removeItem('mappingLeadsCached')
      }
      
      await fetchClients()
      setSelectedLeads([])
      onUpdate()
      showToast(`Successfully deleted ${leads.length} lead(s) from "${sourceName}"`, 'success')
    } catch (error) {
      console.error('Error deleting source leads:', error)
      showToast('Failed to delete leads', 'error')
    }
  }

  const isAllSelected = paginatedClients.length > 0 && selectedLeads.length === paginatedClients.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {user.role === 'admin' ? 'All Leads' : 'My Leads'}
        </h2>
        {user.role === 'admin' && (
          <div className="flex space-x-3">
            {selectedLeads.length > 0 && (
              <button
                onClick={() => setShowBulkAssignModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                title="Assign selected leads"
              >
                <User className="h-4 w-4 mr-2" />
                Assign ({selectedLeads.length})
              </button>
            )}
            <button
              onClick={() => setShowSourceModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              title="Manage project sources"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Project Sources
            </button>
            <button
              onClick={() => setShowAutoAssignModal(true)}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              title="Configure auto-assignment"
            >
              <Users className="h-4 w-4 mr-2" />
              Auto Assignment
            </button>
            <button
              onClick={fetchClients}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh leads"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              title={selectedLeads.length > 0 ? `Delete ${selectedLeads.length} selected lead${selectedLeads.length > 1 ? 's' : ''}` : "Delete all leads"}
            >
              <Trash className="h-4 w-4 mr-2" />
              {selectedLeads.length > 0 ? `Delete (${selectedLeads.length})` : 'Delete All'}
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
              Add Lead
            </button>
          </div>
        )}
      </div>

      {/* Search Bar and View Mode Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {/* Only show view mode toggle for admin */}
        {user.role === 'admin' && (
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-4 py-2 flex items-center ${
                viewMode === 'grouped'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title="Grouped view"
            >
              <Grid className="h-4 w-4 mr-2" />
              Grouped
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-4 py-2 flex items-center border-l border-gray-300 dark:border-gray-600 ${
                viewMode === 'flat'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title="Flat view"
            >
              <List className="h-4 w-4 mr-2" />
              Flat
            </button>
          </div>
        )}
      </div>

      {/* Warning Banner for Unassigned Leads */}
      {unassignedCount > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                  Unassigned Leads in Staging Area
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                  {unassignedCount} lead(s) are waiting in the staging area and not visible here. Please process them first before viewing assigned leads.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Notify parent to switch to unassigned tab
                      if (onSwitchToUnassigned) {
                        onSwitchToUnassigned()
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Go to Unassigned Leads
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner for Leads with Errors */}
      {leadsWithErrors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Validation Warnings
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {leadsWithErrors.length} lead(s) were imported with phone number validation issues. 
                  These leads are highlighted in yellow below. Click the edit icon to fix the phone numbers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setLeadsWithErrors([])}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Leads Display - Grouped or Flat View */}
      {/* Admin can toggle between grouped and flat view, sales employees always see flat view */}
      {user.role === 'admin' && viewMode === 'grouped' ? (
        <LeadsGroupedView
          sortedGroupKeys={sortedGroupKeys}
          hierarchicalGroups={hierarchicalGroups}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          selectedLeads={selectedLeads}
          setSelectedLeads={setSelectedLeads}
          user={user}
          hasLeadError={hasLeadError}
          getLeadError={getLeadError}
          handleSelectLead={handleSelectLead}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          openModal={openModal}
          setDeleteConfirm={setDeleteConfirm}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onDeleteSourceLeads={handleDeleteSourceLeads}
        />
      ) : (
        <LeadsFlatView
          paginatedClients={paginatedClients}
          startIndex={startIndex}
          isAllSelected={isAllSelected}
          handleSelectAll={handleSelectAll}
          user={user}
          hasLeadError={hasLeadError}
          getLeadError={getLeadError}
          selectedLeads={selectedLeads}
          handleSelectLead={handleSelectLead}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          openModal={openModal}
          setDeleteConfirm={setDeleteConfirm}
          searchQuery={searchQuery}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          filteredClients={filteredClients}
          endIndex={endIndex}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingClient ? 'Edit Lead' : 'Add Lead'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name * <span className="text-xs text-gray-500">({formData.name.length}/100)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone * <span className="text-xs text-gray-500">(10-11 digits)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '')
                      setFormData({ ...formData, phone: value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alternate Phone <span className="text-xs text-gray-500">(10-11 digits)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={15}
                    value={formData.alternatePhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d\s\-\+\(\)]/g, '')
                      setFormData({ ...formData, alternatePhone: value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 9876543210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-xs text-gray-500">({formData.email.length}/100)</span>
                  </label>
                  <input
                    type="email"
                    maxLength={100}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company / Project <span className="text-xs text-gray-500">({formData.company.length}/100)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Company or project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags <span className="text-xs text-gray-500">({formData.tags.length}/100)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., VIP, Hot Lead"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address <span className="text-xs text-gray-500">({formData.address.length}/200)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City <span className="text-xs text-gray-500">({formData.city.length}/50)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="City name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State <span className="text-xs text-gray-500">({formData.state.length}/50)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="State name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select source...</option>
                    {projectSources.map((source) => (
                      <option key={source._id} value={source.name}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Budget <span className="text-xs text-gray-500">({formData.budget.length}/50)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 50L - 1Cr"
                  />
                </div>
                
                {user.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assign To *
                    </label>
                    <select
                      required
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select employee</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lead Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="no-response">No Response</option>
                    <option value="not-interested">Not Interested</option>
                    <option value="qualified">Qualified</option>
                    <option value="number-inactive">Number Inactive</option>
                    <option value="number-switched-off">Number Switched Off</option>
                    <option value="on-hold">On Hold</option>
                    <option value="no-requirement">No Requirement</option>
                    <option value="follow-up">Follow Up</option>
                    <option value="disqualified">Disqualified</option>
                    <option value="disconnected">Disconnected</option>
                    <option value="already-finalised">Already Finalised</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks <span className="text-xs text-gray-500">({formData.description.length}/500)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional remarks about the lead..."
                />
              </div>
              
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
                  {loading ? 'Saving...' : editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleCsvImport}
        users={users}
      />

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assign {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Employee
                </label>
                <select
                  value={bulkAssignTo}
                  onChange={(e) => setBulkAssignTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose an employee...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} will be assigned to the selected employee.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkAssignModal(false)
                    setBulkAssignTo('')
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkAssigning || !bulkAssignTo}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkAssigning ? 'Assigning...' : 'Assign Leads'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Sources Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Manage Project Sources
            </h3>
            
            {/* Add/Edit Form */}
            <form onSubmit={handleSourceSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {editingSource ? 'Edit Source' : 'Add New Source'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={sourceFormData.name}
                    onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Website, Referral"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={sourceFormData.description}
                    onChange={(e) => setSourceFormData({ ...sourceFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {editingSource && (
                  <button
                    type="button"
                    onClick={cancelSourceEdit}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingSource}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingSource ? 'Saving...' : editingSource ? 'Update Source' : 'Add Source'}
                </button>
              </div>
            </form>

            {/* Sources List */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Existing Sources ({projectSources.length})
              </h4>
              
              {projectSources.length > 0 ? (
                <div className="space-y-2">
                  {projectSources.map((source) => (
                    <div
                      key={source._id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </h5>
                        {source.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {source.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => openSourceEdit(source)}
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                          title="Edit source"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteSourceConfirm({ 
                            isOpen: true, 
                            sourceId: source._id, 
                            sourceName: source.name 
                          })}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Delete source"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No sources yet. Add your first source above.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowSourceModal(false)
                  cancelSourceEdit()
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Source Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteSourceConfirm.isOpen}
        onClose={() => setDeleteSourceConfirm({ isOpen: false, sourceId: null, sourceName: '' })}
        onConfirm={handleDeleteSource}
        title="Delete Project Source"
        message={`Are you sure you want to delete "${deleteSourceConfirm.sourceName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, clientId: null, clientName: '' })}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${deleteConfirm.clientName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete All/Selected Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteAllConfirm}
        onClose={() => setDeleteAllConfirm(false)}
        onConfirm={handleDeleteAll}
        title={selectedLeads.length > 0 ? `Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}` : "Delete All Leads"}
        message={
          selectedLeads.length > 0
            ? `Are you sure you want to delete ${selectedLeads.length} selected lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`
            : `Are you sure you want to delete ALL ${clients.length} leads? This action cannot be undone and will permanently remove all lead data.`
        }
        confirmText={selectedLeads.length > 0 ? `Delete ${selectedLeads.length}` : "Delete All"}
        cancelText="Cancel"
        variant="danger"
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            )}
            <p className={`text-sm font-medium ${
              toast.type === 'success' 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {toast.message}
            </p>
            <button
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className={`ml-4 ${
                toast.type === 'success' 
                  ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200' 
                  : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Auto Assignment Modal */}
      <AutoAssignmentModal
        isOpen={showAutoAssignModal}
        onClose={() => setShowAutoAssignModal(false)}
        users={users}
        projectSources={projectSources}
      />
    </div>
  )
}

export default ClientManagement