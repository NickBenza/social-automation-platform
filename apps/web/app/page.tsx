'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Plus, 
  Copy, 
  Check, 
  Clock,
  Zap,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Bot,
  Power,
  PowerOff,
  PauseCircle,
  Loader2,
  Plug
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ConnectModal } from './components/ConnectModal'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types
interface Platform {
  id: string
  name: string
  icon: string
  username: string
  mode: 'off' | 'draft' | 'automate'
  followers: number
  postsThisWeek: number
  engagementRate: number
  lastPost?: string
}

interface DraftPost {
  id: string
  platform: string
  content: string
  confidence: number
  suggestedTime: string
  status: 'pending' | 'approved' | 'posted'
}

interface AgentStatus {
  name: string
  status: 'active' | 'paused' | 'error'
  lastRun: string
  nextRun: string
  tasksCompleted: number
}

interface DashboardData {
  stats: {
    totalFollowers: number
    postsThisWeek: number
    engagementRate: number
    pendingDrafts: number
    tasksCompleted: number
  }
  platforms: Platform[]
  agents: AgentStatus[]
}

// Components
function ModeBadge({ mode }: { mode: Platform['mode'] }) {
  const styles = {
    off: 'bg-gray-100 text-gray-600',
    draft: 'bg-amber-100 text-amber-700',
    automate: 'bg-emerald-100 text-emerald-700'
  }
  
  const labels = {
    off: 'OFF',
    draft: 'DRAFT + CRON',
    automate: 'AUTOMATE'
  }
  
  const icons = {
    off: PowerOff,
    draft: PauseCircle,
    automate: Zap
  }
  
  const Icon = icons[mode]
  
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', styles[mode])}>
      <Icon className="w-3.5 h-3.5" />
      {labels[mode]}
    </span>
  )
}

function StatCard({ label, value, change, icon: Icon, loading }: { label: string; value: string; change?: string; icon: any; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          {loading ? (
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mt-2" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              {change && (
                <p className="text-sm text-emerald-600 mt-1">{change}</p>
              )}
            </>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
}

function PlatformCard({ platform, onConnect }: { platform: Platform; onConnect?: () => void }) {
  const isConnected = platform.mode !== 'off' && platform.username !== ''
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
            {platform.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{platform.name}</h3>
            <p className="text-sm text-gray-500">
              {isConnected ? platform.username : 'Not connected'}
            </p>
          </div>
        </div>
        <ModeBadge mode={platform.mode} />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {isConnected ? platform.followers.toLocaleString() : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Followers</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {isConnected ? platform.postsThisWeek : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Posts This Week</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {isConnected ? `${platform.engagementRate}%` : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Engagement</p>
        </div>
      </div>
      
      {platform.lastPost && isConnected && (
        <p className="text-xs text-gray-400 mt-4">Last post: {platform.lastPost}</p>
      )}
      
      <div className="flex gap-2 mt-4">
        {isConnected ? (
          <>
            <button className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              Configure
            </button>
            <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              View Analytics
            </button>
          </>
        ) : (
          <button 
            onClick={onConnect}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plug className="w-4 h-4" />
            Connect {platform.name}
          </button>
        )}
      </div>
    </div>
  )
}

function DraftCard({ draft }: { draft: DraftPost }) {
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    posted: 'bg-emerald-100 text-emerald-700'
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{draft.platform}</span>
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusColors[draft.status])}>
            {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {draft.suggestedTime}
        </div>
      </div>
      
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 mb-4">
        {draft.content}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">{Math.round(draft.confidence * 100)}% confidence</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={copyToClipboard}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Post Now
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: AgentStatus }) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    paused: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200'
  }
  
  const statusIcons = {
    active: Zap,
    paused: PauseCircle,
    error: AlertCircle
  }
  
  const Icon = statusIcons[agent.status]
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', statusColors[agent.status])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{agent.name}</p>
          <p className="text-xs text-gray-500">Last run: {agent.lastRun} • Next: {agent.nextRun}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">{agent.tasksCompleted}</p>
        <p className="text-xs text-gray-500">tasks done</p>
      </div>
    </div>
  )
}

