import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../services/audit-log.service';
import type { AuditLog } from '../types/audit-log';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui';

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', { action, entityType, dateFrom, dateTo }],
    queryFn: () => auditLogService.getAll({ action, entityType, dateFrom, dateTo }),
  });

  const handleReset = () => {
    setAction('');
    setEntityType('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <>
      <PageHeader title="Audit Log" />

      <main className="max-w-7xl mx-auto py-6 px-6">
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Filter by action"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <input
                  type="text"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Filter by entity type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleReset} variant="secondary" size="sm">
                Reset
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs found</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entityType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entityId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.actor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      
  );
}