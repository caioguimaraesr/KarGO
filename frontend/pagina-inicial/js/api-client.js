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
        setSession({
            id: user.id,
            type: role,
            name: user.nome,
            email: user.email,
            phone: user.telefone
        });
    }

    async function login(loginValue, senha) {
        const data = await request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: loginValue, senha: senha })
        });
        setToken(data.token);
        setSession({
            id: data.id,
            type: data.tipoUsuario,
            name: data.nome,
            email: data.email
        });
        return data;
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

    async function listVeiculos() {
        return request('/api/veiculos', { method: 'GET' });
    }

    async function createVeiculo(payload) {
        return request('/api/veiculos', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function listCargas() {
        return request('/api/cargas', { method: 'GET' });
    }

    async function createFrete(payload) {
        return request('/api/fretes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    window.KargoApi = {
        get apiBase() { return apiBase; },
        setApiBase: setApiBase,
        normalizeDigits: normalizeDigits,
        request: request,
        setSession: setSession,
        getSession: getSession,
        getToken: getToken,
        setToken: setToken,
        saveSessionFromApi: saveSessionFromApi,
        login: login,
        listMotoristas: listMotoristas,
        getMotorista: getMotorista,
        createMotorista: createMotorista,
        updateMotorista: updateMotorista,
        listEmbarcadores: listEmbarcadores,
        createEmbarcador: createEmbarcador,
        listVeiculos: listVeiculos,
        createVeiculo: createVeiculo,
        listCargas: listCargas,
        createFrete: createFrete
    };
})();

