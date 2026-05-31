/* Projects Page Application */

// 1. Vite Glob Imports (Eagerly bundled at build time)
const projectModules = import.meta.glob('./content/projects/*.md', { query: '?raw', import: 'default', eager: true });

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  try {
    // Parse and load Markdown files
    const projects = loadProjects();

    // Render HTML components
    renderAllProjects(projects);

    // Initialize interactive behaviors
    initMarkdownLoader(projects);
    initFlowBackground();
  } catch (error) {
    console.error('Initialization error:', error);
    document.body.innerHTML += `<div style="position:fixed; top:20px; left:20px; color:red; font-size:12px; z-index:9999;">Error loading projects.</div>`;
  }
}

/* ==========================================
   METADATA / FRONTMATTER PARSING ENGINE
   ========================================== */
function parseFrontmatter(rawText) {
  const match = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      metadata: {},
      body: rawText
    };
  }

  const yamlSection = match[1];
  const body = match[2];
  const metadata = {};

  yamlSection.split('\n').forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('#')) return;

    const colonIndex = cleanLine.indexOf(':');
    if (colonIndex > 0) {
      const key = cleanLine.substring(0, colonIndex).trim();
      let val = cleanLine.substring(colonIndex + 1).trim();

      // Check for array format: [A, B, C]
      if (val.startsWith('[') && val.endsWith(']')) {
        metadata[key] = val
          .slice(1, -1)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      } else {
        // Remove surrounding quotes if present
        val = val.replace(/^["']|["']$/g, '');
        if (val.toLowerCase() === 'true') {
          metadata[key] = true;
        } else if (val.toLowerCase() === 'false') {
          metadata[key] = false;
        } else if (!isNaN(val) && val !== '') {
          metadata[key] = Number(val);
        } else {
          metadata[key] = val;
        }
      }
    }
  });

  return { metadata, body };
}

function loadProjects() {
  const projects = [];
  for (const path in projectModules) {
    const rawContent = projectModules[path];
    const filename = path.split('/').pop().replace('.md', '');
    const { metadata, body } = parseFrontmatter(rawContent);

    const bodyHtml = (typeof marked !== 'undefined') 
      ? marked.parse(body) 
      : body.split('\n').map(l => l.trim() ? `<p>${l.trim()}</p>` : '').join('');

    projects.push({
      id: filename,
      title: metadata.title || filename,
      subtitle: metadata.subtitle || '',
      tags: metadata.tags || [],
      order: metadata.order || 999,
      demoUrl: metadata.demoUrl || '',
      githubUrl: metadata.githubUrl || '',
      bodyHtml
    });
  }

  return projects.sort((a, b) => a.order - b.order);
}

/* ==========================================
   DOM RENDERING ENGINE
   ========================================== */
