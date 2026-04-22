import React from 'react'
import { ChevronDown, ChevronRight, Edit2, Trash2, Phone, Building, User, AlertTriangle, ChevronLeft, ChevronRight as ChevronRightIcon, UserPlus, FileSpreadsheet, Facebook, Instagram, Database, FolderOpen, MapPin, Building2 } from 'lucide-react'

// Function to censor phone number for employees
const censorPhoneNumber = (phone, userRole) => {
  if (userRole === 'admin') {
    return phone // Admin sees full number
  }
  
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length <= 4) {
    return '****' // Too short, just show asterisks
  }
  
  // Show last 4 digits, censor the rest
  const lastFour = digits.slice(-4)
  const censoredPart = '*'.repeat(digits.length - 4)
  
  // Try to maintain original formatting if possible
  if (phone.includes('-')) {
    return `${censoredPart.slice(0, -4)}****-${lastFour}`
  } else if (phone.includes(' ')) {
    return `${censoredPart} ${lastFour}`
  } else {
    return `${censoredPart}${lastFour}`
  }
}

const LeadsGroupedView = ({
  sortedGroupKeys,
  hierarchicalGroups,
  expandedGroups,
  toggleGroup,
  selectedLeads,
  setSelectedLeads,
  user,
  hasLeadError,
  getLeadError,
  handleSelectLead,
  getStatusColor,
  getPriorityColor,
  openModal,
  setDeleteConfirm,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  onDeleteSourceLeads // New prop for deleting source-specific leads
}) => {
  
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
    } else if (groupKey.startsWith('bp-')) {
      // Brand partner group
      return { type: 'Brand Partner', name: groupKey, id: null }
    } else if (groupKey === 'manual') {
      return { type: 'Manual', name: 'Manually Added', id: null }
    } else if (groupKey === 'mapping') {
      return { type: 'Mapping', name: 'Mapping Source', id: null }
    }
    return { type: 'Other', name: groupKey, id: null }
  }
  // Color schemes for different groups
  const getGroupColor = (groupKey, isManual) => {
    if (isManual) {
      return {
        bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        border: 'border-purple-200 dark:border-purple-700',
        hover: 'hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30',
        badge: 'bg-purple-500 text-white',
        icon: 'text-purple-600 dark:text-purple-400'
      }
    }
    
    // Different colors for different CSV files
    const colors = [
      {
        bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        hover: 'hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30',
        badge: 'bg-blue-500 text-white',
        icon: 'text-blue-600 dark:text-blue-400'
      },
      {
        bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        border: 'border-green-200 dark:border-green-700',
        hover: 'hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30',
        badge: 'bg-green-500 text-white',
        icon: 'text-green-600 dark:text-green-400'
      },
      {
        bg: 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
        border: 'border-orange-200 dark:border-orange-700',
        hover: 'hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30',
        badge: 'bg-orange-500 text-white',
        icon: 'text-orange-600 dark:text-orange-400'
      },
      {
        bg: 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
        border: 'border-rose-200 dark:border-rose-700',
        hover: 'hover:from-rose-100 hover:to-red-100 dark:hover:from-rose-900/30 dark:hover:to-red-900/30',
        badge: 'bg-rose-500 text-white',
        icon: 'text-rose-600 dark:text-rose-400'
      },
      {
        bg: 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20',
        border: 'border-indigo-200 dark:border-indigo-700',
        hover: 'hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/30 dark:hover:to-violet-900/30',
        badge: 'bg-indigo-500 text-white',
        icon: 'text-indigo-600 dark:text-indigo-400'
      },
      {
        bg: 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
        border: 'border-teal-200 dark:border-teal-700',
        hover: 'hover:from-teal-100 hover:to-cyan-100 dark:hover:from-teal-900/30 dark:hover:to-cyan-900/30',
        badge: 'bg-teal-500 text-white',
        icon: 'text-teal-600 dark:text-teal-400'
      }
    ]
    
    // Use hash of groupKey to consistently assign colors
    const hash = groupKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
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
                  bgColor: 'bg-purple-50/50 dark:bg-purple-900/10',
                  subBorder: 'border-pink-300 dark:border-pink-700',
                  subGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30',
                  subHoverGradient: 'hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/40 dark:hover:to-rose-900/40',
                  subIconColor: 'text-pink-600 dark:text-pink-400',
                  subTextColor: 'text-pink-900 dark:text-pink-100',
                  subSubTextColor: 'text-pink-700 dark:text-pink-300',
                  subBadgeColor: 'text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-900/50',
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
                  bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
                  subBorder: 'border-green-300 dark:border-green-700',
                  subGradient: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
                  subHoverGradient: 'hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40',
                  subIconColor: 'text-green-600 dark:text-green-400',
                  subTextColor: 'text-green-900 dark:text-green-100',
                  subSubTextColor: 'text-green-700 dark:text-green-300',
                  subBadgeColor: 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50',
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
                        <ParentIcon className={`h-5 w-5 ${colorScheme.iconColor.replace('-600', '-700').replace('-400', '-300')}`} />
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
                
                {/* Level 2: Sub-Categories */}
                {isParentExpanded && (
                  <div className={`${colorScheme.bgColor} p-4 space-y-3`}>
                    {subCategoryKeys.map((subCategoryKey) => {
                      const subCategory = group.subCategories[subCategoryKey]
                      const childKeys = Object.keys(subCategory.children)
                      const subCategoryTotalLeads = childKeys.reduce((sum, key) => sum + subCategory.children[key].length, 0)
                      const isSubCategoryExpanded = expandedGroups[subCategoryKey]
                      
                      return (
                        <div key={subCategoryKey} className={`bg-white dark:bg-gray-800 border-2 ${colorScheme.subBorder} rounded-lg overflow-hidden shadow-sm`}>
                          {/* Sub-Category Header */}
                          <button
                            onClick={() => toggleGroup(subCategoryKey)}
                            className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${colorScheme.subGradient} ${colorScheme.subHoverGradient} transition-all duration-200`}
                          >
                            <div className="flex items-center">
                              {isSubCategoryExpanded ? (
                                <ChevronDown className={`h-5 w-5 ${colorScheme.subIconColor} mr-3`} />
                              ) : (
                                <ChevronRight className={`h-5 w-5 ${colorScheme.subIconColor} mr-3`} />
                              )}
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  {isBrandPartner ? (
                                    <Building2 className={`h-4 w-4 ${colorScheme.subSubTextColor}`} />
                                  ) : (
                                    <FolderOpen className={`h-4 w-4 ${colorScheme.subSubTextColor}`} />
                                  )}
                                  <h4 className={`text-sm font-bold ${colorScheme.subTextColor}`}>
                                    {subCategory.name}
                                  </h4>
                                </div>
                                <p className={`text-xs ${colorScheme.subSubTextColor} ml-6 mt-0.5`}>
                                  {isBrandPartner ? `${subCategoryTotalLeads} lead${subCategoryTotalLeads !== 1 ? 's' : ''}` : `${childKeys.length} file${childKeys.length !== 1 ? 's' : ''} • ${subCategoryTotalLeads} lead${subCategoryTotalLeads !== 1 ? 's' : ''}`}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-sm font-semibold ${colorScheme.subBadgeColor} rounded-md`}>
                              {subCategoryTotalLeads}
                            </span>
                          </button>
                          
                          {/* Level 3: Individual CSV Files */}
                          {isSubCategoryExpanded && (
                            <div className="bg-gray-50 dark:bg-gray-900/30 p-3 space-y-2">
                              {childKeys.map((childKey) => {
                                const groupInfo = getGroupInfo(childKey)
                                const groupLeads = subCategory.children[childKey]
                                const isExpanded = expandedGroups[childKey]
                                
                                // Pagination for this group
                                const totalPages = Math.ceil(groupLeads.length / itemsPerPage)
                                const startIndex = (currentPage - 1) * itemsPerPage
                                const endIndex = startIndex + itemsPerPage
                                const paginatedGroupLeads = groupLeads.slice(startIndex, endIndex)
                                
                                return (
                                  <div key={childKey} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                                    {/* CSV File Header */}
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                                      <button
                                        onClick={() => toggleGroup(childKey)}
                                        className="flex-1 flex items-center hover:opacity-80 transition-opacity"
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
                                      </button>
                                      <div className="flex items-center gap-2">
                                        {user.role === 'admin' && onDeleteSourceLeads && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              onDeleteSourceLeads(groupLeads, groupInfo.name)
                                            }}
                                            className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Delete all leads from this source"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        <span className="px-2 py-0.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
                                          {groupLeads.length}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* CSV File Content - Leads Table */}
                                    {isExpanded && (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {user.role === 'admin' && (
                            <th className="px-3 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={paginatedGroupLeads.every(client => selectedLeads.includes(client._id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLeads(prev => [...new Set([...prev, ...paginatedGroupLeads.map(c => c._id)])])
                                  } else {
                                    setSelectedLeads(prev => prev.filter(id => !paginatedGroupLeads.find(c => c._id === id)))
                                  }
                                }}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                              />
                            </th>
                          )}
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Sr. No.
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Unique ID
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Lead
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contact
                          </th>
                          {user.role === 'admin' && (
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Assigned To
                            </th>
                          )}
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Lead Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Lead Source
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Created Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedGroupLeads.map((client, index) => {
                          const hasError = hasLeadError(client._id)
                          const errorInfo = getLeadError(client._id)
                          const isSelected = selectedLeads.includes(client._id)
                          const serialNumber = startIndex + index + 1
                          
                          return (
                            <tr 
                              key={client._id}
                              className={hasError ? 'bg-yellow-50 dark:bg-yellow-900/10' : isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                            >
                              {user.role === 'admin' && (
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectLead(client._id)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {serialNumber}
                                </div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                  {client.uniqueId || 'N/A'}
                                </code>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                    {hasError && (
                                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                                    )}
                                    {client.name}
                                  </div>
                                  {client.company && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                      <Building className="h-3 w-3 mr-1" />
                                      {client.company}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div>
                                  <div className={`text-sm flex items-center ${hasError && errorInfo?.hasPhoneError ? 'text-yellow-700 dark:text-yellow-300 font-medium' : 'text-gray-900 dark:text-white'}`}>
                                    <Phone className="h-3 w-3 mr-1" />
                                    {censorPhoneNumber(client.phone, user.role)}
                                    {hasError && errorInfo?.hasPhoneError && (
                                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                                        ({errorInfo.phoneErrorMessage})
                                      </span>
                                    )}
                                  </div>
                                  {client.email && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {client.email}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {user.role === 'admin' && (
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white flex items-center">
                                    <User className="h-3 w-3 mr-1" />
                                    {client.assignedTo.name}
                                  </div>
                                </td>
                              )}
                              <td className="px-3 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                                  {client.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(client.priority)}`}>
                                  {client.priority}
                                </span>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {client.source || 'N/A'}
                                </div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {client.importMethod === 'csv' && client.importedAt ? (
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {new Date(client.importedAt).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-500">
                                        CSV Import
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {new Date(client.createdAt).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                          {client.importMethod === 'facebook' ? 'Facebook' : 
                                           client.importMethod === 'instagram' ? 'Instagram' : 
                                           client.importMethod === 'mapping' ? 'Mapping' :
                                           'Manual'}
                                        </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openModal(client)}
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                                    title={hasError ? 'Edit to fix validation errors' : 'Edit lead'}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  {user.role === 'admin' && (
                                    <button
                                      onClick={() => setDeleteConfirm({ 
                                        isOpen: true, 
                                        clientId: client._id, 
                                        clientName: client.name 
                                      })}
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination for this group */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {startIndex + 1} to {Math.min(endIndex, groupLeads.length)} of {groupLeads.length} leads
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
                          <ChevronRightIcon className="h-4 w-4" />
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
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          
          // Handle single-level groups (manual, Facebook, Instagram)
          else {
            const groupLeads = group.leads
            const groupInfo = getGroupInfo(groupKey)
            const isExpanded = expandedGroups[groupKey]
            
            // Determine icon and colors
            let GroupIcon = FileSpreadsheet
            let colorScheme = {
              bg: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800',
              hover: 'hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700',
              border: 'border-gray-200 dark:border-gray-700'
            }
            
            if (groupKey === 'manual') {
              GroupIcon = UserPlus
              colorScheme = {
                bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
                hover: 'hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30',
                border: 'border-purple-200 dark:border-purple-700'
              }
            } else if (groupKey === 'mapping') {
              GroupIcon = MapPin
              colorScheme = {
                bg: 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20',
                hover: 'hover:from-teal-100 hover:to-emerald-100 dark:hover:from-teal-900/30 dark:hover:to-emerald-900/30',
                border: 'border-teal-200 dark:border-teal-700'
              }
            } else if (groupKey.startsWith('facebook-campaign-')) {
              GroupIcon = Facebook
              colorScheme = {
                bg: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
                hover: 'hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30',
                border: 'border-blue-200 dark:border-blue-700'
              }
            } else if (groupKey.startsWith('instagram-campaign-')) {
              GroupIcon = Instagram
              colorScheme = {
                bg: 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
                hover: 'hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30',
                border: 'border-pink-200 dark:border-pink-700'
              }
            }
            
            // Pagination for this group
            const totalPages = Math.ceil(groupLeads.length / itemsPerPage)
            const startIndex = (currentPage - 1) * itemsPerPage
            const endIndex = startIndex + itemsPerPage
            const paginatedGroupLeads = groupLeads.slice(startIndex, endIndex)
            
            return (
              <div key={groupKey} className={`border ${colorScheme.border} rounded-lg overflow-hidden shadow-sm`}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className={`w-full flex items-center justify-between p-4 ${colorScheme.bg} ${colorScheme.hover} transition-all duration-200`}
                >
                  <div className="flex items-center">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {groupInfo.type}: {groupInfo.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 ml-6">
                        {groupLeads.length} lead{groupLeads.length !== 1 ? 's' : ''}
                        {groupInfo.id && groupInfo.id !== 'unknown' && (
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            • ID: {groupInfo.id}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
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
                            {user.role === 'admin' && (
                              <th className="px-3 py-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={paginatedGroupLeads.every(client => selectedLeads.includes(client._id))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLeads(prev => [...new Set([...prev, ...paginatedGroupLeads.map(c => c._id)])])
                                    } else {
                                      setSelectedLeads(prev => prev.filter(id => !paginatedGroupLeads.find(c => c._id === id)))
                                    }
                                  }}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                />
                              </th>
                            )}
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Sr. No.
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Unique ID
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Lead
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Contact
                            </th>
                            {user.role === 'admin' && (
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Assigned To
                              </th>
                            )}
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Lead Status
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Priority
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Lead Source
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Created Date
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {paginatedGroupLeads.map((client, index) => {
                            const hasError = hasLeadError(client._id)
                            const errorInfo = getLeadError(client._id)
                            const isSelected = selectedLeads.includes(client._id)
                            const serialNumber = startIndex + index + 1
                            
                            return (
                              <tr 
                                key={client._id}
                                className={hasError ? 'bg-yellow-50 dark:bg-yellow-900/10' : isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                              >
                                {user.role === 'admin' && (
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectLead(client._id)}
                                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                    />
                                  </td>
                                )}
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {serialNumber}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                    {client.uniqueId || 'N/A'}
                                  </code>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                      {hasError && (
                                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                                      )}
                                      {client.name}
                                    </div>
                                    {client.company && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                        <Building className="h-3 w-3 mr-1" />
                                        {client.company}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div>
                                    <div className={`text-sm flex items-center ${hasError && errorInfo?.hasPhoneError ? 'text-yellow-700 dark:text-yellow-300 font-medium' : 'text-gray-900 dark:text-white'}`}>
                                      <Phone className="h-3 w-3 mr-1" />
                                      {censorPhoneNumber(client.phone, user.role)}
                                      {hasError && errorInfo?.hasPhoneError && (
                                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                                          ({errorInfo.phoneErrorMessage})
                                        </span>
                                      )}
                                    </div>
                                    {client.email && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {client.email}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {user.role === 'admin' && (
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      {client.assignedTo.name}
                                    </div>
                                  </td>
                                )}
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(client.status)}`}>
                                    {client.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(client.priority)}`}>
                                    {client.priority}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {client.source || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {client.importMethod === 'csv' && client.importedAt ? (
                                      <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {new Date(client.importedAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                          CSV Import
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {new Date(client.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                          {client.importMethod === 'facebook' ? 'Facebook' : 
                                           client.importMethod === 'instagram' ? 'Instagram' : 
                                           client.importMethod === 'mapping' ? 'Mapping' :
                                           'Manual'}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openModal(client)}
                                      className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                                      title={hasError ? 'Edit to fix validation errors' : 'Edit lead'}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    {user.role === 'admin' && (
                                      <button
                                        onClick={() => setDeleteConfirm({ 
                                          isOpen: true, 
                                          clientId: client._id, 
                                          clientName: client.name 
                                        })}
                                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination for this group */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Showing {startIndex + 1} to {Math.min(endIndex, groupLeads.length)} of {groupLeads.length} leads
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
                            <ChevronRightIcon className="h-4 w-4" />
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
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No leads yet
        </div>
      )}
    </div>
  )
}

export default LeadsGroupedView

