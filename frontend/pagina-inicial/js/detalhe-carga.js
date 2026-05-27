/* ============================================
   KARGO — Detalhe da Carga & Candidatura Lógica (Desktop-First)
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {

        // --- 1. TOAST NOTIFICATION SYSTEM ---
        function showToast(message, type = 'success') {
            const existingToast = document.querySelector('.kargo-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = `kargo-toast ${type}`;
            
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

            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                backgroundColor: '#0F172A',
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

            toast.offsetHeight; // Reflow
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3500);
        }

        // --- 2. FAVORITAR CARGA (HEART TOGGLE) ---
        const btnFavToggle = document.getElementById('btn-fav-toggle');
        const favText = document.getElementById('fav-text');

        if (btnFavToggle && favText) {
            btnFavToggle.addEventListener('click', () => {
                btnFavToggle.classList.toggle('active');
                
                const isFav = btnFavToggle.classList.contains('active');
                if (isFav) {
                    favText.textContent = 'Carga Salva ✓';
                    showToast('Carga adicionada aos seus favoritos!');
                    
                    // Efeito de pulso rápido
                    btnFavToggle.style.transform = 'scale(1.05)';
                    setTimeout(() => { btnFavToggle.style.transform = ''; }, 150);
                } else {
                    favText.textContent = 'Salvar Carga';
                    showToast('Carga removida dos favoritos', 'info');
                }
            });
        }

        // --- 3. COMPARTILHAR CARGA ---
        const btnShareTrigger = document.getElementById('btn-share-trigger');
        if (btnShareTrigger) {
            btnShareTrigger.addEventListener('click', async () => {
                const shareData = {
                    title: 'KarGO — Recife → Fortaleza',
                    text: 'Confira esta excelente carga disponível: Recife/PE para Fortaleza/CE com frete de R$ 4.500,00',
                    url: window.location.href
                };

                if (navigator.share) {
                    try {
                        await navigator.share(shareData);
                    } catch (err) {
                        // Compartilhamento cancelado ou falhou
                    }
                } else {
                    // Fallback: Copiar para área de transferência
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                        showToast('Link da carga copiado para o clipboard!');
                    } catch (e) {
                        showToast('Não foi possível copiar o link automaticamente.', 'info');
                    }
                }
            });
        }

        // --- 4. CONTROLE DO MODAL DE PROPOSTAS (ESTILO FREELANCER) ---
        const btnApplyTrigger = document.getElementById('btn-apply-trigger');
        const modalBackdrop = document.getElementById('proposal-modal-backdrop');
        const btnCloseModal = document.getElementById('js-close-modal');
        const btnCancelModal = document.getElementById('js-cancel-modal');
        const btnSubmitProposal = document.getElementById('js-submit-proposal');
        const modalSuggestedValue = document.getElementById('js-modal-suggested-val');
        const driverBidInput = document.getElementById('driver-bid-input');
        const successOverlay = document.getElementById('success-overlay');
        const successProposedVal = document.getElementById('js-success-proposed-val');

        let currentSuggestedAmount = '4.500,00';

        function openModal() {
            if (btnApplyTrigger && modalBackdrop) {
                const suggested = btnApplyTrigger.getAttribute('data-suggested') || '4.500,00';
                currentSuggestedAmount = suggested;

                if (modalSuggestedValue) {
                    modalSuggestedValue.textContent = `R$ ${suggested}`;
                }
                if (driverBidInput) {
                    driverBidInput.value = suggested;
                }

                modalBackdrop.classList.add('show');
                document.body.style.overflow = 'hidden';

                setTimeout(() => {
                    if (driverBidInput) driverBidInput.select();
                }, 100);
            }
        }

        function closeModal() {
            if (modalBackdrop) {
                modalBackdrop.classList.remove('show');
                document.body.style.overflow = '';
            }
        }

        function showSuccess(finalBid) {
            closeModal();
            setTimeout(() => {
                if (successProposedVal) {
                    successProposedVal.textContent = `R$ ${finalBid}`;
                }
                if (successOverlay) {
                    successOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }, 300);
        }

        if (btnApplyTrigger) btnApplyTrigger.addEventListener('click', openModal);
        if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
        if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    closeModal();
                }
            });
        }

        if (btnSubmitProposal) {
            btnSubmitProposal.addEventListener('click', () => {
                const finalBid = driverBidInput ? driverBidInput.value.trim() : currentSuggestedAmount;

                if (!finalBid) {
                    showToast('Por favor, informe um valor de frete válido.', 'error');
                    return;
                }

                const originalText = btnSubmitProposal.textContent;
                btnSubmitProposal.disabled = true;
                btnSubmitProposal.textContent = 'Enviando...';

                setTimeout(() => {
                    btnSubmitProposal.disabled = false;
                    btnSubmitProposal.textContent = originalText;
                    
                    // Obtém veículo selecionado
                    const selectVehicle = document.getElementById('driver-vehicle-select');
                    const vehicleName = selectVehicle ? selectVehicle.options[selectVehicle.selectedIndex].text : 'Scania R450 6x2 - Sider (Placa KRG-2E26)';
                    const plateMatch = vehicleName.match(/\((.*?)\)/);
                    const plate = plateMatch ? plateMatch[1] : 'KRG-2E26';
                    const modelName = vehicleName.split(' - ')[0];

                    showSuccess(finalBid);
                    showToast(`Sua proposta de R$ ${finalBid} com o veículo ${modelName} (${plate}) foi enviada com sucesso!`);
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

        // --- 5. CHAT COM EMBARCADOR ---
        const btnChatTrigger = document.getElementById('btn-chat-trigger');
        if (btnChatTrigger) {
            btnChatTrigger.addEventListener('click', () => {
                const originalContent = btnChatTrigger.innerHTML;
                
                // Transição de estado de clique
                btnChatTrigger.disabled = true;
                btnChatTrigger.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Conectando canal...
                `;
                
                // Injeta animação de spin no botão caso não tenha no CSS geral
                if (!document.getElementById('spin-keyframes-style')) {
                    const style = document.createElement('style');
                    style.id = 'spin-keyframes-style';
                    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
                    document.head.appendChild(style);
                }

                setTimeout(() => {
                    showToast('Canal seguro estabelecido com TransLog Nordeste!', 'success');
                    btnChatTrigger.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Chat Aberto
                    `;
                    
                    setTimeout(() => {
                        btnChatTrigger.disabled = false;
                        btnChatTrigger.innerHTML = originalContent;
                    }, 3000);
                }, 1500);
            });
        }

        // --- 6. SINO DE NOTIFICAÇÕES (TOPBAR) ---
        const notifBtn = document.querySelector('.mp-notification-btn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                const notifications = [
                    'TransLog Nordeste está aguardando candidatos de Categoria C/D.',
                    'Seu perfil de João Transportes foi aprovado por 3 embarcadores!',
                    'Lembre-se: O pagamento é assegurado pelo Escrow Inteligente da KarGO.'
                ];
                const msg = notifications[Math.floor(Math.random() * notifications.length)];
                showToast(msg, 'info');
            });
        }

        // --- 7. CARDS HOVER E MICRO-EFEITOS ---
        const dcCards = document.querySelectorAll('.dc-card');
        dcCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.04)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = '';
            });
        });
    });

})();
