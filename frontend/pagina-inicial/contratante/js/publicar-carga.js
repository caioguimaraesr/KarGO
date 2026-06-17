/* ============================================
   KARGO — Lógica de Publicar Carga
   Coleta os dados do Wizard e envia para a API
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoPublicarCarga] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        // Elementos do formulário
        const cargoWeightInput = document.getElementById('cargo-weight');
        const cargoVolumeInput = document.getElementById('cargo-volume');
        const cargoDescInput = document.getElementById('cargo-desc');
        const cargoOriginInput = document.getElementById('cargo-city-origin');
        const cargoDestInput = document.getElementById('cargo-city-dest');
        const cargoTruckSelect = document.getElementById('cargo-truck-type');
        const cargoBodySelect = document.getElementById('cargo-body-type');
        const cargoValueInput = document.getElementById('cargo-value');
        const cargoPaymentSelect = document.getElementById('cargo-payment-method');
        const btnPublish = document.getElementById('btn-publish-cargo');

        // Spans de Resumo (Passo 5)
        const summaryCargoType = document.getElementById('summary-cargo-type');
        const summaryCargoWeight = document.getElementById('summary-cargo-weight');
        const summaryCargoTruck = document.getElementById('summary-cargo-truck');
        const summaryCargoBody = document.getElementById('summary-cargo-body');
        const summaryCargoOrigin = document.getElementById('summary-cargo-origin');
        const summaryCargoDest = document.getElementById('summary-cargo-dest');

        // Função para atualizar o resumo final no passo 5
        function updateSummary() {
            // Categoria selecionada
            const selectedTypeRadio = document.querySelector('input[name="tipo-carga"]:checked');
            let typeLabel = 'Carga Seca';
            if (selectedTypeRadio) {
                const typeVal = selectedTypeRadio.value;
                if (typeVal === 'seca') typeLabel = 'Carga Seca';
                else if (typeVal === 'alimentos') typeLabel = 'Alimentos e Perecíveis';
                else if (typeVal === 'perigosa') typeLabel = 'Carga Perigosa';
                else if (typeVal === 'outros') typeLabel = 'Equipamentos';
            }

            if (summaryCargoType) summaryCargoType.textContent = typeLabel;
            if (summaryCargoWeight) summaryCargoWeight.textContent = cargoWeightInput ? (cargoWeightInput.value || '0') : '0';
            if (summaryCargoTruck) summaryCargoTruck.textContent = cargoTruckSelect ? cargoTruckSelect.value : 'Truck';
            if (summaryCargoBody) summaryCargoBody.textContent = cargoBodySelect ? cargoBodySelect.value : 'Baú Fechado';
            
            if (summaryCargoOrigin) {
                const originVal = cargoOriginInput ? cargoOriginInput.value : '';
                const cepOrigin = document.getElementById('cargo-cep-origin') ? document.getElementById('cargo-cep-origin').value : '';
                summaryCargoOrigin.textContent = originVal ? `${originVal}${cepOrigin ? ' (CEP: ' + cepOrigin + ')' : ''}` : 'Não selecionado';
            }
            if (summaryCargoDest) {
                const destVal = cargoDestInput ? cargoDestInput.value : '';
                const cepDest = document.getElementById('cargo-cep-dest') ? document.getElementById('cargo-cep-dest').value : '';
                summaryCargoDest.textContent = destVal ? `${destVal}${cepDest ? ' (CEP: ' + cepDest + ')' : ''}` : 'Não selecionado';
            }
        }

        // Ouvir mudanças nos inputs para atualizar o resumo
        const inputsToWatch = [
            cargoWeightInput, cargoOriginInput, cargoDestInput,
            cargoTruckSelect, cargoBodySelect,
            document.getElementById('cargo-cep-origin'),
            document.getElementById('cargo-cep-dest')
        ];

        inputsToWatch.forEach(input => {
            if (input) {
                input.addEventListener('input', updateSummary);
                input.addEventListener('change', updateSummary);
            }
        });

        // Adicionar listener nos radios de categoria de carga
        document.querySelectorAll('input[name="tipo-carga"]').forEach(radio => {
            radio.addEventListener('change', updateSummary);
        });

        // Efetuar a publicação ao clicar no botão
        if (btnPublish) {
            btnPublish.addEventListener('click', async (e) => {
                e.preventDefault();

                const weightTon = parseFloat(cargoWeightInput ? cargoWeightInput.value : '0') || 0;
                const descText = cargoDescInput ? cargoDescInput.value.trim() : '';
                const origin = cargoOriginInput ? cargoOriginInput.value.trim() : '';
                const dest = cargoDestInput ? cargoDestInput.value.trim() : '';
                const cepOrigin = document.getElementById('cargo-cep-origin') ? document.getElementById('cargo-cep-origin').value.trim() : '';
                const cepDest = document.getElementById('cargo-cep-dest') ? document.getElementById('cargo-cep-dest').value.trim() : '';
                const addrOrigin = document.getElementById('cargo-addr-origin') ? document.getElementById('cargo-addr-origin').value.trim() : '';
                const addrDest = document.getElementById('cargo-addr-dest') ? document.getElementById('cargo-addr-dest').value.trim() : '';
                const dateCollect = document.getElementById('cargo-date-collect') ? document.getElementById('cargo-date-collect').value : '';
                const timeCollect = document.getElementById('cargo-time-collect') ? document.getElementById('cargo-time-collect').value : '';
                const dateDelivery = document.getElementById('cargo-date-delivery') ? document.getElementById('cargo-date-delivery').value : '';
                
                const truckType = cargoTruckSelect ? cargoTruckSelect.value : '';
                const bodyType = cargoBodySelect ? cargoBodySelect.value : '';
                const rawValue = cargoValueInput ? cargoValueInput.value : '0';
                
                // Converter valor formatado para float
                const valueStr = String(rawValue).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
                const cleanValue = parseFloat(valueStr) || 0;

                // Validações básicas
                if (!weightTon || weightTon <= 0) {
                    alert('Por favor, informe um peso válido para a carga.');
                    return;
                }
                if (!descText) {
                    alert('Por favor, adicione uma descrição para a carga.');
                    return;
                }
                if (!origin) {
                    alert('Por favor, selecione a cidade de origem.');
                    return;
                }
                if (!cepOrigin) {
                    alert('Por favor, informe o CEP de origem.');
                    return;
                }
                if (!dest) {
                    alert('Por favor, selecione a cidade de destino.');
                    return;
                }
                if (!cepDest) {
                    alert('Por favor, informe o CEP de destino.');
                    return;
                }
                if (!dateCollect) {
                    alert('Por favor, informe a data de coleta.');
                    return;
                }
                if (!timeCollect) {
                    alert('Por favor, informe o horário de coleta na origem.');
                    return;
                }
                if (!cleanValue || cleanValue <= 0) {
                    alert('Por favor, informe um valor de frete proposto válido.');
                    return;
                }

                // Formatar datas para exibição na descrição
                const formatDataBr = (dStr) => {
                    if (!dStr) return '';
                    const parts = dStr.split('-');
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    return dStr;
                };

                // Construção da descrição enriquecida (com os dados extras para o marketplace)
                const paymentMethod = cargoPaymentSelect ? cargoPaymentSelect.value : 'Na Entrega';
                
                let extraDetails = [];
                if (truckType) extraDetails.push(`Req: ${truckType}`);
                if (bodyType) extraDetails.push(`Carroceria: ${bodyType}`);
                if (paymentMethod) extraDetails.push(`Pagamento: ${paymentMethod}`);
                if (dateCollect) extraDetails.push(`Coleta: ${formatDataBr(dateCollect)}${timeCollect ? ' às ' + timeCollect : ''}`);
                if (dateDelivery) extraDetails.push(`Entrega Prevista: ${formatDataBr(dateDelivery)}`);
                if (addrOrigin) extraDetails.push(`Endereço Coleta: ${addrOrigin}`);
                if (addrDest) extraDetails.push(`Endereço Entrega: ${addrDest}`);

                const fullDescription = `${descText} [${extraDetails.join(' | ')}]`;

                // Montagem do payload de Carga com CEPs embutidos na origem/destino
                const payload = {
                    descricao: fullDescription,
                    origem: `${origin} (CEP: ${cepOrigin})`,
                    destino: `${dest} (CEP: ${cepDest})`,
                    pesoKg: weightTon * 1000, // API espera em Kg
                    valorSugerido: cleanValue,
                    ativa: true,
                    embarcador: {
                        id: auth.getUserId()
                    }
                };

                // Desabilitar botão e mostrar loading
                const originalText = btnPublish.textContent;
                btnPublish.disabled = true;
                btnPublish.textContent = 'Publicando...';

                try {
                    await api.createCarga(payload);
                    alert('Parabéns! Sua carga foi anunciada com sucesso no marketplace.');
                    window.location.href = 'minhas-cargas.html';
                } catch (error) {
                    console.error('[KargoPublicarCarga] Erro ao publicar carga:', error);
                    alert(`Falha ao publicar carga: ${error.message}`);
                } finally {
                    btnPublish.disabled = false;
                    btnPublish.textContent = originalText;
                }
            });
        }

        // Executar uma vez no load
        updateSummary();
    });
})();