// Main Dashboard
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [drafts, setDrafts] = useState<DraftPost[]>([])
  const [draftsLoading, setDraftsLoading] = useState(true)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [connectingPlatform, setConnectingPlatform] = useState<"threads" | "linkedin" | "x" | null>(null)
  
  // Hardcoded user ID for demo (in production, get from auth context)
  const userId = "cmmmm5nr80000bmzd5l7n3xtu"
  
  const openConnectModal = (platform: "threads" | "linkedin" | "x") => {
    setConnectingPlatform(platform)
    setConnectModalOpen(true)
  }

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const dashboardData = await response.json()
          setData(dashboardData)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchDrafts = async () => {
      try {
        const response = await fetch('/api/drafts')
        if (response.ok) {
          const draftsData = await response.json()
          setDrafts(draftsData.drafts)
        }
      } catch (error) {
        console.error('Failed to fetch drafts:', error)
      } finally {
        setDraftsLoading(false)
      }
    }

    fetchDashboard()
    fetchDrafts()
  }, [])

  // Default data for when API fails or during loading
  const stats = data?.stats || {
    totalFollowers: 0,
    postsThisWeek: 0,
    engagementRate: 0,
    pendingDrafts: 0,
    tasksCompleted: 0
  }

  const platforms = data?.platforms || []
  const agents = data?.agents || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Social Automation</h1>
                <p className="text-xs text-gray-500">AI-Powered Community Engagement</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Activity className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                NB
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'platforms', label: 'Platforms', icon: Users },
              { id: 'content', label: 'Content Queue', icon: FileText },
              { id: 'agents', label: 'AI Agents', icon: Bot },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Total Followers" 
                value={stats.totalFollowers.toLocaleString()} 
                change="+12% this month"
                icon={Users}
                loading={loading}
              />
              <StatCard 
                label="Posts This Week" 
                value={stats.postsThisWeek.toString()}
                change="On track for goal"
                icon={FileText}
                loading={loading}
              />
              <StatCard 
                label="Avg Engagement" 
                value={`${stats.engagementRate}%`}
                change="+0.8% vs last week"
                icon={TrendingUp}
                loading={loading}
              />
              <StatCard 
                label="AI Tasks Completed" 
                value={stats.tasksCompleted.toString()}
                change="24 in last 24h"
                icon={Bot}
                loading={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Platforms */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Connected Platforms</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openConnectModal("threads")}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <span>🧵</span>
                      Connect Threads
                    </button>
                    <button 
                      onClick={() => openConnectModal("linkedin")}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <span>💼</span>
                      Connect LinkedIn
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platforms.map((platform) => (
                      <PlatformCard 
                        key={platform.id} 
                        platform={platform} 
                        onConnect={() => {
                          const platformKey = platform.name.toLowerCase() as "threads" | "linkedin" | "x"
                          if (platformKey === "threads" || platformKey === "linkedin") {
                            openConnectModal(platformKey)
                          }
                        }}
                      />
                    ))}
                    
                    {/* Add Platform Card */}
                    <div className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl min-h-[240px]">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Plug className="w-6 h-6 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-600">Connect a Platform</span>
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={() => openConnectModal("threads")}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          🧵 Threads
                        </button>
                        <button 
                          onClick={() => openConnectModal("linkedin")}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          💼 LinkedIn
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Agent Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">AI Agents Status</h3>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agents.map((agent) => (
                        <AgentCard key={agent.name} agent={agent} />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Voice Profile */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Voice Profile</h3>
                  </div>
                  <p className="text-sm text-white/80 mb-4">
                    Your AI has analyzed your content to learn your voice and tone.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Tone</span>
                      <span className="font-medium">Casual-Professional</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Style</span>
                      <span className="font-medium">Data-Driven</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Confidence</span>
                      <span className="font-medium">94%</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                    Review & Edit Profile
                  </button>
                </div>
              </div>
            </div>
            
            {/* Recent Drafts */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Drafts</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </button>
              </div>
              {draftsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {drafts.slice(0, 4).map((draft) => (
                    <DraftCard key={draft.id} draft={draft} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'platforms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Platform Management</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => openConnectModal("threads")}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <span>🧵</span>
                  Connect Threads
                </button>
                <button 
                  onClick={() => openConnectModal("linkedin")}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <span>💼</span>
                  Connect LinkedIn
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platforms.map((platform) => (
                  <PlatformCard 
                    key={platform.id} 
                    platform={platform}
                    onConnect={() => {
                      const platformKey = platform.name.toLowerCase() as "threads" | "linkedin" | "x"
                      if (platformKey === "threads" || platformKey === "linkedin") {
                        openConnectModal(platformKey)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Content Queue</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Drafts
                </button>
                <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Scheduled
                </button>
                <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Posted
                </button>
              </div>
            </div>
            {draftsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">AI Agent Control Center</h2>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {agents.map((agent) => (
                  <div key={agent.name} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Bot className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                            agent.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {agent.status === 'active' ? '● Active' : '⏸ Paused'}
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={agent.status === 'active'} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{agent.tasksCompleted}</p>
                        <p className="text-xs text-gray-500">Tasks Done</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{agent.lastRun}</p>
                        <p className="text-xs text-gray-500">Last Run</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{agent.nextRun}</p>
                        <p className="text-xs text-gray-500">Next Run</p>
                      </div>
                    </div>
                    
                    <button className="w-full mt-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                      Configure Agent
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Detailed analytics with engagement tracking, follower growth, and content performance insights are being built.
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* Connect Platform Modal */}
      <ConnectModal
        platform={connectingPlatform}
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        userId={userId}
      />
    </div>
  )
}