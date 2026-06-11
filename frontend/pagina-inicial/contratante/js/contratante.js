/* ============================================
   KARGO — Contratante Interactive JS
   Tabs, Wizard, Modals, Chat, Charts, Ratings
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initWizard();
    initModals();
    initStarRating();
    initTags();
    initOptionItems();
    initUrgencySelector();
    initRevealAnimations();
    initSidebar();
    initDataQueries();
});

async function initDataQueries() {
    const api = window.KargoApi;
    if (!api) return;

    const page = window.location.pathname.split('/').pop() || '';
    const dataPages = ['dashboard.html', 'publicar-carga.html', 'minhas-cargas.html', 'perfil.html'];
    if (!dataPages.includes(page)) return;

    const session = api.getSession();
    if (!session || !session.id || session.type !== 'EMBARCADOR') {
        window.location.href = '../login.html';
        return;
    }

    const hydratedSession = await api.hydrateSessionProfile();
    const activeSession = hydratedSession || session;
    const resolvedEmbarcadorId = await resolveEmbarcadorId(api, activeSession);
    activeSession.embarcadorId = resolvedEmbarcadorId;
    api.setSession(activeSession);

    document.querySelectorAll('.ct-user-name').forEach(el => {
        el.textContent = activeSession.name || 'Embarcador';
    });

    if (page === 'dashboard.html') {
        loadDashboardData(api, activeSession);
    }
    if (page === 'publicar-carga.html') {
        setupPublicarCarga(api, activeSession);
    }
    if (page === 'minhas-cargas.html') {
        loadMinhasCargas(api, activeSession);
    }
    if (page === 'perfil.html') {
        loadPerfilData(api, activeSession);
    }
}

function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

async function resolveEmbarcadorId(api, session) {
    if (!session || session.type !== 'EMBARCADOR') {
        return null;
    }

    try {
        const embarcadorById = await api.getEmbarcador(session.id);
        if (embarcadorById && embarcadorById.id != null) {
            return Number(embarcadorById.id);
        }
    } catch (error) {
        // fallback by email/phone below
    }

    try {
        const embarcadores = await api.listEmbarcadores();
        if (!Array.isArray(embarcadores) || embarcadores.length === 0) {
            return session.id;
        }

        const sessionEmail = String(session.email || '').trim().toLowerCase();
        const sessionPhoneDigits = normalizeDigits(session.phone || '');

        if (sessionEmail) {
            const matchByEmail = embarcadores.find((e) => String(e.email || '').trim().toLowerCase() === sessionEmail);
            if (matchByEmail && matchByEmail.id != null) {
                return Number(matchByEmail.id);
            }
        }

        if (sessionPhoneDigits) {
            const matchByPhone = embarcadores.find((e) => normalizeDigits(e.telefone || '') === sessionPhoneDigits);
            if (matchByPhone && matchByPhone.id != null) {
                return Number(matchByPhone.id);
            }
        }
    } catch (error) {
        // last fallback below
    }

    return session.id;
}

function formatMoneyBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCurrencyInput(value) {
    const normalized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parsePtNumberInput(value) {
    const normalized = String(value || '').trim().replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatCpfCnpj(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value || '';
}

async function loadDashboardData(api, session) {
    try {
        const embarcadorId = session.embarcadorId || session.id;
        const [cargasRaw, fretesRaw] = await Promise.all([
            api.listCargas({ embarcadorId: embarcadorId }),
            api.listFretes({ embarcadorId: embarcadorId })
        ]);
        const cargas = Array.isArray(cargasRaw) ? cargasRaw : [];
        const fretes = Array.isArray(fretesRaw) ? fretesRaw : [];

        const ativos = cargas.filter(c => c.ativa !== false).length;
        const totalGastos = cargas.reduce((acc, c) => acc + Number(c.valorSugerido || 0), 0);
        const proxima = fretes.find(f => f.status === 'PUBLICADO' || f.status === 'ACEITO' || f.status === 'EM_TRANSITO');

        const greeting = document.getElementById('ct-page-greeting');
        if (greeting) greeting.textContent = `Olá, ${session.name || 'Embarcador'}`;

        const statAtivos = document.getElementById('ct-stat-ativos');
        if (statAtivos) statAtivos.textContent = String(ativos);

        const statGastos = document.getElementById('ct-stat-gastos');
        if (statGastos) statGastos.textContent = formatMoneyBRL(totalGastos);

        const statProxima = document.getElementById('ct-stat-proxima');
        if (statProxima) {
            statProxima.textContent = proxima ? `${proxima.origem || '-'} -> ${proxima.destino || '-'}` : 'Sem coletas';
        }

        const cargasList = document.getElementById('ct-dashboard-cargas-list');
        if (cargasList) {
            const card = document.getElementById('ct-dashboard-cargas-card');
            if (card) {
                card.querySelectorAll('.ct-cargo-card').forEach((legacyCard) => {
                    if (!cargasList.contains(legacyCard)) {
                        legacyCard.remove();
                    }
                });
            }

            if (!cargas.length) {
                cargasList.innerHTML = '<div style="padding:16px; border:1px solid var(--border-light); border-radius:var(--radius-md); color:var(--text-muted);">Nenhuma carga encontrada no banco de dados.</div>';
            } else {
                cargasList.innerHTML = cargas.slice(0, 3).map(carga => `
                    <div class="ct-cargo-card">
                        <div class="ct-cargo-header">
                            <div>
                                <span class="ct-badge ${carga.ativa !== false ? 'ct-badge-green' : 'ct-badge-orange'}">${carga.ativa !== false ? 'Ativa' : 'Inativa'}</span>
                                <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Carga #${carga.id}</p>
                            </div>
                            <span style="font-size:20px;font-weight:900;color:var(--accent-green);">${formatMoneyBRL(carga.valorSugerido)}</span>
                        </div>
                        <div class="ct-cargo-route">
                            <div class="ct-route-point"><div class="ct-route-label">Origem</div><div class="ct-route-city">${carga.origem || '-'}</div></div>
                            <div class="ct-route-arrow">-></div>
                            <div class="ct-route-point"><div class="ct-route-label">Destino</div><div class="ct-route-city">${carga.destino || '-'}</div></div>
                        </div>
                        <div class="ct-cargo-meta">
                            <span class="ct-meta-chip">${carga.descricao || 'Sem descricao'}</span>
                            <span class="ct-meta-chip">${Number(carga.pesoKg || 0)} kg</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        const propostasList = document.getElementById('ct-dashboard-propostas-list');
        if (propostasList) {
            const propostas = fretes.filter(f => f.status === 'PUBLICADO').slice(0, 4);
            if (!propostas.length) {
                propostasList.innerHTML = '<div style="padding:12px; color:var(--text-muted);">Nenhuma proposta pendente encontrada.</div>';
            } else {
                propostasList.innerHTML = propostas.map(frete => `
                    <div class="ct-proposal-card" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid var(--border-light); margin-bottom:8px;">
                        <div>
                            <div class="ct-proposal-name" style="font-weight:700; font-size:14px;">Motorista #${frete.motorista ? frete.motorista.id : '-'}</div>
                            <div class="ct-proposal-detail" style="font-size:12px; color:var(--text-muted);">${frete.origem || '-'} -> ${frete.destino || '-'} · Frete #${frete.id}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="ct-proposal-value" style="font-weight:800; color:var(--text-dark); font-size:16px;">${formatMoneyBRL(frete.valorFrete)}</div>
                            <button type="button" class="ct-btn ct-btn-success ct-btn-sm js-proposta-action" data-frete-id="${frete.id}" data-acao="aceitar">Aceitar</button>
                            <button type="button" class="ct-btn ct-btn-secondary ct-btn-sm js-proposta-action" data-frete-id="${frete.id}" data-acao="negar">Negar</button>
                        </div>
                    </div>
                `).join('');

                if (!propostasList.dataset.propostaBound) {
                    propostasList.dataset.propostaBound = '1';
                    propostasList.addEventListener('click', async (event) => {
                        const button = event.target.closest('.js-proposta-action');
                        if (!button) return;

                        const freteId = Number(button.getAttribute('data-frete-id') || 0);
                        const acao = button.getAttribute('data-acao');
                        if (!freteId || !acao) return;

                        const aceitar = acao === 'aceitar';
                        const originalLabel = button.textContent;
                        button.disabled = true;
                        button.textContent = aceitar ? 'Aceitando...' : 'Negando...';

                        try {
                            await api.respondFreteProposal(freteId, aceitar);
                            await loadDashboardData(api, session);
                        } catch (error) {
                            alert('Falha ao responder proposta: ' + (error.message || 'erro inesperado'));
                        } finally {
                            button.disabled = false;
                            button.textContent = originalLabel;
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard do contratante:', error);
    }
}

async function setupPublicarCarga(api, session) {
    const btn = document.getElementById('pc-publish-btn')
        || document.querySelector('#step-5 #pc-publish-btn')
        || document.querySelector('#step-5 .ct-btn-success');
    if (!btn) return;

    function pickFieldValueById(id) {
        const field = document.getElementById(id);
        return field && typeof field.value === 'string' ? field.value : '';
    }

    function pickWizardPublishValues() {
        const origemEndereco = pickFieldValueById('pc-origem');
        const destinoEndereco = pickFieldValueById('pc-destino');
        const origemCep = pickFieldValueById('pc-cep-origem');
        const destinoCep = pickFieldValueById('pc-cep-destino');

        const descricao = pickFieldValueById('pc-descricao').trim();
        const pesoRaw = pickFieldValueById('pc-peso');
        const origem = (origemEndereco || origemCep || '').trim();
        const destino = (destinoEndereco || destinoCep || '').trim();
        const valorRaw = pickFieldValueById('pc-valor');

        return {
            descricao,
            origem,
            destino,
            peso: parsePtNumberInput(pesoRaw || ''),
            valor: parseCurrencyInput(valorRaw || '')
        };
    }

    try {
        const embarcadorId = session.embarcadorId || session.id;
        const cargasRaw = await api.listCargas({ embarcadorId: embarcadorId });
        const cargas = Array.isArray(cargasRaw) ? cargasRaw : [];
        if (cargas.length) {
            const media = cargas.reduce((acc, c) => acc + Number(c.valorSugerido || 0), 0) / cargas.length;
            const suggestMin = document.getElementById('pc-suggest-min');
            const suggestMax = document.getElementById('pc-suggest-max');
            if (suggestMin) suggestMin.textContent = formatMoneyBRL(media * 0.9);
            if (suggestMax) suggestMax.textContent = formatMoneyBRL(media * 1.1);
        }
    } catch (error) {
        console.error('Falha ao buscar sugestao de valores:', error);
    }

    btn.addEventListener('click', async () => {
        const values = pickWizardPublishValues();
        const descricao = values.descricao;
        const origem = values.origem;
        const destino = values.destino;
        const peso = values.peso;
        const valor = values.valor;

        if (!descricao.trim() || !origem.trim() || !destino.trim() || peso <= 0 || valor <= 0) {
            alert('Preencha descricao, origem, destino, peso e valor para publicar a carga.');
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Publicando...';

        try {
            await api.createCarga({
                descricao: descricao.trim(),
                origem: origem.trim(),
                destino: destino.trim(),
                pesoKg: peso,
                valorSugerido: valor,
                ativa: true,
                embarcador: { id: session.embarcadorId || session.id }
            });

            alert('Carga publicada com sucesso no banco de dados.');
            window.location.href = 'minhas-cargas.html';
        } catch (error) {
            alert('Falha ao publicar carga: ' + (error.message || 'erro inesperado'));
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

async function loadMinhasCargas(api, session) {
    const listContainer = document.getElementById('ct-minhas-cargas-list');
    if (!listContainer) return;

    function buildCargoCard(carga) {
        return `
            <div class="ct-cargo-card">
                <div class="ct-cargo-header">
                    <div>
                        <span class="ct-badge ${carga.ativa !== false ? 'ct-badge-green' : 'ct-badge-orange'}">${carga.ativa !== false ? 'Ativa' : 'Pendente'}</span>
                        <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Carga #${carga.id}</p>
                    </div>
                    <span style="font-size:20px;font-weight:900;color:var(--accent-green);">${formatMoneyBRL(carga.valorSugerido)}</span>
                </div>
                <div class="ct-cargo-route">
                    <div class="ct-route-point"><div class="ct-route-label">Origem</div><div class="ct-route-city">${carga.origem || '-'}</div></div>
                    <div class="ct-route-arrow">-></div>
                    <div class="ct-route-point"><div class="ct-route-label">Destino</div><div class="ct-route-city">${carga.destino || '-'}</div></div>
                </div>
                <div class="ct-cargo-meta">
                    <span class="ct-meta-chip">${carga.descricao || 'Sem descricao'}</span>
                    <span class="ct-meta-chip">${Number(carga.pesoKg || 0)} kg</span>
                </div>
                <div class="ct-cargo-actions">
                    <a href="publicar-carga.html" class="ct-btn ct-btn-secondary ct-btn-sm">Editar</a>
                </div>
            </div>
        `;
    }

    function buildEmptyState(message) {
        return `<div style="padding:16px; border:1px solid var(--border-light); border-radius:var(--radius-md); color:var(--text-muted);">${message}</div>`;
    }

    const tabTodasContent = document.getElementById('tab-todas');
    if (tabTodasContent) {
        tabTodasContent.querySelectorAll('.ct-cargo-card').forEach((legacyCard) => {
            if (!listContainer.contains(legacyCard)) {
                legacyCard.remove();
            }
        });
    }

    try {
        const embarcadorId = session.embarcadorId || session.id;
        const [cargasRaw, fretesRaw] = await Promise.all([
            api.listCargas({ embarcadorId: embarcadorId }),
            api.listFretes({ embarcadorId: embarcadorId })
        ]);
        const cargas = Array.isArray(cargasRaw) ? cargasRaw : [];
        const fretes = Array.isArray(fretesRaw) ? fretesRaw : [];

        const ativas = cargas.filter(c => c.ativa !== false).length;
        const pendentes = cargas.filter(c => c.ativa === false).length;
        const concluidas = fretes.filter(f => f.status === 'CONCLUIDO').length;

        const tabTodas = document.getElementById('ct-tab-todas');
        const tabAtivas = document.getElementById('ct-tab-ativas');
        const tabPendentes = document.getElementById('ct-tab-pendentes');
        const tabConcluidas = document.getElementById('ct-tab-concluidas');
        const tabAtivasContent = document.getElementById('tab-ativas');
        const tabPendentesContent = document.getElementById('tab-pendentes');
        const tabConcluidasContent = document.getElementById('tab-concluidas');

        const cargasAtivas = cargas.filter(c => c.ativa !== false);
        const cargasPendentes = cargas.filter(c => c.ativa === false);

        if (tabTodas) tabTodas.textContent = `Todas (${cargas.length})`;
        if (tabAtivas) tabAtivas.textContent = `Ativas (${ativas})`;
        if (tabPendentes) tabPendentes.textContent = `Pendentes (${pendentes})`;
        if (tabConcluidas) tabConcluidas.textContent = `Concluidas (${concluidas})`;

        if (tabAtivasContent) {
            tabAtivasContent.innerHTML = cargasAtivas.length
                ? cargasAtivas.map(buildCargoCard).join('')
                : buildEmptyState('Nenhuma carga ativa encontrada no banco de dados.');
        }

        if (tabPendentesContent) {
            tabPendentesContent.innerHTML = cargasPendentes.length
                ? cargasPendentes.map(buildCargoCard).join('')
                : buildEmptyState('Nenhuma carga pendente encontrada no banco de dados.');
        }

        if (tabConcluidasContent) {
            const concluidasRows = fretes.filter(f => f.status === 'CONCLUIDO');
            tabConcluidasContent.innerHTML = concluidasRows.length
                ? concluidasRows.map((frete) => `
                    <div class="ct-cargo-card">
                        <div class="ct-cargo-header">
                            <div>
                                <span class="ct-badge ct-badge-green">Concluida</span>
                                <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Frete #${frete.id}</p>
                            </div>
                            <span style="font-size:20px;font-weight:900;color:var(--accent-green);">${formatMoneyBRL(frete.valorFrete)}</span>
                        </div>
                        <div class="ct-cargo-route">
                            <div class="ct-route-point"><div class="ct-route-label">Origem</div><div class="ct-route-city">${frete.origem || '-'}</div></div>
                            <div class="ct-route-arrow">-></div>
                            <div class="ct-route-point"><div class="ct-route-label">Destino</div><div class="ct-route-city">${frete.destino || '-'}</div></div>
                        </div>
                    </div>
                `).join('')
                : buildEmptyState('Nenhum frete concluido encontrado no banco de dados.');
        }

        if (!cargas.length) {
            listContainer.innerHTML = buildEmptyState('Nenhuma carga cadastrada no banco de dados.');
            return;
        }

        listContainer.innerHTML = cargas.map(buildCargoCard).join('');
    } catch (error) {
        listContainer.innerHTML = '<div style="padding:16px; border:1px solid var(--border-light); border-radius:var(--radius-md); color:var(--accent-red);">Falha ao consultar cargas no backend.</div>';
        console.error('Erro ao carregar minhas cargas:', error);
    }
}

async function loadPerfilData(api, session) {
    try {
        const embarcadorId = session.embarcadorId || session.id;
        const [embarcador, cargasRaw, fretesRaw] = await Promise.all([
            api.getEmbarcador(embarcadorId),
            api.listCargas({ embarcadorId: embarcadorId }),
            api.listFretes({ embarcadorId: embarcadorId })
        ]);

        const cargas = Array.isArray(cargasRaw) ? cargasRaw : [];
        const fretes = Array.isArray(fretesRaw) ? fretesRaw : [];

        const perfilNome = document.getElementById('ct-perfil-nome');
        const perfilCnpj = document.getElementById('ct-perfil-cnpj');
        const razaoSocial = document.getElementById('ct-razao-social');
        const telefone = document.getElementById('ct-telefone');
        const email = document.getElementById('ct-email');
        const inscricao = document.getElementById('ct-inscricao');
        const endereco = document.getElementById('ct-endereco');
        const statFretes = document.getElementById('ct-stat-fretes');
        const statPontualidade = document.getElementById('ct-stat-pontualidade');
        const statOcorrencias = document.getElementById('ct-stat-ocorrencias');
        const perfilRating = document.getElementById('ct-perfil-rating');

        if (perfilNome) perfilNome.textContent = embarcador.nome || session.name || 'Embarcador';
        if (perfilCnpj) perfilCnpj.textContent = `CNPJ: ${formatCpfCnpj(embarcador.cpfCnpj || '')}`;
        if (razaoSocial) razaoSocial.textContent = embarcador.nome || '-';
        if (telefone) telefone.textContent = embarcador.telefone || '-';
        if (email) email.textContent = embarcador.email || '-';
        if (inscricao) inscricao.textContent = formatCpfCnpj(embarcador.cpfCnpj || '-');
        if (endereco) endereco.textContent = 'Endereco cadastral indisponivel no backend atual';

        if (statFretes) statFretes.textContent = String(fretes.length);

        const concluidos = fretes.filter(f => f.status === 'CONCLUIDO').length;
        const pontualidade = fretes.length ? ((concluidos / fretes.length) * 100).toFixed(1) : '0.0';
        if (statPontualidade) statPontualidade.textContent = `${pontualidade}%`;

        if (statOcorrencias) statOcorrencias.textContent = '0';
        if (perfilRating) perfilRating.textContent = fretes.length ? '4.8 de Avaliação' : 'Sem avaliações ainda';
    } catch (error) {
        console.error('Erro ao carregar perfil do embarcador:', error);
    }
}

/* === TABS === */
function initTabs() {
    document.querySelectorAll('.ct-tabs').forEach(tabGroup => {
        const tabs = tabGroup.querySelectorAll('.ct-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                if (target) {
                    const parent = tabGroup.closest('.ct-section-card') || tabGroup.parentElement;
                    parent.querySelectorAll('.ct-tab-content').forEach(c => {
                        c.style.display = 'none';
                    });
                    const content = parent.querySelector('#' + target);
                    if (content) content.style.display = 'block';
                }
            });
        });
    });
}

