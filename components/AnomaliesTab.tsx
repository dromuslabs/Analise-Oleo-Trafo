
import React, { useState } from 'react';
import { TransformerGroup } from '../types';

interface AnomaliesTabProps {
  assets: TransformerGroup[];
  onSuccess?: () => void;
}

const AnomaliesTab: React.FC<AnomaliesTabProps> = ({ assets, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ativoparque: '',
    data: new Date().toISOString().split('T')[0],
    gravidade: 'Média',
    tipo: 'Inspeção Visual',
    observacaotecnica: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ativoparque || !formData.observacaotecnica) {
      setError("Por favor, preencha o equipamento e a observação técnica.");
      return;
    }

    setLoading(true);
    setError(null);

    const BASE_API = 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi';

    try {
      const response = await fetch(`${BASE_API}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registro: {
            ativoparque: formData.ativoparque,
            data: formData.data,
            gravidade: formData.gravidade,
            tipo: formData.tipo,
            observacaotecnica: formData.observacaotecnica
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar registro na planilha.');
      }

      const result = await response.json();
      console.log('Registro salvo:', result);
      
      // Feedback visual e reset do form
      alert("Registro salvo com sucesso na planilha!");
      setFormData({
        ativoparque: '',
        data: new Date().toISOString().split('T')[0],
        gravidade: 'Média',
        tipo: 'Inspeção Visual',
        observacaotecnica: ''
      });

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro ao tentar salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-indigo-600 p-3 rounded-2xl">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Novo Registro Técnico</h2>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Equipamento</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
              value={formData.ativoparque}
              onChange={e => setFormData({...formData, ativoparque: e.target.value})}
              required
            >
              <option value="">Selecione o ativo...</option>
              {assets.map(a => <option key={a.sn} value={a.tag}>{a.tag} ({a.sn})</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Data do Evento</label>
            <input 
              type="date"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all"
              value={formData.data}
              onChange={e => setFormData({...formData, data: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Gravidade</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
              value={formData.gravidade}
              onChange={e => setFormData({...formData, gravidade: e.target.value})}
            >
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Tipo de Registro</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="Inspeção Visual">Inspeção Visual</option>
              <option value="Ruído Anormal">Ruído Anormal</option>
              <option value="Vazamento">Vazamento</option>
              <option value="Termografia">Termografia</option>
              <option value="Manutenção Corretiva">Manutenção Corretiva</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">Observação Técnica</label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 text-white h-40 outline-none focus:border-indigo-500 resize-none transition-all placeholder:text-slate-700 font-medium"
            placeholder="Relate detalhadamente as condições técnicas, defeitos ou intervenções realizadas..."
            value={formData.observacaotecnica}
            onChange={e => setFormData({...formData, observacaotecnica: e.target.value})}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-white shadow-xl transition-all flex items-center justify-center gap-3 ${
            loading ? 'bg-slate-800 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Sincronizando...
            </>
          ) : (
            'Salvar na Planilha Master'
          )}
        </button>
      </form>
    </div>
  );
};

export default AnomaliesTab;
