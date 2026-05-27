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