/* === WIZARD === */
function initWizard() {
    const wizard = document.querySelector('.ct-wizard');
    if (!wizard) return;

    window.wizardCurrentStep = 1;
    const totalSteps = wizard.querySelectorAll('.ct-wizard-panel').length;

    window.wizardNext = function() {
        if (window.wizardCurrentStep < totalSteps) {
            window.wizardCurrentStep++;
            updateWizard(wizard);
        }
    };

    window.wizardPrev = function() {
        if (window.wizardCurrentStep > 1) {
            window.wizardCurrentStep--;
            updateWizard(wizard);
        }
    };

    updateWizard(wizard);
}

function updateWizard(wizard) {
    const step = window.wizardCurrentStep;
    
    // Update dots
    wizard.querySelectorAll('.ct-wizard-dot').forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i + 1 === step) dot.classList.add('active');
        else if (i + 1 < step) dot.classList.add('completed');
    });

    // Update lines
    wizard.querySelectorAll('.ct-wizard-line').forEach((line, i) => {
        line.classList.toggle('completed', i + 1 < step);
    });

    // Update panels
    wizard.querySelectorAll('.ct-wizard-panel').forEach((panel, i) => {
        panel.classList.toggle('active', i + 1 === step);
    });
}

/* === MODALS === */
function initModals() {
    // Close on backdrop click
    document.querySelectorAll('.ct-modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('show');
            }
        });
    });

    // Close buttons
    document.querySelectorAll('.ct-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.ct-modal-backdrop').classList.remove('show');
        });
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.ct-modal-backdrop.show').forEach(m => {
                m.classList.remove('show');
            });
        }
    });
}

