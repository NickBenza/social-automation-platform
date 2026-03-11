'use client'

import { useState } from 'react'
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
  PauseCircle
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

// Mock Data
const platforms: Platform[] = [
  {
    id: '1',
    name: 'Threads',
    icon: '🧵',
    username: '@glade_runner85',
    mode: 'draft',
    followers: 390,
    postsThisWeek: 12,
    engagementRate: 4.2,
    lastPost: '2 hours ago'
  },
  {
    id: '2',
    name: 'LinkedIn',
    icon: '💼',
    username: 'Nick Benza',
    mode: 'automate',
    followers: 14757,
    postsThisWeek: 8,
    engagementRate: 3.8,
    lastPost: '1 hour ago'
  },
  {
    id: '3',
    name: 'X',
    icon: '𝕏',
    username: '@aiHiringRadar',
    mode: 'off',
    followers: 0,
    postsThisWeek: 0,
    engagementRate: 0,
  }
]

const drafts: DraftPost[] = [
  {
    id: '1',
    platform: 'Threads',
    content: 'sitting in the lodge at 4pm watching people ski past in jeans like that\'s normal behavior\n\nsir this is a double black diamond not a fashion show!!!\n\nanyway the beer is cold and my legs are dead!!!',
    confidence: 0.92,
    suggestedTime: '6:30 PM',
    status: 'pending'
  },
  {
    id: '2',
    platform: 'LinkedIn',
    content: 'The best candidates never apply through your ATS.\n\nAfter 14 years in recruiting, I\'ve noticed a pattern: the people companies actually want are rarely the ones flooding their job boards...',
    confidence: 0.89,
    suggestedTime: '8:00 AM',
    status: 'approved'
  }
]

const agents: AgentStatus[] = [
  {
    name: 'Content Generator',
    status: 'active',
    lastRun: '2 hours ago',
    nextRun: 'in 4 hours',
    tasksCompleted: 24
  },
  {
    name: 'Engagement Manager',
    status: 'active',
    lastRun: '30 mins ago',
    nextRun: 'in 30 mins',
    tasksCompleted: 156
  },
  {
    name: 'Trend Scanner',
    status: 'active',
    lastRun: '1 hour ago',
    nextRun: 'in 3 hours',
    tasksCompleted: 18
  },
  {
    name: 'Analytics Reporter',
    status: 'paused',
    lastRun: '5 days ago',
    nextRun: 'Monday 8:00 AM',
    tasksCompleted: 4
  }
]

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

function StatCard({ label, value, change, icon: Icon }: { label: string; value: string; change?: string; icon: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-emerald-600 mt-1">{change}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  )
}

function PlatformCard({ platform }: { platform: Platform }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
            {platform.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{platform.name}</h3>
            <p className="text-sm text-gray-500">{platform.username}</p>
          </div>
        </div>
        <ModeBadge mode={platform.mode} />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p className="text-2xl font-bold text-gray-900">{platform.followers.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Followers</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{platform.postsThisWeek}</p>
          <p className="text-xs text-gray-500 mt-0.5">Posts This Week</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{platform.engagementRate}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Engagement</p>
        </div>
      </div>
      
      {platform.lastPost && (
        <p className="text-xs text-gray-400 mt-4">Last post: {platform.lastPost}</p>
      )}
      
      <div className="flex gap-2 mt-4">
        <button className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
          Configure
        </button>
        <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
          View Analytics
        </button>
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
                value="15,147" 
                change="+12% this month"
                icon={Users}
              />
              <StatCard 
                label="Posts This Week" 
                value="20"
                change="On track for goal"
                icon={FileText}
              />
              <StatCard 
                label="Avg Engagement" 
                value="4.1%"
                change="+0.8% vs last week"
                icon={TrendingUp}
              />
              <StatCard 
                label="AI Tasks Completed" 
                value="202"
                change="24 in last 24h"
                icon={Bot}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Platforms */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Connected Platforms</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Connect Platform
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {platforms.map((platform) => (
                    <PlatformCard key={platform.id} platform={platform} />
                  ))}
                  
                  {/* Add Platform Card */}
                  <button className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors min-h-[240px]">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-600">Connect New Platform</span>
                    <span className="text-sm text-gray-400">X, Instagram, TikTok, and more</span>
                  </button>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Agent Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">AI Agents Status</h3>
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <AgentCard key={agent.name} agent={agent} />
                    ))}
                  </div>
                </div>
                
                {/* Voice Profile */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className="font-semibold">Voice Profile</h3>
                  </div>
                  <p className="text-sm text-white/80 mb-4">
                    Your AI has analyzed 147 posts to learn your voice and tone.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {drafts.map((draft) => (
                  <DraftCard key={draft.id} draft={draft} />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'platforms' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Platform Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform) => (
                <PlatformCard key={platform.id} platform={platform} />
              ))}
            </div>
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
            <div className="space-y-4">
              {drafts.map((draft) => (
                <DraftCard key={draft.id} draft={draft} />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">AI Agent Control Center</h2>
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
    </div>
  )
}