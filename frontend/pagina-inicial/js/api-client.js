(function () {
    let apiBase = localStorage.getItem('kargoApiBase') || 'http://localhost:8080';

    function normalizeDigits(value) {
        return (value || '').replace(/\D/g, '');
    }

    function buildUrl(path) {
        return apiBase.replace(/\/$/, '') + path;
    }

    function setApiBase(newBase) {
        const normalized = String(newBase || '').trim();
        if (!normalized) {
            throw new Error('Informe uma URL base valida para a API.');
        }
        apiBase = normalized;
        localStorage.setItem('kargoApiBase', apiBase);
        return apiBase;
    }

    function getToken() {
        return localStorage.getItem('kargoToken');
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem('kargoToken', token);
        } else {
            localStorage.removeItem('kargoToken');
        }
    }

    async function request(path, options) {
        const token = getToken();
        const authHeader = token ? { 'Authorization': 'Bearer ' + token } : {};
        const response = await fetch(buildUrl(path), {
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            ...options
        });

        if (!response.ok) {
            let message = 'Erro ao comunicar com o backend';
            try {
                const errorBody = await response.json();
                message = errorBody.message || errorBody.title || message;
            } catch (e) {
                const text = await response.text();
                if (text) {
                    message = text;
                }
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            return null;
        }

        return response.json();
    }

    function setSession(user) {
        localStorage.setItem('kargoSession', JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem('kargoSession');
        localStorage.removeItem('kargoToken');
        sessionStorage.removeItem('kargoProfileType');
    }

    function normalizeProfileSubtype(value) {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === 'motorista' || normalized === 'pme' || normalized === 'embarcador') {
            return normalized;
        }
        return '';
    }

    function getSession() {
        try {
            const raw = localStorage.getItem('kargoSession');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveSessionFromApi(user) {
        const role = user.tipoUsuario === 'EMBARCADOR' ? 'EMBARCADOR' : 'MOTORISTA';
        const existing = getSession();
        const preservedSubtype = existing ? normalizeProfileSubtype(existing.profileSubtype) : '';
        const profileSubtype = role === 'MOTORISTA'
            ? 'motorista'
            : (preservedSubtype || 'embarcador');

        setSession({
            id: user.id,
            type: role,
            name: user.nome,
            email: user.email,
            phone: user.telefone,
            profileSubtype: profileSubtype
        });
    }

    async function login(loginValue, senha) {
        const data = await request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: loginValue, senha: senha })
        });
        setToken(data.token);
        const profileSubtype = data.tipoUsuario === 'MOTORISTA'
            ? 'motorista'
            : 'embarcador';

        setSession({
            id: data.id,
            type: data.tipoUsuario,
            name: data.nome,
            email: data.email,
            phone: data.telefone,
            profileSubtype: profileSubtype
        });
        return data;
    }

    async function hydrateSessionProfile() {
        const session = getSession();
        if (!session || !session.id || !session.type) {
            return session;
        }

        try {
            if (session.type === 'MOTORISTA') {
                const profile = await getMotorista(session.id);
                const updated = {
                    ...session,
                    name: profile.nomeCompleto || session.name,
                    email: profile.email || session.email,
                    phone: profile.telefone || session.phone,
                    profileSubtype: 'motorista'
                };
                setSession(updated);
                return updated;
            }

            const profile = await getEmbarcador(session.id);
            const updated = {
                ...session,
                name: profile.nomeResponsavel || profile.razaoSocial || session.name,
                email: profile.email || session.email,
                phone: profile.telefone || session.phone,
                profileSubtype: normalizeProfileSubtype(session.profileSubtype) || 'embarcador'
            };
            setSession(updated);
            return updated;
        } catch (error) {
            return session;
        }
    }

    async function listMotoristas() {
        return request('/api/motoristas', { method: 'GET' });
    }

    async function getMotorista(id) {
        return request('/api/motoristas/' + id, { method: 'GET' });
    }

    async function createMotorista(payload) {
        return request('/api/motoristas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function updateMotorista(id, payload) {
        return request('/api/motoristas/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async function listEmbarcadores() {
        return request('/api/embarcadores', { method: 'GET' });
    }

    async function createEmbarcador(payload) {
        return request('/api/embarcadores', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function getEmbarcador(id) {
        return request('/api/embarcadores/' + id, { method: 'GET' });
    }

    async function listVeiculos() {
        return request('/api/veiculos', { method: 'GET' });
    }

    async function createVeiculo(payload) {
        return request('/api/veiculos', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function listCargas(filters) {
        const query = [];
        if (filters && filters.embarcadorId != null) {
            query.push('embarcadorId=' + encodeURIComponent(String(filters.embarcadorId)));
        }
        const suffix = query.length ? ('?' + query.join('&')) : '';
        return request('/api/cargas' + suffix, { method: 'GET' });
    }

    async function getCarga(id) {
        return request('/api/cargas/' + encodeURIComponent(String(id)), { method: 'GET' });
    }

    async function createCarga(payload) {
        return request('/api/cargas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function createFrete(payload) {
        return request('/api/fretes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function listFretes(filters) {
        const query = [];
        if (filters && filters.motoristaId != null) {
            query.push('motoristaId=' + encodeURIComponent(String(filters.motoristaId)));
        }
        if (filters && filters.embarcadorId != null) {
            query.push('embarcadorId=' + encodeURIComponent(String(filters.embarcadorId)));
        }
        const suffix = query.length ? ('?' + query.join('&')) : '';
        return request('/api/fretes' + suffix, { method: 'GET' });
    }

    async function respondFreteProposal(freteId, aceitar) {
        return request('/api/fretes/' + encodeURIComponent(String(freteId)) + '/resposta', {
            method: 'POST',
            body: JSON.stringify({ aceitar: !!aceitar })
        });
    }

    async function concludeFrete(freteId) {
        return request('/api/fretes/' + encodeURIComponent(String(freteId)) + '/concluir', {
            method: 'POST'
        });
    }

    function getLoginPath() {
        const path = (window.location.pathname || '').toLowerCase();
        return path.includes('/contratante/') ? '../login.html' : 'login.html';
    }

    function logoutAndRedirect(loginPath) {
        clearSession();
        window.location.href = loginPath || getLoginPath();
    }

    function injectLogoutButton() {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.endsWith('/login.html') || path.endsWith('/cadastro.html') || path.endsWith('/index.html') || path.endsWith('/')) {
            return;
        }

        const session = getSession();
        if (!session) {
            return;
        }

        const existing = document.getElementById('kargo-logout-btn');
        if (existing) {
            return;
        }

        const host = document.querySelector('.mp-topbar-actions, .ct-topbar-actions, .ct-topbar-right, .topbar-actions, header .actions');
        if (!host) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'kargo-logout-btn';
        button.type = 'button';
        button.textContent = 'Sair';
        button.className = 'btn btn-outline-danger';
        button.style.marginLeft = '10px';
        button.addEventListener('click', function () {
            logoutAndRedirect(getLoginPath());
        });
        host.appendChild(button);
    }

    document.addEventListener('DOMContentLoaded', function () {
        injectLogoutButton();
    });

    window.KargoApi = {
        get apiBase() { return apiBase; },
        setApiBase: setApiBase,
        normalizeDigits: normalizeDigits,
        request: request,
        setSession: setSession,
        clearSession: clearSession,
        getSession: getSession,
        getToken: getToken,
        setToken: setToken,
        saveSessionFromApi: saveSessionFromApi,
        login: login,
        hydrateSessionProfile: hydrateSessionProfile,
        logoutAndRedirect: logoutAndRedirect,
        listMotoristas: listMotoristas,
        getMotorista: getMotorista,
        createMotorista: createMotorista,
        updateMotorista: updateMotorista,
        listEmbarcadores: listEmbarcadores,
        createEmbarcador: createEmbarcador,
        getEmbarcador: getEmbarcador,
        listVeiculos: listVeiculos,
        createVeiculo: createVeiculo,
        listCargas: listCargas,
        getCarga: getCarga,
        createCarga: createCarga,
        createFrete: createFrete,
        listFretes: listFretes,
        respondFreteProposal: respondFreteProposal,
        concludeFrete: concludeFrete
    };
})();

