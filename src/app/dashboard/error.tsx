'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030303] p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#0d0d0f] p-6 sm:p-8 text-center shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center text-[#FF5533] mb-4">
          <AlertCircle size={24} />
        </div>
        
        <h2 className="text-lg font-black text-white">Something Went Wrong</h2>
        <p className="mt-2 text-xs leading-5 text-white/50">
          This dashboard page encountered a temporary issue while loading.
        </p>

        {error?.message && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-mono text-rose-300 break-words text-left">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-[#FF473A] via-[#FF622E] to-[#FF8526] hover:brightness-110 text-white shadow-lg shadow-[#FF5533]/25 transition cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