function renderAllProjects(projects) {
  const container = document.getElementById('all-projects-list');
  if (!container) return;

  const html = projects.map(proj => {
    // Extract first image from bodyHtml
    const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/i;
    const match = proj.bodyHtml.match(imgRegex);
    let imageUrl = '';

    if (match) {
      imageUrl = match[1];
    } else {
      // Fallback in case there is no image
      imageUrl = '/bramfire_mockup.png';
    }

    return `
      <article class="dump-project-item" id="proj-${proj.id}">
        <div class="dump-project-image-container">
          <img src="${imageUrl}" alt="${proj.title}" class="dump-project-image" loading="lazy">
        </div>
        <div class="dump-project-content">
          <div class="dump-project-header">
            <h2 class="dump-project-title">${proj.title}</h2>
            <p class="dump-project-subtitle">${proj.subtitle}</p>
            ${proj.tags && proj.tags.length > 0 ? `
              <div class="badge-row">
                ${proj.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="project-actions-row">
            <button class="show-more-toggle-btn">read details ↗</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;
}

/* ==========================================
   MARKDOWN MODAL POPUP ENGINE
   ========================================== */
function initMarkdownLoader(projects) {
  const modal = document.getElementById('content-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  if (!modal || !closeBtn) return;

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  const cards = document.querySelectorAll('.dump-project-item');
  cards.forEach(card => {
    const openModalHandler = (e) => {
      // Don't trigger modal if user clicked links or badges
      if (e.target.tagName === 'A' || e.target.classList.contains('tag-badge') || e.target.closest('a')) {
        return;
      }

      const id = card.getAttribute('id').replace('proj-', '');
      const data = projects.find(proj => proj.id === id);
      if (!data) return;

      // Populate Modal Fields
      document.getElementById('modal-title').textContent = data.title;
      document.getElementById('modal-subtitle').textContent = data.subtitle || '';
      document.getElementById('modal-date').textContent = '';
      document.getElementById('modal-loc').textContent = '';
      
      const badgesContainer = document.getElementById('modal-badges');
      if (data.tags && data.tags.length > 0) {
        badgesContainer.style.display = 'flex';
        badgesContainer.innerHTML = data.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('');
      } else {
        badgesContainer.style.display = 'none';
        badgesContainer.innerHTML = '';
      }

      const actionsContainer = document.getElementById('modal-actions');
      if (actionsContainer) {
        let actionsHtml = '';
        if (data.demoUrl) {
          actionsHtml += `<a href="${data.demoUrl}" target="_blank" rel="noopener noreferrer" class="project-action-link">view demo ↗</a>`;
        }
        if (data.githubUrl) {
          actionsHtml += `<a href="${data.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-action-link">view github ↗</a>`;
        }
        
        if (actionsHtml) {
          actionsContainer.style.display = 'flex';
          actionsContainer.innerHTML = actionsHtml;
        } else {
          actionsContainer.style.display = 'none';
          actionsContainer.innerHTML = '';
        }
      }

      document.getElementById('modal-body').innerHTML = data.bodyHtml || '';

      // Reveal Modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    card.addEventListener('click', openModalHandler);
  });
}

/* ==========================================
   INTERACTIVE FLOW FIELD BACKGROUND CANVAS
   ========================================== */
function initFlowBackground() {
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  const countSlider = document.getElementById('particle-count-slider');
  const influenceSlider = document.getElementById('influence-slider');
  const speedSlider = document.getElementById('speed-slider');
  const regenBtn = document.getElementById('regenerate-btn');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  let particles = [];
  
  let maxParticles = countSlider ? parseInt(countSlider.value) : 400;
  let mouseInfluence = influenceSlider ? parseInt(influenceSlider.value) : 5;
  let baseSpeed = speedSlider ? parseInt(speedSlider.value) / 4 : 1.0;
  
  let mouse = { x: -1000, y: -1000, active: false };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateParticles();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -1000;
    mouse.y = -1000;
  });

  if (countSlider) {
    countSlider.addEventListener('input', () => {
      maxParticles = parseInt(countSlider.value);
      generateParticles();
    });
  }
  if (influenceSlider) {
    influenceSlider.addEventListener('input', () => {
      mouseInfluence = parseInt(influenceSlider.value);
    });
  }
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      baseSpeed = parseInt(speedSlider.value) / 4;
    });
  }
  if (regenBtn) {
    regenBtn.addEventListener('click', () => {
      generateParticles();
    });
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initiallyRandom = false) {
      this.x = Math.random() * width;
      this.y = initiallyRandom ? Math.random() * height : (Math.random() > 0.5 ? 0 : height);
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 1.5 + 0.8;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.life = Math.random() * 200 + 100;
    }

    update() {
      let angle = Math.sin(this.x * 0.005) * Math.cos(this.y * 0.005) * Math.PI * 2;
      
      this.vx += Math.cos(angle) * 0.05 * baseSpeed;
      this.vy += Math.sin(angle) * 0.05 * baseSpeed;

      if (mouse.active) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.hypot(dx, dy);
        let maxDist = mouseInfluence * 40;

        if (dist < maxDist) {
          let force = (1 - dist / maxDist) * 0.15;
          let orbitAngle = Math.atan2(dy, dx) + Math.PI / 2;
          this.vx += Math.cos(orbitAngle) * force;
          this.vy += Math.sin(orbitAngle) * force;
          
          this.vx += (dx / dist) * force * 0.2;
          this.vy += (dy / dist) * force * 0.2;
        }
      }

      this.x += this.vx * baseSpeed;
      this.y += this.vy * baseSpeed;
      this.vx *= 0.95;
      this.vy *= 0.95;

      this.life--;

      if (this.x < 0 || this.x > width || this.y < 0 || this.y > height || this.life <= 0) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      const style = getComputedStyle(document.body);
      const dotColor = style.getPropertyValue('--canvas-dot').trim() || 'rgba(79, 70, 229, 0.15)';
      ctx.fillStyle = dotColor.replace('0.15', this.alpha.toFixed(2)).replace('0.2', this.alpha.toFixed(2));
      ctx.fill();
    }
  }

  function generateParticles() {
    particles = [];
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
  }

  generateParticles();

  function drawConnections() {
    const style = getComputedStyle(document.body);
    ctx.lineWidth = 0.6;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        let p1 = particles[i];
        let p2 = particles[j];
        let dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        
        if (dist < 60) {
          let alpha = (1 - dist / 60) * 0.12 * Math.min(p1.alpha, p2.alpha);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          const accentRgb = style.getPropertyValue('--accent-rgb').trim() || '79, 70, 229';
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawConnections();

    if (mouse.active) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--accent-color)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouseInfluence * 20, 0, Math.PI * 2);
      const accentRgb = getComputedStyle(document.body).getPropertyValue('--accent-rgb').trim() || '79, 70, 229';
      ctx.strokeStyle = `rgba(${accentRgb}, 0.04)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
