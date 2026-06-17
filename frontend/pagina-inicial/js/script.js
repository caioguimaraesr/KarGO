/* ============================================
   KARGO — Interactive Scripts (Uber Freight Style)
   ============================================ */

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile menu toggle
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile menu on link click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if (link) {
            link.classList.toggle('active', scrollY >= top && scrollY < top + height);
        }
    });
});

// Animated counters
function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const start = performance.now();
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString('pt-BR');
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Intersection Observer for scroll reveal animations
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Stagger animation delay
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, delay);

            // Trigger counter animation for metrics
            if (entry.target.classList.contains('metric-item')) {
                const counter = entry.target.querySelector('.metric-number[data-target]');
                if (counter) animateCounter(counter);
            }

            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

// Observe all reveal elements with stagger delays
document.querySelectorAll('.reveal').forEach((el, i) => {
    // Add stagger delay for sibling elements
    const parent = el.parentElement;
    const siblings = parent.querySelectorAll(':scope > .reveal');
    if (siblings.length > 1) {
        const siblingIndex = Array.from(siblings).indexOf(el);
        el.dataset.delay = siblingIndex * 150;
    }
    revealObserver.observe(el);
});

// Add stagger delays for step cards and stat cards
document.querySelectorAll('.step-card.reveal').forEach((card, i) => {
    card.dataset.delay = i * 100;
});

document.querySelectorAll('.about-stat-card').forEach((card, i) => {
    card.classList.add('reveal');
    card.dataset.delay = i * 100;
    revealObserver.observe(card);
});

document.querySelectorAll('.metric-item.reveal').forEach((item, i) => {
    item.dataset.delay = i * 150;
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Parallax effect on hero floating cards
window.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.hero-float-card');
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    cards.forEach((card, i) => {
        const factor = (i + 1) * 5;
        card.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 8}px) translate(${x * factor}px, ${y * factor}px)`;
    });
});

// Re-animate route SVG on scroll into view
const routeSvg = document.querySelector('.route-path-hero');
if (routeSvg) {
    const routeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                routeSvg.style.animation = 'none';
                routeSvg.offsetHeight; // trigger reflow
                routeSvg.style.animation = 'drawRoute 3s ease-in-out forwards';
            }
        });
    }, { threshold: 0.3 });
    routeObserver.observe(routeSvg.closest('.hero-image-wrapper'));
}

// ============================================
// KARGO — Navbar de Usuário Logado (Responsivo)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const api = window.KargoApi;
    if (api && api.isLoggedIn()) {
        const session = api.getSession();
        if (session) {
            const navCta = document.querySelector('.nav-cta');
            const navLinks = document.getElementById('nav-links');
            
            const name = session.name || session.nome || 'U';
            const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const dashboardUrl = session.type === 'EMBARCADOR' ? 'contratante/dashboard.html' : 'dashboard.html';

            if (navCta) {
                // Criar o contêiner de perfil logado para desktop
                const userBox = document.createElement('div');
                userBox.className = 'nav-user-box';
                userBox.style.cssText = 'display:flex;align-items:center;gap:12px;';

                // Avatar circular com iniciais
                const avatar = document.createElement('div');
                avatar.textContent = initials;
                avatar.style.cssText = 'width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0088ff,#00d4ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;cursor:pointer;border:2px solid rgba(255,255,255,0.1);';
                avatar.addEventListener('click', () => {
                    window.location.href = dashboardUrl;
                });

                // Nome do usuário clicável
                const nameLink = document.createElement('a');
                nameLink.href = dashboardUrl;
                nameLink.textContent = name.split(' ')[0];
                nameLink.style.cssText = 'color:#fff;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;transition:color 0.2s;';
                nameLink.addEventListener('mouseover', () => nameLink.style.color = '#3b82f6');
                nameLink.addEventListener('mouseout', () => nameLink.style.color = '#fff');

                // Botão de Sair (Logout)
                const logoutBtn = document.createElement('button');
                logoutBtn.textContent = 'Sair';
                logoutBtn.style.cssText = 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#94a3b8;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;transition:all 0.2s;';
                logoutBtn.addEventListener('mouseover', () => {
                    logoutBtn.style.background = 'rgba(239,68,68,0.1)';
                    logoutBtn.style.borderColor = 'rgba(239,68,68,0.2)';
                    logoutBtn.style.color = '#ef4444';
                });
                logoutBtn.addEventListener('mouseout', () => {
                    logoutBtn.style.background = 'rgba(255,255,255,0.06)';
                    logoutBtn.style.borderColor = 'rgba(255,255,255,0.12)';
                    logoutBtn.style.color = '#94a3b8';
                });
                logoutBtn.addEventListener('click', () => {
                    api.logout();
                });

                userBox.appendChild(avatar);
                userBox.appendChild(nameLink);
                userBox.appendChild(logoutBtn);

                // No desktop, substitui o CTA
                navCta.parentNode.replaceChild(userBox, navCta);
            }

            // Para o menu mobile (.nav-links)
            if (navLinks) {
                const liDashboard = document.createElement('li');
                liDashboard.className = 'nav-mobile-only';
                liDashboard.style.cssText = 'border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;margin-top:12px;display:none;';
                
                const linkDash = document.createElement('a');
                linkDash.href = dashboardUrl;
                linkDash.className = 'nav-link';
                linkDash.textContent = `Meu Painel (${name})`;
                liDashboard.appendChild(linkDash);

                const liLogout = document.createElement('li');
                liLogout.className = 'nav-mobile-only';
                liLogout.style.cssText = 'padding-top:12px;display:none;';
                
                const linkLogout = document.createElement('a');
                linkLogout.href = '#';
                linkLogout.className = 'nav-link';
                linkLogout.style.color = '#ef4444';
                linkLogout.textContent = 'Sair da Conta';
                linkLogout.addEventListener('click', (e) => {
                    e.preventDefault();
                    api.logout();
                });
                liLogout.appendChild(linkLogout);

                navLinks.appendChild(liDashboard);
                navLinks.appendChild(liLogout);

                // Expor estilização no CSS mobile de forma simples
                const styleSheet = document.createElement('style');
                styleSheet.textContent = `
                    @media (max-width: 768px) {
                        .nav-mobile-only {
                            display: block !important;
                        }
                        .nav-user-box {
                            display: none !important;
                        }
                    }
                `;
                document.head.appendChild(styleSheet);
            }
        }
    }
});
