/* ============================================
   KARGO — Lógica do Chat do Contratante
   Gerencia conversas com motoristas de fretes ativos via API
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoChat] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        const embarcadorId = auth.getUserId();

        // Containers e Elementos
        const chatListContainer = document.getElementById('chat-list-container');
        const welcomePlaceholder = document.getElementById('chat-welcome-placeholder');
        const activePanel = document.getElementById('chat-active-panel');
        const messagesContainer = document.getElementById('chat-messages-container');

        // Header e Contexto do Chat Ativo
        const activeDriverInitials = document.getElementById('active-driver-initials');
        const activeDriverName = document.getElementById('active-driver-name');
        const activeFreteCode = document.getElementById('active-frete-code');
        const contextStatus = document.getElementById('context-frete-status');
        const contextDesc = document.getElementById('context-frete-desc');
        const trackingLink = document.getElementById('chat-tracking-link');
        const panelLink = document.getElementById('chat-panel-link');
        const chatInput = document.getElementById('chat-input');

        let fretesAtivos = [];
        let selectedFrete = null;
        
        // Histórico de mensagens em memória por ID do Frete
        const chatHistories = {};

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        async function loadActiveChats() {
            try {
                const fretes = await api.getFretesByEmbarcador(embarcadorId);
                const todosFretes = Array.isArray(fretes) ? fretes : [];

                // Filtrar apenas fretes ativos (ACEITO, EM_TRANSITO ou PUBLICADO/PROPOSTA)
                fretesAtivos = todosFretes.filter(f => f.status === 'ACEITO' || f.status === 'EM_TRANSITO' || f.status === 'PUBLICADO');

                renderChatList();
                
                // Abrir chat automaticamente se vier ID na URL
                const urlParams = new URLSearchParams(window.location.search);
                const autoFreteId = parseInt(urlParams.get('frete'), 10);
                if (autoFreteId) {
                    const freteTarget = fretesAtivos.find(f => f.id === autoFreteId);
                    if (freteTarget) {
                        selectChat(freteTarget);
                    }
                }
            } catch (error) {
                console.error('[KargoChat] Erro ao carregar chats do backend:', error);
                if (chatListContainer) {
                    chatListContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--accent-red); font-size:12px;">Erro ao carregar conversas.</div>`;
                }
            }
        }

        function renderChatList() {
            if (!chatListContainer) return;

            if (fretesAtivos.length === 0) {
                chatListContainer.innerHTML = `
                    <div style="text-align:center; padding:30px; color:var(--text-muted); font-size:12px; line-height:1.5;">
                        Nenhuma conversa ativa.<br>Seus chats aparecerão quando você aceitar propostas de motoristas.
                    </div>
                `;
                return;
            }

            const html = fretesAtivos.map(frete => {
                const motNome = escapeHtml(frete.motorista?.nome || 'Motorista');
                const iniciais = motNome.charAt(0).toUpperCase();
                const statusText = frete.status === 'EM_TRANSITO' ? 'Em trânsito...' : 'Aguardando coleta...';
                const activeClass = (selectedFrete && selectedFrete.id === frete.id) ? 'active' : '';

                return `
                    <div class="ct-chat-item ${activeClass}" data-frete-id="${frete.id}">
                        <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; flex-shrink:0;">
                            ${iniciais}
                        </div>
                        <div class="ct-chat-item-info">
                            <div class="ct-chat-item-header">
                                <span class="ct-chat-item-name">${motNome}</span>
                                <span class="ct-chat-item-time">Agora</span>
                            </div>
                            <p class="ct-chat-item-msg">${statusText}</p>
                        </div>
                    </div>
                `;
            }).join('');

            chatListContainer.innerHTML = html;

            // Adicionar listeners de clique nos itens da lista
            document.querySelectorAll('.ct-chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const freteId = parseInt(item.getAttribute('data-frete-id'), 10);
                    const frete = fretesAtivos.find(f => f.id === freteId);
                    if (frete) {
                        selectChat(frete);
                    }
                });
            });
        }

        function formatTime(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
            } catch (e) {
                return '';
            }
        }

        async function pollMessages() {
            if (!selectedFrete) return;

            try {
                const msgs = await api.listMensagens(selectedFrete.motorista.id, embarcadorId, null);
                if (Array.isArray(msgs)) {
                    const formattedMsgs = msgs.map(msg => ({
                        sender: msg.remetente.toLowerCase() === 'embarcador' ? 'sent' : 'received',
                        text: msg.texto,
                        time: formatTime(msg.dataEnvio)
                    }));

                    const previousLen = (chatHistories[selectedFrete.id] || []).length;
                    chatHistories[selectedFrete.id] = formattedMsgs;

                    if (formattedMsgs.length !== previousLen) {
                        renderMessages();
                    }
                }
            } catch (err) {
                console.warn("Erro no polling das mensagens do contratante:", err);
            }
        }

        async function selectChat(frete) {
            selectedFrete = frete;

            // Ajustar UI da lista
            document.querySelectorAll('.ct-chat-item').forEach(item => {
                const fId = parseInt(item.getAttribute('data-frete-id'), 10);
                item.classList.toggle('active', fId === frete.id);
            });

            // Ocultar placeholder e exibir painel de mensagens
            if (welcomePlaceholder) welcomePlaceholder.style.display = 'none';
            if (activePanel) activePanel.style.display = 'flex';

            // Alimentar dados do cabeçalho
            const motNome = escapeHtml(frete.motorista?.nome || 'Motorista');
            if (activeDriverName) activeDriverName.textContent = motNome;
            if (activeDriverInitials) activeDriverInitials.textContent = motNome.charAt(0).toUpperCase();
            if (activeFreteCode) activeFreteCode.textContent = `Frete #KG-2026-${frete.id}`;

            // Links rápidos
            if (trackingLink) trackingLink.href = `rastreamento.html?id=${frete.id}`;
            if (panelLink) panelLink.href = `detalhes-frete.html?id=${frete.id}`;

            // Ajustar card de contexto
            const isEmTransito = frete.status === 'EM_TRANSITO';
            const isPublicado = frete.status === 'PUBLICADO';
            if (contextStatus) {
                if (isPublicado) {
                    contextStatus.textContent = 'Status do Frete: Proposta Recebida';
                } else {
                    contextStatus.textContent = `Status do Frete: ${isEmTransito ? 'Em Trânsito' : 'Coleta Agendada'}`;
                }
            }
            if (contextDesc) {
                if (isPublicado) {
                    contextDesc.textContent = `${motNome} enviou uma proposta de frete no valor de ${api.formatCurrency(frete.valorFrete)}.`;
                } else {
                    contextDesc.textContent = isEmTransito 
                        ? `${motNome} está a caminho do destino (${escapeHtml(frete.destino)}).`
                        : `${motNome} está com a coleta agendada de ${escapeHtml(frete.origem)} para ${escapeHtml(frete.destino)}.`;
                }
            }

            // Buscar mensagens do banco
            await pollMessages();

            // Envia a de boas-vindas do motorista pro banco se estiver vazio
            if (!chatHistories[frete.id] || chatHistories[frete.id].length === 0) {
                try {
                    const welcomeText = `Olá! Sou o motorista ${motNome}. Minha coleta de ${frete.origem} para ${frete.destino} está confirmada com o frete de ${api.formatCurrency(frete.valorFrete)}. Tudo pronto para iniciar!`;
                    const payload = {
                        motoristaId: frete.motorista.id,
                        embarcadorId: embarcadorId,
                        remetente: 'MOTORISTA',
                        texto: welcomeText,
                        freteId: frete.id,
                        rota: `${frete.origem} → ${frete.destino}`
                    };
                    await api.enviarMensagem(payload);
                    await pollMessages();
                } catch(e) {
                    console.error("Erro ao enviar mensagem de boas-vindas:", e);
                }
            }

            if (chatInput) chatInput.focus();
        }

        function renderMessages() {
            if (!messagesContainer || !selectedFrete) return;

            const messages = chatHistories[selectedFrete.id] || [];
            const html = messages.map(msg => {
                const checkMark = msg.sender === 'sent' ? ' ✓✓' : '';
                return `
                    <div class="ct-chat-bubble ${msg.sender}">
                        ${escapeHtml(msg.text)}
                        <div class="ct-chat-bubble-time">${msg.time}${checkMark}</div>
                    </div>
                `;
            }).join('');

            messagesContainer.innerHTML = html;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Função global de envio de mensagens
        window.sendKargoChatMessage = async function() {
            if (!chatInput || !chatInput.value.trim() || !selectedFrete) return;

            const text = chatInput.value.trim();

            try {
                const payload = {
                    motoristaId: selectedFrete.motorista.id,
                    embarcadorId: embarcadorId,
                    remetente: 'EMBARCADOR',
                    texto: text,
                    freteId: selectedFrete.id,
                    rota: `${selectedFrete.origem} → ${selectedFrete.destino}`
                };
                await api.enviarMensagem(payload);
                chatInput.value = '';
                await pollMessages();
            } catch (error) {
                console.error("Erro ao enviar mensagem do contratante:", error);
            }
        };

        // Carregar dados no load inicial
        loadActiveChats();
        setInterval(pollMessages, 3000);
    });
})();
