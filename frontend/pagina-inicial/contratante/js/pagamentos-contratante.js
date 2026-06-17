/* ============================================
   KARGO — Lógica Financeira do Contratante
   Alimenta estatísticas e histórico de pagamentos via API
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoPagamentos] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        const embarcadorId = auth.getUserId();
        const tableBody = document.getElementById('payments-table-body');

        // Elementos de Estatísticas
        const statPaidValue = document.getElementById('pay-total-paid');
        const statPaidCount = document.getElementById('pay-liquidated-count');
        const statPendingValue = document.getElementById('pay-total-pending');
        const statPendingCount = document.getElementById('pay-pending-count');
        const statDisputedValue = document.getElementById('pay-total-disputed');

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function getStorageKey(suffix) {
            return `kargo_ocorrencias_${embarcadorId}`;
        }

        async function fetchPaymentsData() {
            try {
                const fretes = await api.getFretesByEmbarcador(embarcadorId);
                const todosFretes = Array.isArray(fretes) ? fretes : [];

                // Ler as ocorrências ativas do localStorage para identificar fretes em disputa
                const rawOcorrencias = localStorage.getItem(getStorageKey());
                const ocorrencias = rawOcorrencias ? JSON.parse(rawOcorrencias) : [];
                const fretesComDisputaIds = ocorrencias
                    .filter(o => o.status === 'EM_ANALISE')
                    .map(o => Number(o.freteId));

                renderFinancePanel(todosFretes, fretesComDisputaIds);
            } catch (error) {
                console.error('[KargoPagamentos] Erro ao carregar dados financeiros:', error);
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="7" style="padding: 30px; text-align: center; color: var(--accent-red);">
                                Erro ao carregar histórico financeiro.
                            </td>
                        </tr>
                    `;
                }
            }
        }

        function renderFinancePanel(fretes, fretesComDisputaIds) {
            // Filtrar fretes de interesse (com exceção de cancelados)
            const fretesValidos = fretes.filter(f => f.status !== 'CANCELADO' && f.status !== 'PUBLICADO');

            // 1. Calcular saldos
            let totalPago = 0;
            let countPago = 0;
            let totalPendente = 0;
            let countPendente = 0;
            let totalDisputa = 0;

            fretesValidos.forEach(f => {
                const valor = Number(f.valorFrete) || 0;
                const isDisputado = fretesComDisputaIds.includes(Number(f.id));

                if (isDisputado) {
                    totalDisputa += valor;
                } else if (f.status === 'CONCLUIDO') {
                    totalPago += valor;
                    countPago++;
                } else if (f.status === 'ACEITO' || f.status === 'EM_TRANSITO') {
                    totalPendente += valor;
                    countPendente++;
                }
            });

            // Atualizar contadores na tela
            if (statPaidValue) statPaidValue.textContent = api.formatCurrency(totalPago);
            if (statPaidCount) statPaidCount.textContent = `${countPago} ${countPago === 1 ? 'frete liquidado' : 'fretes liquidados'}`;
            if (statPendingValue) statPendingValue.textContent = api.formatCurrency(totalPendente);
            if (statPendingCount) statPendingCount.textContent = `${countPendente} ${countPendente === 1 ? 'frete em andamento' : 'fretes em andamento'}`;
            if (statDisputedValue) statDisputedValue.textContent = api.formatCurrency(totalDisputa);

            // 2. Renderizar tabela
            if (!tableBody) return;

            tableBody.innerHTML = '';

            if (fretesValidos.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="padding: 30px; text-align: center; color: var(--text-muted);">
                            Nenhum histórico financeiro encontrado.
                        </td>
                    </tr>
                `;
                return;
            }

            // Ordenar por ID decrescente
            fretesValidos.sort((a, b) => b.id - a.id);

            fretesValidos.forEach(f => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-light)';
                tr.style.color = 'var(--text-body)';

                const isDisputado = fretesComDisputaIds.includes(Number(f.id));
                const motoristaNome = f.motorista ? escapeHtml(f.motorista.nome) : 'Não atribuído';
                const dataFormatada = f.dataPublicacao ? api.formatDate(f.dataPublicacao) : '—';
                const valorFormatado = api.formatCurrency(f.valorFrete);

                // Badge de status
                let badgeHtml = '';
                if (isDisputado) {
                    badgeHtml = `<span class="ct-badge ct-badge-red"><span class="status-indicator-dot red"></span>Retido / Disputa</span>`;
                } else if (f.status === 'CONCLUIDO') {
                    badgeHtml = `<span class="ct-badge ct-badge-green"><span class="status-indicator-dot green"></span>Pago</span>`;
                } else if (f.status === 'EM_TRANSITO') {
                    badgeHtml = `<span class="ct-badge ct-badge-orange"><span class="status-indicator-dot orange"></span>Em Trânsito</span>`;
                } else if (f.status === 'ACEITO') {
                    badgeHtml = `<span class="ct-badge ct-badge-blue"><span class="status-indicator-dot blue"></span>Agendado</span>`;
                } else {
                    badgeHtml = `<span class="ct-badge ct-badge-gray">${escapeHtml(f.status)}</span>`;
                }

                // Ações
                let acoesHtml = '';
                if (f.status === 'CONCLUIDO') {
                    acoesHtml = `
                        <button class="ct-btn ct-btn-outline ct-btn-sm" onclick="alert('Comprovante de transferência bancária enviado para o e-mail de faturamento.')" style="padding:4px 8px; font-size:11px;">Comprovante</button>
                        <a href="detalhes-frete.html?id=${f.id}" class="ct-btn ct-btn-secondary ct-btn-sm" style="padding:4px 8px; font-size:11px; margin-left:4px; text-decoration:none; display:inline-block;">Detalhes</a>
                    `;
                } else {
                    acoesHtml = `<a href="detalhes-frete.html?id=${f.id}" class="ct-btn ct-btn-primary ct-btn-sm" style="padding:4px 8px; font-size:11px; text-decoration:none; display:inline-block;">Ver Frete</a>`;
                }

                tr.innerHTML = `
                    <td style="padding:14px 10px; font-weight:700;">#KG-2026-${f.id}</td>
                    <td style="padding:14px 10px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#6b7280,#9ca3af); color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">
                                ${motoristaNome.charAt(0).toUpperCase()}
                            </div>
                            <span>${motoristaNome}</span>
                        </div>
                    </td>
                    <td style="padding:14px 10px;">${escapeHtml(f.origem)} → ${escapeHtml(f.destino)}</td>
                    <td style="padding:14px 10px;">${dataFormatada}</td>
                    <td style="padding:14px 10px; font-weight:700; color:var(--text-dark);">${valorFormatado}</td>
                    <td style="padding:14px 10px;">${badgeHtml}</td>
                    <td style="padding:14px 10px; text-align:right;">${acoesHtml}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // Carregar dados inicialmente
        fetchPaymentsData();
    });
})();
