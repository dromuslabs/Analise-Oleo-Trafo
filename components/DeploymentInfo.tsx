
import React from 'react';

interface DeploymentInfoProps {
  onClose: () => void;
}

const DeploymentInfo: React.FC<DeploymentInfoProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-indigo-600/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Guia de Hospedagem Gratuita
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <section>
            <h3 className="text-indigo-400 font-bold mb-2 uppercase text-xs tracking-widest">Opções de Hosting</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://vercel.com" target="_blank" className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all">
                <p className="font-bold text-white">Vercel</p>
                <p className="text-xs text-slate-500">Alta performance, ideal para React.</p>
              </a>
              <a href="https://netlify.com" target="_blank" className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all">
                <p className="font-bold text-white">Netlify</p>
                <p className="text-xs text-slate-500">Simples e com deploy via Git.</p>
              </a>
            </div>
          </section>

          <section className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
            <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Segurança: Variáveis de Ambiente
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ao hospedar em qualquer um destes locais, você deve configurar a sua chave do Gemini nas configurações do projeto (Environment Variables).
              Adicione uma variável chamada <code className="bg-slate-800 px-1 rounded text-indigo-300">API_KEY</code> com o valor da sua chave.
            </p>
          </section>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-2 font-mono uppercase tracking-tighter">Fluxo de Deploy</p>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              <li>Suba seu código para um repositório no <span className="text-white">GitHub</span>.</li>
              <li>No Vercel/Netlify, clique em <span className="text-indigo-400">"New Project"</span>.</li>
              <li>Importe o seu repositório.</li>
              <li>Em <span className="text-indigo-400">"Environment Variables"</span>, adicione a sua <span className="font-mono">API_KEY</span>.</li>
              <li>Clique em <span className="text-white font-bold">Deploy</span>. Pronto!</li>
            </ol>
          </div>
        </div>
        
        <div className="p-6 bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-all"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentInfo;
