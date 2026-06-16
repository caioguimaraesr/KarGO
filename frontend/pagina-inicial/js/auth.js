/* ============================================
   KARGO — Auth & Registration Scripts
   Tabs, Wizard, Masks, Validations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const api = window.KargoApi;

    // Se estiver na página de login, limpar preventivamente qualquer sessão fantasma residual
    if (api && document.getElementById('login-form')) {
        api.clearSession();
    }

    // ========================================
    // TAB SYSTEM (Login Page)
    // ========================================
    const tabs = document.querySelectorAll('.auth-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const authSubtitle = document.getElementById('auth-subtitle');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(c => c.classList.remove('active'));
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.classList.add('active');

            // Update subtitle
            if (authSubtitle) {
                authSubtitle.textContent = target === 'tab-login' ? 'Bem-vindo de volta' : 'Crie sua conta';
            }

            // Reset signup steps to step 1
            if (target === 'tab-signup') {
                showSignupStep(1);
            }
        });
    });

    // ========================================
    // SIGNUP WIZARD (Login Page - Steps 1 & 2)
    // ========================================
    let signupStep = 1;
    const signupSteps = document.querySelectorAll('.signup-step');
    const signupNextBtn = document.getElementById('signup-next-btn');
    const signupBackBtn = document.getElementById('signup-back-btn');
    const profileCards = document.querySelectorAll('.profile-card');
    let selectedProfile = null;

    function showSignupStep(step) {
        signupStep = step;
        signupSteps.forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`signup-step-${step}`);
        if (target) target.classList.add('active');
    }

    // Profile card selection
    profileCards.forEach(card => {
        card.addEventListener('click', () => {
            profileCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProfile = card.dataset.profile;
            if (signupNextBtn) signupNextBtn.disabled = false;

            // Store in sessionStorage for cadastro page
            sessionStorage.setItem('kargoProfile', selectedProfile);
        });
    });

    if (signupNextBtn) {
        signupNextBtn.addEventListener('click', () => {
            if (signupStep === 1 && selectedProfile) {
                showSignupStep(2);
            }
        });
    }

    if (signupBackBtn) {
        signupBackBtn.addEventListener('click', () => {
            if (signupStep === 2) {
                showSignupStep(1);
            }
        });
    }

    // ========================================
    // WIZARD SYSTEM (Cadastro Page)
    // ========================================
    let wizardStep = 1;
    const wizardSteps = document.querySelectorAll('.wizard-step');
    const progressFill = document.getElementById('progress-fill');
    const stepIndicator = document.getElementById('step-indicator');
    const stepIndicatorDesktop = document.getElementById('step-indicator-desktop');
    const profile = sessionStorage.getItem('kargoProfile') || 'motorista';

    // Determine total steps based on profile
    const hasVehicleStep = (profile === 'motorista');
    let totalSteps = hasVehicleStep ? 4 : 3;

    function updateWizardUI() {
        wizardSteps.forEach(s => s.classList.remove('active'));
        
        let actualStep = wizardStep;
        // If embarcador skips vehicle step
        if (!hasVehicleStep && wizardStep >= 2) {
            // Step 2 for embarcador = documents (step 3 in DOM)
            if (wizardStep === 2) actualStep = 3;
            if (wizardStep === 3) actualStep = 4;
        }

        const target = document.getElementById(`wizard-step-${actualStep}`);
        if (target) target.classList.add('active');

        // Update progress
        const progress = (wizardStep / totalSteps) * 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (stepIndicator) stepIndicator.textContent = `Passo ${wizardStep} de ${totalSteps}`;
        if (stepIndicatorDesktop) stepIndicatorDesktop.textContent = `Passo ${wizardStep} de ${totalSteps}`;
        
        // Exibir cabeçalho do desktop e restaurar botões de voltar
        const navHeader = document.querySelector('.wizard-navigation-header');
        if (navHeader) {
            navHeader.style.display = '';
        }
        
        const desktopBackBtn = document.querySelector('.auth-back-btn-desktop');
        if (desktopBackBtn) desktopBackBtn.style.display = '';

        // Se for embarcador, ajustar os cards de documentos dinamicamente
        if (profile === 'embarcador' || profile === 'pme') {
            const cards = document.querySelectorAll('#wizard-step-3 .upload-card');
            if (cards.length >= 3) {
                // Card 1
                const h4_1 = cards[0].querySelector('h4');
                const p_1 = cards[0].querySelector('p');
                if (h4_1) h4_1.textContent = 'Contrato Social ou Cartão CNPJ';
                if (p_1) p_1.textContent = 'Documento corporativo em PDF ou imagem';
                
                // Card 2
                const h4_2 = cards[1].querySelector('h4');
                const p_2 = cards[1].querySelector('p');
                if (h4_2) h4_2.textContent = 'Inscrição Estadual';
                if (p_2) p_2.textContent = 'Comprovante de inscrição ativa (opcional)';

                // Card 3
                const h4_3 = cards[2].querySelector('h4');
                const p_3 = cards[2].querySelector('p');
                if (h4_3) h4_3.textContent = 'Comprovante de Endereço';
                if (p_3) p_3.textContent = 'Conta corporativa (energia, água ou internet)';

                // Trocar ícone do veículo por um de residência/sede
                const icon_3 = cards[2].querySelector('.upload-card-icon');
                if (icon_3) {
                    icon_3.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
                }
            }
        }
    }

    // Wire up wizard navigation buttons
    document.querySelectorAll('[data-wizard-next]').forEach(btn => {
        btn.addEventListener('click', () => {
            // Na etapa de veiculo, validar campos apenas para motorista.
            if (wizardStep === 2 && profile === 'motorista') {
                const chipSelected = document.querySelector('#vehicle-type-chips .chip.selected');
                const placa = (document.getElementById('wizard-plate')?.value || '').trim();
                const modelo = (document.getElementById('wizard-model')?.value || '').trim();
                const ano = document.getElementById('wizard-year')?.value;
                const capacidade = parseFloat(document.getElementById('wizard-capacity')?.value);

                if (!chipSelected) {
                    alert('Por favor, selecione o tipo do seu veículo.');
                    return;
                }
                if (!placa || placa.length < 7) {
                    alert('Por favor, informe uma placa de veículo válida (ex: ABC1D23).');
                    return;
                }
                if (!modelo) {
                    alert('Por favor, informe a marca e o modelo do seu veículo.');
                    return;
                }
                if (!ano) {
                    alert('Por favor, selecione o ano de fabricação do seu veículo.');
                    return;
                }
                if (isNaN(capacidade) || capacidade <= 0) {
                    alert('Por favor, informe uma capacidade de carga máxima válida maior que zero.');
                    return;
                }
            }

            if (wizardStep < totalSteps) {
                wizardStep++;
                updateWizardUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('[data-wizard-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (wizardStep > 1) {
                wizardStep--;
                updateWizardUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    function mapearTipoVeiculo(texto) {
        if (!texto) return 'TRUCK';
        const t = texto.toLowerCase();
        if (t.includes('van') || t.includes('utilit') || t.includes('3/4')) return 'VUC';
        if (t.includes('toco')) return 'TOCO';
        if (t.includes('truck')) return 'TRUCK';
        if (t.includes('carreta')) return 'CARRETA';
        return 'TRUCK';
    }

    function extrairMarca(modelo) {
        if (!modelo) return 'Volkswagen';
        const partes = modelo.trim().split(' ');
        return partes[0] || 'Volkswagen';
    }

    // Finalize button -> show analysis
    document.querySelectorAll('[data-wizard-finish]').forEach(btn => {
        btn.addEventListener('click', async () => {
            // Salvar veiculo apenas para contas de motorista.
            if (profile === 'motorista') {
                const motoristaId = api && api.getSession() ? api.getSession().id : null;
                if (motoristaId) {
                    const chipSelected = document.querySelector('#vehicle-type-chips .chip.selected');
                    const tipoVeiculoTexto = chipSelected ? chipSelected.textContent : 'Caminhão Truck';
                    const placa = (document.getElementById('wizard-plate')?.value || '').trim().toUpperCase();
                    const modelo = (document.getElementById('wizard-model')?.value || '').trim();
                    const ano = parseInt(document.getElementById('wizard-year')?.value) || 2022;
                    const isVolume = document.querySelector('.capacity-option[data-type="volume"]')?.classList.contains('selected');
                    const capacidadeValor = parseFloat(document.getElementById('wizard-capacity')?.value) || 10;
                    const capacidadeKg = isVolume ? capacidadeValor : capacidadeValor * 1000;

                    try {
                        const veiculos = await api.listVeiculos();
                        const vAtivo = veiculos.find(v => v.motorista && v.motorista.id === motoristaId);
                        const payload = {
                            ativo: true,
                            capacidadeKg: capacidadeKg,
                            tipoVeiculo: mapearTipoVeiculo(tipoVeiculoTexto),
                            ano: ano,
                            marca: extrairMarca(modelo),
                            modelo: modelo,
                            placa: placa,
                            motorista: { id: motoristaId }
                        };

                        if (vAtivo) {
                            await api.updateVeiculo(vAtivo.id, payload);
                            console.log('Veículo atualizado com sucesso no backend');
                        } else {
                            await api.createVeiculo(payload);
                            console.log('Veículo criado com sucesso no backend');
                        }

                        // Salvar cidade base no localStorage
                        const wizardCity = (document.getElementById('wizard-city')?.value || '').trim();
                        if (wizardCity) {
                            localStorage.setItem('kargo_city_' + motoristaId, wizardCity);
                        }

                        // Salvar status CNH no motorista no backend
                        const cnhCard = document.querySelector('#wizard-step-3 .upload-card'); // Primeiro card da Etapa 3 é a CNH
                        const isCnhUploaded = cnhCard && cnhCard.classList.contains('uploaded');
                        
                        const motoristaDados = await api.getMotorista(motoristaId);
                        if (motoristaDados) {
                            const motoristaPayload = {
                                ...motoristaDados,
                                cnh: isCnhUploaded ? 'ENVIADA' : 'PENDENTE',
                                disponivel: true
                            };
                            const updatedMotorista = await api.updateMotorista(motoristaId, motoristaPayload);
                            api.saveSessionFromApi(updatedMotorista);
                            console.log('Dados do motorista (CNH) atualizados com sucesso no backend');
                        }
                    } catch (err) {
                        console.error('Erro ao salvar informações de cadastro no backend:', err);
                        alert('Houve um erro ao salvar as informações do seu cadastro no backend: ' + err.message);
                        return; // Impede que avance para a tela de sucesso
                    }
                }
            }

            wizardStep = totalSteps;
            
            // Show analysis screen
            wizardSteps.forEach(s => s.classList.remove('active'));
            const analysis = document.getElementById('wizard-step-analysis');
            if (analysis) analysis.classList.add('active');
            
            if (progressFill) progressFill.style.width = '100%';
            if (stepIndicator) stepIndicator.textContent = `Passo ${totalSteps} de ${totalSteps}`;
            if (stepIndicatorDesktop) stepIndicatorDesktop.textContent = `Passo ${totalSteps} de ${totalSteps}`;
            
            // Ocultar o botão de voltar na tela final de análise
            const desktopBackBtn = document.querySelector('.auth-back-btn-desktop');
            if (desktopBackBtn) desktopBackBtn.style.display = 'none';
            
            // Garantir que o header do desktop continue visível
            const navHeader = document.querySelector('.wizard-navigation-header');
            if (navHeader) {
                navHeader.style.display = '';
            }
        });
    });

    // Initialize wizard if on cadastro page
    if (wizardSteps.length > 0) {
        updateWizardUI();

        // Inicializar setas do slider de tipo de veículo se existirem
        const chipsContainer = document.getElementById('vehicle-type-chips');
        const btnLeft = document.querySelector('.chips-arrow-left');
        const btnRight = document.querySelector('.chips-arrow-right');
        if (btnLeft && btnRight && chipsContainer) {
            btnLeft.addEventListener('click', (e) => {
                e.preventDefault();
                chipsContainer.scrollBy({ left: -150, behavior: 'smooth' });
            });
            btnRight.addEventListener('click', (e) => {
                e.preventDefault();
                chipsContainer.scrollBy({ left: 150, behavior: 'smooth' });
            });
        }
    }

    // ========================================
    // CHIP SELECTOR
    // ========================================
    document.querySelectorAll('.chips-container[data-single], .chips-wrap[data-single]').forEach(container => {
        container.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
            });
        });
    });

    document.querySelectorAll('.chips-wrap:not([data-single])').forEach(container => {
        container.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('selected');
            });
        });
    });

    // Capacity selector
    document.querySelectorAll('.capacity-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.capacity-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            const label = document.getElementById('capacity-label');
            if (label) {
                label.textContent = opt.dataset.type === 'volume' ? 'Volume máximo (litros)' : 'Carga máxima (toneladas)';
            }
        });
    });

    // ========================================
    // PASSWORD TOGGLE
    // ========================================
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.innerHTML = isPassword
                    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });
    });

    // ========================================
    // INPUT MASKS
    // ========================================
    function maskCPF(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .slice(0, 14);
    }

    function maskCNPJ(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
            .slice(0, 18);
    }

    function maskPhone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15);
    }

    function maskPlate(value) {
        const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        // Mercosul: ABC1D23
        if (clean.length <= 3) return clean;
        if (clean.length <= 4) return clean.slice(0, 3) + clean.slice(3);
        return clean.slice(0, 7);
    }

    // Apply masks
    document.querySelectorAll('[data-mask]').forEach(input => {
        input.addEventListener('input', () => {
            const mask = input.dataset.mask;
            if (mask === 'cpf') input.value = maskCPF(input.value);
            if (mask === 'cnpj') input.value = maskCNPJ(input.value);
            if (mask === 'cpf-cnpj') {
                const digits = input.value.replace(/\D/g, '');
                input.value = digits.length > 11 ? maskCNPJ(input.value) : maskCPF(input.value);
            }
            if (mask === 'phone') input.value = maskPhone(input.value);
            if (mask === 'plate') input.value = maskPlate(input.value);
        });
    });

    // ========================================
    // PASSWORD STRENGTH
    // ========================================
    const passwordInput = document.getElementById('signup-password');
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            let score = 0;
            if (val.length >= 6) score++;
            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            strengthBars.forEach((bar, i) => {
                bar.className = 'strength-bar';
                if (i < score) {
                    if (score <= 2) bar.classList.add('weak');
                    else if (score <= 3) bar.classList.add('medium');
                    else bar.classList.add('strong');
                }
            });

            if (strengthText) {
                if (val.length === 0) { strengthText.textContent = ''; strengthText.style.color = '#64748B'; }
                else if (score <= 2) { strengthText.textContent = 'Fraca'; strengthText.style.color = '#EF4444'; }
                else if (score <= 3) { strengthText.textContent = 'Média'; strengthText.style.color = '#F59E0B'; }
                else { strengthText.textContent = 'Forte'; strengthText.style.color = '#22C55E'; }
            }
        });
    }

    // ========================================
    // CONFIRM PASSWORD VALIDATION
    // ========================================
    const confirmInput = document.getElementById('signup-confirm-password');
    if (confirmInput && passwordInput) {
        confirmInput.addEventListener('input', () => {
            if (confirmInput.value && confirmInput.value !== passwordInput.value) {
                confirmInput.classList.add('error');
                confirmInput.classList.remove('valid');
            } else if (confirmInput.value) {
                confirmInput.classList.remove('error');
                confirmInput.classList.add('valid');
            }
        });
    }

    // ========================================
    // FILE UPLOAD SIMULATION
    // ========================================
    document.querySelectorAll('.upload-btn:not(.uploaded)').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.pdf';
            input.onchange = () => {
                if (input.files.length > 0) {
                    const card = btn.closest('.upload-card');
                    card.classList.add('uploaded');
                    btn.textContent = '✓ Enviado';
                    btn.classList.add('uploaded');

                    // Update info text
                    const info = card.querySelector('.upload-card-info p');
                    if (info) info.textContent = input.files[0].name;
                }
            };
            input.click();
        });
    });

    // Avatar upload
    const avatarCircle = document.querySelector('.avatar-circle');
    if (avatarCircle) {
        avatarCircle.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
                if (input.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        avatarCircle.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            };
            input.click();
        });
    }

    // ========================================
    // FORM SUBMIT HANDLERS (Prevent default)
    // ========================================
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    });

    function sanitizeDigits(value) {
        return (value || '').replace(/\D/g, '');
    }

    function defaultDateAfterYears(years) {
        const date = new Date();
        date.setFullYear(date.getFullYear() + years);
        return date.toISOString().slice(0, 10);
    }

    async function ensureDefaultVehicle(motoristaId) {
        if (!api) return;
        const veiculos = await api.listVeiculos();
        const hasOwnVehicle = veiculos.some(v => v.motorista && v.motorista.id === motoristaId);
        if (hasOwnVehicle) return;

        const uniquePlate = `KRG${Date.now().toString().slice(-4)}A`;
        await api.createVeiculo({
            ativo: true,
            capacidadeKg: 10000,
            tipoVeiculo: 'TRUCK',
            ano: 2022,
            marca: 'Nao informado',
            modelo: 'Nao informado',
            placa: uniquePlate,
            motorista: { id: motoristaId }
        });
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!api) {
                alert('Cliente de API nao encontrado. Verifique o carregamento de js/api-client.js.');
                return;
            }

            const loginValue = document.getElementById('login-email')?.value?.trim();
            const senhaValue = document.getElementById('login-password')?.value || '';

            if (!loginValue || !senhaValue) {
                alert('Preencha e-mail/telefone e senha para entrar.');
                return;
            }

            try {
                const data = await api.login(loginValue, senhaValue);

                if (data.tipoUsuario === 'MOTORISTA') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'contratante/dashboard.html';
                }
            } catch (error) {
                alert(`Falha ao realizar login: ${error.message}`);
            }
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!api) {
                alert('Cliente de API nao encontrado. Verifique o carregamento de js/api-client.js.');
                return;
            }

            if (!selectedProfile) {
                alert('Selecione o tipo de perfil antes de continuar.');
                return;
            }

            const nome = document.getElementById('signup-name')?.value?.trim() || '';
            const email = document.getElementById('signup-email')?.value?.trim() || '';
            const telefone = document.getElementById('signup-phone')?.value?.trim() || '';
            const senha = document.getElementById('signup-password')?.value || '';
            const confirmacao = document.getElementById('signup-confirm-password')?.value || '';
            const cpfCnpjRaw = document.getElementById('signup-cpf')?.value || '';
            const cpfCnpj = sanitizeDigits(cpfCnpjRaw);

            if (!nome || !email || !telefone || !senha) {
                alert('Preencha os dados obrigatorios para criar a conta.');
                return;
            }

            if (senha !== confirmacao) {
                alert('A confirmacao de senha nao confere.');
                return;
            }

            try {
                if (selectedProfile === 'motorista') {
                    if (cpfCnpj.length !== 11) {
                        alert('Para motorista, informe um CPF com 11 digitos.');
                        return;
                    }

                    const motorista = await api.createMotorista({
                        nome,
                        email,
                        telefone,
                        senha,
                        cpf: cpfCnpj,
                        cnh: 'PENDENTE',
                        dataValidadeCnh: defaultDateAfterYears(5),
                        disponivel: true,
                        avaliacaoMedia: 0
                    });

                    await ensureDefaultVehicle(motorista.id);
                    api.saveSessionFromApi(motorista);
                } else {
                    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
                        alert('Para PME/embarcador, informe CPF ou CNPJ com 11 ou 14 digitos.');
                        return;
                    }

                    const embarcador = await api.createEmbarcador({
                        nome,
                        email,
                        telefone,
                        senha,
                        cpfCnpj
                    });

                    api.saveSessionFromApi(embarcador);
                }

                window.location.href = 'cadastro.html';
            } catch (error) {
                alert(`Falha ao criar conta: ${error.message}`);
            }
        });
    }

    // ========================================
    // URL HASH HANDLING (deep linking)
    // ========================================
    if (window.location.hash === '#criar-conta') {
        const signupTab = document.querySelector('[data-tab="tab-signup"]');
        if (signupTab) signupTab.click();
    }

});
