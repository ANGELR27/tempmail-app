import { Copy, Check } from 'lucide-react';

export function CodeCopyButton({ code, onCopy, copied }) {
  return (
    <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs text-slate-400 mb-2 font-medium">
            ✨ Código de verificación detectado
          </div>
          <div className="text-3xl font-mono font-bold text-primary-400 tracking-wider">
            {code}
          </div>
        </div>
        <button
          onClick={() => onCopy(code)}
          className={`px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
