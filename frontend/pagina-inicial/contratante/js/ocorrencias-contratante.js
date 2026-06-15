/* ============================================
   KARGO — Central de Ocorrências do Contratante
   Lógica reativa e filtros dinâmicos via localStorage
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoOcorrencias] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        const embarcadorId = auth.getUserId();
        const container = document.getElementById('ocorrencias-list');
        const tabButtons = document.querySelectorAll('.ct-tabs .ct-tab');

        let allOcorrencias = [];
        let currentFilter = 'todas'; // todas, analise, resolvido

        function getStorageKey() {
            return `kargo_ocorrencias_${embarcadorId}`;
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function loadOcorrencias() {
            try {
                const raw = localStorage.getItem(getStorageKey());
                allOcorrencias = raw ? JSON.parse(raw) : [];

                updateTabCounters();
                renderOcorrencias();
            } catch (error) {
                console.error('[KargoOcorrencias] Erro ao carregar ocorrencias:', error);
                if (container) {
                    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--accent-red); font-size:13px;">Erro ao carregar ocorrências.</div>`;
                }
            }
        }

        function updateTabCounters() {
            const countTodas = allOcorrencias.length;
            const countAnalise = allOcorrencias.filter(o => o.status === 'EM_ANALISE').length;
            const countResolvido = allOcorrencias.filter(o => o.status === 'RESOLVIDA' || o.status === 'RESOLVIDO').length;

            tabButtons.forEach(btn => {
                const tabName = btn.getAttribute('data-tab') || btn.dataset.tab;
                if (tabName === 'tab-todas') {
                    btn.textContent = `Todas as Ocorrências (${countTodas})`;
                } else if (tabName === 'tab-analise') {
                    btn.textContent = `Em Análise (${countAnalise})`;
                } else if (tabName === 'tab-resolvido') {
                    btn.textContent = `Resolvidas (${countResolvido})`;
                }
            });
        }

        function renderOcorrencias() {
            if (!container) return;

            container.innerHTML = '';

            // Filtrar itens
            let filtered = [];
            if (currentFilter === 'todas') {
                filtered = allOcorrencias;
            } else if (currentFilter === 'analise') {
                filtered = allOcorrencias.filter(o => o.status === 'EM_ANALISE');
            } else if (currentFilter === 'resolvido') {
                filtered = allOcorrencias.filter(o => o.status === 'RESOLVIDA' || o.status === 'RESOLVIDO');
            }

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="ct-section-card" style="text-align:center; padding:50px; color:var(--text-muted); font-size:14px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="margin: 0 auto 16px; color:var(--text-muted); display:block;">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Nenhuma ocorrência encontrada para este filtro.
                    </div>
                `;
                return;
            }

            // Ordenar por data mais recente
            filtered.sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));

            filtered.forEach(o => {
                const card = document.createElement('div');
                card.className = 'ct-section-card ct-reveal visible';
                
                const isResolvida = o.status === 'RESOLVIDA' || o.status === 'RESOLVIDO';
                const borderLeftColor = isResolvida ? 'var(--accent-green)' : 'var(--accent-orange)';
                card.style.borderLeft = `4px solid ${borderLeftColor}`;
                card.style.marginTop = '20px';

                // Badge do status
                const badgeStatusClass = isResolvida ? 'ct-badge-green' : 'ct-badge-orange';
                const statusText = isResolvida ? 'Resolvida' : 'Em Análise';
                const indicatorDotColor = isResolvida ? 'green' : 'orange';

                // Badge de urgência
                let urgencyBadgeClass = 'ct-badge-gray';
                let urgencyStyle = '';
                const urg = String(o.urgencia || 'Média').toLowerCase();

                if (urg === 'alta') {
                    urgencyBadgeClass = 'ct-badge-red';
                    urgencyStyle = 'font-weight:800; border: 1px solid var(--accent-red-light);';
                } else if (urg === 'média' || urg === 'media') {
                    urgencyBadgeClass = 'ct-badge-orange';
                    urgencyStyle = 'font-weight:800; border: 1px solid var(--accent-orange-light);';
                } else {
                    urgencyBadgeClass = 'ct-badge-gray';
                    urgencyStyle = 'font-weight:800;';
                }

                // Resposta e resolução
                let responseHtml = '';
                if (isResolvida) {
                    responseHtml = `<p style="margin-top:10px; color:var(--accent-green); font-weight:600;">✓ Resolução final: "${escapeHtml(o.respostaSuporte || 'Problema solucionado com intermediação do suporte.')}"</p>`;
                } else {
                    responseHtml = `<p style="margin-top:10px; color:var(--accent-blue); font-weight:600;">ℹ️ Resposta KarGO: "${escapeHtml(o.respostaSuporte || 'Nossa equipe está analisando as informações fornecidas.')}"</p>`;
                }

                // Botão de ação do card
                let btnAcaoHtml = '';
                if (isResolvida) {
                    btnAcaoHtml = `<button class="ct-btn ct-btn-outline ct-btn-sm" onclick="alert('Esta ocorrência já foi finalizada pelo suporte e encontra-se arquivada.')">Protocolo de Resolução</button>`;
                } else {
                    btnAcaoHtml = `
                        <button class="ct-btn ct-btn-secondary ct-btn-sm" onclick="alert('Funcionalidade de comentário direto em desenvolvimento. O suporte já está trabalhando no seu caso.')">Comentar</button>
                    `;
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span class="ct-badge ${badgeStatusClass}" style="margin-bottom:8px;">
                                <span class="status-indicator-dot ${indicatorDotColor}"></span>${statusText}
                            </span>
                            <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">Protocolo ${escapeHtml(o.protocolo)}</span>
                            <h3 style="font-size:16px; font-weight:800; color:var(--text-dark); margin-top:4px;">${escapeHtml(o.tipo)}</h3>
                            <p style="font-size:13px; color:var(--text-body); margin-top:6px;">
                                <strong>Frete:</strong> #KG-2026-${o.freteId} (${escapeHtml(o.rota)}) | <strong>Motorista:</strong> ${escapeHtml(o.motorista)}
                            </p>
                        </div>
                        <span class="ct-badge ${urgencyBadgeClass}" style="${urgencyStyle}">Urgência: ${escapeHtml(o.urgencia)}</span>
                    </div>

                    <div style="margin-top:16px; padding:12px; background:var(--bg-body); border-radius:var(--radius-sm); border:1px solid var(--border-light); font-size:13px;">
                        <p><strong>Descrição do Contratante:</strong> "${escapeHtml(o.descricao)}"</p>
                        ${responseHtml}
                    </div>

                    <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:10px;">
                        ${btnAcaoHtml}
                        <a href="detalhes-frete.html?id=${o.freteId}" class="ct-btn ct-btn-primary ct-btn-sm">Ver Frete</a>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Filtro pelas abas (Tabs)
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tabName = btn.getAttribute('data-tab') || btn.dataset.tab;
                if (tabName === 'tab-todas') {
                    currentFilter = 'todas';
                } else if (tabName === 'tab-analise') {
                    currentFilter = 'analise';
                } else if (tabName === 'tab-resolvido') {
                    currentFilter = 'resolvido';
                }
                
                renderOcorrencias();
            });
        });

        // Carregar dados inicialmente
        loadOcorrencias();
    });
})();
