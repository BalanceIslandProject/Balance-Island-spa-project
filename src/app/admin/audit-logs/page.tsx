'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, ShieldCheck, Activity, Calendar, User, FileText } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string;
  actor_type: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/affiliates/admin/audit-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-600"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-medium text-neutral-950">
              Audit Logs
            </h1>
            <p className="text-xs text-neutral-500">
              Security trail for partner approvals, commission calculations, and payout records
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:bg-neutral-50 transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck size={28} className="mx-auto text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-700">No Audit Events Recorded Yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Sensitive actions like partner approval, commission reversals, and payouts will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900">{log.actor_id}</span>
                      <span className="text-neutral-400 text-[10px] ml-1.5 uppercase font-mono">
                        ({log.actor_type})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                      {log.target_type}: {log.target_id.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
