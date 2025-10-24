import { BarChart3, Mail, Inbox, Clock, TrendingUp } from 'lucide-react';
import { getStats, getTopServices, formatTime } from '../utils/stats';

export function StatsPanel({ onClose }) {
  const stats = getStats();
  const topServices = getTopServices(5);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-primary-500/20 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary-400" />
              </div>
              Tus Estadísticas
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card p-4 bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-primary-400" />
                <span className="text-sm text-slate-400">Emails Generados</span>
              </div>
              <div className="text-3xl font-bold text-primary-400">
                {stats.emailsGenerated}
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Inbox className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-400">Mensajes Recibidos</span>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {stats.messagesReceived}
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Tiempo Promedio</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {formatTime(stats.averageTime)}
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-400">Tasa de Éxito</span>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {stats.emailsGenerated > 0 
                  ? Math.round((stats.messagesReceived / stats.emailsGenerated) * 100) 
                  : 0}%
              </div>
            </div>
          </div>

          {/* Top Services */}
          {topServices.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">🏆</span>
                Top Servicios
              </h3>
              <div className="space-y-3">
                {topServices.map((item, index) => {
                  const maxCount = topServices[0].count;
                  const percentage = (item.count / maxCount) * 100;
                  
                  return (
                    <div key={item.service}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {index + 1}. {item.service}
                        </span>
                        <span className="text-sm text-slate-400">
                          {item.count} {item.count === 1 ? 'mensaje' : 'mensajes'}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {stats.emailsGenerated === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay estadísticas todavía</p>
              <p className="text-sm mt-2">Genera emails y recibe mensajes para ver tus estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
