// Changed to ../../ to go up two folder levels!
import { createClient } from '../../lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { approveAvatar, rejectAvatar } from './actions'
import { ShieldCheck, Check, X, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard(props: { searchParams: Promise<{ success?: string, error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // 1. Verify this user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Double-check they are actually the Global Admin
  const { data: currentUser } = await supabase
    .from('users')
    .select('is_global_admin')
    .eq('id', user.id)
    .single()

  if (!currentUser?.is_global_admin) {
    redirect('/?error=Unauthorized. You are not a global admin.')
  }

  // 3. Use the Service Role to fetch all users who are waiting for image approval
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: pendingUsers } = await supabaseAdmin
    .from('users')
    .select('id, username, email, pending_avatar_url, avatar_url')
    .not('pending_avatar_url', 'is', null)

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-6 pb-12">
      
      {/* Back Navigation */}
      <div>
        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-orange-600" />
              Global Admin Portal
            </h1>
            <p className="text-gray-500 text-sm mt-1">Review and moderate pending user profile images.</p>
          </div>
        </div>
      </div>

      {searchParams?.success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium">
          {searchParams.success}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        <div className="p-5 bg-gray-950 text-white font-black uppercase tracking-wider text-xs flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-400" />
          Pending Image Approvals ({pendingUsers?.length || 0})
        </div>

        <div className="p-6 md:p-8">
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-600 uppercase tracking-tight">Queue is empty</p>
              <p className="text-xs text-gray-400 mt-1">All user images have been reviewed successfully.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingUsers.map((u: any) => (
                <div key={u.id} className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 shadow-sm flex flex-col hover:border-gray-300 transition-all">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="overflow-hidden">
                      <p className="font-extrabold text-gray-900 truncate">{u.username || 'No Username'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center bg-white rounded-xl border border-gray-100 p-6 mb-5 flex-grow shadow-inner">
                    <img 
                      src={u.pending_avatar_url} 
                      alt="Pending Avatar" 
                      className="h-28 w-28 object-cover rounded-full border-4 border-orange-500 shadow-md"
                    />
                  </div>

                  <div className="flex gap-3 mt-auto">
                    {/* Approve Button */}
                    <form action={approveAvatar} className="flex-1">
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="pending_url" value={u.pending_avatar_url} />
                      <button type="submit" className="w-full flex items-center justify-center gap-1 bg-[#d4ff00] hover:bg-[#bce600] text-black py-2.5 rounded-xl font-black uppercase tracking-wider transition-colors text-xs shadow-sm">
                        <Check className="h-4 w-4" /> Approve
                      </button>
                    </form>

                    {/* Reject Button */}
                    <form action={rejectAvatar} className="flex-1">
                      <input type="hidden" name="user_id" value={u.id} />
                      <button type="submit" className="w-full flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-colors text-xs border border-red-200 shadow-sm">
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </form>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}