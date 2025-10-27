import { Search, Filter, X } from 'lucide-react';

export function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  filterService, 
  onFilterChange,
  onlyWithCodes,
  onToggleCodes,
  availableServices = []
}) {
  return (
    <div className="space-y-3 mb-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="🔍 Buscar por remitente, asunto o contenido..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {/* Filtro por servicio */}
        {availableServices.length > 0 && (
          <select
            value={filterService}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
          >
            <option value="all">Todos los servicios</option>
            {availableServices.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        )}
        
        {/* Filtro: solo con códigos */}
        <button
          onClick={onToggleCodes}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            onlyWithCodes
              ? 'bg-primary-500 text-white'
              : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
          }`}
        >
          <Filter className="w-4 h-4" />
          Solo con códigos
        </button>
        
        {/* Indicador de resultados */}
        {(searchTerm || filterService !== 'all' || onlyWithCodes) && (
          <div className="px-3 py-2 bg-slate-800/50 rounded-lg text-sm text-slate-400 inline-flex items-center">
            Filtrando resultados
          </div>
        )}
      </div>
    </div>
  );
}
