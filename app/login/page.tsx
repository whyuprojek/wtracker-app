'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* Pakai ikon kamu sebagai logo */}
            <img src="/favicon.ico" alt="WTracker Logo" className="w-16 h-16 rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke WTracker</h1>
          <p className="text-gray-500 text-sm mt-2">Jurnal Trading Personal Kamu</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#16a34a', // Warna hijau senada dengan logomu
                  brandAccent: '#15803d',
                }
              }
            }
          }}
          providers={[]} // Dikosongkan dulu, biar fokus ke Email & Password
          theme="light"
        />
      </div>
    </div>
  )
}