// Aero Cleaner Modern Motion Interaction Layer
// Theme: Premium Dark Eco-Tech (350-600ms, cubic-bezier(0.4, 0, 0.2, 1))

document.addEventListener('DOMContentLoaded', () => {
    // Global State for Sensory Air Quality Simulator
    window.AQI_STATE = 20;

    initScrollTracker();
    initNavbarScroll();
    initDoubleLayerCanvas();
    initScrollReveal();
    initAqiCounters();
    initProductHotspots();
    initTimelineStepper();
    initButtonSpringPhysics();
    initFormInteractions();
    initSensorySimulator();
    initProductConfigurator();
    initExplodedView();
});

/**
 * 1. Scroll Tracker at top of screen
 */
function initScrollTracker() {
    const tracker = document.getElementById('scrollTracker');
    if (!tracker) return;

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        tracker.style.width = scrolled + '%';
    });
}

/**
 * 2. Navbar glassmorphic background scroll toggle
 */
function initNavbarScroll() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

/**
 * 3. Enterprise Background (Data Constellation)
 * Sleek, slow-moving node network representing air data points, 
 * matching the premium Pomelo FinTech aesthetic.
 */
function initDoubleLayerCanvas() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    const maxNodes = 60; // Clean, sparse layout

    function resize() {
        width = canvas.width = hero.offsetWidth;
        height = canvas.height = hero.offsetHeight;
    }

    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 1.5 + 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        }
    }

    function init() {
        resize();
        nodes = [];
        for (let i = 0; i < maxNodes; i++) {
            nodes.push(new Node());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        ctx.lineWidth = 0.5;
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].update();
            nodes[i].draw();
            // Draw connections
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - dist / 1500})`;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', () => {
        resize();
        init();
    });
    
    init();
    animate();
}

/**
 * 4. Intersection Observer for Scroll Reveals
 * Uses Premium Deceleration (cubic-bezier(0.05, 0.7, 0.1, 1))
 */
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.08,
        rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));
}

/**
 * 5. Animated City AQI Dials (Ticking numbers on scroll)
 */
function initAqiCounters() {
    const crisisSection = document.getElementById('crisis');
    if (!crisisSection) return;

    let animated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                animateAqiValue('aqiBishkek', 188);
                animateAqiValue('aqiAlmaty', 165);
                animateAqiValue('aqiAstana', 142);
            }
        });
    }, { threshold: 0.15 });

    observer.observe(crisisSection);

    function animateAqiValue(id, target) {
        const dial = document.getElementById(id);
        if (!dial) return;
        
        const textVal = dial.querySelector('.val');
        let current = 0;
        const duration = 1500; // 1.5s
        const start = performance.now();

        // Ease out formula for ticking
        function tick(timestamp) {
            const progress = Math.min((timestamp - start) / duration, 1);
            // Cubic decel easing
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            current = Math.floor(easeProgress * target);
            textVal.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                textVal.textContent = target; // force lock
            }
        }
        requestAnimationFrame(tick);
    }
}

/**
 * 6. Product Showcase Interactive Hotspots & Parallax
 */
function initProductHotspots() {
    const container = document.querySelector('.product-showcase-container');
    if (!container) return;

    const img = document.getElementById('productImage');
    
    // Parallax tilt on card wrapper
    container.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = container.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;

        // Smoothly rotate the frame based on mouse posture
        img.style.transform = `perspective(1200px) rotateY(${x * 12 - 10}deg) rotateX(${y * -12}deg) scale(1.03)`;
        img.style.transition = 'transform 0.1s ease-out';
    });

    container.addEventListener('mouseleave', () => {
        img.style.transform = `perspective(1200px) rotateY(-10deg) rotateX(0deg) scale(1)`;
        img.style.transition = 'transform 0.5s var(--ease-premium)';
    });

    // Hotspot trigger hooks (e.g. highlight specific filters or zones)
    const hotspots = document.querySelectorAll('.hotspot');
    hotspots.forEach(spot => {
        spot.addEventListener('mouseenter', () => {
            const type = spot.getAttribute('data-id');
            // Subtle image pulsing based on active component hover
            if (type === 'solar') img.style.boxShadow = '0 30px 60px rgba(253, 160, 133, 0.4)';
            if (type === 'suction') img.style.boxShadow = '0 30px 60px rgba(0, 242, 254, 0.4)';
            if (type === 'filter') img.style.boxShadow = '0 30px 60px rgba(142, 197, 252, 0.4)';
            if (type === 'ionizer') img.style.boxShadow = '0 30px 60px rgba(224, 195, 252, 0.4)';
        });

        spot.addEventListener('mouseleave', () => {
            img.style.boxShadow = '0 30px 60px rgba(0,0,0,0.5)';
        });
    });
}

/**
 * 7. Interactive Timeline Stepper (Slide 8)
 */
function initTimelineStepper() {
    const stepNodes = document.querySelectorAll('.step-node');
    const progressBar = document.getElementById('timelineProgress');
    if (!stepNodes.length || !progressBar) return;

    stepNodes.forEach((node, idx) => {
        node.addEventListener('click', () => {
            // Activate nodes up to the clicked index
            stepNodes.forEach((n, nIdx) => {
                if (nIdx <= idx) {
                    n.classList.add('active');
                    if (nIdx === 3) {
                        n.classList.add('active-solar');
                    }
                } else {
                    n.classList.remove('active');
                    n.classList.remove('active-solar');
                }
            });

            // Adjust the width of the linking connector line
            const percentage = (idx / (stepNodes.length - 1)) * 100;
            progressBar.style.width = percentage + '%';
        });
    });

    // Auto-advance simulation loop (every 5 seconds, unless clicked)
    let autoTimer;
    let currentStep = 0;

    function autoAdvance() {
        currentStep = (currentStep + 1) % stepNodes.length;
        stepNodes[currentStep].click();
    }

    // Start auto progress loop
    autoTimer = setInterval(autoAdvance, 5000);

    // Cancel auto progression on manual clicks to respect user intent
    stepNodes.forEach(node => {
        node.addEventListener('click', () => {
            clearInterval(autoTimer);
        });
    });
}

/**
 * 8. Button Spring Dynamics (Playful Squash/Stretch from SKILL.md)
 */
function initButtonSpringPhysics() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', () => {
            // Anticipation squish (Scale to 0.96, slightly flattened)
            btn.style.transform = 'scale(0.96) translateY(2px)';
            btn.style.transition = 'transform 80ms ease-out';
        });

        btn.addEventListener('mouseup', () => {
            // Overshoot recovery (Squashes up to 1.04, then spring-settles)
            btn.style.transform = 'scale(1.05) translateY(-3px)';
            btn.style.transition = 'transform 120ms var(--ease-spring)';
            
            setTimeout(() => {
                btn.style.transform = '';
                btn.style.transition = 'transform 300ms var(--ease-spring)';
            }, 120);
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform 300ms var(--ease-premium)';
        });
    });
}

/**
 * 9. Form Submission, Telemetry Loading, and Spark Burst success overlay
 */
function initFormInteractions() {
    const form = document.getElementById('contactForm');
    const overlay = document.getElementById('successOverlay');
    const closeBtn = document.getElementById('closeSuccessBtn');
    const submitBtn = document.getElementById('submitBtn');
    if (!form || !overlay || !closeBtn || !submitBtn) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Telemetry Loading Feedbacks
        const origText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying security nodes...';
        submitBtn.style.opacity = '0.7';

        setTimeout(() => {
            submitBtn.textContent = 'Transmitting credentials...';
        }, 800);

        setTimeout(() => {
            // 2. Playful Success state reveal
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
            submitBtn.style.opacity = '';
            
            overlay.classList.add('active');
            
            // Trigger particle burst inside the panel (Creative Playful burst)
            createParticleBurst(overlay);
        }, 1800);
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        form.reset();
    });

    /**
     * Spawns shimmering particle stars from behind the success checkmark
     */
    function createParticleBurst(parentEl) {
        const count = 30;
        const rect = parentEl.getBoundingClientRect();
        const centerX = rect.width * 0.5;
        const centerY = rect.height * 0.35; // centered around the checkmark SVG

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.width = Math.random() * 6 + 4 + 'px';
            star.style.height = star.style.width;
            star.style.borderRadius = '50%';
            
            // Random green or gold shimmers
            const isGreen = Math.random() > 0.5;
            star.style.background = isGreen ? 'var(--color-green)' : 'var(--color-cyan)';
            star.style.boxShadow = `0 0 10px ${isGreen ? 'var(--color-green)' : 'var(--color-cyan)'}`;
            
            star.style.left = centerX + 'px';
            star.style.top = centerY + 'px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '5';
            parentEl.appendChild(star);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 120 + 60;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            // Physics spring anim
            star.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
            ], {
                duration: Math.random() * 800 + 600,
                easing: 'cubic-bezier(0.1, 0.8, 0.25, 1)',
                fill: 'forwards'
            });

            // Cleanup
            setTimeout(() => {
                star.remove();
            }, 1500);
        }
    }
}

/**
 * 10. Sensory Air Simulator
 * Binds the AQI slider to global canvas physics, breathing rate, and visual overlays.
 */
function initSensorySimulator() {
    const slider = document.getElementById('aqiSlider');
    const valDisplay = document.getElementById('aqiValueDisplay');
    const breathingCircle = document.getElementById('breathingCircle');
    const diagnosticText = document.getElementById('diagnosticText');
    const overlay = document.getElementById('atmosphericOverlay');

    const blobSmog = document.querySelector('.blob-smog');
    const blobEco = document.querySelector('.blob-eco');
    const blobAir = document.querySelector('.blob-air');
    const cleanPaths = document.querySelectorAll('.wind-clean');
    const pollutedPaths = document.querySelectorAll('.wind-polluted');

    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        window.AQI_STATE = val;
        valDisplay.textContent = val;

        // 1. Calculate severity ratio (0 to 1) based on a range from 10 to 300
        const severity = (val - 10) / 290;

        // 2. Adjust Breathing Rhythm
        // Fresh air = 5.5s calm pulse. Toxic air = 1.2s rapid restricted pulse.
        const duration = 5.5 - (severity * 4.3);
        breathingCircle.style.setProperty('--breathing-duration', `${duration.toFixed(1)}s`);

        // 3. Update Ambient Blobs dynamically for high-fidelity ecological feel
        if (blobSmog) blobSmog.style.opacity = (severity * 0.75 + 0.05).toFixed(2);
        if (blobEco) blobEco.style.opacity = ((1.0 - severity) * 0.65 + 0.05).toFixed(2);
        if (blobAir) blobAir.style.opacity = ((1.0 - severity) * 0.50 + 0.05).toFixed(2);

        // 4. Update Ambient Wind Currents (Oxygen vs Smog currents)
        cleanPaths.forEach(path => {
            path.style.opacity = ((1.0 - severity) * 0.85).toFixed(2);
        });
        pollutedPaths.forEach(path => {
            path.style.opacity = (severity * 0.90).toFixed(2);
        });

        // 5. Adjust Sleek Data Indicators
        if (val < 50) {
            diagnosticText.textContent = 'Air Quality Optimal: Running in passive monitoring mode.';
            diagnosticText.style.color = 'var(--color-eco-light)';
            valDisplay.style.color = 'var(--color-eco-light)';
            breathingCircle.style.background = 'rgba(16, 185, 129, 0.08)';
            breathingCircle.style.border = '2px solid var(--color-eco-light)';
            breathingCircle.style.boxShadow = 'inset 0 0 15px rgba(16, 185, 129, 0.2), 0 0 25px rgba(16, 185, 129, 0.3)';
            breathingCircle.style.animationName = 'breathing-simulate'; // Calm deep breath
            overlay.style.opacity = '0';
        } else if (val < 150) {
            diagnosticText.textContent = 'Moderate Load: Active filtration engaged at 50% capacity.';
            diagnosticText.style.color = '#ffb703'; // Warm Amber warning
            valDisplay.style.color = '#ffb703';
            breathingCircle.style.background = 'rgba(255, 183, 3, 0.08)';
            breathingCircle.style.border = '2px solid #ffb703';
            breathingCircle.style.boxShadow = 'inset 0 0 15px rgba(255, 183, 3, 0.2), 0 0 25px rgba(255, 183, 3, 0.3)';
            breathingCircle.style.animationName = 'breathing-simulate'; // Moderate breath
            
            // Light, dusty amber/smog atmospheric haze
            overlay.style.background = 'rgba(230, 140, 10, 0.14)';
            overlay.style.opacity = `${((val - 50) / 100) * 0.35}`;
        } else {
            diagnosticText.textContent = 'High Load: Maximum extraction mode active. Air heavily clogged.';
            diagnosticText.style.color = '#ff416c'; // Crimson warning
            valDisplay.style.color = '#ff416c';
            breathingCircle.style.background = 'rgba(255, 65, 108, 0.12)';
            breathingCircle.style.border = '2px solid #ff416c';
            breathingCircle.style.boxShadow = 'inset 0 0 15px rgba(255, 65, 108, 0.3), 0 0 35px rgba(255, 65, 108, 0.5)';
            
            // Physical restricted breath (struggling-breath)
            breathingCircle.style.animationName = 'struggling-breath';
            
            // Deep, heavy toxic brown-grey smog atmospheric haze!
            overlay.style.background = 'rgba(142, 115, 80, 0.38)';
            overlay.style.opacity = `${0.35 + ((val - 150) / 150) * 0.45}`;
        }
    });

    // Synchronize initial state on load!
    slider.dispatchEvent(new Event('input'));
}

/**
 * 11. Product Configurator (Divide Products feature)
 * Handles tab switching, data loading, and animated ticking specs.
 */
function initProductConfigurator() {
    const tabs = document.querySelectorAll('.product-tab');
    if (!tabs.length) return;

    // Database of specifications
    const productData = {
        'model-r': { capacity: 2500, coverage: 1, solar: 15 },
        'model-x': { capacity: 6000, coverage: 3, solar: 40 },
        'model-g': { capacity: 15000, coverage: 8, solar: 100 }
    };

    // Elements
    const capEl = document.getElementById('specCapacity');
    const covEl = document.getElementById('specCoverage');
    const solEl = document.getElementById('specSolar');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all, set to clicked
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Trigger data load
            const modelKey = tab.getAttribute('data-model');
            const data = productData[modelKey];

            animateSpec(capEl, data.capacity, true);
            animateSpec(covEl, data.coverage, false);
            animateSpec(solEl, data.solar, false);

            // Add visual physical feel to the product image based on the model chosen
            const img = document.getElementById('productImage');
            if (img) {
                if (modelKey === 'model-r') {
                    img.style.transform = 'perspective(1200px) rotateY(-10deg) rotateX(0deg) scale(0.9)';
                    img.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.4)';
                    img.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                } else if (modelKey === 'model-x') {
                    img.style.transform = 'perspective(1200px) rotateY(-10deg) rotateX(0deg) scale(1)';
                    img.style.boxShadow = '0 30px 60px rgba(0, 242, 254, 0.5)';
                    img.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                } else if (modelKey === 'model-g') {
                    img.style.transform = 'perspective(1200px) rotateY(-10deg) rotateX(0deg) scale(1.1)';
                    img.style.boxShadow = '0 40px 80px rgba(253, 160, 133, 0.6)';
                    img.style.borderColor = 'rgba(253, 160, 133, 0.5)';
                }
            }
        });
    });

    // Count-up/count-down spec animator
    function animateSpec(element, targetValue, formatWithComma) {
        // Parse current value handling commas
        let current = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const duration = 800; // 0.8s
        const start = performance.now();

        function tick(timestamp) {
            const progress = Math.min((timestamp - start) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentTick = Math.floor(current + (targetValue - current) * easeProgress);
            
            if (formatWithComma && currentTick > 999) {
                element.textContent = currentTick.toLocaleString('en-US');
            } else {
                element.textContent = currentTick;
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                element.textContent = formatWithComma ? targetValue.toLocaleString('en-US') : targetValue;
            }
        }
        requestAnimationFrame(tick);
    }
}

/**
 * 12. Sci-Fi Exploded View Controller
 * Toggles the physical separation of the machine into sliced components in 3D WebGL space.
 */
function initExplodedView() {
    const btnExplode = document.getElementById('btnExplode');
    const productFrame = document.getElementById('productFrame');
    
    if (!btnExplode || !productFrame) return;

    btnExplode.addEventListener('click', () => {
        productFrame.classList.toggle('is-exploded');
        
        const isExploded = productFrame.classList.contains('is-exploded');
        if (isExploded) {
            btnExplode.innerHTML = '<span style="margin-right: 0.5rem;">❌</span> Reassemble Unit';
            btnExplode.classList.remove('btn-secondary');
            btnExplode.classList.add('btn-primary');
            // Trigger 3D separation
            if (typeof window.toggleExplodedCore === 'function') {
                window.toggleExplodedCore(true);
            }
        } else {
            btnExplode.innerHTML = '<span style="margin-right: 0.5rem;">⚡</span> Disassemble Core';
            btnExplode.classList.remove('btn-primary');
            btnExplode.classList.add('btn-secondary');
            // Trigger 3D reassembly
            if (typeof window.toggleExplodedCore === 'function') {
                window.toggleExplodedCore(false);
            }
        }
    });
}

