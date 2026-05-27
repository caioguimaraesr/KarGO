/* ============================================
   KARGO — Marketplace Logic (Desktop-First)
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        
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
            const resultsCount = document.getElementById('results-count');
            const cards = document.querySelectorAll('.cargo-card');
            
            // Efeito visual nos cards
            cards.forEach(card => {
                card.style.opacity = '0.3';
                card.style.transform = 'scale(0.98)';
            });

            setTimeout(() => {
                // Simula contagem variando um pouco
                if (resultsCount) {
                    const randomCount = Math.floor(Math.random() * 20) + 15;
                    resultsCount.textContent = randomCount;
                }
                
                // Restaura cards com efeito de entrada suave
                cards.forEach((card, idx) => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                    card.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                    
                    // Simula esconder o card de Rota de Retorno se o peso for muito alto
                    if (weightSlider && parseInt(weightSlider.value) > 25 && card.classList.contains('return')) {
                        card.style.display = 'none';
                    } else {
                        card.style.display = 'block';
                    }
                });

                animateCards();
            }, 300);
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
            btnSubmitProposal.addEventListener('click', () => {
                const finalBid = driverBidInput ? driverBidInput.value.trim() : currentSuggestedAmount;

                if (!finalBid) {
                    showToast('Por favor, informe um valor de frete válido.', 'error');
                    return;
                }

                // Efeito de carregamento
                const originalText = btnSubmitProposal.textContent;
                btnSubmitProposal.disabled = true;
                btnSubmitProposal.textContent = 'Enviando...';

                setTimeout(() => {
                    // Restaura botão e fecha modal
                    btnSubmitProposal.disabled = false;
                    btnSubmitProposal.textContent = originalText;
                    closeModal();

                    // Obtém veículo selecionado
                    const selectVehicle = document.getElementById('driver-vehicle-select');
                    const vehicleName = selectVehicle ? selectVehicle.options[selectVehicle.selectedIndex].text : 'Scania R450 6x2 - Sider (Placa KRG-2E26)';
                    const plateMatch = vehicleName.match(/\((.*?)\)/);
                    const plate = plateMatch ? plateMatch[1] : 'KRG-2E26';
                    const modelName = vehicleName.split(' - ')[0];

                    // Toast de sucesso premium detalhando o veículo
                    showToast(`Proposta Enviada!`, `Sua proposta de R$ ${finalBid} com o veículo ${modelName} (${plate}) foi enviada com sucesso!`);
                }, 800);
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

        // Executa animação inicial nos cards
        animateCards();
    });

})();
