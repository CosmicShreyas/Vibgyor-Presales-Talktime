import React from 'react'
import { Edit2, Trash2, Phone, Building, User, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

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

const LeadsFlatView = ({
  paginatedClients,
  startIndex,
  isAllSelected,
  handleSelectAll,
  user,
  hasLeadError,
  getLeadError,
  selectedLeads,
  handleSelectLead,
  getStatusColor,
  getPriorityColor,
  openModal,
  setDeleteConfirm,
  searchQuery,
  totalPages,
  currentPage,
  setCurrentPage,
  filteredClients,
  endIndex
}) => {
  return (
    <>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {user.role === 'admin' && (
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
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
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client, index) => {
                const hasError = hasLeadError(client._id)
                const errorInfo = getLeadError(client._id)
                const serialNumber = startIndex + index + 1
                const isSelected = selectedLeads.includes(client._id)
                
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
              })
            ) : (
              <tr>
                <td colSpan={user.role === 'admin' ? 11 : 9} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No leads found matching your search' : 'No leads yet'}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} leads
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
    </>
  )
}

export default LeadsFlatView