window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
};

/* === STAR RATING === */
function initStarRating() {
    document.querySelectorAll('.ct-star-rating').forEach(container => {
        const stars = container.querySelectorAll('.ct-star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i <= index);
                });
                container.dataset.rating = index + 1;
            });

            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    s.style.color = i <= index ? '#F59E0B' : '#E2E8F0';
                });
            });
        });

        container.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                s.style.color = s.classList.contains('active') ? '#F59E0B' : '#E2E8F0';
            });
        });
    });
}

/* === TAGS === */
function initTags() {
    document.querySelectorAll('.ct-tags').forEach(container => {
        container.querySelectorAll('.ct-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('selected');
            });
        });
    });
}

/* === OPTION ITEMS (Radio/Checkbox style) === */
function initOptionItems() {
    document.querySelectorAll('.ct-option-list').forEach(list => {
        const items = list.querySelectorAll('.ct-option-item');
        const isRadio = list.dataset.type === 'radio';
        
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT') return;
                
                if (isRadio) {
                    items.forEach(i => {
                        i.classList.remove('selected');
                        const radio = i.querySelector('input[type="radio"]');
                        if (radio) radio.checked = false;
                    });
                }
                
                item.classList.toggle('selected');
                const input = item.querySelector('input');
                if (input) input.checked = item.classList.contains('selected');
            });
        });
    });
}

