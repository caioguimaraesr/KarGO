/* ============================================
   KARGO — Marketplace Logic (Desktop-First)
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        let selectedCargaData = null;

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function formatCurrency(value) {
            return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        function formatBidValue(value) {
            return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function parseBidValue(value) {
            const sanitized = String(value || '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
            const parsed = Number(sanitized);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        function toLocalDateTimeString(date) {
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return local.toISOString().slice(0, 19);
        }

        function toDateString(date) {
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return local.toISOString().slice(0, 10);
        }

        function setUserNameOnTopbar() {
            if (!api) return;
            const session = api.getSession();
            if (!session || !session.name) return;
            document.querySelectorAll('.user-name').forEach(el => {
                el.textContent = session.name;
            });
        }

        let todasCargas = [];

        function renderCargas(cargas) {
            const cardsContainer = document.getElementById('cards-container');
            const resultsCount = document.getElementById('results-count');
            if (!cardsContainer) return;

            if (cargas.length === 0) {
                cardsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted); font-size:14px; width:100%;">Nenhuma carga encontrada para os filtros aplicados.</div>`;
                if (resultsCount) resultsCount.textContent = '0';
                return;
            }

            const html = cargas.map((carga) => {
                const valor = Number(carga.valorSugerido || 0);
                const suggested = formatBidValue(valor);
                const origem = escapeHtml(carga.origem || 'Origem');
                const destino = escapeHtml(carga.destino || 'Destino');
                const descricao = escapeHtml(carga.descricao || 'Carga');
                const pesoTon = (Number(carga.pesoKg || 0) / 1000).toFixed(1);
                const embarcadorNome = escapeHtml(carga.embarcador && carga.embarcador.nome ? carga.embarcador.nome : 'Embarcador');
                const embarcadorId = carga.embarcador && carga.embarcador.id ? carga.embarcador.id : '';
                return `
                    <article class="cargo-card">
                        <div class="card-header-row">
                            <span class="card-tag info">NOVA CARGA</span>
                            <span class="card-publish-time">Publicada agora</span>
                        </div>
                        <div class="card-main-grid">
                            <div class="card-route-horizontal">
                                <div class="route-origin">
                                    <span class="route-label">ORIGEM</span>
                                    <h4 class="route-city">${origem}</h4>
                                    <span class="route-time">Saída imediata</span>
                                </div>
                                <div class="route-connector-container">
                                    <span class="route-distance">-</span>
                                    <div class="route-line-connector"></div>
                                </div>
                                <div class="route-destination">
                                    <span class="route-label">DESTINO</span>
                                    <h4 class="route-city">${destino}</h4>
                                    <span class="route-time">Consulte prazo</span>
                                </div>
                            </div>
                            <div class="card-specs-grid">
                                <div class="spec-tile"><span class="spec-label">PESO</span><span class="spec-value">${pesoTon} Ton</span></div>
                                <div class="spec-tile"><span class="spec-label">PRODUTO</span><span class="spec-value">${descricao}</span></div>
                                <div class="spec-tile"><span class="spec-label">PAGAMENTO</span><span class="spec-value">Na Entrega</span></div>
                                <div class="spec-tile"><span class="spec-label">STATUS</span><span class="spec-value">Disponível</span></div>
                            </div>
                            <div class="card-action-column">
                                <div class="price-box">
                                    <span class="price-label">FRETE SUGERIDO</span>
                                    <h3 class="price-value">${formatCurrency(valor)}</h3>
                                </div>
                                <div class="actions-group">
                                    <a href="detalhe-carga.html" class="card-btn-outline">Ver Detalhes</a>
                                    <button class="card-btn-primary js-propose-btn" data-suggested="${suggested}" data-origin="${origem}" data-destination="${destino}" data-carga-id="${carga.id}" data-embarcador-id="${embarcadorId}" data-peso-kg="${Number(carga.pesoKg || 0)}" data-descricao="${descricao}">Enviar Proposta</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-contractor-section">
                            <div class="contractor-info">
                                <div class="contractor-details">
                                    <div class="contractor-name-row"><span class="contractor-name">${embarcadorNome}</span></div>
                                    <div class="contractor-rating-row"><span class="rating-count">Embarcador vinculado à carga</span></div>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            cardsContainer.innerHTML = html;
            if (resultsCount) resultsCount.textContent = String(cargas.length);
            animateCards();
        }

        function applyFilters() {
            const originFilter = (document.getElementById('quick-origin')?.value || '').trim().toLowerCase();
            const destinationFilter = (document.getElementById('quick-destination')?.value || '').trim().toLowerCase();
            
            const truckEl = document.getElementById('quick-truck');
            const truckFilter = truckEl ? truckEl.value : 'todos';
            
            const weightSlider = document.getElementById('weight-slider');
            const maxWeightTon = weightSlider ? parseFloat(weightSlider.value) : 50;
            
            const priceMin = parseFloat(document.getElementById('price-min')?.value || '0') || 0;
            const priceMax = parseFloat(document.getElementById('price-max')?.value || '9999999') || 9999999;
            
            const selectedTypes = Array.from(document.querySelectorAll('input[name="carga-tipo"]:checked')).map(cb => cb.value);

            const filtered = todasCargas.filter(carga => {
                // Origem
                if (originFilter && !(carga.origem || '').toLowerCase().includes(originFilter)) return false;
                // Destino
                if (destinationFilter && !(carga.destino || '').toLowerCase().includes(destinationFilter)) return false;
                
                // Tipo de caminhão
                if (truckFilter !== 'todos') {
                    const desc = (carga.descricao || '').toLowerCase();
                    if (truckFilter === 'bau' && !desc.includes('bau') && !desc.includes('baú') && !desc.includes('seco')) return false;
                    if (truckFilter === 'sider' && !desc.includes('sider')) return false;
                    if (truckFilter === 'graneleiro' && !desc.includes('granel') && !desc.includes('soja') && !desc.includes('milho') && !desc.includes('adubo')) return false;
                    if (truckFilter === 'refrigerado' && !desc.includes('refriger') && !desc.includes('frio') && !desc.includes('congelado')) return false;
                }
                
                // Peso (filtro é tonelada máxima, no banco pesoKg é em Kg)
                const pesoKg = parseFloat(carga.pesoKg || 0);
                if (pesoKg > maxWeightTon * 1000) return false;
                
                // Preço
                const valor = parseFloat(carga.valorSugerido || 0);
                if (valor < priceMin || valor > priceMax) return false;
                
                // Checkbox Tipo de Carga
                if (selectedTypes.length > 0) {
                    const desc = (carga.descricao || '').toLowerCase();
                    const matchesType = selectedTypes.some(type => {
                        if (type === 'alimenticia') return desc.includes('aliment') || desc.includes('comida') || desc.includes('grão') || desc.includes('soja') || desc.includes('milho') || desc.includes('graneleiro');
                        if (type === 'construcao') return desc.includes('construc') || desc.includes('cimento') || desc.includes('tijolo') || desc.includes('ferro') || desc.includes('madeira') || desc.includes('telha');
                        if (type === 'quimica') return desc.includes('quimic') || desc.includes('combustivel') || desc.includes('oleo') || desc.includes('ácido') || desc.includes('fertilizante');
                        if (type === 'eletronicos') return desc.includes('eletron') || desc.includes('tv') || desc.includes('computador') || desc.includes('celular') || desc.includes('aparelho');
                        if (type === 'geral') return true;
                        return false;
                    });
                    if (!matchesType) return false;
                }
                
                return true;
            });

            renderCargas(filtered);
        }

        async function loadCargasFromBackend() {
            if (!api) return;

            try {
                const cargas = await api.listCargas();
                todasCargas = Array.isArray(cargas) ? cargas : [];
                applyFilters();
            } catch (error) {
                showToast(`Falha ao carregar cargas: ${error.message}`, 'error');
            }
        }

        // --- 1. SLIDER DE PESO ---
        const weightSlider = document.getElementById('weight-slider');
        const weightSliderVal = document.getElementById('weight-slider-val');

        if (weightSlider && weightSliderVal) {
            weightSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                weightSliderVal.textContent = val + 'T';
                simulateFiltering();
            });
        }

        // --- 2. DISTÂNCIA DO RAIO (TOGGLE CÍCLICO) ---
        const radiusLink = document.getElementById('btn-radius-trigger');
        const radiusOptions = [
            'Até 50 km da origem',
            'Até 100 km da origem',
            'Até 250 km da origem',
            'Raio ilimitado da origem'
        ];
        let currentRadiusIdx = 1; // Começa em 100 km

        if (radiusLink) {
            radiusLink.addEventListener('click', (e) => {
                e.preventDefault();
                currentRadiusIdx = (currentRadiusIdx + 1) % radiusOptions.length;
                radiusLink.textContent = radiusOptions[currentRadiusIdx];
                showToast(`Raio ajustado para: ${radiusOptions[currentRadiusIdx]}`);
                simulateFiltering();
            });
        }

        // --- 3. LIMPAR FILTROS ---
        const btnClearFilters = document.getElementById('btn-clear-filters');
        if (btnClearFilters) {
            btnClearFilters.addEventListener('click', () => {
                // Reset checkboxes
                const checkboxes = document.querySelectorAll('input[name="carga-tipo"]');
                checkboxes.forEach(cb => {
                    // Mantém apenas o de construção marcado por padrão
                    cb.checked = (cb.value === 'construcao');
                });

                // Reset slider
                if (weightSlider && weightSliderVal) {
                    weightSlider.value = 14;
                    weightSliderVal.textContent = '14T';
                }

                // Reset inputs de preço
                const priceMin = document.getElementById('price-min');
                const priceMax = document.getElementById('price-max');
                if (priceMin) priceMin.value = '';
                if (priceMax) priceMax.value = '';

                // Reset raio
                currentRadiusIdx = 1;
                if (radiusLink) radiusLink.textContent = radiusOptions[1];

                showToast('Filtros redefinidos para os padrões');
                simulateFiltering();
            });
        }

        // --- 4. ALTERNAR VISUALIZAÇÃO (LISTA / MAPA) ---
        const viewListBtn = document.getElementById('view-list-btn');
        const viewMapBtn = document.getElementById('view-map-btn');
        const cardsContainer = document.getElementById('cards-container');
        const miniMapCard = document.querySelector('.mini-map-card');

        if (viewListBtn && viewMapBtn) {
            viewListBtn.addEventListener('click', () => {
                viewListBtn.classList.add('active');
                viewMapBtn.classList.remove('active');
                showToast('Exibindo resultados em formato de Lista');
                if (cardsContainer) {
                    cardsContainer.style.opacity = '1';
                    cardsContainer.style.pointerEvents = 'all';
                }
            });

            viewMapBtn.addEventListener('click', () => {
                viewMapBtn.classList.add('active');
                viewListBtn.classList.remove('active');
                showToast('Exibindo resultados integrados no Mapa Principal');
                // Adiciona um efeito premium de pulso temporário na mini-imagem do mapa
                if (miniMapCard) {
                    miniMapCard.style.transform = 'scale(1.03)';
                    setTimeout(() => {
                        miniMapCard.style.transform = '';
                    }, 300);
                }
            });
        }

        // --- 5. BUSCA RÁPIDA SUPERIOR ---
        const btnSearchTrigger = document.getElementById('btn-search-trigger');
        const quickOrigin = document.getElementById('quick-origin');
        const quickDestination = document.getElementById('quick-destination');
        const quickTruck = document.getElementById('quick-truck');
        const quickDate = document.getElementById('quick-date');

        if (btnSearchTrigger) {
            btnSearchTrigger.addEventListener('click', () => {
                const origin = quickOrigin ? quickOrigin.value : '';
                const dest = quickDestination ? quickDestination.value : '';
                const truck = quickTruck ? quickTruck.options[quickTruck.selectedIndex].text : '';
                
                showToast(`Buscando cargas de: "${origin || 'Qualquer'}" para "${dest || 'Qualquer'}" (${truck})`);
                simulateFiltering();
            });
        }

        // --- 6. ANIMAÇÃO DE ENTRADA DOS CARDS ---
        function animateCards() {
            const cards = document.querySelectorAll('.cargo-card');
            cards.forEach((card, idx) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(15px)';
                card.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 80 * idx);
            });
        }

        // --- 7. SIMULAÇÃO DE FILTRAGEM ---
        function simulateFiltering() {
            applyFilters();
        }

        // --- 8. NOTIFICAÇÕES (SINO DE TOAST) ---
        const notificationBtn = document.querySelector('.mp-notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                const notifications = [
                    'Nova carga correspondente cadastrada de Campinas, SP!',
                    'Embarcador TransLog avaliou sua candidatura positivamente.',
                    'Seu pagamento da rota SP-RJ foi liberado para saque.'
                ];
                const randomNotif = notifications[Math.floor(Math.random() * notifications.length)];
                showToast(randomNotif, 'info');
                
                // Remove a bolinha vermelha se clicado
                const badge = notificationBtn.querySelector('.notification-badge');
                if (badge) {
                    badge.style.display = 'none';
                }
            });
        }

        // --- 9. MICRO-ANIMAÇÕES E EFEITO CLIQUE NOS CARDS ---
        const cargoCards = document.querySelectorAll('.cargo-card');
        cargoCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.06)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = '';
            });
        });

        // --- 10. CRIAÇÃO DE TOAST NOTIFICATION PREMIUM ---
        function showToast(message, type = 'success') {
            // Remove toast existente se houver
            const existingToast = document.querySelector('.kargo-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = `kargo-toast ${type}`;
            
            // Icone SVG de acordo com o tipo
            let iconSvg = '';
            if (type === 'success') {
                iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
            } else {
                iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
            }

            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon">${iconSvg}</span>
                    <span class="toast-text">${message}</span>
                </div>
            `;

            // Estilos do Toast via JS para evitar dependências ou falha de CSS
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                backgroundColor: '#0F172A', // Slate 900
                color: '#FFFFFF',
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                zIndex: '9999',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                opacity: '0',
                transform: 'translateY(10px)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            });

            document.body.appendChild(toast);

            // Reflow e Animação de entrada
            toast.offsetHeight;
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';

            // Timeout para sumir
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3500);
        }

        // --- 11. CONTROLE DO MODAL DE PROPOSTAS ---
        const modalBackdrop = document.getElementById('proposal-modal-backdrop');
        const btnCloseModal = document.getElementById('btn-close-modal');
        const btnCancelModal = document.getElementById('btn-cancel-modal');
        const btnSubmitProposal = document.getElementById('btn-submit-proposal');
        const modalSuggestedValue = document.getElementById('modal-suggested-value');
        const driverBidInput = document.getElementById('driver-bid-input');
        
        let currentSuggestedAmount = '';

        // Captura todos os botões de proposta dos cards
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-propose-btn');
            if (btn && modalBackdrop) {
                e.preventDefault();

                selectedCargaData = {
                    cargaId: Number(btn.getAttribute('data-carga-id') || 0),
                    embarcadorId: Number(btn.getAttribute('data-embarcador-id') || 0),
                    origem: btn.getAttribute('data-origin') || '',
                    destino: btn.getAttribute('data-destination') || '',
                    pesoKg: Number(btn.getAttribute('data-peso-kg') || 1000),
                    descricao: btn.getAttribute('data-descricao') || 'Frete'
                };

                // Pega dados do botão
                const suggested = btn.getAttribute('data-suggested') || '0,00';
                currentSuggestedAmount = suggested;

                // Preenche o modal
                if (modalSuggestedValue) {
                    modalSuggestedValue.textContent = `R$ ${suggested}`;
                }
                if (driverBidInput) {
                    driverBidInput.value = suggested;
                }

                // Abre o modal com animação
                modalBackdrop.classList.add('show');
                
                // Foco no input
                setTimeout(() => {
                    if (driverBidInput) driverBidInput.select();
                }, 100);
            }
        });

        // Fechar modal
        function closeModal() {
            if (modalBackdrop) {
                modalBackdrop.classList.remove('show');
            }
        }

        if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
        if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

        // Fecha se clicar fora do modal-wrapper
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    closeModal();
                }
            });
        }

        // Submissão da proposta
        if (btnSubmitProposal) {
            btnSubmitProposal.addEventListener('click', async () => {
                const finalBid = driverBidInput ? driverBidInput.value.trim() : currentSuggestedAmount;

                if (!finalBid) {
                    showToast('Por favor, informe um valor de frete válido.', 'error');
                    return;
                }

                if (!api) {
                    showToast('Cliente de API indisponivel.', 'error');
                    return;
                }

                const session = api.getSession();
                if (!session || session.type !== 'MOTORISTA') {
                    showToast('Faca login como motorista para enviar propostas.', 'error');
                    return;
                }

                if (!selectedCargaData || !selectedCargaData.embarcadorId) {
                    showToast('Nao foi possivel identificar os dados da carga.', 'error');
                    return;
                }

                // Efeito de carregamento
                const originalText = btnSubmitProposal.textContent;
                btnSubmitProposal.disabled = true;
                btnSubmitProposal.textContent = 'Enviando...';

                try {
                    const veiculos = await api.listVeiculos();
                    const veiculoAtivo = veiculos.find(v => v.motorista && v.motorista.id === session.id && v.ativo);

                    if (!veiculoAtivo) {
                        throw new Error('Nenhum veiculo ativo encontrado para este motorista.');
                    }

                    const now = new Date();
                    const entrega = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                    await api.createFrete({
                        titulo: `Proposta para carga ${selectedCargaData.cargaId || ''}`.trim(),
                        descricao: `Proposta enviada via marketplace para ${selectedCargaData.descricao}`,
                        origem: selectedCargaData.origem,
                        destino: selectedCargaData.destino,
                        pesoCargaKg: selectedCargaData.pesoKg || 1000,
                        valorFrete: parseBidValue(finalBid),
                        dataEntrega: toDateString(entrega),
                        dataPublicacao: toLocalDateTimeString(now),
                        status: 'PUBLICADO',
                        embarcador: { id: selectedCargaData.embarcadorId },
                        motorista: { id: session.id },
                        veiculo: { id: veiculoAtivo.id }
                    });

                    btnSubmitProposal.disabled = false;
                    btnSubmitProposal.textContent = originalText;
                    closeModal();
                    showToast(`Proposta enviada com sucesso para a carga ${selectedCargaData.cargaId}.`);
                } catch (error) {
                    btnSubmitProposal.disabled = false;
                    btnSubmitProposal.textContent = originalText;
                    showToast(`Falha ao enviar proposta: ${error.message}`, 'error');
                }
            });
        }

        // Função global de alteração de especificações do veículo no modal
        window.updateModalVehicleSpecs = function(value) {
            const specType = document.getElementById('modal-spec-type');
            const specCapacity = document.getElementById('modal-spec-capacity');
            const specPlate = document.getElementById('modal-spec-plate');

            if (value === 'scania') {
                if (specType) specType.textContent = 'Sider / Baú';
                if (specCapacity) specCapacity.textContent = '14 Ton';
                if (specPlate) specPlate.textContent = 'KRG-2E26';
            } else if (value === 'volvo') {
                if (specType) specType.textContent = 'Carreta Sider';
                if (specCapacity) specCapacity.textContent = '30 Ton';
                if (specPlate) specPlate.textContent = 'KRG-3A88';
            }
        };

        // --- 12. CONTROLE DO DRAWER DE FILTROS (MOBILE) ---
        const btnMobileFilterOpen = document.getElementById('btn-mobile-filter-open');
        const btnCloseFiltersDrawer = document.getElementById('btn-close-filters-drawer');
        const mpFiltersSidebar = document.querySelector('.mp-filters-sidebar');
        const mpFiltersOverlay = document.getElementById('mp-filters-overlay');

        if (btnMobileFilterOpen && mpFiltersSidebar && mpFiltersOverlay) {
            btnMobileFilterOpen.addEventListener('click', () => {
                mpFiltersSidebar.classList.add('active');
                mpFiltersOverlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Impede scroll na página atrás
            });

            const closeFilters = () => {
                mpFiltersSidebar.classList.remove('active');
                mpFiltersOverlay.classList.remove('active');
                document.body.style.overflow = '';
            };

            if (btnCloseFiltersDrawer) btnCloseFiltersDrawer.addEventListener('click', closeFilters);
            mpFiltersOverlay.addEventListener('click', closeFilters);
        }

        // Adiciona listeners para inputs de preço e checkboxes para filtrar em tempo real
        const priceMinInput = document.getElementById('price-min');
        const priceMaxInput = document.getElementById('price-max');
        if (priceMinInput) priceMinInput.addEventListener('input', applyFilters);
        if (priceMaxInput) priceMaxInput.addEventListener('input', applyFilters);

        document.querySelectorAll('input[name="carga-tipo"]').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });

        const qOrigin = document.getElementById('quick-origin');
        const qDest = document.getElementById('quick-destination');
        const qTruck = document.getElementById('quick-truck');
        if (qOrigin) qOrigin.addEventListener('input', applyFilters);
        if (qDest) qDest.addEventListener('input', applyFilters);
        if (qTruck) qTruck.addEventListener('change', applyFilters);

        // Executa animação inicial nos cards
        setUserNameOnTopbar();
        loadCargasFromBackend();
        animateCards();
    });

})();
