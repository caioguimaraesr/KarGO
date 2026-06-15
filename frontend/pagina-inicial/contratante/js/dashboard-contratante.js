/* ============================================
   KARGO — Lógica do Dashboard do Contratante
   Alimenta estatísticas, propostas e timeline via API
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoDashboard] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        const embarcadorId = auth.getUserId();

        // Elementos de Estatísticas
        const statActive = document.getElementById('dashboard-active-freights');
        const statExpenses = document.getElementById('dashboard-monthly-expenses');
        const statNextValue = document.getElementById('dashboard-next-collect-value');
        const statNextRoute = document.getElementById('dashboard-next-collect-route');

        // Containers
        const containerCargas = document.getElementById('dashboard-cargas-container');
        const containerPropostas = document.getElementById('dashboard-propostas-container');
        const containerTimeline = document.getElementById('dashboard-timeline-container');

        // Resumo financeiro
        const labelTotalFinanceiro = document.getElementById('dashboard-total-semanal');
        const labelFinalizadosCount = document.getElementById('dashboard-fretes-concluidos-count');

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        async function fetchDashboardData() {
            try {
                const cargas = await api.listCargasByEmbarcador(embarcadorId);
                const todasCargas = Array.isArray(cargas) ? cargas : [];

                const fretes = await api.getFretesByEmbarcador(embarcadorId);
                const todosFretes = Array.isArray(fretes) ? fretes : [];

                renderDashboard(todasCargas, todosFretes);
            } catch (error) {
                console.error('[KargoDashboard] Erro ao carregar dados do painel:', error);
                const errorHtml = `<div style="text-align:center; padding:20px; color:var(--accent-red); font-size:13px;">Erro ao carregar dados.</div>`;
                if (containerCargas) containerCargas.innerHTML = errorHtml;
                if (containerPropostas) containerPropostas.innerHTML = errorHtml;
            }
        }

        function renderDashboard(cargas, fretes) {
            // 1. Estatísticas
            const fretesAtivos = fretes.filter(f => f.status === 'ACEITO' || f.status === 'EM_TRANSITO');
            const fretesConcluidos = fretes.filter(f => f.status === 'CONCLUIDO');
            const propostasAbertas = fretes.filter(f => f.status === 'PUBLICADO');

            // Gastos totais: Soma dos fretes firmados (ACEITO, EM_TRANSITO, CONCLUIDO)
            const totalGasto = fretes
                .filter(f => f.status !== 'CANCELADO')
                .reduce((sum, f) => sum + (Number(f.valorFrete) || 0), 0);

            if (statActive) statActive.textContent = fretesAtivos.length;
            if (statExpenses) statExpenses.textContent = api.formatCurrency(totalGasto);
            if (labelTotalFinanceiro) labelTotalFinanceiro.textContent = api.formatCurrency(totalGasto);
            if (labelFinalizadosCount) labelFinalizadosCount.textContent = fretesConcluidos.length;

            // Próxima coleta (primeiro frete com status ACEITO)
            const proximaColeta = fretes.find(f => f.status === 'ACEITO');
            if (proximaColeta) {
                if (statNextValue) statNextValue.textContent = api.formatDate(proximaColeta.dataPublicacao);
                if (statNextRoute) statNextRoute.textContent = `${escapeHtml(proximaColeta.origem)} → ${escapeHtml(proximaColeta.destino)}`;
            } else {
                if (statNextValue) statNextValue.textContent = '--';
                if (statNextRoute) statNextRoute.textContent = 'Nenhuma agendada';
            }

            // 2. Anúncios de carga ativos (limitar a 3 mais recentes)
            if (containerCargas) {
                if (cargas.length === 0) {
                    containerCargas.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;">Nenhum anúncio ativo.</div>`;
                } else {
                    const html = cargas.slice(0, 3).map(carga => {
                        const pesoTon = (Number(carga.pesoKg || 0) / 1000).toFixed(1);
                        
                        // Verificar se tem frete ativo associado
                        const fretesCarga = fretes.filter(f => {
                            const match = String(f.titulo || '').match(/Proposta para carga (\d+)/);
                            return match && parseInt(match[1]) === carga.id;
                        });
                        const freteAtivo = fretesCarga.find(f => f.status === 'ACEITO' || f.status === 'EM_TRANSITO');
                        const isAtivo = !!freteAtivo;
                        
                        const statusClass = isAtivo ? 'ct-badge-green' : 'ct-badge-orange';
                        const statusText = isAtivo ? (freteAtivo.status === 'EM_TRANSITO' ? 'Em Trânsito' : 'Coleta Agendada') : 'Aguardando Propostas';
                        const dotClass = isAtivo ? 'green' : 'orange';
                        const valorExibido = isAtivo ? freteAtivo.valorFrete : carga.valorSugerido;

                        return `
                            <div class="ct-cargo-card" style="margin-bottom:12px; padding: 18px;">
                                <div class="ct-cargo-header" style="margin-bottom:10px;">
                                    <div>
                                        <span class="ct-badge ${statusClass}" style="padding: 4px 10px; font-size:11px;"><span class="status-indicator-dot ${dotClass}"></span>${statusText}</span>
                                        <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">#KG-${carga.id}</span>
                                    </div>
                                    <span style="font-size:16px;font-weight:800;color:var(--text-dark);">${api.formatCurrency(valorExibido)}</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--text-body); margin-bottom:6px;">
                                    <span><strong>Origem:</strong> ${escapeHtml(carga.origem)}</span>
                                    <span><strong>Destino:</strong> ${escapeHtml(carga.destino)}</span>
                                </div>
                                <div style="font-size:12px; color:var(--text-muted);">
                                    ${escapeHtml(carga.descricao.split('[')[0])} · ${pesoTon} Ton
                                </div>
                            </div>
                        `;
                    }).join('');
                    containerCargas.innerHTML = html;
                }
            }

            // 3. Propostas recebidas (limitar a 3 com status PUBLICADO)
            if (containerPropostas) {
                if (propostasAbertas.length === 0) {
                    containerPropostas.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:13px;">Nenhuma proposta recebida.</div>`;
                } else {
                    const html = propostasAbertas.slice(0, 3).map(prop => {
                        const motNome = escapeHtml(prop.motorista?.nome || 'Motorista');
                        const match = String(prop.titulo || '').match(/Proposta para carga (\d+)/);
                        const cargaId = match ? match[1] : '';
                        
                        return `
                            <div class="ct-proposal-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border:1px solid var(--border-light); border-radius:var(--radius-md); margin-bottom:8px; background:#fff;">
                                <div style="display:flex; gap:10px; align-items:center;">
                                    <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#4b5563,#9ca3af); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0;">
                                        ${motNome.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="ct-proposal-name" style="font-weight:700; font-size:13px; color:var(--text-dark);">${motNome}</div>
                                        <div style="font-size:11px; color:var(--text-muted);">
                                            Carga #KG-${cargaId}
                                        </div>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div style="font-weight:800; color:var(--accent-green); font-size:14px; white-space:nowrap;">${api.formatCurrency(prop.valorFrete)}</div>
                                    <button class="ct-btn ct-btn-success ct-btn-sm js-accept-prop-dash" data-frete-id="${prop.id}" data-driver-name="${motNome}" style="padding:4px 10px; font-size:11px;">Aceitar</button>
                                </div>
                            </div>
                        `;
                    }).join('');
                    containerPropostas.innerHTML = html;
                }
            }

            // 4. Montar a timeline de eventos dinamicamente
            if (containerTimeline) {
                const eventos = [];

                // Cargas publicadas
                cargas.forEach(c => {
                    eventos.push({
                        title: `Carga #KG-${c.id} publicada`,
                        desc: `Anúncio para rota ${escapeHtml(c.origem)} → ${escapeHtml(c.destino)} criado no marketplace.`,
                        time: 'Recente',
                        type: 'blue',
                        timestamp: new Date().getTime() - 2 * 60 * 60 * 1000 // Simula 2h atrás
                    });
                });

                // Propostas recebidas
                propostasAbertas.forEach(p => {
                    const match = String(p.titulo || '').match(/Proposta para carga (\d+)/);
                    const cId = match ? match[1] : '';
                    eventos.push({
                        title: `Proposta de frete recebida`,
                        desc: `Motorista ${escapeHtml(p.motorista?.nome)} enviou proposta para Carga #KG-${cId}.`,
                        time: 'Hoje',
                        type: 'orange',
                        timestamp: new Date().getTime() - 30 * 60 * 1000 // Simula 30 min atrás
                    });
                });

                // Fretes aceitos (ativos)
                fretesAtivos.forEach(f => {
                    eventos.push({
                        title: `Contrato firmado - Frete #KG-${f.id}`,
                        desc: `Motorista ${escapeHtml(f.motorista?.nome)} vinculado e a caminho da coleta.`,
                        time: 'Hoje',
                        type: 'green',
                        timestamp: new Date().getTime() - 10 * 60 * 1000 // Simula 10 min atrás
                    });
                });

                // Evento fallback
                if (eventos.length === 0) {
                    eventos.push({
                        title: 'Painel Inicializado',
                        desc: 'Sem novos eventos. Publique um anúncio de carga para começar.',
                        time: 'Agora',
                        type: 'blue',
                        timestamp: new Date().getTime()
                    });
                }

                // Ordenar por data simulação
                eventos.sort((a, b) => b.timestamp - a.timestamp);

                const timelineHtml = eventos.slice(0, 4).map(ev => {
                    return `
                        <div class="ct-timeline-item">
                            <div class="ct-timeline-dot ${ev.type}"></div>
                            <div class="ct-timeline-content">
                                <div class="ct-timeline-title">${ev.title}</div>
                                <div class="ct-timeline-desc" style="font-size:12px; color:var(--text-muted); margin-top:2px;">${ev.desc}</div>
                            </div>
                            <div class="ct-timeline-time">${ev.time}</div>
                        </div>
                    `;
                }).join('');
                containerTimeline.innerHTML = timelineHtml;
            }
        }

        // Listener para aceitar propostas direto do Dashboard
        document.body.addEventListener('click', async (e) => {
            const btn = e.target.closest('.js-accept-prop-dash');
            if (btn) {
                e.preventDefault();
                const freteId = Number(btn.getAttribute('data-frete-id'));
                const driverName = btn.getAttribute('data-driver-name');

                if (confirm(`Deseja aceitar a proposta de ${driverName}? Isto fechará o contrato de frete.`)) {
                    btn.disabled = true;
                    btn.textContent = '...';

                    try {
                        await api.updateFrete(freteId, { status: 'ACEITO' });
                        alert(`Contrato firmado com sucesso com o motorista ${driverName}.`);
                        fetchDashboardData();
                    } catch (error) {
                        alert(`Erro ao aceitar proposta: ${error.message}`);
                        btn.disabled = false;
                        btn.textContent = 'Aceitar';
                    }
                }
            }
        });

        // Carregar dados iniciais
        fetchDashboardData();
    });
})();
