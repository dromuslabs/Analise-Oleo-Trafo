
import { GoogleGenAI, Type } from "@google/genai";

// Configurações e Estado
const STATE = {
  groups: [],
  apiUrl: localStorage.getItem('powergrid_api_url') || 'https://api.sheety.co/08e6cbbffee520029dcb64480d35d1a8/controleasi/trafo',
  loading: false,
  aiInsights: null,
  activeModal: null
};

// Inicialização da IA seguindo estritamente as diretrizes
// Assume-se que process.env.API_KEY será provido pelo ambiente de execução (Vercel/Preview)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Lógica de Dados ---

async function fetchData() {
  const btn = document.getElementById('refresh-btn') as HTMLButtonElement;
  const icon = document.getElementById('refresh-icon') as HTMLElement;
  const listContainer = document.getElementById('list-container');
  
  console.log("Iniciando sincronização com:", STATE.apiUrl);

  STATE.loading = true;
  if (btn) btn.disabled = true;
  if (icon) icon.classList.add('animate-spin');

  try {
    const response = await fetch(STATE.apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na Planilha (${response.status}): ${errorText || 'Verifique se a API Sheety está pública.'}`);
    }

    const data = await response.json();
    
    // Sheety usa o nome da aba como chave
    const key = Object.keys(data)[0];
    const rows = data[key] || [];
    
    if (!Array.isArray(rows)) {
      throw new Error("A API Sheety não retornou uma lista válida de dados.");
    }

    STATE.groups = processRows(rows);
    renderDashboard();
    
    // Tenta obter insights globais - o erro de API será tratado dentro da função
    getGlobalAIInsights();

  } catch (err: any) {
    console.error("Erro na carga de dados:", err);
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="p-12 text-center">
          <p class="text-rose-400 font-bold mb-2">Falha na Sincronização</p>
          <p class="text-slate-500 text-sm mb-4">${err.message}</p>
          <button onclick="app.configApi()" class="text-indigo-400 underline text-xs">Reconfigurar URL da Planilha</button>
        </div>
      `;
    }
  } finally {
    STATE.loading = false;
    if (btn) btn.disabled = false;
    if (icon) icon.classList.remove('animate-spin');
    const lastUpdatedText = document.getElementById('last-updated-text');
    if (lastUpdatedText) lastUpdatedText.innerText = `Atualizado: ${new Date().toLocaleTimeString()}`;
  }
}

function processRows(rows: any[]) {
  const grouped: { [key: string]: any[] } = {};
  rows.forEach(row => {
    const sn = (row.sn || row.serie || row.id || 'N/A').toString();
    if (!grouped[sn]) grouped[sn] = [];
    
    const reading = {
      ...row,
      h2: Number(row.h2) || 0,
      c2h2: Number(row.c2h2) || 0,
      ch4: Number(row.ch4) || 0,
      c2h4: Number(row.c2h4) || 0,
      c2h6: Number(row.c2h6) || 0,
      co: Number(row.co) || 0,
      temperaturaOleo: Number(row.temperaturaOleo) || 0,
      data: row.data || new Date().toISOString()
    };
    grouped[sn].push(reading);
  });

  return Object.keys(grouped).map(sn => {
    const history = grouped[sn].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const last = history[history.length - 1];
    
    let status = 'Normal';
    if (last.c2h2 > 2 || last.h2 > 500) status = 'Crítico';
    else if (last.c2h2 > 0.5 || last.h2 > 100) status = 'Alerta';

    return { 
      sn, 
      tag: last.tag || 'EQUIP', 
      local: last.local || 'Planta', 
      history, 
      lastReading: last, 
      status 
    };
  });
}

// --- Lógica de IA ---