/* === URGENCY SELECTOR === */
function initUrgencySelector() {
    document.querySelectorAll('.ct-urgency-selector').forEach(container => {
        container.querySelectorAll('.ct-urgency-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.ct-urgency-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    });
}

/* === REVEAL ANIMATIONS === */
function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.ct-reveal').forEach(el => observer.observe(el));
}

/* === SIDEBAR ACTIVE STATE === */
function initSidebar() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.ct-menu-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/* === CHAT (SEM MOCK DE RESPOSTA AUTOMATICA) === */
window.sendChatMessage = function() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const messagesContainer = document.querySelector('.ct-chat-messages');
    if (!messagesContainer) return;

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    // Add sent message
    const bubble = document.createElement('div');
    bubble.className = 'ct-chat-bubble sent';
    bubble.innerHTML = `${input.value}<div class="ct-chat-bubble-time">${timeStr} ✓✓</div>`;
    messagesContainer.appendChild(bubble);

    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const status = document.createElement('div');
    status.className = 'ct-chat-bubble received';
    status.innerHTML = `Mensagem enviada. A resposta depende da integracao de chat em tempo real.<div class="ct-chat-bubble-time">${timeStr}</div>`;
    messagesContainer.appendChild(status);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

/* === CONFIRM DELIVERY FLOW === */
window.showConfirmSuccess = function() {
    const form = document.getElementById('confirm-form');
    const success = document.getElementById('confirm-success');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
};

/* === REPORT PROBLEM FLOW === */
window.showReportSuccess = function() {
    const form = document.getElementById('report-form');
    const success = document.getElementById('report-success');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
};

/* === UTILITY: Format Currency === */
window.formatCurrency = function(input) {
    let value = input.value.replace(/\D/g, '');
    value = (parseInt(value, 10) / 100).toFixed(2);
    value = value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = value;
};
