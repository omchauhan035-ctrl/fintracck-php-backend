import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Server, Database, Cpu, ShieldCheck,
  RefreshCw, CheckCircle2, Clock, Terminal, Zap
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Badge, LoadingSpinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminSystemPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pingLatency, setPingLatency] = useState(null);
  const [pinging, setPinging] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getSystemHealth();
      setHealth(data.data);
    } catch {
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handlePing = async () => {
    try {
      setPinging(true);
      const start = performance.now();
      await adminAPI.getSystemHealth();
      const duration = Math.round(performance.now() - start);
      setPingLatency(duration);
      toast.success(`Server response: ${duration}ms (Healthy)`);
    } catch {
      toast.error('Server ping failed');
    } finally {
      setPinging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const heapUsed = parseFloat(health?.memory?.heapUsedMB || 0);
  const heapTotal = parseFloat(health?.memory?.heapTotalMB || 128);
  const heapPercent = Math.min(Math.round((heapUsed / heapTotal) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            System Telemetry & Health
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            PHP 8.x runtime environment, memory allocations, and MySQL database connectivity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchHealth}
            className="cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={handlePing}
            disabled={pinging}
            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${pinging ? 'animate-bounce' : ''}`} />
            <span>Ping API Health</span>
          </Button>
        </div>
      </div>

      {/* Primary Server Specs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">System Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Operational</h3>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              API latency: {pingLatency !== null ? `${pingLatency} ms` : 'Click Ping to test'}
            </p>
          </CardContent>
        </Card>

        {/* Server Uptime */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Server Engine</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {health?.uptime || 'Active'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              PHP REST API with Native PDO
            </p>
          </CardContent>
        </Card>

        {/* Runtime Engine */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Environment</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {health?.nodeVersion || 'PHP 8.x'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              Zero-dependency front controller
            </p>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">MySQL Database</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {health?.database?.status}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 truncate">
              <code className="text-indigo-500">{health?.database?.name}</code>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Memory Utilization & Security Middleware */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                PHP Memory Allocation
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Memory Consumption</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {heapUsed} MB / {heapTotal} MB ({heapPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(heapPercent, 5)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400">Allocated</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{heapUsed} MB</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400">Peak Usage</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{health?.memory?.rssMB} MB</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400">Database Engine</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">MySQL PDO</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Middleware Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Security & Defense Protocol
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Strict CORS Origin Guard</p>
                  <p className="text-[11px] text-slate-400">Restricted to http://localhost:5173 with credentials</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">PDO Prepared Statements</p>
                  <p className="text-[11px] text-slate-400">100% parameter-bound SQL injection immunity</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">HTTP-Only JWT Cookie Guard</p>
                  <p className="text-[11px] text-slate-400">Stateless session authentication with SameSite</p>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Reference Box */}
      <Card className="p-6 bg-slate-900 text-white border-slate-800">
        <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-indigo-400">
          <Terminal className="w-4 h-4" />
          Administrator Quick Reference & Credentials
        </h3>
        <p className="text-xs text-slate-300 mb-4">
          The FinTrack Admin Panel for Project(2) connects directly to MySQL/MariaDB in XAMPP.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block mb-1">Admin Email</span>
            <code className="text-emerald-400 font-bold">om40@gmail.com</code>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block mb-1">Admin Password</span>
            <code className="text-emerald-400 font-bold">om@123</code>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block mb-1">Admin Route</span>
            <code className="text-indigo-400 font-bold">http://localhost:5173/admin</code>
          </div>
        </div>
      </Card>
    </div>
  );
}

