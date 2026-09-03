'use client'

import { useState } from 'react'
import { Trophy, Plus, Search, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createContest, joinContest } from './actions'

export default function ContestHub({ myContests, messages }: any) {
  const [activeTab, setActiveTab] = useState<'my_contests' | 'join' | 'create'>('my_contests')

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-purple-900 text-white p-2.5 rounded-xl shadow">
          <Trophy className="h-6 w-6 text-orange-400" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">Contest Hub</h1>
      </div>

      {/* Error Message */}
      {messages?.error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          {messages.error}
        </div>
      )}

      {/* Tabs Navigation - High-contrast sports aesthetic */}
      <div className="flex space-x-2 bg-gray-900 p-1.5 rounded-2xl shadow-md">
        <button 
          onClick={() => setActiveTab('my_contests')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'my_contests' 
              ? 'bg-[#d4ff00] text-black shadow' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="h-4 w-4" /> My Contests
        </button>
        <button 
          onClick={() => setActiveTab('join')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'join' 
              ? 'bg-[#d4ff00] text-black shadow' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search className="h-4 w-4" /> Join Private
        </button>
        <button 
          onClick={() => setActiveTab('create')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
            activeTab === 'create' 
              ? 'bg-[#d4ff00] text-black shadow' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="h-4 w-4" /> Create Contest
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 min-h-[300px]">
        
        {/* MY CONTESTS TAB */}
        {activeTab === 'my_contests' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase tracking-tight text-gray-900 mb-4">Your Active Contests</h2>
            
            {myContests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <Users className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-gray-900 font-bold text-lg">No contests yet</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-sm mb-4">You haven't joined any prediction leagues. Join an existing one or create your own!</p>
                <button onClick={() => setActiveTab('join')} className="text-purple-700 font-bold uppercase text-xs tracking-wider hover:underline">
                  Find a contest to join &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myContests.map((membership: any) => (
                  <Link 
                    key={membership.contest_id} 
                    href={`/contests/${membership.contest_id}`}
                    className="flex flex-col p-5 border border-gray-200 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group cursor-pointer bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                        {membership.contests.name}
                      </h3>
                      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-extrabold ${membership.role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                        {membership.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 text-sm border-t border-gray-100">
                      <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded text-xs">Key: <span className="font-mono font-bold text-gray-700">{membership.contests.contest_key}</span></span>
                      <span className="flex items-center text-xs font-bold uppercase tracking-wider text-purple-800 group-hover:text-orange-600">
                        Dashboard <ChevronRight className="h-4 w-4 ml-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JOIN CONTEST TAB */}
        {activeTab === 'join' && (
          <div className="max-w-md mx-auto py-4">
            <div className="text-center mb-6">
              <Search className="h-10 w-10 text-orange-600 mx-auto mb-3" />
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">Join a Private Contest</h2>
              <p className="text-gray-500 text-sm mt-1">Enter the 7-character invitation key provided by the contest administrator.</p>
            </div>
            <form action={joinContest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Contest Key *</label>
                <input 
                  type="text" 
                  name="contest_key" 
                  required 
                  placeholder="e.g. btyfwtx" 
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg tracking-widest uppercase bg-gray-50" 
                />
              </div>
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-3.5 font-black uppercase tracking-wider text-sm transition-colors shadow-md">
                Join Contest
              </button>
            </form>
          </div>
        )}

        {/* CREATE CONTEST TAB */}
        {activeTab === 'create' && (
          <div className="max-w-md mx-auto py-4">
            <div className="text-center mb-6">
              <Plus className="h-10 w-10 text-orange-600 mx-auto mb-3" />
              <h2 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">Create a New Contest</h2>
              <p className="text-gray-500 text-sm mt-1">Create your own prediction league and invite your friends to compete.</p>
            </div>
            <form action={createContest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Contest Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g. Office Premier League 24/25" 
                  className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" 
                />
              </div>
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-4 py-3.5 font-black uppercase tracking-wider text-sm transition-colors shadow-md">
                Create & Generate Key
              </button>
              <p className="text-[11px] text-center text-gray-400 mt-4">
                You will automatically become the Admin. You can customize settings after creation.
              </p>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}