async function getGlobalAIInsights() {
  const container = document.getElementById('ai-insights-container');
  if (!container || STATE.groups.length === 0) return;
  
  const summary = STATE.groups.map((g: any) => ({ sn: g.sn, status: g.status, c2h2: g.lastReading.c2h2 }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise a frota de transformadores: ${JSON.stringify(summary)}. Forneça um resumo de saúde e recomendações em formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            health: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    container.innerHTML = `
      <div class="flex items-center gap-2 mb-4">
        <div class="bg-indigo-500 p-1.5 rounded-lg">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h3 class="text-xl font-bold text-indigo-100">AI PowerGrid</h3>
      </div>
      <p class="text-slate-300 mb-6 text-sm leading-relaxed">${data.health}</p>
      <div class="space-y-2">
        <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ações Recomendadas</h4>
        ${data.actions.map((a: string) => `<div class="flex gap-2 text-xs text-slate-400"><span class="text-emerald-500">✓</span> ${a}</div>`).join('')}
      </div>
    `;
  } catch (err: any) {
    console.error("Falha na chamada da IA (Insights Globais):", err);
    container.innerHTML = `
      <div class="p-4 border border-slate-800 rounded-2xl bg-slate-900/50">
        <p class="text-slate-500 text-[10px] uppercase font-bold mb-2">Status da IA</p>
        <p class="text-slate-400 text-xs">Aguardando chave de API válida no Vercel/Ambiente.</p>
        <p class="text-[10px] text-slate-600 mt-2 font-mono">${err.message || ''}</p>
      </div>
    `;
  }
}

async function analyzeTransformerTrends(group: any) {
  const container = document.getElementById('ai-diagnosis-container');
  if (!container) return;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o histórico DGA do transformador ${group.tag} (SN: ${group.sn}). 
      Histórico: ${JSON.stringify(group.history)}.
      Identifique tendências de gases e possíveis falhas incipientes. 
      Responda estritamente em JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ["Baixo", "Médio", "Alto"] },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    const riskColor = data.riskLevel === 'Alto' ? 'text-rose-500' : (data.riskLevel === 'Médio' ? 'text-amber-500' : 'text-emerald-500');

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="md:col-span-3">
          <h3 class="text-indigo-400 font-bold mb-3 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Diagnóstico Predictivo
          </h3>
          <p class="text-slate-300 text-base leading-relaxed mb-4">${data.summary}</p>
          <div class="flex flex-wrap gap-2">
            ${data.patterns.map((p: string) => `<span class="bg-slate-800 text-indigo-300 text-[10px] px-3 py-1 rounded-full border border-slate-700 font-bold uppercase tracking-tighter">${p}</span>`).join('')}
          </div>
        </div>
        <div class="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <p class="text-[10px] font-bold text-slate-600 uppercase mb-1 tracking-widest">Risco de Falha</p>
          <p class="text-3xl font-black ${riskColor} uppercase tracking-tight">${data.riskLevel}</p>
        </div>
      </div>
    `;
  } catch (err: any) {
    console.error("Erro na análise individual via Gemini:", err);
    container.innerHTML = `
      <div class="p-6 text-center border border-slate-800 rounded-3xl">
        <p class="text-slate-500 text-sm">Análise de IA indisponível para este ativo no momento.</p>
        <p class="text-[10px] text-slate-700 mt-2">Verifique as Variáveis de Ambiente no Dashboard do Vercel.</p>
      </div>
    `;
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
  const criticalCount = STATE.groups.filter((g: any) => g.status === 'Crítico').length;
  const alertCount = STATE.groups.filter((g: any) => g.status === 'Alerta').length;
  const avgTemp = STATE.groups.reduce((acc, g: any) => acc + g.lastReading.temperaturaOleo, 0) / (STATE.groups.length || 1);

  const stats = [
    { label: 'Total Ativos', value: STATE.groups.length, color: 'text-indigo-400' },
    { label: 'Estado Crítico', value: criticalCount, color: 'text-rose-500' },
    { label: 'Em Alerta', value: alertCount, color: 'text-amber-400' },
    { label: 'Temp. Média', value: `${avgTemp.toFixed(1)}°C`, color: 'text-blue-400' }
  ];

  container.innerHTML = stats.map(s => `
    <div class="glass p-6 rounded-3xl relative overflow-hidden group">
      <div class="absolute top-0 right-0 p-4 opacity-5 ${s.color}"><svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
      <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">${s.label}</p>
      <p class="text-3xl font-black ${s.color}">${s.value}</p>
    </div>
  `).join('');
}

function renderList() {
  const container = document.getElementById('list-container');
  if (!container) return;
  if (STATE.groups.length === 0) {
    container.innerHTML = `<div class="p-20 text-center text-slate-500">Nenhum dado encontrado na planilha.</div>`;
    return;
  }

  const tableRows = STATE.groups.map((g: any) => `
    <tr class="hover:bg-slate-800/40 border-b border-slate-800/50 transition-colors cursor-pointer" onclick="app.openDetail('${g.sn}')">
      <td class="px-6 py-4 font-bold text-white">${g.tag}<br><span class="text-[10px] text-slate-500 font-mono">${g.sn}</span></td>
      <td class="px-6 py-4 text-center text-slate-400 text-sm">${new Date(g.lastReading.data).toLocaleDateString()}</td>
      <td class="px-6 py-4 text-center font-mono text-lg ${g.lastReading.c2h2 > 0.5 ? 'text-rose-500' : 'text-emerald-400'}">${g.lastReading.c2h2.toFixed(2)}</td>
      <td class="px-6 py-4 text-center">
        <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(g.status)}">${g.status}</span>
      </td>
      <td class="px-6 py-4 text-right">
        <button class="bg-slate-800 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Ver Detalhes</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="w-full text-left">
      <thead>
        <tr class="bg-slate-800/30 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
          <th class="px-6 py-4">Equipamento</th>
          <th class="px-6 py-4 text-center">Última Coleta</th>
          <th class="px-6 py-4 text-center">C2H2 (ppm)</th>
          <th class="px-6 py-4 text-center">Status</th>
          <th class="px-6 py-4 text-right">Ação</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `;
}

function getStatusStyle(s: string) {
  if (s === 'Crítico') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  if (s === 'Alerta') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
}

// --- Detalhes e Gráficos ---

async function openDetail(sn: string) {
  const group = STATE.groups.find((g: any) => g.sn === sn);
  if (!group) return;

  const modal = document.getElementById('modal-container');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative custom-scrollbar">
      <button onclick="app.closeModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
      
      <div class="mb-8">
        <div class="flex items-center gap-4 mb-1">
          <h2 class="text-3xl font-black text-white">${group.tag}</h2>
          <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(group.status)}">${group.status}</span>
        </div>
        <p class="text-slate-500 font-mono text-sm tracking-tight">Identificação: ${group.sn} • Localização: ${group.local}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        ${['h2', 'c2h2', 'temperaturaOleo'].map(k => `
          <div class="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
            <p class="text-[10px] font-bold text-slate-600 uppercase mb-1 tracking-widest">${k === 'temperaturaOleo' ? 'Temp Óleo' : k.toUpperCase()}</p>
            <div class="flex items-baseline gap-2">
              <p class="text-3xl font-black text-white">${group.lastReading[k].toFixed(k === 'c2h2' ? 3 : 1)}</p>
              <span class="text-slate-500 text-xs font-bold uppercase">${k === 'temperaturaOleo' ? '°C' : 'ppm'}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div id="ai-diagnosis-container" class="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-8 mb-10 min-h-[160px]">
        <div class="animate-pulse space-y-4">
          <div class="h-4 bg-slate-800 rounded w-1/4"></div>
          <div class="h-20 bg-slate-800 rounded w-full"></div>
        </div>
      </div>

      <div class="space-y-4">
        <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-2">Tendência Histórica</h4>
        <div id="chart-detail" class="bg-slate-950 p-6 rounded-3xl border border-slate-800 min-h-[400px]"></div>
      </div>
    </div>
  `;

  renderChart(group.history);
  analyzeTransformerTrends(group);
}

function renderChart(history: any[]) {
  const options = {
    series: [
      { name: 'Acetileno (C2H2)', data: history.map(h => h.c2h2) },
      { name: 'Hidrogênio (H2)', data: history.map(h => h.h2) },
      { name: 'Metano (CH4)', data: history.map(h => h.ch4) }
    ],
    chart: { type: 'area', height: 380, toolbar: { show: false }, background: 'transparent' },
    colors: ['#f43f5e', '#3b82f6', '#10b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { 
      categories: history.map(h => new Date(h.data).toLocaleDateString()), 
      labels: { style: { colors: '#64748b', fontSize: '10px' } } 
    },
    yaxis: { labels: { style: { colors: '#64748b', fontSize: '10px' } } },
    grid: { borderColor: '#1e293b' },
    theme: { mode: 'dark' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0 } },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#94a3b8' } }
  };

  const chart = new (window as any).ApexCharts(document.querySelector("#chart-detail"), options);
  chart.render();
}

// --- Funções Globais expostas para o HTML ---

(window as any).app = {
  fetchData,
  openDetail,
  closeModal: () => {
    const modal = document.getElementById('modal-container');
    if (modal) modal.classList.add('hidden');
  },
  configApi: () => {
    const url = prompt('Cole o link da sua API Sheety (HTTPS):', STATE.apiUrl);
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
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl shadow-2xl relative">
        <button onclick="document.getElementById('guide-container').classList.add('hidden')" class="absolute top-6 right-6 text-slate-500 hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
          <svg class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Guia de Deploy Vercel
        </h2>
        <div class="space-y-4 text-sm text-slate-400 leading-relaxed text-left">
          <p>1. Vá ao dashboard da <span class="text-white font-bold">Vercel</span>.</p>
          <p>2. Entre no seu projeto e vá em <span class="text-indigo-400">Settings > Environment Variables</span>.</p>
          <p>3. Adicione a chave <span class="font-bold text-white">API_KEY</span>.</p>
          <p>4. Cole o valor da sua chave Gemini.</p>
          <p>5. Faça um <span class="text-white font-bold">Redeploy</span> na aba "Deployments" para aplicar a variável.</p>
        </div>
        <button onclick="document.getElementById('guide-container').classList.add('hidden')" class="mt-8 bg-indigo-600 hover:bg-indigo-500 w-full py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20">Entendi!</button>
      </div>
    `;
  }
};

// Início automático
fetchData();
