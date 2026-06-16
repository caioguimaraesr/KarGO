/* ============================================
   KARGO — Lógica de Acompanhamento de Cargas
   Listagem de cargas e aceite de propostas via API
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoCargas] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        const embarcadorId = auth.getUserId();

        // Containers
        const containerTodas = document.getElementById('cargas-todas-container');
        const containerAtivas = document.getElementById('cargas-ativas-container');
        const containerPendentes = document.getElementById('cargas-pendentes-container');
        const containerConcluidas = document.getElementById('cargas-concluidas-container');

        // Badges das Tabs
        const btnTabTodas = document.getElementById('btn-tab-todas');
        const btnTabAtivas = document.getElementById('btn-tab-ativas');
        const btnTabPendentes = document.getElementById('btn-tab-pendentes');
        const btnTabConcluidas = document.getElementById('btn-tab-concluidas');

        // Modal de Edição
        const modalEditar = document.getElementById('modal-editar-carga');
        const editValueInput = document.getElementById('edit-cargo-value');
        const editWeightInput = document.getElementById('edit-cargo-weight');
        const editDescInput = document.getElementById('edit-cargo-desc');
        const btnSaveEdit = document.getElementById('btn-save-edit-cargo');
        let selectedCargaId = null;

        let todasCargas = [];
        let todosFretes = [];

        // Função de utilidade para escapar HTML
        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Carregar dados
        async function fetchDados() {
            try {
                // Obter cargas criadas por este embarcador
                const cargas = await api.listCargasByEmbarcador(embarcadorId);
                todasCargas = Array.isArray(cargas) ? cargas : [];

                // Obter todos os fretes/contratos vinculados ao embarcador
                const fretes = await api.getFretesByEmbarcador(embarcadorId);
                todosFretes = Array.isArray(fretes) ? fretes : [];

                processarERenderizar();
            } catch (error) {
                console.error('[KargoCargas] Erro ao carregar dados:', error);
                const errorHtml = `<div style="text-align:center; padding:40px; color:var(--accent-red); font-size:14px; width:100%;">Falha ao carregar informações do backend.</div>`;
                if (containerTodas) containerTodas.innerHTML = errorHtml;
            }
        }

        // Processar e categorizar
        function processarERenderizar() {
            const cargasAtivas = [];
            const cargasPendentes = [];
            const cargasConcluidas = [];

            todasCargas.forEach(carga => {
                // Encontrar fretes associados a essa carga pelo título
                // O motorista cria o frete com título "Proposta para carga {id}"
                const fretesCarga = todosFretes.filter(f => {
                    const match = String(f.titulo || '').match(/Proposta para carga (\d+)/);
                    return match && parseInt(match[1]) === carga.id;
                });

                // Determinar o status da carga baseada nos fretes
                const freteAtivo = fretesCarga.find(f => f.status === 'ACEITO' || f.status === 'EM_TRANSITO');
                const freteConcluido = fretesCarga.find(f => f.status === 'CONCLUIDO');
                const propostasAbertas = fretesCarga.filter(f => f.status === 'PUBLICADO');

                if (freteConcluido) {
                    cargasConcluidas.push({ carga, frete: freteConcluido });
                } else if (freteAtivo) {
                    cargasAtivas.push({ carga, frete: freteAtivo });
                } else {
                    // Sem fretes aceitos/concluidos = Pendente
                    cargasPendentes.push({ carga, propostas: propostasAbertas });
                }
            });

            // Atualizar contadores das Tabs
            if (btnTabTodas) btnTabTodas.textContent = `Todas (${todasCargas.length})`;
            if (btnTabAtivas) btnTabAtivas.textContent = `Ativas (${cargasAtivas.length})`;
            if (btnTabPendentes) btnTabPendentes.textContent = `Pendentes (${cargasPendentes.length})`;
            if (btnTabConcluidas) btnTabConcluidas.textContent = `Concluídas (${cargasConcluidas.length})`;

            // Renderizar cada aba
            renderAbaTodas(cargasAtivas, cargasPendentes, cargasConcluidas);
            renderAbaAtivas(cargasAtivas);
            renderAbaPendentes(cargasPendentes);
            renderAbaConcluidas(cargasConcluidas);
        }

        // --- RENDERIZADORES ---

        function renderAbaTodas(ativas, pendentes, concluidas) {
            if (!containerTodas) return;

            if (todasCargas.length === 0) {
                containerTodas.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px; width:100%;">Você não possui cargas cadastradas. Clique em "Nova Carga" para anunciar.</div>`;
                return;
            }

            let html = '';
            
            // Juntar todos os cards
            ativas.forEach(item => { html += renderCardAtiva(item.carga, item.frete); });
            pendentes.forEach(item => { html += renderCardPendente(item.carga, item.propostas); });
            concluidas.forEach(item => { html += renderCardConcluida(item.carga, item.frete); });

            containerTodas.innerHTML = html;
        }

        function renderAbaAtivas(ativas) {
            if (!containerAtivas) return;
            if (ativas.length === 0) {
                containerAtivas.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px; width:100%;">Nenhuma carga ativa em transporte no momento.</div>`;
                return;
            }
            containerAtivas.innerHTML = ativas.map(item => renderCardAtiva(item.carga, item.frete)).join('');
        }

        function renderAbaPendentes(pendentes) {
            if (!containerPendentes) return;
            if (pendentes.length === 0) {
                containerPendentes.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px; width:100%;">Nenhuma carga aguardando propostas.</div>`;
                return;
            }
            containerPendentes.innerHTML = pendentes.map(item => renderCardPendente(item.carga, item.propostas)).join('');
        }

        function renderAbaConcluidas(concluidas) {
            if (!containerConcluidas) return;
            if (concluidas.length === 0) {
                containerConcluidas.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px; width:100%;">Nenhuma carga finalizada.</div>`;
                return;
            }
            containerConcluidas.innerHTML = concluidas.map(item => renderCardConcluida(item.carga, item.frete)).join('');
        }

        // --- GERADORES DE CARDS (HTML) ---

        // 1. CARD ATIVA (Agendada ou Em Trânsito)
        function renderCardAtiva(carga, frete) {
            const pesoTon = (Number(carga.pesoKg || 0) / 1000).toFixed(1);
            const motoristaNome = escapeHtml(frete.motorista?.nome || 'Motorista');
            const dataColeta = api.formatDate(frete.dataPublicacao);
            const isEmTransito = frete.status === 'EM_TRANSITO';
            const badgeClass = isEmTransito ? 'ct-badge-green' : 'ct-badge-blue';
            const statusText = isEmTransito ? 'Em Trânsito' : 'Coleta Agendada';
            const dotClass = isEmTransito ? 'green' : 'blue';
            const progressPercent = isEmTransito ? '65%' : '10%';
            const progressLabel = isEmTransito ? '65% concluído' : 'Aguardando coleta';

            return `
                <div class="ct-cargo-card">
                    <div class="ct-cargo-header">
                        <div>
                            <span class="ct-badge ${badgeClass}"><span class="status-indicator-dot ${dotClass}"></span>${statusText}</span>
                            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Frete #KG-2026-${frete.id}</p>
                        </div>
                        <span style="font-size:20px;font-weight:900;color:var(--accent-green);">${api.formatCurrency(frete.valorFrete)}</span>
                    </div>
                    <div class="ct-cargo-route">
                        <div class="ct-route-point"><div class="ct-route-label">Origem</div><div class="ct-route-city">${escapeHtml(carga.origem)}</div></div>
                        <div class="ct-route-arrow">➔</div>
                        <div class="ct-route-point"><div class="ct-route-label">Destino</div><div class="ct-route-city">${escapeHtml(carga.destino)}</div></div>
                    </div>
                    <div class="ct-cargo-meta">
                        <span class="ct-meta-chip">${escapeHtml((carga.descricao || '').split('[')[0].trim())} - ${pesoTon}t</span>
                        <span class="ct-meta-chip">Coleta: ${dataColeta}</span>
                    </div>
                    <div class="ct-cargo-driver">
                        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;margin-right:10px;flex-shrink:0;">
                            ${motoristaNome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="ct-driver-name">${motoristaNome}</div>
                            <div class="ct-driver-rating">
                                <svg class="star-icon-inline" viewBox="0 0 24 24" style="fill:#F59E0B;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                Motorista Vinculado · Ativo
                            </div>
                        </div>
                    </div>
                    <div class="ct-progress-bar"><div class="ct-progress-fill blue" style="width:${progressPercent};"></div></div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:12px;">
                        <span>${progressLabel}</span><span>Previsão: ${api.formatDate(frete.dataEntrega)}</span>
                    </div>
                    <div class="ct-cargo-actions">
                        <a href="rastreamento.html?id=${frete.id}" class="ct-btn ct-btn-primary ct-btn-sm">Rastrear no Mapa</a>
                        <a href="chat.html?motorista=${frete.motorista?.id}&frete=${frete.id}" class="ct-btn ct-btn-secondary ct-btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Chat
                        </a>
                        <a href="detalhes-frete.html?id=${frete.id}" class="ct-btn ct-btn-secondary ct-btn-sm">Ver Painel</a>
                    </div>
                </div>
            `;
        }

        // 2. CARD PENDENTE (Carga anunciada aguardando propostas dos motoristas)
        function renderCardPendente(carga, propostas) {
            const pesoTon = (Number(carga.pesoKg || 0) / 1000).toFixed(1);
            const temPropostas = propostas && propostas.length > 0;
            const propostasCountText = temPropostas ? `${propostas.length} propostas recebidas` : 'Nenhuma proposta recebida';

            let propostasHtml = '';
            if (temPropostas) {
                propostasHtml = `
                    <div style="background:var(--bg-body); padding:16px; border-radius:var(--radius-md); margin-bottom:14px; border:1px solid var(--border-light); margin-top: 14px;">
                        <div style="font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:10px;">Propostas Recebidas de Motoristas:</div>
                        ${propostas.map(prop => {
                            const motNome = escapeHtml(prop.motorista?.nome || 'Motorista');
                            const veicDesc = escapeHtml(prop.veiculo ? `${prop.veiculo.marca} ${prop.veiculo.modelo} [${prop.veiculo.placa}]` : 'Veículo');
                            return `
                                <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid var(--border-light); margin-bottom:10px; gap: 10px;" class="proposal-item-api">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6b7280,#9ca3af);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">
                                            ${motNome.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span style="font-weight:700; font-size:13px; display:block; color:var(--text-dark);">${motNome}</span>
                                            <span style="font-size:11px; color:var(--text-muted); display:block;">
                                                <svg class="star-icon-inline" viewBox="0 0 24 24" style="fill:#F59E0B; width:10px; height:10px; display:inline-block;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                ${veicDesc}
                                            </span>
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <span style="font-weight:800; font-size:14px; color:var(--accent-green); white-space:nowrap;">${api.formatCurrency(prop.valorFrete)}</span>
                                        <button class="ct-btn ct-btn-success ct-btn-sm js-accept-proposal-btn" data-frete-id="${prop.id}" data-driver-name="${motNome}" style="padding:6px 12px;">Aceitar</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            return `
                <div class="ct-cargo-card">
                    <div class="ct-cargo-header">
                        <div>
                            <span class="ct-badge ct-badge-orange"><span class="status-indicator-dot orange"></span>Aguardando Propostas</span>
                            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Carga #KG-${carga.id}</p>
                        </div>
                        <span style="font-size:20px;font-weight:900;color:var(--accent-blue);">${api.formatCurrency(carga.valorSugerido)}</span>
                    </div>
                    <div class="ct-cargo-route">
                        <div class="ct-route-point"><div class="ct-route-label">Origem</div><div class="ct-route-city">${escapeHtml(carga.origem)}</div></div>
                        <div class="ct-route-arrow">➔</div>
                        <div class="ct-route-point"><div class="ct-route-label">Destino</div><div class="ct-route-city">${escapeHtml(carga.destino)}</div></div>
                    </div>
                    <div class="ct-cargo-meta">
                        <span class="ct-meta-chip">${escapeHtml((carga.descricao || '').split('[')[0].trim())} - ${pesoTon}t</span>
                        <span class="ct-meta-chip" style="color:var(--accent-blue); font-weight:700;">${propostasCountText}</span>
                    </div>
                    ${propostasHtml}
                    <div class="ct-cargo-actions" style="margin-top:12px;">
                        <button class="ct-btn ct-btn-primary ct-btn-sm js-edit-cargo-btn" data-carga-id="${carga.id}" data-value="${carga.valorSugerido}" data-weight="${pesoTon}" data-desc="${escapeHtml(carga.descricao)}">✏️ Editar Anúncio</button>
                        <button class="ct-btn ct-btn-outline ct-btn-sm js-delete-cargo-btn" data-carga-id="${carga.id}" style="border-color:rgba(239,68,68,0.2);color:var(--accent-red);">Excluir Carga</button>
                    </div>
                </div>
            `;
        }

        // 3. CARD CONCLUÍDA
        function renderCardConcluida(carga, frete) {
            const pesoTon = (Number(carga.pesoKg || 0) / 1000).toFixed(1);
            const motoristaNome = escapeHtml(frete.motorista?.nome || 'Motorista');

            return `
                <div class="ct-cargo-card">
                    <div class="ct-cargo-header">
                        <div>
                            <span class="ct-badge ct-badge-green"><span class="status-indicator-dot green"></span>Entregue e Finalizado</span>
                            <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Frete #KG-2026-${frete.id}</p>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:20px;font-weight:900;color:var(--accent-green);">${api.formatCurrency(frete.valorFrete)}</span>
                            <div style="font-size:11px;color:var(--accent-green);font-weight:600;">Pago</div>
                        </div>
                    </div>
                    <div class="ct-cargo-route">
                        <div class="ct-route-point"><div class="ct-route-label">Origem</div><div class="ct-route-city">${escapeHtml(carga.origem)}</div></div>
                        <div class="ct-route-arrow">➔</div>
                        <div class="ct-route-point"><div class="ct-route-label">Destino</div><div class="ct-route-city">${escapeHtml(carga.destino)}</div></div>
                    </div>
                    <div class="ct-cargo-meta">
                        <span class="ct-meta-chip">${escapeHtml((carga.descricao || '').split('[')[0].trim())} - ${pesoTon}t</span>
                        <span class="ct-meta-chip">Entregue em: ${api.formatDate(frete.dataEntrega)}</span>
                    </div>
                    <div class="ct-cargo-driver">
                        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;margin-right:10px;flex-shrink:0;">
                            ${motoristaNome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="ct-driver-name">${motoristaNome}</div>
                            <div class="ct-driver-rating">
                                <svg class="star-icon-inline" viewBox="0 0 24 24" style="fill:#F59E0B;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                Avaliação Concluída
                            </div>
                        </div>
                    </div>
                    <div class="ct-cargo-actions">
                        <button class="ct-btn ct-btn-secondary ct-btn-sm" onclick="alert('Comprovantes e recibos gerados no backend para download!')">Ver Comprovantes</button>
                    </div>
                </div>
            `;
        }

        // --- EVENT LISTENERS ---

        // Aceitar proposta
        document.body.addEventListener('click', async (e) => {
            const btn = e.target.closest('.js-accept-proposal-btn');
            if (btn) {
                e.preventDefault();
                const freteId = Number(btn.getAttribute('data-frete-id'));
                const driverName = btn.getAttribute('data-driver-name');

                if (confirm(`Deseja aceitar a proposta de ${driverName}? Isto fechará o contrato de frete.`)) {
                    btn.disabled = true;
                    btn.textContent = 'Processando...';

                    try {
                        // Atualizar status enviando payload completo para passar nas validacoes do backend
                        const freteAtual = await api.getFrete(freteId);
                        const payloadAtualizado = {
                            ...freteAtual,
                            status: 'ACEITO'
                        };
                        await api.updateFrete(freteId, payloadAtualizado);

                        // Para simular a limpeza do chat reativa, podemos salvar nos logs
                        alert(`Contrato firmado com sucesso! O motorista ${driverName} foi vinculado à sua carga.`);
                        
                        // Recarregar os dados
                        fetchDados();
                    } catch (error) {
                        alert(`Erro ao aceitar proposta: ${error.message}`);
                        btn.disabled = false;
                        btn.textContent = 'Aceitar';
                    }
                }
            }
        });

        // Excluir carga
        document.body.addEventListener('click', async (e) => {
            const btn = e.target.closest('.js-delete-cargo-btn');
            if (btn) {
                e.preventDefault();
                const cargaId = Number(btn.getAttribute('data-carga-id'));

                if (confirm('Tem certeza de que deseja excluir este anúncio de carga?')) {
                    try {
                        await api.deleteCarga(cargaId);
                        alert('Carga excluída com sucesso.');
                        fetchDados();
                    } catch (error) {
                        alert(`Falha ao excluir carga: ${error.message}`);
                    }
                }
            }
        });

        // Abrir Modal de Edição
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-edit-cargo-btn');
            if (btn) {
                e.preventDefault();
                selectedCargaId = Number(btn.getAttribute('data-carga-id'));
                const val = btn.getAttribute('data-value');
                const weight = btn.getAttribute('data-weight');
                const desc = btn.getAttribute('data-desc');

                if (editValueInput) editValueInput.value = val;
                if (editWeightInput) editWeightInput.value = weight;
                if (editDescInput) editDescInput.value = (desc || '').split('[')[0].trim();

                window.openModal('modal-editar-carga');
            }
        });

        // Salvar edição
        if (btnSaveEdit) {
            btnSaveEdit.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!selectedCargaId) return;

                const val = parseFloat(editValueInput.value.replace(/\./g, '').replace(',', '.')) || 0;
                const weight = parseFloat(editWeightInput.value) || 0;
                const desc = editDescInput.value.trim();

                if (!val || !weight || !desc) {
                    alert('Preencha todos os campos obrigatórios.');
                    return;
                }

                btnSaveEdit.disabled = true;
                btnSaveEdit.textContent = 'Salvando...';

                try {
                    // Buscar carga original para manter as rotas e o embarcador intactos
                    const originalCarga = todasCargas.find(c => c.id === selectedCargaId);
                    if (!originalCarga) throw new Error('Carga original não localizada.');

                    await api.updateCarga(selectedCargaId, {
                        descricao: `${desc} [Req: Truck | Editado]`,
                        origem: originalCarga.origem,
                        destino: originalCarga.destino,
                        pesoKg: weight * 1000,
                        valorSugerido: val,
                        ativa: originalCarga.ativa,
                        embarcador: { id: embarcadorId }
                    });

                    alert('Anúncio de carga atualizado com sucesso.');
                    window.closeModal('modal-editar-carga');
                    fetchDados();
                } catch (error) {
                    alert(`Falha ao atualizar carga: ${error.message}`);
                } finally {
                    btnSaveEdit.disabled = false;
                    btnSaveEdit.textContent = 'Salvar Alterações';
                }
            });
        }

        // Carregar dados no load inicial
        fetchDados();
    });
})();
