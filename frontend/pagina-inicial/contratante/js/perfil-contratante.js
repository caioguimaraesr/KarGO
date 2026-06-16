/* ============================================
   KARGO — Meu Perfil do Embarcador
   Lógica de exibição, edição de dados e estatísticas via API
   ============================================ */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const api = window.KargoApi;
        const auth = window.KargoAuth;

        if (!api || !auth) {
            console.error('[KargoPerfil] api-client.js ou auth-guard-contratante.js não carregados');
            return;
        }

        const embarcadorId = auth.getUserId();
        let embarcadorDadosCompletos = null;

        // Chaves para dados locais não presentes no backend
        const keyAddress = `kargo_embarcador_${embarcadorId}_address`;
        const keyOcorrencias = `kargo_ocorrencias_${embarcadorId}`;

        // Elementos do Formulário (editáveis)
        const inputEmail = document.getElementById('prof-email');
        const inputAddress = document.getElementById('prof-address');

        // Elementos de texto do cadastro (somente leitura na tela)
        const textCompanyName = document.getElementById('profile-company-name-text');
        const textCnpj = document.getElementById('profile-cnpj-text');
        const textPhone = document.getElementById('profile-phone-text');

        // Elementos de cabeçalho / visualização
        const labelNameMain = document.getElementById('profile-name-main');
        const labelCnpjMeta = document.getElementById('profile-cnpj-meta');
        const labelRating = document.getElementById('perf-rating');

        // Estatísticas
        const statTotalFretes = document.getElementById('perf-total-fretes');
        const statOcorrenciasCount = document.getElementById('perf-ocorrencias-count');

        async function loadProfile() {
            try {
                // 1. Carregar dados cadastrais da API
                const data = await api.getEmbarcador(embarcadorId);
                embarcadorDadosCompletos = data;

                // Preencher textos de leitura
                if (textCompanyName) textCompanyName.textContent = data.nome || '—';
                if (textCnpj) textCnpj.textContent = data.cpfCnpj || '—';
                if (textPhone) textPhone.textContent = data.telefone || '—';

                // Preencher inputs editáveis
                if (inputEmail) inputEmail.value = data.email || '';
                if (inputAddress) {
                    inputAddress.value = localStorage.getItem(keyAddress) || 'Av. Barbosa Lima, 100 - Bairro do Recife, Recife - PE, CEP 50030-017';
                }

                // Nome no header
                if (labelNameMain) labelNameMain.textContent = data.nome || 'Embarcador';
                
                // Carregar avatar do localStorage ou usar iniciais
                const keyAvatar = `kargo_avatar_${embarcadorId}`;
                const savedAvatar = localStorage.getItem(keyAvatar);
                
                // Atualizar no topo se já existir
                const topbarAvatar = document.querySelector('.ct-user-avatar');
                if (topbarAvatar && savedAvatar) {
                    topbarAvatar.src = savedAvatar;
                }

                const avatarContainer = document.getElementById('profile-avatar-container');
                if (avatarContainer) {
                    if (savedAvatar) {
                        avatarContainer.innerHTML = `
                            <img src="${savedAvatar}" alt="Foto de Perfil" style="width:96px; height:96px; border-radius:50%; border:4px solid var(--accent-blue-light); box-shadow:0 4px 14px rgba(0,136,255,0.25); object-fit: cover;">
                        `;
                    } else if (data.nome) {
                        const initials = data.nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        avatarContainer.innerHTML = `
                            <div style="width:96px; height:96px; border-radius:50%; background:linear-gradient(135deg,#0088ff,#00d4ff); color:#fff; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:900; border:4px solid var(--accent-blue-light); box-shadow:0 4px 14px rgba(0,136,255,0.25); text-transform:uppercase;">
                                ${initials}
                            </div>
                        `;
                    }
                }

                // Formatar Data Cadastro
                let dataMembro = 'Junho de 2024';
                if (data.dataCadastro) {
                    const dateObj = new Date(data.dataCadastro);
                    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    dataMembro = `${meses[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
                }

                if (labelCnpjMeta) {
                    const cnpjVal = data.cpfCnpj || '—';
                    labelCnpjMeta.textContent = `CNPJ: ${cnpjVal} · Desde ${dataMembro}`;
                }

                // 2. Carregar estatísticas reais de fretes
                const fretes = await api.getFretesByEmbarcador(embarcadorId);
                const todosFretes = Array.isArray(fretes) ? fretes : [];
                const fretesValidos = todosFretes.filter(f => f.status !== 'CANCELADO' && f.status !== 'PUBLICADO');

                const statsContainer = document.getElementById('profile-stats-container');
                if (fretesValidos.length === 0) {
                    if (statsContainer) {
                        statsContainer.innerHTML = `
                            <div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:13px; font-style:italic;">
                                Nenhuma Estatísticas no momento
                            </div>
                        `;
                    }
                } else {
                    if (statTotalFretes) statTotalFretes.textContent = fretesValidos.length;
                    
                    const rawOcorrencias = localStorage.getItem(keyOcorrencias);
                    const ocorrencias = rawOcorrencias ? JSON.parse(rawOcorrencias) : [];
                    const resolvidas = ocorrencias.filter(o => o.status === 'RESOLVIDA' || o.status === 'RESOLVIDO');
                    
                    if (statOcorrenciasCount) statOcorrenciasCount.textContent = resolvidas.length;
                }

                // Média de avaliações lida do backend
                if (labelRating) {
                    const pRatingEl = labelRating.closest('p') || labelRating.parentElement;
                    const media = data.avaliacaoMedia ? Number(data.avaliacaoMedia).toFixed(1) : '0.0';
                    const count = data.quantidadeAvaliacoes || 0;
                    
                    // Contar fretes concluídos
                    const fretesConcluidos = todosFretes.filter(f => f.status === 'CONCLUIDO').length;

                    if (fretesConcluidos === 0) {
                        if (pRatingEl) {
                            pRatingEl.innerHTML = `
                                <svg class="star-icon-inline" viewBox="0 0 24 24" style="width:16px; height:16px; color:var(--text-muted); fill:none; stroke:currentColor; stroke-width:2;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                <strong id="perf-rating">Sem avaliações</strong> (0 fretes completos)
                            `;
                        }
                    } else {
                        if (pRatingEl) {
                            pRatingEl.innerHTML = `
                                <svg class="star-icon-inline" viewBox="0 0 24 24" style="width:16px; height:16px; color:#F59E0B; fill:#F59E0B;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                <strong id="perf-rating" style="margin-left: 4px;">${media} de Avaliação</strong> (<span id="perf-fretes-count">${fretesConcluidos}</span> ${fretesConcluidos === 1 ? 'frete completo' : 'fretes completos'})
                            `;
                        }
                    }
                }

            } catch (error) {
                console.error('[KargoPerfil] Erro ao carregar dados do perfil:', error);
                showToast('Erro ao carregar', 'Ocorreu um problema ao obter os dados do servidor.', 'error');
            }
        }

        async function saveProfileChanges() {
            const btn = document.getElementById('btn-save-profile');
            if (!btn) return;

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Salvando...';

            const email = inputEmail ? inputEmail.value.trim() : '';
            const address = inputAddress ? inputAddress.value.trim() : '';

            try {
                if (!embarcadorDadosCompletos) {
                    embarcadorDadosCompletos = await api.getEmbarcador(embarcadorId);
                }

                // Payload do PUT com email atualizado
                const payload = {
                    ...embarcadorDadosCompletos,
                    email: email
                };

                const updated = await api.updateEmbarcador(embarcadorId, payload);
                api.saveSessionFromApi(updated);

                // Persistir endereço localmente
                localStorage.setItem(keyAddress, address);

                showToast('Perfil Atualizado!', 'As alterações do cadastro da empresa foram salvas com sucesso.');
                loadProfile();
            } catch (error) {
                console.error('[KargoPerfil] Erro ao salvar alterações de perfil:', error);
                showToast('Erro ao salvar', error.message || 'Falha ao salvar no servidor.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }

        // Criar sistema de Toast dinâmico para feedback premium
        function showToast(title, desc, type = 'success') {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.style.cssText = `
                background: ${type === 'success' ? '#ffffff' : '#fef2f2'};
                border-left: 4px solid ${type === 'success' ? '#10b981' : '#ef4444'};
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border-radius: 8px;
                padding: 16px;
                min-width: 300px;
                max-width: 450px;
                display: flex;
                align-items: flex-start;
                gap: 12px;
                font-family: 'Inter', sans-serif;
                transform: translateX(120%);
                transition: transform 0.3s ease-out;
            `;

            const iconColor = type === 'success' ? '#10b981' : '#ef4444';
            const iconSvg = type === 'success'
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

            toast.innerHTML = `
                <div style="flex-shrink: 0; margin-top: 2px;">${iconSvg}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 13px; color: #1e293b; margin-bottom: 2px;">${title}</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.4;">${desc}</div>
                </div>
            `;

            container.appendChild(toast);
            
            // Forçar reflow para animar a entrada
            toast.offsetHeight;
            toast.style.transform = 'translateX(0)';

            setTimeout(() => {
                toast.style.transform = 'translateX(120%)';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        function triggerAvatarUpload() {
            const fileInput = document.getElementById('avatar-file-input');
            if (fileInput) fileInput.click();
        }

        function handleAvatarSelected(input) {
            if (!input.files || input.files.length === 0) return;
            const file = input.files[0];
            
            if (!file.type.startsWith('image/')) {
                showToast('Tipo inválido', 'Selecione uma imagem válida (PNG, JPG, etc).', 'error');
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                showToast('Arquivo muito grande', 'Selecione uma imagem menor que 2MB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                localStorage.setItem(`kargo_avatar_${embarcadorId}`, base64Image);
                
                updateAvatarElements(base64Image);
                showToast('Foto Atualizada!', 'Sua nova foto de perfil foi carregada com sucesso.');
            };
            reader.onerror = function() {
                showToast('Erro ao carregar', 'Não foi possível ler a imagem selecionada.', 'error');
            };
            reader.readAsDataURL(file);
        }

        function updateAvatarElements(base64Image) {
            const avatarContainer = document.getElementById('profile-avatar-container');
            if (avatarContainer) {
                avatarContainer.innerHTML = `
                    <img src="${base64Image}" alt="Foto de Perfil" style="width:96px; height:96px; border-radius:50%; border:4px solid var(--accent-blue-light); box-shadow:0 4px 14px rgba(0,136,255,0.25); object-fit: cover;">
                `;
            }
            
            // Atualizar imagens de avatar do topo/header
            document.querySelectorAll('.ct-user-avatar, .user-avatar').forEach(img => {
                let targetImg = img;
                if (img.tagName !== 'IMG') {
                    targetImg = img.querySelector('img');
                }
                if (!targetImg) return;

                const oldPlaceholder = targetImg.parentElement.querySelector('.header-avatar-placeholder');
                if (oldPlaceholder) oldPlaceholder.remove();
                
                targetImg.src = base64Image;
                targetImg.style.display = '';
            });
        }

        // Expor para o formulário
        window.saveProfileChanges = saveProfileChanges;
        window.triggerAvatarUpload = triggerAvatarUpload;
        window.handleAvatarSelected = handleAvatarSelected;

        // Iniciar
        loadProfile();
    });
})();
