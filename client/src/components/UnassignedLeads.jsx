import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Trash2, FileSpreadsheet, Database, FolderOpen, ChevronLeft, CheckCircle, XCircle, AlertTriangle, UserPlus, List, Grid, Building2, RefreshCw } from 'lucide-react'
import AutoAssignmentModal from './AutoAssignmentModal'

const UnassignedLeads = () => {
  const [unassignedLeads, setUnassignedLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [groupPages, setGroupPages] = useState({})
  const [toast, setToast] = useState(null)
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false)
  const [users, setUsers] = useState([])
  const [projectSources, setProjectSources] = useState([])
  const [viewMode, setViewMode] = useState('grouped') // 'grouped' or 'flat'
  const [currentPage, setCurrentPage] = useState(1) // For flat view pagination
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLeadId, setDeleteLeadId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const itemsPerPage = 20

  // Fetch unassigned leads
  useEffect(() => {
    fetchUnassignedLeads()
    fetchUsers()
    fetchProjectSources()
  }, [])

  const fetchUnassignedLeads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients/unassigned', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch unassigned leads')
      }
      
      const data = await response.json()
      setUnassignedLeads(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/clients/unassigned', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to refresh unassigned leads')
      }
      
      const data = await response.json()
      setUnassignedLeads(data)
      showToast('Leads refreshed successfully', 'success')
    } catch (err) {
      showToast('Failed to refresh leads', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive))
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const fetchProjectSources = async () => {
    try {
      const response = await fetch('/api/project-sources', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjectSources(data)
      }
    } catch (err) {
      console.error('Error fetching project sources:', err)
    }
  }

  const handleDeleteLead = async (leadId) => {
    setDeleteLeadId(leadId)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteLeadId) return

    try {
      const response = await fetch(`/api/clients/${deleteLeadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }

      showToast('Lead deleted successfully', 'success')
      fetchUnassignedLeads()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setShowDeleteConfirm(false)
      setDeleteLeadId(null)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const getGroupPage = (groupKey) => {
    return groupPages[groupKey] || 1
  }

  const setGroupPage = (groupKey, page) => {
    setGroupPages(prev => ({
      ...prev,
      [groupKey]: page
    }))
  }

  const getGroupInfo = (groupKey) => {
    if (groupKey.startsWith('csv-')) {
      // Format: csv-{fileName}-{CSV-timestamp-random}
      const withoutPrefix = groupKey.replace('csv-', '')
      const csvIdIndex = withoutPrefix.lastIndexOf('CSV-')
      
      if (csvIdIndex !== -1) {
        const fileName = withoutPrefix.substring(0, csvIdIndex - 1) // -1 to remove the dash before CSV-
        const csvImportId = withoutPrefix.substring(csvIdIndex)
        return { type: 'CSV Import', name: fileName, id: csvImportId }
      }
      return { type: 'CSV Import', name: withoutPrefix, id: null }
    } else if (groupKey.startsWith('facebook-campaign-')) {
      const parts = groupKey.split('-')
      const campaignId = parts[2]
      const campaignName = parts.slice(3).join('-')
      return { type: 'Facebook', name: campaignName, id: campaignId }
    } else if (groupKey.startsWith('instagram-campaign-')) {
      const parts = groupKey.split('-')
      const campaignId = parts[2]
      const campaignName = parts.slice(3).join('-')
      return { type: 'Instagram', name: campaignName, id: campaignId }
    }
    return { type: 'Other', name: groupKey, id: null }
  }

  // Create hierarchical grouping structure
  const hierarchicalGroups = {}
  const csvGroups = {} // Group by CSV file (fileName + importId) - for client dashboard uploads
  const brandPartnerGroups = {} // Group by brand partner name

  unassignedLeads.forEach(lead => {
    const source = lead.source || 'unknown'

    // Check if this is a Brand Partner lead
    if (source === 'Brand Partners' && lead.metadata?.brandPartnerName) {
      const brandPartnerName = lead.metadata.brandPartnerName
      const brandPartnerCode = lead.metadata.brandPartnerCode || 'Unknown'
      
      if (!brandPartnerGroups[brandPartnerName]) {
        brandPartnerGroups[brandPartnerName] = {
          name: brandPartnerName,
          code: brandPartnerCode,
          leads: []
        }
      }
      brandPartnerGroups[brandPartnerName].leads.push(lead)
    }
    // Check if this is a CSV import from client dashboard (not brand partner)
    else if (lead.csvFileName && lead.csvImportId && source !== 'Brand Partners') {
      // Create a unique key for this CSV file: fileName + importId
      const csvFileKey = `csv-${lead.csvFileName}-${lead.csvImportId}`
      
      if (!csvGroups[csvFileKey]) {
        csvGroups[csvFileKey] = {
          fileName: lead.csvFileName,
          importId: lead.csvImportId,
          leads: []
        }
      }
      csvGroups[csvFileKey].leads.push(lead)
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

  // Build hierarchical structure for CSV imports from client dashboard
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

  // Sort group keys (brand-partners first, then databases, then others)
  const sortedGroupKeys = Object.keys(hierarchicalGroups).sort((a, b) => {
    if (a === 'brand-partners') return -1
    if (b === 'brand-partners') return 1
    if (a === 'databases') return -1
    if (b === 'databases') return 1
    return a.localeCompare(b)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading unassigned leads...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Unassigned Leads ({unassignedLeads.length})
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 flex items-center bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh leads"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* View Mode Toggle */}
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
        </div>
      </div>

      {/* Warning Notice */}
      {unassignedLeads.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Action Required: {unassignedLeads.length} Unassigned Lead{unassignedLeads.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                You have {unassignedLeads.length} lead{unassignedLeads.length !== 1 ? 's' : ''} that need to be assigned to employees. 
                Click the "Assign Leads" button to open the auto-assignment menu and distribute these leads to your team. 
                Once assigned, these leads will appear in the main Leads page and this section will be cleared.
              </p>
              <button
                onClick={() => setShowAutoAssignModal(true)}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grouped Leads Display - Three Level Hierarchy */}
      {viewMode === 'grouped' ? (
        <div className="space-y-4">
        {sortedGroupKeys.length > 0 ? (
          sortedGroupKeys.map((groupKey) => {
            const group = hierarchicalGroups[groupKey]
            
            // Handle parent groups (like Brand Partners, Databases)
            if (group.type === 'parent') {
              const subCategoryKeys = Object.keys(group.subCategories)
              const totalLeads = subCategoryKeys.reduce((sum, subKey) => {
                const subCategory = group.subCategories[subKey]
                const childKeys = Object.keys(subCategory.children)
                return sum + childKeys.reduce((subSum, key) => subSum + subCategory.children[key].length, 0)
              }, 0)
              const isParentExpanded = expandedGroups[groupKey]
              
              // Determine styling based on group type
              const isBrandPartner = groupKey === 'brand-partners'
              const colorScheme = isBrandPartner 
                ? {
                    border: 'border-purple-300 dark:border-purple-700',
                    gradient: 'from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30',
                    hoverGradient: 'hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/40 dark:hover:to-violet-900/40',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    textColor: 'text-purple-900 dark:text-purple-100',
                    subTextColor: 'text-purple-700 dark:text-purple-300',
                    badgeColor: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50',
                    icon: Building2
                  }
                : {
                    border: 'border-blue-300 dark:border-blue-700',
                    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
                    hoverGradient: 'hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    textColor: 'text-blue-900 dark:text-blue-100',
                    subTextColor: 'text-blue-700 dark:text-blue-300',
                    badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50',
                    icon: Database
                  }
              
              const ParentIcon = colorScheme.icon
              
              return (
                <div key={groupKey} className={`bg-white dark:bg-gray-800 border-2 ${colorScheme.border} rounded-lg overflow-hidden shadow-md`}>
                  {/* Level 1: Parent Header */}
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className={`w-full flex items-center justify-between p-5 bg-gradient-to-r ${colorScheme.gradient} ${colorScheme.hoverGradient} transition-all duration-200`}
                  >
                    <div className="flex items-center">
                      {isParentExpanded ? (
                        <ChevronDown className={`h-6 w-6 ${colorScheme.iconColor} mr-3`} />
                      ) : (
                        <ChevronRight className={`h-6 w-6 ${colorScheme.iconColor} mr-3`} />
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <ParentIcon className={`h-5 w-5 ${colorScheme.iconColor.replace('text-', 'text-').replace('dark:text-', 'dark:text-').replace('-400', '-300').replace('-600', '-700')}`} />
                          <h3 className={`text-base font-bold ${colorScheme.textColor}`}>
                            {group.name}
                          </h3>
                        </div>
                        <p className={`text-xs ${colorScheme.subTextColor} ml-7 mt-1`}>
                          {subCategoryKeys.length} {isBrandPartner ? 'partner' : 'categor'}{subCategoryKeys.length !== 1 ? (isBrandPartner ? 's' : 'ies') : 'y'} • {totalLeads} total lead{totalLeads !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold ${colorScheme.badgeColor} rounded-md`}>
                      {totalLeads}
                    </span>
                  </button>
                  
                  {/* Level 2: Sub-Categories (Brand Partner Names or CSV Imports) */}
                  {isParentExpanded && (
                    <div className={`${isBrandPartner ? 'bg-purple-50/50 dark:bg-purple-900/10' : 'bg-blue-50/50 dark:bg-blue-900/10'} p-4 space-y-3`}>
                      {subCategoryKeys.map((subCategoryKey) => {
                        const subCategory = group.subCategories[subCategoryKey]
                        const childKeys = Object.keys(subCategory.children)
                        const subCategoryTotalLeads = childKeys.reduce((sum, key) => sum + subCategory.children[key].length, 0)
                        const isSubCategoryExpanded = expandedGroups[subCategoryKey]
                        
                        // For brand partners, we don't need the third level - show leads directly
                        const isBrandPartnerSub = groupKey === 'brand-partners'
                        
                        return (
                          <div key={subCategoryKey} className={`bg-white dark:bg-gray-800 border-2 ${isBrandPartnerSub ? 'border-purple-300 dark:border-purple-700' : 'border-green-300 dark:border-green-700'} rounded-lg overflow-hidden shadow-sm`}>
                            {/* Sub-Category Header */}
                            <button
                              onClick={() => toggleGroup(subCategoryKey)}
                              className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${isBrandPartnerSub ? 'from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/40 dark:hover:to-violet-900/40' : 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40'} transition-all duration-200`}
                            >
                              <div className="flex items-center">
                                {isSubCategoryExpanded ? (
                                  <ChevronDown className={`h-5 w-5 ${isBrandPartnerSub ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'} mr-3`} />
                                ) : (
                                  <ChevronRight className={`h-5 w-5 ${isBrandPartnerSub ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'} mr-3`} />
                                )}
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    {isBrandPartnerSub ? (
                                      <Building2 className={`h-4 w-4 text-purple-700 dark:text-purple-300`} />
                                    ) : (
                                      <FolderOpen className={`h-4 w-4 text-green-700 dark:text-green-300`} />
                                    )}
                                    <h4 className={`text-sm font-bold ${isBrandPartnerSub ? 'text-purple-900 dark:text-purple-100' : 'text-green-900 dark:text-green-100'}`}>
                                      {subCategory.name}
                                    </h4>
                                  </div>
                                  <p className={`text-xs ${isBrandPartnerSub ? 'text-purple-700 dark:text-purple-300' : 'text-green-700 dark:text-green-300'} ml-6 mt-0.5`}>
                                    {subCategoryTotalLeads} lead{subCategoryTotalLeads !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 text-sm font-semibold ${isBrandPartnerSub ? 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50' : 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50'} rounded-md`}>
                                {subCategoryTotalLeads}
                              </span>
                            </button>
                            
                            {/* Show leads directly for brand partners, or show CSV files for databases */}
                            {isSubCategoryExpanded && (
                              isBrandPartnerSub ? (
                                // For brand partners: show leads directly
                                <>
                                  {childKeys.map((childKey) => {
                                    const groupLeads = subCategory.children[childKey]
                                    
                                    // Pagination for this group
                                    const page = getGroupPage(childKey)
                                    const totalPages = Math.ceil(groupLeads.length / itemsPerPage)
                                    const startIndex = (page - 1) * itemsPerPage
                                    const endIndex = startIndex + itemsPerPage
                                    const paginatedLeads = groupLeads.slice(startIndex, endIndex)
                                    
                                    return (
                                      <div key={childKey}>
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                              <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Sr. No.
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Phone
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Email
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Company
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Lead Source
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Imported Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                  Actions
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                              {paginatedLeads.map((lead, index) => (
                                                <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {startIndex + index + 1}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                      {lead.name}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                      {lead.phone}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                      {lead.email || 'N/A'}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                      {lead.company || 'N/A'}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-white">
                                                      {lead.source || 'N/A'}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                      {lead.importedAt ? (
                                                        new Date(lead.importedAt).toLocaleDateString('en-US', { 
                                                          year: 'numeric', 
                                                          month: 'short', 
                                                          day: 'numeric' 
                                                        })
                                                      ) : (
                                                        new Date(lead.createdAt).toLocaleDateString('en-US', { 
                                                          year: 'numeric', 
                                                          month: 'short', 
                                                          day: 'numeric' 
                                                        })
                                                      )}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                      onClick={() => handleDeleteLead(lead._id)}
                                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                                      title="Delete lead"
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                        
                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                              Showing {startIndex + 1} to {Math.min(endIndex, groupLeads.length)} of {groupLeads.length} leads
                                            </div>
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() => setGroupPage(childKey, Math.max(page - 1, 1))}
                                                disabled={page === 1}
                                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                <ChevronLeft className="h-4 w-4" />
                                              </button>
                                              <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Page {page} of {totalPages}
                                              </span>
                                              <button
                                                onClick={() => setGroupPage(childKey, Math.min(page + 1, totalPages))}
                                                disabled={page === totalPages}
                                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                <ChevronRight className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </>
                              ) : (
                                // For databases: show CSV files as third level
                              <div className="bg-gray-50 dark:bg-gray-900/30 p-3 space-y-2">
                                {childKeys.map((childKey) => {
                                  const groupInfo = getGroupInfo(childKey)
                                  const groupLeads = subCategory.children[childKey]
                                  const isExpanded = expandedGroups[childKey]
                                  
                                  // Pagination for this group
                                  const page = getGroupPage(childKey)
                                  const totalPages = Math.ceil(groupLeads.length / itemsPerPage)
                                  const startIndex = (page - 1) * itemsPerPage
                                  const endIndex = startIndex + itemsPerPage
                                  const paginatedLeads = groupLeads.slice(startIndex, endIndex)
                                  
                                  return (
                                    <div key={childKey} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                                      {/* CSV File Header */}
                                      <button
                                        onClick={() => toggleGroup(childKey)}
                                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200"
                                      >
                                        <div className="flex items-center">
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
                                          )}
                                          <div className="text-left">
                                            <div className="flex items-center gap-2">
                                              <FileSpreadsheet className="h-3.5 w-3.5 text-gray-700 dark:text-gray-200" />
                                              <h5 className="text-xs font-semibold text-gray-900 dark:text-white">
                                                {groupInfo.name}
                                              </h5>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 ml-5">
                                              {groupLeads.length} lead{groupLeads.length !== 1 ? 's' : ''}
                                              {groupInfo.id && (
                                                <span className="ml-2 text-gray-500 dark:text-gray-400">
                                                  • {groupInfo.id}
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="px-2 py-0.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
                                          {groupLeads.length}
                                        </span>
                                      </button>
                                      
                                      {/* CSV File Content - Leads Table */}
                                      {isExpanded && (
                                        <>
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                              <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Sr. No.
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Name
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Phone
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Email
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Company
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Lead Source
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Imported Date
                                                  </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {paginatedLeads.map((lead, index) => (
                                                  <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                      {startIndex + index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {lead.name}
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="text-sm text-gray-900 dark:text-white">
                                                        {lead.phone}
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {lead.email || 'N/A'}
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {lead.company || 'N/A'}
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="text-sm text-gray-900 dark:text-white">
                                                        {lead.source || 'N/A'}
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {lead.importedAt ? (
                                                          new Date(lead.importedAt).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                          })
                                                        ) : (
                                                          new Date(lead.createdAt).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                          })
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                      <button
                                                        onClick={() => handleDeleteLead(lead._id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                                        title="Delete lead"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </button>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                          
                                          {/* Pagination */}
                                          {totalPages > 1 && (
                                            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                                Showing {startIndex + 1} to {Math.min(endIndex, groupLeads.length)} of {groupLeads.length} leads
                                              </div>
                                              <div className="flex space-x-2">
                                                <button
                                                  onClick={() => setGroupPage(childKey, Math.max(page - 1, 1))}
                                                  disabled={page === 1}
                                                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                  Page {page} of {totalPages}
                                                </span>
                                                <button
                                                  onClick={() => setGroupPage(childKey, Math.min(page + 1, totalPages))}
                                                  disabled={page === totalPages}
                                                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  <ChevronRight className="h-4 w-4" />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              )
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            
            // Handle single groups (non-CSV sources like Facebook, Instagram, etc.)
            else {
              const groupLeads = group.leads
              const groupInfo = getGroupInfo(groupKey)
              const isExpanded = expandedGroups[groupKey]
              
              // Pagination for this group
              const page = getGroupPage(groupKey)
              const totalPages = Math.ceil(groupLeads.length / itemsPerPage)
              const startIndex = (page - 1) * itemsPerPage
              const endIndex = startIndex + itemsPerPage
              const paginatedLeads = groupLeads.slice(startIndex, endIndex)
              
              return (
              <div key={groupKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200"
                >
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {groupInfo.type}: {groupInfo.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 ml-6">
                        {groupLeads.length} unassigned lead{groupLeads.length !== 1 ? 's' : ''}
                        {groupInfo.id && (
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            • ID: {groupInfo.id}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                    {groupLeads.length}
                  </span>
                </button>
                
                {/* Group Content */}
                {isExpanded && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Sr. No.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Company
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Lead Source
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Imported Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {paginatedLeads.map((lead, index) => (
                            <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {startIndex + index + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {lead.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {lead.phone}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {lead.email || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {lead.company || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {lead.source || 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {lead.importedAt ? (
                                    new Date(lead.importedAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  ) : (
                                    new Date(lead.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleDeleteLead(lead._id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                  title="Delete lead"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Showing {startIndex + 1} to {Math.min(endIndex, groupLeads.length)} of {groupLeads.length} leads
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setGroupPage(groupKey, Math.max(page - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Page {page} of {totalPages}
                          </span>
                          <button
                            onClick={() => setGroupPage(groupKey, Math.min(page + 1, totalPages))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              )
            }
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              All Leads Assigned!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no unassigned leads at the moment. All leads have been processed and assigned to employees.
            </p>
          </div>
        )}
      </div>
      ) : (
        /* Flat View */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {unassignedLeads.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sr. No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Lead Source
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Imported Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {unassignedLeads
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((lead, index) => (
                        <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {lead.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {lead.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {lead.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {lead.company || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {lead.source || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {lead.importedAt ? (
                                new Date(lead.importedAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              ) : (
                                new Date(lead.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteLead(lead._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete lead"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {/* Flat View Pagination */}
              {Math.ceil(unassignedLeads.length / itemsPerPage) > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, unassignedLeads.length)} of {unassignedLeads.length} leads
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {Math.ceil(unassignedLeads.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(unassignedLeads.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(unassignedLeads.length / itemsPerPage)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                All Leads Assigned!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no unassigned leads at the moment. All leads have been processed and assigned to employees.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Auto Assignment Modal */}
      <AutoAssignmentModal
        isOpen={showAutoAssignModal}
        onClose={() => {
          setShowAutoAssignModal(false)
          fetchUnassignedLeads() // Refresh after closing modal
        }}
        users={users}
        projectSources={projectSources}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Lead
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this lead? This action cannot be undone and the lead will be permanently removed from the system.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteLeadId(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
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
          </div>
        </div>
      )}
    </div>
  )
}

export default UnassignedLeads

