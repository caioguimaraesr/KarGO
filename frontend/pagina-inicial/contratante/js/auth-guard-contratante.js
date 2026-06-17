/* ============================================
   KARGO — Auth Guard Contratante (Proteção de Rotas)
   Usado nas telas do Embarcador (pasta /contratante/)
   ============================================ */
(function () {
    const api = window.KargoApi;

    if (!api) {
        console.error('[KargoGuard] api-client.js deve ser carregado antes de auth-guard-contratante.js');
        return;
    }

    // 1) Verificar se está logado
    if (!api.isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }

    const session = api.getSession();

    // 2) Verificar tipo de usuário — Motorista não pode acessar telas de embarcador
    if (session && session.type === 'MOTORISTA') {
        window.location.href = '../dashboard.html';
        return;
    }

    // 3) Preencher dados do usuário no header/sidebar
    function fillUserData(user) {
        // Nome do usuário
        document.querySelectorAll('.ct-user-name, .js-user-name, .user-name').forEach(el => {
            el.textContent = user.name || user.nome || 'Usuário';
        });

        // Role
        document.querySelectorAll('.ct-user-role, .js-user-role, .user-role').forEach(el => {
            const icon = el.querySelector('svg');
            const svgHtml = icon ? icon.outerHTML : '';
            el.innerHTML = svgHtml + ' Embarcador Verificado';
        });

        // Avatar do header (localStorage ou iniciais fallback)
        const keyAvatar = `kargo_avatar_${user.id}`;
        const savedAvatar = localStorage.getItem(keyAvatar);

        document.querySelectorAll('.ct-user-avatar, .user-avatar').forEach(img => {
            let targetImg = img;
            if (img.tagName !== 'IMG') {
                targetImg = img.querySelector('img');
            }
            if (!targetImg) return;

            targetImg.onerror = function () {
                const name = user.name || user.nome || 'U';
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                this.style.display = 'none';
                
                // Limpar placeholders anteriores
                const oldPlaceholder = this.parentElement.querySelector('.header-avatar-placeholder');
                if (oldPlaceholder) oldPlaceholder.remove();

                const placeholder = document.createElement('div');
                placeholder.className = 'header-avatar-placeholder';
                placeholder.textContent = initials;
                placeholder.style.cssText = 'width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0088ff,#00d4ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;';
                this.parentElement.insertBefore(placeholder, this);
            };

            if (savedAvatar) {
                const oldPlaceholder = targetImg.parentElement.querySelector('.header-avatar-placeholder');
                if (oldPlaceholder) oldPlaceholder.remove();
                targetImg.src = savedAvatar;
                targetImg.style.display = '';
            } else {
                if (!targetImg.src || targetImg.src.includes('avatar') || targetImg.src.includes('embarcador.png') || targetImg.src.includes('motorista.png')) {
                    targetImg.onerror();
                }
            }
        });

        // Saudação
        document.querySelectorAll('.ct-welcome-name, .js-welcome-name').forEach(el => {
            const firstName = (user.name || user.nome || 'Contratante').split(' ')[0];
            el.textContent = firstName;
        });

        // Page title greeting
        const pageTitle = document.querySelector('.page-title h1, .ct-page-title h1');
        if (pageTitle && (pageTitle.textContent.includes('Olá') || pageTitle.textContent.includes('Bem-vindo'))) {
            const firstName = (user.name || user.nome || 'Contratante').split(' ')[0];
            pageTitle.textContent = 'Olá, ' + firstName;
        }

        // Redirecionar ao clicar no perfil do cabeçalho (desktop e mobile)
        document.querySelectorAll('.ct-user-profile, .js-user-profile').forEach(el => {
            el.style.cursor = 'pointer';
            el.title = 'Ver Meu Perfil';
            el.addEventListener('click', () => {
                window.location.href = 'perfil.html';
            });
        });

        // Injetar botão de logout dinâmico na sidebar
        const sidebarBottom = document.querySelector('.ct-sidebar-bottom');
        if (sidebarBottom && !document.getElementById('js-dynamic-logout-ct')) {
            const logoutLink = document.createElement('a');
            logoutLink.id = 'js-dynamic-logout-ct';
            logoutLink.href = '#';
            logoutLink.className = 'ct-menu-item';
            logoutLink.style.color = '#ff3b30'; // Vermelho elegante
            logoutLink.style.marginTop = '10px';
            logoutLink.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ff3b30;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sair da Conta
            `;
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                api.logout();
            });
            sidebarBottom.appendChild(logoutLink);
        }
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ============================================
    // MODAL DINÂMICO DE PERFIL DO MOTORISTA
    // ============================================
    window.verPerfilMotorista = async function (driverId, freteId) {
        if (!driverId) return;

        // 1) Garantir que os estilos do modal existam na página
        if (!document.getElementById('js-driver-profile-styles')) {
            const style = document.createElement('style');
            style.id = 'js-driver-profile-styles';
            style.innerHTML = `
                .ct-driver-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }
                .ct-driver-modal-backdrop.show {
                    opacity: 1;
                    pointer-events: auto;
                }
                .ct-driver-modal-card {
                    background: #111827;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    width: 90%;
                    max-width: 450px;
                    padding: 24px;
                    color: #f3f4f6;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                }
                .ct-driver-modal-backdrop.show .ct-driver-modal-card {
                    transform: translateY(0);
                }
                .ct-driver-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding-bottom: 12px;
                }
                .ct-driver-modal-header h2 {
                    font-size: 18px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.5px;
                }
                .ct-driver-modal-close {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    font-size: 24px;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .ct-driver-modal-close:hover {
                    color: #fff;
                }
                .driver-profile-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .driver-profile-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0088ff, #00d4ff);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 800;
                    box-shadow: 0 4px 12px rgba(0, 136, 255, 0.25);
                }
                .driver-profile-main-info h3 {
                    font-size: 16px;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 4px;
                }
                .driver-profile-main-info p {
                    font-size: 13px;
                    color: #9ca3af;
                }
                .driver-rating-container {
                    margin-top: 6px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #f59e0b;
                    font-weight: 600;
                }
                .driver-profile-details {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .driver-detail-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                }
                .driver-detail-item strong {
                    color: #9ca3af;
                }
                .driver-vehicle-section h4 {
                    font-size: 13px;
                    font-weight: 700;
                    color: #fff;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                    letter-spacing: 0.5px;
                }
                .driver-vehicle-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    padding: 12px;
                    border-radius: 14px;
                }
                .driver-vehicle-card svg {
                    color: #0088ff;
                    flex-shrink: 0;
                }
                .vehicle-info strong {
                    font-size: 13px;
                    font-weight: 700;
                    color: #fff;
                    display: block;
                }
                .vehicle-info p {
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 2px;
                }
            `;
            document.head.appendChild(style);
        }

        // 2) Garantir que a estrutura do modal exista na página
        let modal = document.getElementById('js-driver-profile-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'js-driver-profile-modal';
            modal.className = 'ct-driver-modal-backdrop';
            modal.innerHTML = `
                <div class="ct-driver-modal-card">
                    <div class="ct-driver-modal-header">
                        <h2>Perfil do Motorista</h2>
                        <button class="ct-driver-modal-close" onclick="document.getElementById('js-driver-profile-modal').classList.remove('show')">&times;</button>
                    </div>
                    <div class="ct-driver-modal-body" id="js-driver-profile-modal-body">
                        <div style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">Carregando perfil...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Fechar ao clicar fora do card
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }

        const body = document.getElementById('js-driver-profile-modal-body');
        body.innerHTML = `<div style="text-align:center; padding:20px; color:#9ca3af; font-size:13px;">Carregando perfil...</div>`;
        modal.classList.add('show');

        try {
            // 3) Buscar os dados reais do motorista do backend
            const driver = await api.getMotorista(driverId);
            if (!driver) throw new Error("Motorista não encontrado");

            // Buscar veículo se tiver freteId
            let veicHtml = '';
            if (freteId) {
                try {
                    const frete = await api.getFrete(freteId);
                    if (frete && frete.veiculo) {
                        const capTon = (Number(frete.veiculo.capacidadeKg || 0) / 1000).toFixed(1);
                        veicHtml = `
                            <div class="driver-vehicle-section" style="margin-top:20px;">
                                <h4>Veículo da Proposta</h4>
                                <div class="driver-vehicle-card">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #0088ff;"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                                    <div class="vehicle-info">
                                        <strong>\${escapeHtml(frete.veiculo.marca)} \${escapeHtml(frete.veiculo.modelo)} (\${frete.veiculo.ano})</strong>
                                        <p>Placa: <span style="color:#fff;font-weight:600;">\${escapeHtml(frete.veiculo.placa)}</span> · Capacidade: \${capTon} Ton (\${escapeHtml(frete.veiculo.tipoVeiculo)})</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                } catch (e) {
                    console.warn("Erro ao buscar veículo da proposta:", e);
                }
            }

            // Reputação / Classificação
            let ratingHtml = '';
            const media = driver.avaliacaoMedia != null ? Number(driver.avaliacaoMedia) : 0;
            const qtd = driver.quantidadeAvaliacoes != null ? Number(driver.quantidadeAvaliacoes) : 0;
            
            if (qtd > 0 && media > 0) {
                const stars = '★'.repeat(Math.round(media)) + '☆'.repeat(5 - Math.round(media));
                ratingHtml = `
                    <div class="driver-rating-container" title="\${media} de 5 estrelas">
                        <span>\${stars}</span>
                        <span style="color:#9ca3af;font-weight:400;margin-left:4px;">\${media.toFixed(1)} (\${qtd} avaliações)</span>
                    </div>
                `;
            } else {
                ratingHtml = `
                    <div class="driver-rating-container" style="color:#9ca3af;font-weight:400;gap:4px;">
                        <svg viewBox="0 0 24 24" style="fill:#6b7280; width:12px; height:12px; display:inline-block;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Ainda não possui avaliações
                    </div>
                `;
            }

            const iniciais = (driver.nome || 'M').charAt(0).toUpperCase();

            body.innerHTML = `
                <div class="driver-profile-header">
                    <div class="driver-profile-avatar">\${iniciais}</div>
                    <div class="driver-profile-main-info">
                        <h3>\${escapeHtml(driver.nome)}</h3>
                        <p>\${escapeHtml(driver.telefone || 'Telefone não cadastrado')}</p>
                        \${ratingHtml}
                    </div>
                </div>
                <div class="driver-profile-details">
                    <div class="driver-detail-item">
                        <strong>E-mail:</strong>
                        <span>\${escapeHtml(driver.email)}</span>
                    </div>
                    <div class="driver-detail-item">
                        <strong>CNH:</strong>
                        <span>\${escapeHtml(driver.cnh || '—')}</span>
                    </div>
                    <div class="driver-detail-item">
                        <strong>Disponibilidade:</strong>
                        <span style="color:\${driver.disponivel ? '#34c759' : '#ff3b30'}; font-weight:600;">
                            \${driver.disponivel ? 'Disponível' : 'Em viagem / Ocupado'}
                        </span>
                    </div>
                </div>
                \${veicHtml}
            `;

        } catch (error) {
            console.error("Erro ao carregar perfil do motorista:", error);
            body.innerHTML = `<div style="text-align:center; padding:20px; color:#ff3b30; font-size:13px;">Erro ao carregar dados do perfil.</div>`;
        }
    };

    // Registrar o click listener global no guard do contratante para os links de perfil
    document.addEventListener('click', (e) => {
        const el = e.target.closest('.js-view-driver-profile');
        if (el) {
            e.preventDefault();
            const driverId = el.getAttribute('data-driver-id');
            const freteId = el.getAttribute('data-frete-id');
            window.verPerfilMotorista(driverId, freteId);
        }
    });

    // 4) Preencher imediatamente com dados da sessão local
    if (session) {
        fillUserData(session);

        // Validar sessão contra o backend de forma assíncrona
        api.getMe()
            .then(userFromServer => {
                if (!userFromServer) {
                    console.warn('[KargoGuard] Sessão inválida no servidor. Efetuando logout...');
                    api.logout();
                } else {
                    // Atualizar dados da sessão local com os dados do servidor
                    api.saveSessionFromApi(userFromServer);
                }
            })
            .catch(err => {
                console.error('[KargoGuard] Erro ao validar sessão no servidor. Limpando sessão fantasma...', err);
                api.logout();
            });
    }

    // 5) Exportar guard
    window.KargoAuth = {
        session: session,
        isMotorista: function () { return session && session.type === 'MOTORISTA'; },
        isEmbarcador: function () { return session && session.type === 'EMBARCADOR'; },
        getUserId: function () { return session ? session.id : null; },
        getUserName: function () { return session ? (session.name || '') : ''; },
        logout: function () { api.logout(); },
        fillUserData: fillUserData
    };
})();
