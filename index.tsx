
import { GoogleGenAI, Type } from "@google/genai";

// Estado Global do Aplicativo
const STATE = {
  groups: [],
  apiUrl: localStorage.getItem('powergrid_api_url') || 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi/trafo',
  loading: false,
};

// Inicialização da IA - Seguindo rigorosamente as diretrizes
// A variável process.env.API_KEY deve ser injetada pelo ambiente de hospedagem
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// --- Lógica de Sincronização de Dados ---

async function fetchData() {
  const btn = document.getElementById('refresh-btn') as HTMLButtonElement;
  const icon = document.getElementById('refresh-icon') as HTMLElement;
  const listContainer = document.getElementById('list-container');
  
  STATE.loading = true;
  if (btn) btn.disabled = true;
  if (icon) icon.classList.add('animate-spin');

  try {
    const response = await fetch(STATE.apiUrl);
    if (!response.ok) throw new Error(`Erro na Planilha: ${response.status}`);

    const data = await response.json();
    const key = Object.keys(data)[0];
    const rows = data[key] || [];
    
    STATE.groups = processRows(rows);
    renderDashboard();
    
    // Dispara análise global da frota
    getFleetAIAnalysis();

  } catch (err: any) {
    console.error("Erro na carga:", err);
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="p-16 text-center">
          <div class="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl inline-block">
            <p class="text-rose-400 font-bold mb-2">Erro de Sincronização</p>
            <p class="text-slate-500 text-sm mb-4">Verifique a URL da API Sheety ou as permissões.</p>
            <button onclick="app.configApi()" class="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs hover:bg-slate-700 transition-all">Reconfigurar URL</button>
          </div>
        </div>
      `;
    }
  } finally {
    STATE.loading = false;
    if (btn) btn.disabled = false;
    if (icon) icon.classList.remove('animate-spin');
    const lastUpdatedText = document.getElementById('last-updated-text');
    if (lastUpdatedText) lastUpdatedText.innerText = `Update: ${new Date().toLocaleTimeString()}`;
  }
}

function processRows(rows: any[]) {
  const grouped: { [key: string]: any[] } = {};
  rows.forEach(row => {
    const sn = (row.sn || row.serie || row.id || 'N/A').toString();
    if (!grouped[sn]) grouped[sn] = [];
    
    grouped[sn].push({
      ...row,
      h2: Number(row.h2) || 0,
      c2h2: Number(row.c2h2) || 0,
      ch4: Number(row.ch4) || 0,
      c2h4: Number(row.c2h4) || 0,
      c2h6: Number(row.c2h6) || 0,
      co: Number(row.co) || 0,
      temperaturaOleo: Number(row.temperaturaOleo) || 0,
      data: row.data || new Date().toISOString()
    });
  });

  return Object.keys(grouped).map(sn => {
    const history = grouped[sn].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const last = history[history.length - 1];
    
    // Lógica de Status Baseada em IEEE C57.104 (Simplificada)
    let status = 'Normal';
    if (last.c2h2 > 1.5 || last.h2 > 700 || last.c2h4 > 200) status = 'Crítico';
    else if (last.c2h2 > 0.3 || last.h2 > 100 || last.c2h4 > 50) status = 'Alerta';

    return { 
      sn, 
      tag: last.tag || 'TRAFO-ID', 
      local: last.local || 'Planta Principal', 
      history, 
      lastReading: last, 
      status 
    };
  });
}

// --- Inteligência Artificial Gemini ---

async function getFleetAIAnalysis() {
  const container = document.getElementById('ai-insights-container');
  if (!container || STATE.groups.length === 0) return;

  const fleetSummary = STATE.groups.map((g: any) => ({
    tag: g.tag,
    status: g.status,
    c2h2: g.lastReading.c2h2,
    h2: g.lastReading.h2,
    tcg: (g.lastReading.h2 + g.lastReading.ch4 + g.lastReading.c2h2 + g.lastReading.c2h4 + g.lastReading.c2h6 + g.lastReading.co)
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Como Engenheiro de Manutenção Preditiva (Especialista DGA), analise esta frota de transformadores: ${JSON.stringify(fleetSummary)}. Forneça um resumo de saúde geral e ações prioritárias em JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            priorityActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    container.innerHTML = `
      <div class="flex items-center gap-3 mb-6">
        <div class="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <h3 class="font-black text-white leading-none">PowerGrid Insight</h3>
          <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">IA Preditiva</p>
        </div>
      </div>
      <div class="space-y-6">
        <p class="text-slate-300 text-sm leading-relaxed">${data.executiveSummary}</p>
        <div class="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
          <h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Plano de Intervenção</h4>
          <ul class="space-y-3">
            ${data.priorityActions.map((a: string) => `
              <li class="flex gap-3 text-xs text-slate-400 leading-tight">
                <span class="text-indigo-500 font-bold">»</span> ${a}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  } catch (err: any) {
    console.error("Erro IA Fleet:", err);
    container.innerHTML = `
      <div class="p-6 text-center border border-slate-800 rounded-3xl bg-slate-900/40">
        <p class="text-slate-500 text-xs mb-2">IA aguardando chave de API válida no Vercel.</p>
        <p class="text-[10px] text-slate-700 font-mono break-all">${err.message}</p>
        <button onclick="app.showDeployGuide()" class="mt-4 text-indigo-400 text-xs font-bold hover:underline">Como ativar?</button>
      </div>
    `;
  }
}

async function analyzeAssetDetail(group: any) {
  const container = document.getElementById('ai-diagnosis-container');
  if (!container) return;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o histórico DGA do transformador ${group.tag}. Dados: ${JSON.stringify(group.history)}. Identifique padrões de falha (Arco, Descarga Térmica, Corona) e nível de risco.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            identifiedFault: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ["Baixo", "Moderado", "Crítico"] }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    const riskColor = data.riskLevel === 'Crítico' ? 'text-rose-500' : (data.riskLevel === 'Moderado' ? 'text-amber-500' : 'text-emerald-500');

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        <div class="md:col-span-3">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <h4 class="text-indigo-400 font-bold uppercase text-xs tracking-widest">Diagnóstico Técnico de IA</h4>
          </div>
          <p class="text-slate-200 text-lg font-medium leading-relaxed mb-4">${data.diagnosis}</p>
          <div class="inline-flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
            <span class="text-[10px] font-bold text-slate-500 uppercase">Falha Provável:</span>
            <span class="text-xs text-white font-bold">${data.identifiedFault}</span>
          </div>
        </div>
        <div class="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center shadow-inner">
          <p class="text-[10px] font-bold text-slate-600 uppercase mb-1 tracking-widest">Risco IEEE</p>
          <p class="text-3xl font-black ${riskColor} uppercase tracking-tight">${data.riskLevel}</p>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-slate-600 text-xs">Análise técnica detalhada indisponível temporariamente.</div>`;
  }
}

// --- Renderização de UI ---

function renderDashboard() {
  renderStats();
  renderList();
}

function renderStats() {
  const container = document.getElementById('stats-container');
  if (!container) return;
  const critical = STATE.groups.filter((g: any) => g.status === 'Crítico').length;
  const alert = STATE.groups.filter((g: any) => g.status === 'Alerta').length;
  const avgTemp = STATE.groups.reduce((acc, g: any) => acc + g.lastReading.temperaturaOleo, 0) / (STATE.groups.length || 1);

  const stats = [
    { label: 'Frota Ativa', value: STATE.groups.length, color: 'text-indigo-400' },
    { label: 'Estado Crítico', value: critical, color: 'text-rose-500' },
    { label: 'Em Alerta', value: alert, color: 'text-amber-400' },
    { label: 'Temp. Média', value: `${avgTemp.toFixed(1)}°C`, color: 'text-blue-400' }
  ];

  container.innerHTML = stats.map(s => `
    <div class="glass p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-slate-700 transition-all">
      <div class="absolute top-0 right-0 p-6 opacity-5 ${s.color} group-hover:scale-110 transition-transform"><svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
      <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">${s.label}</p>
      <p class="text-4xl font-black ${s.color}">${s.value}</p>
    </div>
  `).join('');
}

function renderList() {
  const container = document.getElementById('list-container');
  if (!container) return;
  if (STATE.groups.length === 0) {
    container.innerHTML = `<div class="p-20 text-center text-slate-500">Aguardando dados da planilha...</div>`;
    return;
  }

  const tableRows = STATE.groups.map((g: any) => `
    <tr class="hover:bg-slate-800/40 border-b border-slate-800/50 transition-all cursor-pointer group" onclick="app.openDetail('${g.sn}')">
      <td class="px-8 py-6">
        <div class="flex flex-col">
          <span class="text-white font-black text-lg group-hover:text-indigo-400 transition-colors">${g.tag}</span>
          <span class="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">SN: ${g.sn} • ${g.local}</span>
        </div>
      </td>
      <td class="px-8 py-6 text-center text-slate-400 text-sm font-medium">${new Date(g.lastReading.data).toLocaleDateString()}</td>
      <td class="px-8 py-6 text-center">
        <div class="flex flex-col items-center">
          <span class="font-mono text-xl font-bold ${g.lastReading.c2h2 > 0.3 ? 'text-rose-500' : 'text-emerald-400'}">${g.lastReading.c2h2.toFixed(2)}</span>
          <span class="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Acetileno (ppm)</span>
        </div>
      </td>
      <td class="px-8 py-6 text-center">
        <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(g.status)}">${g.status}</span>
      </td>
      <td class="px-8 py-6 text-right">
        <button class="bg-slate-800 group-hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-indigo-500/20">DETALHAR</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="w-full text-left">
      <thead>
        <tr class="bg-slate-800/30 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black border-b border-slate-800">
          <th class="px-8 py-6">Identificação de Ativo</th>
          <th class="px-8 py-6 text-center">Data Coleta</th>
          <th class="px-8 py-6 text-center">DGA Crítico</th>
          <th class="px-8 py-6 text-center">Status Saúde</th>
          <th class="px-8 py-6 text-right">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/50">${tableRows}</tbody>
    </table>
  `;
}

function getStatusStyle(s: string) {
  if (s === 'Crítico') return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
  if (s === 'Alerta') return 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
}

// --- Modais e Visualização ---

async function openDetail(sn: string) {
  const group = STATE.groups.find((g: any) => g.sn === sn);
  if (!group) return;

  const modal = document.getElementById('modal-container');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] p-10 relative custom-scrollbar">
      <button onclick="app.closeModal()" class="fixed top-8 right-8 z-50 bg-slate-800/80 hover:bg-slate-700 text-white p-4 rounded-2xl backdrop-blur-md transition-all shadow-xl"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
      
      <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-4 mb-2">
            <h2 class="text-5xl font-black text-white tracking-tighter">${group.tag}</h2>
            <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(group.status)}">${group.status}</span>
          </div>
          <p class="text-slate-500 font-mono text-base">Módulo: ${group.sn} • Localização: ${group.local}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        ${['h2', 'c2h2', 'temperaturaOleo'].map(k => `
          <div class="bg-slate-950/80 p-8 rounded-[2rem] border border-slate-800/80 shadow-inner group hover:border-indigo-500/30 transition-all">
            <p class="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-[0.2em]">${k === 'temperaturaOleo' ? 'Temp Óleo' : k.toUpperCase()}</p>
            <div class="flex items-baseline gap-2">
              <p class="text-4xl font-black text-white tracking-tight">${group.lastReading[k].toFixed(k === 'c2h2' ? 3 : 1)}</p>
              <span class="text-slate-600 text-xs font-bold uppercase">${k === 'temperaturaOleo' ? '°C' : 'ppm'}</span>
            </div>
            <div class="h-1 w-full bg-slate-900 rounded-full mt-4 overflow-hidden">
                <div class="h-full bg-indigo-500 opacity-30" style="width: ${Math.min(group.lastReading[k] * 2, 100)}%"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <div id="ai-diagnosis-container" class="bg-indigo-600/5 border border-indigo-600/10 rounded-[2.5rem] p-10 mb-12 shadow-2xl">
        <div class="animate-pulse space-y-4">
          <div class="h-4 bg-slate-800 rounded w-1/4"></div>
          <div class="h-24 bg-slate-800 rounded w-full"></div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="flex items-center justify-between px-4">
          <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cinética de Gases e Tendência</h4>
          <div class="flex gap-4">
             <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-rose-500"></span><span class="text-[10px] font-bold text-slate-500">C2H2</span></div>
             <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-500"></span><span class="text-[10px] font-bold text-slate-500">H2</span></div>
          </div>
        </div>
        <div id="chart-detail" class="bg-slate-950/50 p-10 rounded-[3rem] border border-slate-800/50 min-h-[450px]"></div>
      </div>
    </div>
  `;

  renderChart(group.history);
  analyzeAssetDetail(group);
}

function renderChart(history: any[]) {
  const options = {
    series: [
      { name: 'Acetileno (C2H2)', data: history.map(h => h.c2h2) },
      { name: 'Hidrogênio (H2)', data: history.map(h => h.h2) },
      { name: 'Metano (CH4)', data: history.map(h => h.ch4) }
    ],
    chart: { type: 'area', height: 400, toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter' },
    colors: ['#f43f5e', '#3b82f6', '#10b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 4 },
    xaxis: { 
      categories: history.map(h => new Date(h.data).toLocaleDateString()), 
      labels: { style: { colors: '#475569', fontSize: '10px', fontWeight: 600 } },
      axisBorder: { show: false }
    },
    yaxis: { labels: { style: { colors: '#475569', fontSize: '10px', fontWeight: 600 } } },
    grid: { borderColor: '#1e293b', strokeDashArray: 4 },
    theme: { mode: 'dark' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0, stops: [0, 90, 100] } },
    legend: { show: false }
  };

  const chart = new (window as any).ApexCharts(document.querySelector("#chart-detail"), options);
  chart.render();
}

// --- Utilitários Globais ---

(window as any).app = {
  fetchData,
  openDetail,
  closeModal: () => {
    const modal = document.getElementById('modal-container');
    if (modal) modal.classList.add('hidden');
  },
  configApi: () => {
    const url = prompt('URL Sheety API (HTTPS):', STATE.apiUrl);
    if (url && url.startsWith('http')) {
      STATE.apiUrl = url;
      localStorage.setItem('powergrid_api_url', url);
      fetchData();
    }
  },
  showDeployGuide: () => {
    const guide = document.getElementById('guide-container');
    if (!guide) return;
    guide.classList.remove('hidden');
    guide.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.6)] relative">
        <button onclick="document.getElementById('guide-container').classList.add('hidden')" class="absolute top-8 right-8 text-slate-500 hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        <h2 class="text-2xl font-black mb-6 text-white tracking-tight">Ativação da IA no Vercel</h2>
        <div class="space-y-6 text-sm text-slate-400 leading-relaxed text-left">
          <p>1. No Vercel, vá em <span class="text-indigo-400 font-bold">Settings > Environment Variables</span>.</p>
          <p>2. Adicione a chave <span class="text-white font-mono">API_KEY</span>.</p>
          <p>3. Clique em <span class="text-indigo-400 font-bold">Deployments</span>, escolha o mais recente e clique em <span class="text-white font-bold">Redeploy</span>.</p>
          <div class="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-amber-500/80 text-[11px] font-medium">
            O Vercel não reconhece novas chaves sem um novo Redeploy manual após a configuração.
          </div>
        </div>
        <button onclick="document.getElementById('guide-container').classList.add('hidden')" class="mt-10 bg-indigo-600 hover:bg-indigo-500 w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-indigo-600/20">CONFIRMADO</button>
      </div>
    `;
  }
};

// Start
fetchData();
