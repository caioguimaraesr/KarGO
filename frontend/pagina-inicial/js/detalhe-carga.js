(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const params = new URLSearchParams(window.location.search);
        const cargaId = Number(params.get('id') || 0);

        const btnApplyTrigger = document.getElementById('btn-apply-trigger');
        const applyLabel = document.getElementById('dc-apply-button-label');
        const modalBackdrop = document.getElementById('proposal-modal-backdrop');
        const btnCloseModal = document.getElementById('js-close-modal');
        const btnCancelModal = document.getElementById('js-cancel-modal');
        const btnSubmitProposal = document.getElementById('js-submit-proposal');
        const modalSuggestedValue = document.getElementById('js-modal-suggested-val');
        const driverBidInput = document.getElementById('driver-bid-input');

        let currentCarga = null;
        let currentSuggestedAmount = '0,00';

        function showToast(message, type) {
            const existingToast = document.querySelector('.kargo-toast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.className = `kargo-toast ${type || 'success'}`;
            toast.textContent = message;
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                zIndex: '9999',
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                fontWeight: '500'
            });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3500);
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

        function setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        function estimateDistance(origem, destino) {
            const seed = String(origem || '').length * 19 + String(destino || '').length * 23;
            return Math.max(120, seed * 7);
        }

        function updateAvailability(isAvailable) {
            setText('dc-status-text', isAvailable ? 'Disponível' : 'Indisponível');
            if (btnApplyTrigger) {
                btnApplyTrigger.disabled = !isAvailable;
                btnApplyTrigger.style.opacity = isAvailable ? '1' : '0.6';
                btnApplyTrigger.style.cursor = isAvailable ? 'pointer' : 'not-allowed';
            }
            if (applyLabel) {
                applyLabel.textContent = isAvailable ? 'Enviar Minha Proposta' : 'Carga Fechada';
            }
        }

        function populateCarga(carga) {
            currentCarga = carga;
            const origem = carga.origem || '-';
            const destino = carga.destino || '-';
            const distancia = estimateDistance(origem, destino);
            const pesoKg = Number(carga.pesoKg || 0);
            const pesoTon = (pesoKg / 1000).toFixed(1);
            const valor = Number(carga.valorSugerido || 0);

            document.title = `KarGO — ${origem} -> ${destino}`;
            setText('dc-route-origin-title', origem);
            setText('dc-route-destination-title', destino);
            setText('dc-carga-id', `#${carga.id}`);
            setText('dc-route-origin', origem);
            setText('dc-route-destination', destino);
            setText('dc-origin-address', origem);
            setText('dc-destination-address', destino);
            setText('dc-distance-total', `${distancia} km`);
            setText('dc-distance-small', `${distancia} km`);
            setText('dc-carga-descricao', carga.descricao || 'Carga');
            setText('dc-carga-peso', `${pesoKg.toLocaleString('pt-BR')} kg (${pesoTon} Ton)`);
            setText('dc-peso-small', `${pesoTon} Ton`);
            setText('dc-frete-sugerido-table', formatCurrency(valor));
            setText('dc-frete-sugerido-mobile', formatCurrency(valor));
            setText('dc-price-main', formatCurrency(valor));
            setText('dc-shipper-name', (carga.embarcador && carga.embarcador.nome) || 'Embarcador');

            currentSuggestedAmount = formatBidValue(valor);
            if (btnApplyTrigger) {
                btnApplyTrigger.setAttribute('data-suggested', currentSuggestedAmount);
                btnApplyTrigger.setAttribute('data-origin', origem);
                btnApplyTrigger.setAttribute('data-destination', destino);
                btnApplyTrigger.setAttribute('data-carga-id', String(carga.id));
                btnApplyTrigger.setAttribute('data-embarcador-id', String(carga.embarcador && carga.embarcador.id ? carga.embarcador.id : ''));
                btnApplyTrigger.setAttribute('data-peso-kg', String(pesoKg));
                btnApplyTrigger.setAttribute('data-descricao', carga.descricao || 'Carga');
            }
            updateAvailability(carga.ativa !== false);
        }

        async function loadCarga() {
            if (!api || !cargaId) {
                showToast('Carga inválida para exibição.', 'error');
                updateAvailability(false);
                return;
            }

            try {
                const carga = await api.getCarga(cargaId);
                populateCarga(carga);
            } catch (error) {
                showToast(`Falha ao carregar detalhes da carga: ${error.message}`, 'error');
                updateAvailability(false);
            }
        }

        function openModal() {
            if (!currentCarga || currentCarga.ativa === false || !modalBackdrop) {
                showToast('Esta carga não aceita mais ofertas.', 'info');
                return;
            }

            if (modalSuggestedValue) modalSuggestedValue.textContent = `R$ ${currentSuggestedAmount}`;
            if (driverBidInput) driverBidInput.value = currentSuggestedAmount;
            modalBackdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            if (modalBackdrop) modalBackdrop.classList.remove('show');
            document.body.style.overflow = '';
        }

        async function submitProposal() {
            const session = api ? await api.hydrateSessionProfile() : null;
            if (!session || session.type !== 'MOTORISTA' || !session.id) {
                showToast('Faça login como motorista para enviar propostas.', 'error');
                return;
            }
            if (!currentCarga || currentCarga.ativa === false) {
                showToast('Esta carga não aceita mais ofertas.', 'error');
                updateAvailability(false);
                return;
            }

            const finalBid = driverBidInput ? driverBidInput.value.trim() : currentSuggestedAmount;
            if (!finalBid) {
                showToast('Informe um valor de frete válido.', 'error');
                return;
            }

            const originalText = btnSubmitProposal.textContent;
            btnSubmitProposal.disabled = true;
            btnSubmitProposal.textContent = 'Enviando...';

            try {
                const veiculos = await api.listVeiculos();
                const veiculoAtivo = Array.isArray(veiculos)
                    ? veiculos.find(v => v.motorista && v.motorista.id === session.id && v.ativo)
                    : null;
                if (!veiculoAtivo) {
                    throw new Error('Nenhum veículo ativo encontrado para este motorista.');
                }

                const now = new Date();
                const entrega = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const bidValue = parseBidValue(finalBid);
                const suggestedValue = parseBidValue(currentSuggestedAmount);
                const aceitaSugestao = Math.abs(bidValue - suggestedValue) < 0.005;

                await api.createFrete({
                    titulo: `${aceitaSugestao ? 'Aceite' : 'Proposta'} para carga ${currentCarga.id}`,
                    descricao: `${aceitaSugestao ? 'Aceite imediato' : 'Contraoferta'} via detalhe da carga para ${currentCarga.descricao || 'Carga'}`,
                    origem: currentCarga.origem,
                    destino: currentCarga.destino,
                    pesoCargaKg: Number(currentCarga.pesoKg || 0),
                    valorFrete: bidValue,
                    dataEntrega: toDateString(entrega),
                    dataPublicacao: toLocalDateTimeString(now),
                    dataAceite: aceitaSugestao ? toLocalDateTimeString(now) : null,
                    status: aceitaSugestao ? 'ACEITO' : 'PUBLICADO',
                    carga: { id: currentCarga.id },
                    embarcador: { id: currentCarga.embarcador.id },
                    motorista: { id: session.id },
                    veiculo: { id: veiculoAtivo.id }
                });

                closeModal();
                if (aceitaSugestao) {
                    showToast('Carga aceita com sucesso. Ela não receberá mais ofertas.');
                } else {
                    showToast('Contraoferta enviada. Aguardando resposta do embarcador.', 'info');
                }
                await loadCarga();
            } catch (error) {
                showToast(`Falha ao enviar proposta: ${error.message}`, 'error');
                await loadCarga();
            } finally {
                btnSubmitProposal.disabled = false;
                btnSubmitProposal.textContent = originalText;
            }
        }

        if (btnApplyTrigger) btnApplyTrigger.addEventListener('click', openModal);
        if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
        if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (event) => {
                if (event.target === modalBackdrop) closeModal();
            });
        }
        if (btnSubmitProposal) btnSubmitProposal.addEventListener('click', submitProposal);

        loadCarga();
    });
})();