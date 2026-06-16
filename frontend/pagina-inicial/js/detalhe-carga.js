/* ============================================
   KARGO — Detalhe da Carga & Candidatura Lógica (Desktop-First)
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        let selectedCargaData = null;

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

        function truncateText(value, maxLen) {
            const text = String(value || '').trim();
            if (!maxLen || text.length <= maxLen) return text;
            return text.slice(0, maxLen - 3).trimEnd() + '...';
        }

        function toLocalDateTimeString(date) {
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return local.toISOString().slice(0, 19);
        }

        function toDateString(date) {
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            return local.toISOString().slice(0, 10);
        }

        function setTextById(id, value) {
            const el = document.getElementById(id);
            if (el && value !== undefined && value !== null && String(value).trim() !== '') {
                el.textContent = String(value);
            }
        }

        function classifyCargaBadge(descricao) {
            const d = String(descricao || '').toLowerCase();
            if (d.includes('refriger')) return 'Carga Refrigerada';
            if (d.includes('granel') || d.includes('soja') || d.includes('milho')) return 'Carga Granel';
            if (d.includes('quimic') || d.includes('combust')) return 'Carga Química';
            return 'Carga Seca';
        }

        function applyCargaToPage(carga) {
            if (!carga) return;

            const origem = carga.origem || 'Origem';
            const destino = carga.destino || 'Destino';
            const descricao = carga.descricao || 'Carga';
            const pesoKg = Number(carga.pesoKg || 0);
            const pesoTon = (pesoKg / 1000);
            const pesoTonTxt = `${pesoTon.toFixed(1)} Ton`;
            const pesoSpecTxt = `${pesoKg.toLocaleString('pt-BR')} kg (${pesoTon.toFixed(1)} Ton)`;
            const valor = Number(carga.valorSugerido || 0);
            const valorFmt = formatCurrency(valor);
            const valorBid = formatBidValue(valor);
            const shipper = (carga.embarcador && carga.embarcador.nome) ? carga.embarcador.nome : 'Embarcador';
            const cargaId = carga.id ? String(carga.id) : '-';
            const badgeTipo = classifyCargaBadge(descricao);

            selectedCargaData = {
                cargaId: Number(carga.id || 0),
                embarcadorId: Number((carga.embarcador && carga.embarcador.id) || 0),
                origem: origem,
                destino: destino,
                pesoKg: pesoKg || 1000,
                descricao: descricao
            };

            setTextById('detail-header-origin', origem);
            setTextById('detail-header-destination', destino);
            setTextById('detail-route-origin', origem);
            setTextById('detail-route-destination', destino);
            setTextById('detail-origin-address', origem);
            setTextById('detail-destination-address', destino);
            setTextById('detail-carga-id', `CRG-${cargaId}`);
            setTextById('detail-badge-type', badgeTipo);
            setTextById('detail-carga-descricao', descricao);
            setTextById('detail-peso-spec', pesoSpecTxt);
            setTextById('detail-peso-small', pesoTonTxt);
            setTextById('detail-price-table', valorFmt);
            setTextById('detail-price-mobile', valorFmt);
            setTextById('detail-price-main', valorFmt);
            setTextById('js-modal-suggested-val', valorFmt);
            setTextById('detail-shipper-name', shipper);
            setTextById('detail-success-shipper', shipper);

            const btnApply = document.getElementById('btn-apply-trigger');
            if (btnApply) {
                btnApply.setAttribute('data-suggested', valorBid);
                btnApply.setAttribute('data-origin', origem);
                btnApply.setAttribute('data-destination', destino);
                btnApply.setAttribute('data-carga-id', String(carga.id || ''));
                btnApply.setAttribute('data-embarcador-id', String((carga.embarcador && carga.embarcador.id) || ''));
                btnApply.setAttribute('data-peso-kg', String(pesoKg));
                btnApply.setAttribute('data-descricao', descricao);
            }

            const bidInput = document.getElementById('driver-bid-input');
            if (bidInput) {
                bidInput.value = valorBid;
            }
        }

        async function loadSelectedCarga() {
            const params = new URLSearchParams(window.location.search);
            const idFromUrl = Number(params.get('id') || 0);
            let carga = null;

            if (idFromUrl && api && typeof api.getCarga === 'function') {
                try {
                    carga = await api.getCarga(idFromUrl);
                } catch (error) {
                    // Fallback para sessionStorage se a API falhar.
                }
            }

            if (!carga) {
                try {
                    const raw = sessionStorage.getItem('kargoSelectedCarga');
                    const parsed = raw ? JSON.parse(raw) : null;
                    if (parsed && (!idFromUrl || Number(parsed.id) === idFromUrl)) {
                        carga = parsed;
                    }
                } catch (error) {
                    // Ignore parse errors e mantém layout padrão.
                }
            }

            if (carga) {
                applyCargaToPage(carga);
            }
        }

        loadSelectedCarga();

        // --- 1. TOAST NOTIFICATION SYSTEM ---
        function showToast(message, type = 'success') {
            const existingToast = document.querySelector('.kargo-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = `kargo-toast ${type}`;
            
            let iconSvg;
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
                const origem = document.getElementById('detail-route-origin')?.textContent?.trim() || 'Origem';
                const destino = document.getElementById('detail-route-destination')?.textContent?.trim() || 'Destino';
                const valor = document.getElementById('detail-price-main')?.textContent?.trim() || '';
                const shareData = {
                    title: `KarGO — ${origem} -> ${destino}`,
                    text: `Confira esta carga disponível: ${origem} para ${destino}${valor ? ` com frete sugerido de ${valor}` : ''}`,
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
                    const tituloFrete = truncateText(`Proposta para carga ${selectedCargaData.cargaId || ''}`.trim(), 120);
                    const descricaoFrete = truncateText(`Proposta enviada via detalhe da carga para ${selectedCargaData.descricao || 'Carga'}`.trim(), 240);

                    await api.createFrete({
                        titulo: tituloFrete,
                        descricao: descricaoFrete,
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

                    const selectVehicle = document.getElementById('driver-vehicle-select');
                    const vehicleName = selectVehicle ? selectVehicle.options[selectVehicle.selectedIndex].text : 'Veiculo';
                    const plateMatch = vehicleName.match(/\((.*?)\)/);
                    const plate = plateMatch ? plateMatch[1] : '';
                    const modelName = vehicleName.split(' - ')[0];

                    showSuccess(finalBid);
                    showToast(`Sua proposta de R$ ${finalBid} com o veiculo ${modelName}${plate ? ` (${plate})` : ''} foi enviada com sucesso!`);
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

        // --- 5. CHAT COM EMBARCADOR ---
        const btnChatTrigger = document.getElementById('btn-chat-trigger');
        if (btnChatTrigger) {
            btnChatTrigger.addEventListener('click', () => {

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
                    const contractorNameEl = document.querySelector('.contractor-name') || document.querySelector('.dc-contractor-section .contractor-name');
                    const embarcador = contractorNameEl ? contractorNameEl.textContent.trim() : 'AgroFrete S/A';
                    
                    const origEl = document.querySelector('.route-origin .route-city');
                    const destEl = document.querySelector('.route-destination .route-city');
                    const origem = origEl ? origEl.textContent.trim() : 'Recife, PE';
                    const destino = destEl ? destEl.textContent.trim() : 'Fortaleza, CE';
                    const rota = `${origem} → ${destino}`;

                    window.location.href = `chat.html?embarcador=${encodeURIComponent(embarcador)}&rota=${encodeURIComponent(rota)}`;
                }, 1000);
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
