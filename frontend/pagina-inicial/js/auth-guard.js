/* ============================================
   KARGO — Auth Guard (Proteção de Rotas)
   Usado nas telas do Motorista (pasta raiz)
   ============================================ */
(function () {
    const api = window.KargoApi;

    if (!api) {
        console.error('[KargoGuard] api-client.js deve ser carregado antes de auth-guard.js');
        return;
    }

    // 1) Verificar se está logado
    if (!api.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const session = api.getSession();

    // 2) Verificar tipo de usuário — Embarcador não pode acessar telas de motorista
    if (session && session.type === 'EMBARCADOR') {
        window.location.href = 'contratante/dashboard.html';
        return;
    }

    // 3) Preencher dados do usuário no header/sidebar de todas as páginas
    function fillUserData(user) {
        // Nome do usuário no header
        document.querySelectorAll('.user-name, .js-user-name').forEach(el => {
            el.textContent = user.name || user.nome || 'Usuário';
        });

        // Role/status no header
        document.querySelectorAll('.user-role, .js-user-role').forEach(el => {
            const icon = el.querySelector('svg');
            const svgHtml = icon ? icon.outerHTML : '';
            el.innerHTML = svgHtml + ' Motorista Verificado';
        });

        // Avatar fallback (iniciais)
        document.querySelectorAll('.user-avatar').forEach(img => {
            img.onerror = function () {
                const name = user.name || user.nome || 'U';
                const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                this.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.textContent = initials;
                placeholder.style.cssText = 'width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0088ff,#00d4ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;';
                this.parentElement.insertBefore(placeholder, this);
            };
            // Trigger onerror if src is missing or generic
            if (!img.src || img.src.includes('motorista.png')) {
                img.onerror();
            }
        });

        // Saudação no dashboard
        const pageTitle = document.querySelector('.page-title h1');
        if (pageTitle && pageTitle.textContent.includes('Olá')) {
            const firstName = (user.name || user.nome || 'Motorista').split(' ')[0];
            pageTitle.textContent = 'Olá, ' + firstName;
        }

        // Modal — nome do motorista
        document.querySelectorAll('.driver-mini-name').forEach(el => {
            el.textContent = user.name || user.nome || 'Motorista';
        });
    }

    // 4) Preencher imediatamente com dados da sessão
    if (session) {
        fillUserData(session);
    }

    // 5) Exportar guard com funções úteis
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
