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
    }

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
