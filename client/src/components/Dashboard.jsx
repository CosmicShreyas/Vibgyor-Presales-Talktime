import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import UserManagement from './UserManagement'
import ClientManagement from './ClientManagement'
import Statistics from './Statistics'
import Reports from './Reports'
import UnassignedLeads from './UnassignedLeads'
import MappingManagement from './MappingManagement'
import BrandPartnerManagement from './BrandPartnerManagement'
import { Users, Phone, BarChart3, Clock, TrendingUp, Mail, X, Tag, AlertTriangle, Map, Building2 } from 'lucide-react'
import axios from 'axios'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('clients')
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalUsers: 0,
    pendingCalls: 0,
    completedCalls: 0,
    unassignedLeads: 0
  })
  const [showLeadsModal, setShowLeadsModal] = useState(false)
  const [leadsGroupedBySource, setLeadsGroupedBySource] = useState({})

  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-redirect to unassigned leads if there are any
  useEffect(() => {
    if (user.role === 'admin' && stats.unassignedLeads > 0 && activeTab === 'clients') {
      setActiveTab('unassigned')
    }
  }, [stats.unassignedLeads, user.role])

  const fetchStats = async () => {
    try {
      const [clientsRes, usersRes] = await Promise.all([
        axios.get('/api/clients'),
        user.role === 'admin' ? axios.get('/api/users') : Promise.resolve({ data: [] })
      ])
      
      const leads = clientsRes.data
      const users = usersRes.data
      
      // Count unassigned leads
      const unassigned = leads.filter(l => l.isUnassigned === true).length
      
      // Group leads by source
      const grouped = leads.reduce((acc, lead) => {
        const source = lead.source || 'No Source'
        if (!acc[source]) {
          acc[source] = []
        }
        acc[source].push(lead)
        return acc
      }, {})
      setLeadsGroupedBySource(grouped)
      
      setStats({
        totalLeads: leads.length,
        totalUsers: users.length,
        pendingCalls: leads.filter(c => c.status === 'pending' || c.status === 'no-response' || c.status === 'follow-up').length,
        completedCalls: leads.filter(c => ['qualified', 'already-finalised', 'closed'].includes(c.status)).length,
        unassignedLeads: unassigned
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color = 'primary', onClick }) => {
    const colorClasses = {
      primary: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400'
      },
      yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400'
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400'
      }
    }

    const colors = colorClasses[color] || colorClasses.primary

    return (
      <div 
        className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${
          onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${colors.bg}`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Phone} 
          title="Total Leads" 
          value={stats.totalLeads} 
          onClick={() => setShowLeadsModal(true)}
        />
        {user.role === 'admin' && (
          <StatCard icon={Users} title="Employee Members" value={stats.totalUsers} />
        )}
        <StatCard icon={Clock} title="Pending Calls" value={stats.pendingCalls} color="yellow" />
        <StatCard icon={BarChart3} title="Completed" value={stats.completedCalls} color="green" />
      </div>

      {/* Leads Breakdown Modal */}
      {showLeadsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Leads Breakdown
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stats.totalLeads} leads organized by source
                </p>
              </div>
              <button
                onClick={() => setShowLeadsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3">
                {Object.keys(leadsGroupedBySource).sort().map((source) => {
                  const sourceLeads = leadsGroupedBySource[source]
                  const percentage = ((sourceLeads.length / stats.totalLeads) * 100).toFixed(1)
                  
                  return (
                    <div 
                      key={source} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center flex-1">
                        <Tag className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {source}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {percentage}% of total
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white ml-4">
                        {sourceLeads.length}
                      </span>
                    </div>
                  )
                })}

                {Object.keys(leadsGroupedBySource).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No leads found
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: {stats.totalLeads} leads from {Object.keys(leadsGroupedBySource).length} source{Object.keys(leadsGroupedBySource).length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowLeadsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('unassigned')}
                className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === 'unassigned'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Unassigned Leads
                {stats.unassignedLeads > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                    {stats.unassignedLeads}
                  </span>
                )}
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Phone className="h-4 w-4 inline mr-2" />
              Leads
            </button>
            
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statistics'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Statistics
            </button>
            
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Employee Management
                </button>
                
                <button
                  onClick={() => setActiveTab('mapping')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'mapping'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Map className="h-4 w-4 inline mr-2" />
                  Mapping Management
                </button>
                
                <button
                  onClick={() => setActiveTab('brandpartner')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'brandpartner'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Brand Partner Management
                </button>
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reports'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Mail className="h-4 w-4 inline mr-2" />
                  Reports
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-3">
          {activeTab === 'unassigned' && user.role === 'admin' && <UnassignedLeads onProcessComplete={fetchStats} />}
          {activeTab === 'clients' && <ClientManagement onUpdate={fetchStats} onSwitchToUnassigned={() => setActiveTab('unassigned')} />}
          {activeTab === 'statistics' && <Statistics />}
          {activeTab === 'users' && user.role === 'admin' && <UserManagement onUpdate={fetchStats} />}
          {activeTab === 'mapping' && user.role === 'admin' && <MappingManagement />}
          {activeTab === 'brandpartner' && user.role === 'admin' && <BrandPartnerManagement />}
          {activeTab === 'reports' && user.role === 'admin' && <Reports />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard