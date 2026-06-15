/* ============================================
   KARGO — API Client (Comunicação com Backend)
   ============================================ */
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
        const headers = { ...authHeader };

        // Only set Content-Type for requests with body
        if (options && options.body) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(buildUrl(path), {
            headers: headers,
            ...options
        });

        if ((response.status === 401 || response.status === 403) && !path.includes('/api/auth/login')) {
            // Token expirado ou inválido — limpar e redirecionar
            logout();
            return;
        }

        if (!response.ok) {
            let message = 'Erro ao comunicar com o backend';
            try {
                const errorBody = await response.json();
                message = errorBody.message || errorBody.title || message;
            } catch (e) {
                try {
                    const text = await response.text();
                    if (text) message = text;
                } catch (e2) { /* ignore */ }
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

    // ========================================
    // SESSION MANAGEMENT
    // ========================================

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

    function clearSession() {
        localStorage.removeItem('kargoToken');
        localStorage.removeItem('kargoSession');
    }

    function isLoggedIn() {
        return !!getToken() && !!getSession();
    }

    function logout() {
        clearSession();
        sessionStorage.removeItem('kargoProfile');
        // Determinar caminho correto para login
        const path = window.location.pathname;
        if (path.includes('/contratante/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
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

    // ========================================
    // AUTH ENDPOINTS
    // ========================================

    async function login(loginValue, senha) {
        clearSession();
        const data = await request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ login: loginValue, senha: senha })
        });
        setToken(data.token);
        setSession({
            id: data.id,
            type: data.tipoUsuario,
            name: data.nome,
            email: data.email,
            phone: data.telefone
        });
        return data;
    }

    async function getMe() {
        return request('/api/auth/me', { method: 'GET' });
    }

    // ========================================
    // MOTORISTAS
    // ========================================

    async function listMotoristas() {
        return request('/api/motoristas', { method: 'GET' });
    }

    async function getMotorista(id) {
        return request('/api/motoristas/' + id, { method: 'GET' });
    }

    async function createMotorista(payload) {
        clearSession();
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

    async function deleteMotorista(id) {
        return request('/api/motoristas/' + id, { method: 'DELETE' });
    }

    // ========================================
    // EMBARCADORES
    // ========================================

    async function listEmbarcadores() {
        return request('/api/embarcadores', { method: 'GET' });
    }

    async function getEmbarcador(id) {
        return request('/api/embarcadores/' + id, { method: 'GET' });
    }

    async function createEmbarcador(payload) {
        clearSession();
        return request('/api/embarcadores', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function updateEmbarcador(id, payload) {
        return request('/api/embarcadores/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async function deleteEmbarcador(id) {
        return request('/api/embarcadores/' + id, { method: 'DELETE' });
    }

    // ========================================
    // VEÍCULOS
    // ========================================

    async function listVeiculos() {
        return request('/api/veiculos', { method: 'GET' });
    }

    async function listVeiculosByMotorista(motoristaId) {
        return request('/api/veiculos/motorista/' + motoristaId, { method: 'GET' });
    }

    async function getVeiculo(id) {
        return request('/api/veiculos/' + id, { method: 'GET' });
    }

    async function createVeiculo(payload) {
        return request('/api/veiculos', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function updateVeiculo(id, payload) {
        return request('/api/veiculos/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async function deleteVeiculo(id) {
        return request('/api/veiculos/' + id, { method: 'DELETE' });
    }

    // ========================================
    // CARGAS
    // ========================================

    async function listCargas() {
        return request('/api/cargas', { method: 'GET' });
    }

    async function listCargasAtivas() {
        return request('/api/cargas/ativas', { method: 'GET' });
    }

    async function listCargasByEmbarcador(embarcadorId) {
        return request('/api/cargas/embarcador/' + embarcadorId, { method: 'GET' });
    }

    async function getCarga(id) {
        return request('/api/cargas/' + id, { method: 'GET' });
    }

    async function createCarga(payload) {
        return request('/api/cargas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function updateCarga(id, payload) {
        return request('/api/cargas/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async function deleteCarga(id) {
        return request('/api/cargas/' + id, { method: 'DELETE' });
    }

    // ========================================
    // FRETES
    // ========================================

    async function listFretes() {
        return request('/api/fretes', { method: 'GET' });
    }

    async function getFretesByMotorista(motoristaId) {
        return request('/api/fretes/motorista/' + motoristaId, { method: 'GET' });
    }

    async function getFretesByEmbarcador(embarcadorId) {
        return request('/api/fretes/embarcador/' + embarcadorId, { method: 'GET' });
    }

    async function getFrete(id) {
        return request('/api/fretes/' + id, { method: 'GET' });
    }

    async function createFrete(payload) {
        return request('/api/fretes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async function updateFrete(id, payload) {
        return request('/api/fretes/' + id, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async function deleteFrete(id) {
        return request('/api/fretes/' + id, { method: 'DELETE' });
    }

    async function avaliarFrete(id, nota, comentario) {
        return request('/api/fretes/' + id + '/avaliar', {
            method: 'POST',
            body: JSON.stringify({ nota: nota, comentario: comentario })
        });
    }

    // ========================================
    // UTILS
    // ========================================

    function formatCurrency(value) {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR');
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // ========================================
    // PUBLIC API
    // ========================================

    window.KargoApi = {
        get apiBase() { return apiBase; },
        setApiBase,
        normalizeDigits,
        request,
        // Session
        setSession,
        getSession,
        clearSession,
        isLoggedIn,
        getToken,
        setToken,
        saveSessionFromApi,
        logout,
        // Auth
        login,
        getMe,
        // Motoristas
        listMotoristas,
        getMotorista,
        createMotorista,
        updateMotorista,
        deleteMotorista,
        // Embarcadores
        listEmbarcadores,
        getEmbarcador,
        createEmbarcador,
        updateEmbarcador,
        deleteEmbarcador,
        // Veículos
        listVeiculos,
        listVeiculosByMotorista,
        getVeiculo,
        createVeiculo,
        updateVeiculo,
        deleteVeiculo,
        // Cargas
        listCargas,
        listCargasAtivas,
        listCargasByEmbarcador,
        getCarga,
        createCarga,
        updateCarga,
        deleteCarga,
        // Fretes
        listFretes,
        getFretesByMotorista,
        getFretesByEmbarcador,
        getFrete,
        createFrete,
        updateFrete,
        deleteFrete,
        avaliarFrete,
        // Utils
        formatCurrency,
        formatDate,
        formatDateTime
    };
})();
