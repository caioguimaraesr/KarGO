/* ============================================
   KARGO — Contratante Interactive JS
   Tabs, Wizard, Modals, Chat, Charts, Ratings
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initWizard();
    initModals();
    initStarRating();
    initTags();
    initOptionItems();
    initUrgencySelector();
    initRevealAnimations();
    initSidebar();
    initLogout();
});

/* === TABS === */
function initTabs() {
    document.querySelectorAll('.ct-tabs').forEach(tabGroup => {
        const tabs = tabGroup.querySelectorAll('.ct-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                if (target) {
                    const parent = tabGroup.closest('.ct-section-card') || tabGroup.parentElement;
                    parent.querySelectorAll('.ct-tab-content').forEach(c => {
                        c.style.display = 'none';
                    });
                    const content = parent.querySelector('#' + target);
                    if (content) content.style.display = 'block';
                }
            });
        });
    });
}

/* === WIZARD === */
function initWizard() {
    const wizard = document.querySelector('.ct-wizard');
    if (!wizard) return;

    window.wizardCurrentStep = 1;
    const totalSteps = wizard.querySelectorAll('.ct-wizard-panel').length;

    window.wizardNext = function() {
        if (window.wizardCurrentStep < totalSteps) {
            window.wizardCurrentStep++;
            updateWizard(wizard);
        }
    };

    window.wizardPrev = function() {
        if (window.wizardCurrentStep > 1) {
            window.wizardCurrentStep--;
            updateWizard(wizard);
        }
    };

    updateWizard(wizard);
}

function updateWizard(wizard) {
    const step = window.wizardCurrentStep;
    
    // Update dots
    wizard.querySelectorAll('.ct-wizard-dot').forEach((dot, i) => {
        dot.classList.remove('active', 'completed');
        if (i + 1 === step) dot.classList.add('active');
        else if (i + 1 < step) dot.classList.add('completed');
    });

    // Update lines
    wizard.querySelectorAll('.ct-wizard-line').forEach((line, i) => {
        line.classList.toggle('completed', i + 1 < step);
    });

    // Update panels
    wizard.querySelectorAll('.ct-wizard-panel').forEach((panel, i) => {
        panel.classList.toggle('active', i + 1 === step);
    });
}

/* === MODALS === */
function initModals() {
    // Close on backdrop click
    document.querySelectorAll('.ct-modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('show');
            }
        });
    });

    // Close buttons
    document.querySelectorAll('.ct-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.ct-modal-backdrop').classList.remove('show');
        });
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.ct-modal-backdrop.show').forEach(m => {
                m.classList.remove('show');
            });
        }
    });
}

window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
};

/* === STAR RATING === */
function initStarRating() {
    document.querySelectorAll('.ct-star-rating').forEach(container => {
        const stars = container.querySelectorAll('.ct-star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('active', i <= index);
                });
                container.dataset.rating = index + 1;
            });

            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    s.style.color = i <= index ? '#F59E0B' : '#E2E8F0';
                });
            });
        });

        container.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                s.style.color = s.classList.contains('active') ? '#F59E0B' : '#E2E8F0';
            });
        });
    });
}

/* === TAGS === */
function initTags() {
    document.querySelectorAll('.ct-tags').forEach(container => {
        container.querySelectorAll('.ct-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('selected');
            });
        });
    });
}

/* === OPTION ITEMS (Radio/Checkbox style) === */
function initOptionItems() {
    document.querySelectorAll('.ct-option-list').forEach(list => {
        const items = list.querySelectorAll('.ct-option-item');
        const isRadio = list.dataset.type === 'radio';
        
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT') return;
                
                if (isRadio) {
                    items.forEach(i => {
                        i.classList.remove('selected');
                        const radio = i.querySelector('input[type="radio"]');
                        if (radio) radio.checked = false;
                    });
                }
                
                item.classList.toggle('selected');
                const input = item.querySelector('input');
                if (input) input.checked = item.classList.contains('selected');
            });
        });
    });
}

/* === URGENCY SELECTOR === */
function initUrgencySelector() {
    document.querySelectorAll('.ct-urgency-selector').forEach(container => {
        container.querySelectorAll('.ct-urgency-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.ct-urgency-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    });
}

/* === REVEAL ANIMATIONS === */
function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.ct-reveal').forEach(el => observer.observe(el));
}

/* === SIDEBAR ACTIVE STATE === */
function initSidebar() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.ct-menu-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/* === INJETAR LOGOUT DINAMICAMENTE === */
function initLogout() {
    function executarLogout() {
        if (confirm('Deseja realmente sair da sua conta?')) {
            const api = window.KargoApi;
            if (api) {
                api.logout();
            } else {
                localStorage.removeItem('kargoToken');
                localStorage.removeItem('kargoSession');
                window.location.href = '../login.html';
            }
        }
    }

    // 1) Injetar na sidebar (Desktop)
    const sidebarBottom = document.querySelector('.ct-sidebar-bottom');
    if (sidebarBottom && !document.getElementById('js-sidebar-logout')) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.id = 'js-sidebar-logout';
        logoutLink.className = 'ct-menu-item';
        logoutLink.style.marginTop = '8px';
        logoutLink.style.color = '#ef4444';
        logoutLink.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="stroke:#ef4444; width:18px; height:18px; margin-right: 8px;">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair da Conta
        `;
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            executarLogout();
        });
        sidebarBottom.appendChild(logoutLink);
    }}

/* === CHAT SIMULATION === */
window.sendChatMessage = function() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const messagesContainer = document.querySelector('.ct-chat-messages');
    if (!messagesContainer) return;

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    // Add sent message
    const bubble = document.createElement('div');
    bubble.className = 'ct-chat-bubble sent';
    bubble.innerHTML = `${input.value}<div class="ct-chat-bubble-time">${timeStr} ✓✓</div>`;
    messagesContainer.appendChild(bubble);

    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simulate reply after 2s
    setTimeout(() => {
        const replies = [
            'Entendido! Vou verificar e te retorno.',
            'Certo, estou a caminho!',
            'Pode deixar, tudo sob controle.',
            'Ok, confirmado! Obrigado.',
            'Já estou saindo, chego em breve.'
        ];
        const reply = document.createElement('div');
        reply.className = 'ct-chat-bubble received';
        reply.innerHTML = `${replies[Math.floor(Math.random() * replies.length)]}<div class="ct-chat-bubble-time">${timeStr}</div>`;
        messagesContainer.appendChild(reply);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 2000);
};

/* === CONFIRM DELIVERY FLOW === */
window.showConfirmSuccess = function() {
    const form = document.getElementById('confirm-form');
    const success = document.getElementById('confirm-success');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
};

/* === REPORT PROBLEM FLOW === */
window.showReportSuccess = function() {
    const form = document.getElementById('report-form');
    const success = document.getElementById('report-success');
    if (form) form.style.display = 'none';
    if (success) success.style.display = 'block';
};

/* === UTILITY: Format Currency === */
window.formatCurrency = function(input) {
    let value = input.value.replace(/\D/g, '');
    value = (parseInt(value, 10) / 100).toFixed(2);
    value = value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = value;
};

/* === UTILITY: Format CEP === */
window.formatCEP = function(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    input.value = value;
};
