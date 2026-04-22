import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Calendar, Filter, Clock, PhoneOff, ThumbsDown, CheckCircle, PhoneMissed, Power, Pause, XCircle, CalendarCheck, Ban, PhoneForwarded, CheckCheck, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const Statistics = () => {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [projectSources, setProjectSources] = useState([])
  const [filterType, setFilterType] = useState('all') // all, employee, dateRange, source
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedSource, setSelectedSource] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [clientsRes, usersRes, sourcesRes] = await Promise.all([
        axios.get('/api/clients'),
        user.role === 'admin' ? axios.get('/api/users') : Promise.resolve({ data: [] }),
        axios.get('/api/project-sources')
      ])
      
      setClients(clientsRes.data)
      setUsers(usersRes.data.filter(u => (u.role === 'sales' || u.role === 'mapping') && u.isActive))
      setProjectSources(sourcesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter clients based on selected filters
  const getFilteredClients = () => {
    let filtered = [...clients]

    // For employees, always filter to show only their own leads
    if (user.role !== 'admin') {
      filtered = filtered.filter(c => c.assignedTo._id === user.id)
    }

    // Filter by employee (admin only)
    if (filterType === 'employee' && selectedEmployee) {
      filtered = filtered.filter(c => c.assignedTo._id === selectedEmployee)
    }

    // Filter by source
    if (filterType === 'source' && selectedSource) {
      filtered = filtered.filter(c => c.source === selectedSource)
    }

    // Always apply date range filter if dates are provided
    if (dateFrom || dateTo) {
      filtered = filtered.filter(c => {
        const createdDate = new Date(c.createdAt)
        
        // If both dates provided
        if (dateFrom && dateTo) {
          const fromDate = new Date(dateFrom)
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999) // Include the entire end date
          return createdDate >= fromDate && createdDate <= toDate
        }
        
        // If only from date provided
        if (dateFrom && !dateTo) {
          const fromDate = new Date(dateFrom)
          return createdDate >= fromDate
        }
        
        // If only to date provided
        if (!dateFrom && dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999)
          return createdDate <= toDate
        }
        
        return true
      })
    }

    return filtered
  }

  const filteredClients = getFilteredClients()

  // Get sources from project sources (only active/existing sources)
  const activeSources = projectSources.map(s => s.name).sort((a, b) => a.localeCompare(b))

  // Calculate statistics for each status
  const statusStats = [
    {
      key: 'pending',
      label: 'Pending',
      color: 'bg-amber-400 dark:bg-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: Clock
    },
    {
      key: 'no-response',
      label: 'No Response',
      color: 'bg-slate-400 dark:bg-slate-500',
      bgLight: 'bg-slate-50 dark:bg-slate-900/20',
      textColor: 'text-slate-700 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
      icon: PhoneOff
    },
    {
      key: 'not-interested',
      label: 'Not Interested',
      color: 'bg-rose-400 dark:bg-rose-500',
      bgLight: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-700 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-800',
      icon: ThumbsDown
    },
    {
      key: 'qualified',
      label: 'Qualified',
      color: 'bg-emerald-400 dark:bg-emerald-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle
    },
    {
      key: 'number-inactive',
      label: 'Number Inactive',
      color: 'bg-orange-400 dark:bg-orange-500',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
      icon: PhoneMissed
    },
    {
      key: 'number-switched-off',
      label: 'Number Switched Off',
      color: 'bg-pink-400 dark:bg-pink-500',
      bgLight: 'bg-pink-50 dark:bg-pink-900/20',
      textColor: 'text-pink-700 dark:text-pink-400',
      borderColor: 'border-pink-200 dark:border-pink-800',
      icon: Power
    },
    {
      key: 'on-hold',
      label: 'On Hold',
      color: 'bg-sky-400 dark:bg-sky-500',
      bgLight: 'bg-sky-50 dark:bg-sky-900/20',
      textColor: 'text-sky-700 dark:text-sky-400',
      borderColor: 'border-sky-200 dark:border-sky-800',
      icon: Pause
    },
    {
      key: 'no-requirement',
      label: 'No Requirement',
      color: 'bg-gray-400 dark:bg-gray-500',
      bgLight: 'bg-gray-50 dark:bg-gray-900/20',
      textColor: 'text-gray-700 dark:text-gray-400',
      borderColor: 'border-gray-200 dark:border-gray-700',
      icon: XCircle
    },
    {
      key: 'follow-up',
      label: 'Follow Up',
      color: 'bg-indigo-400 dark:bg-indigo-500',
      bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      icon: CalendarCheck
    },
    {
      key: 'disqualified',
      label: 'Disqualified',
      color: 'bg-red-400 dark:bg-red-500',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: Ban
    },
    {
      key: 'disconnected',
      label: 'Disconnected',
      color: 'bg-fuchsia-400 dark:bg-fuchsia-500',
      bgLight: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
      textColor: 'text-fuchsia-700 dark:text-fuchsia-400',
      borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
      icon: PhoneForwarded
    },
    {
      key: 'already-finalised',
      label: 'Already Finalised',
      color: 'bg-teal-400 dark:bg-teal-500',
      bgLight: 'bg-teal-50 dark:bg-teal-900/20',
      textColor: 'text-teal-700 dark:text-teal-400',
      borderColor: 'border-teal-200 dark:border-teal-800',
      icon: CheckCheck
    }
  ]

  const getStatusCount = (statusKey) => {
    return filteredClients.filter(c => c.status === statusKey).length
  }

  const totalLeads = filteredClients.length
  const getPercentage = (count) => {
    return totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
            {user.role === 'admin' ? 'Lead Statistics' : 'My Statistics'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {user.role === 'admin' 
              ? 'Overview of lead status distribution' 
              : 'Overview of your assigned leads status distribution'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          {(filterType !== 'all' || selectedEmployee || selectedSource || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setFilterType('all')
                setSelectedEmployee('')
                setSelectedSource('')
                setDateFrom('')
                setDateTo('')
              }}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter By
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setSelectedEmployee('')
                setSelectedSource('')
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Leads</option>
              {user.role === 'admin' && <option value="employee">By Employee</option>}
              <option value="source">By Source</option>
            </select>
          </div>

          {/* Employee Filter */}
          {filterType === 'employee' && user.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Employees</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Source Filter */}
          {filterType === 'source' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Source
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Sources</option>
                {activeSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          )}

          {/* From Date - Always visible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* To Date - Always visible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalLeads}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Qualified</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {getStatusCount('qualified')}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                {getStatusCount('pending')}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Follow Up</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {getStatusCount('follow-up')}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Lead Status Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {statusStats.map(status => {
            const count = getStatusCount(status.key)
            const percentage = getPercentage(count)
            const IconComponent = status.icon
            
            return (
              <div
                key={status.key}
                className={`${status.bgLight} rounded-lg p-4 border ${status.borderColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${status.bgLight}`}>
                    <IconComponent className={`h-6 w-6 ${status.textColor}`} />
                  </div>
                  <span className={`text-2xl font-bold ${status.textColor}`}>
                    {count}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {status.label}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {percentage}% of total
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`${status.color} h-1.5 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Additional Info */}
      {(user.role !== 'admin' || filterType !== 'all' || (dateFrom && dateTo)) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> 
            {user.role !== 'admin' && ' Showing statistics for your assigned leads only.'}
            {user.role === 'admin' && ' Statistics are filtered based on your selection.'}
            {filterType === 'employee' && selectedEmployee && ` Showing data for ${users.find(u => u._id === selectedEmployee)?.name}.`}
            {filterType === 'source' && selectedSource && ` Showing data for source: ${selectedSource}.`}
            {dateFrom && dateTo && ` Date range: ${dateFrom} to ${dateTo}.`}
            {dateFrom && !dateTo && ` Showing data from ${dateFrom} onwards.`}
            {!dateFrom && dateTo && ` Showing data up to ${dateTo}.`}
          </p>
        </div>
      )}
    </div>
  )
}

export default Statistics
