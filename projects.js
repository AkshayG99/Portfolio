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
    initVoronoiBackground();
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
   INTERACTIVE VORONOI BACKGROUND CANVAS
   ========================================== */
function initVoronoiBackground() {
  const canvas = document.getElementById('voronoi-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  const countSlider = document.getElementById('point-count-slider');
  const relaxSlider = document.getElementById('relaxation-slider');
  const speedSlider = document.getElementById('speed-slider');
  const regenBtn = document.getElementById('regenerate-btn');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  let points = [];
  
  let numPoints = countSlider ? parseInt(countSlider.value) : 45;
  let relaxation = relaxSlider ? parseInt(relaxSlider.value) / 10 : 0.2;
  let speedFactor = speedSlider ? parseInt(speedSlider.value) / 3 : 1.0;
  
  let mouse = { x: -1000, y: -1000, active: false };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generatePoints();
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
      numPoints = parseInt(countSlider.value);
      generatePoints();
    });
  }
  if (relaxSlider) {
    relaxSlider.addEventListener('input', () => {
      relaxation = parseInt(relaxSlider.value) / 10;
    });
  }
  if (speedSlider) {
    speedSlider.addEventListener('input', () => {
      speedFactor = parseInt(speedSlider.value) / 3;
    });
  }
  if (regenBtn) {
    regenBtn.addEventListener('click', () => {
      generatePoints();
    });
  }

  function generatePoints() {
    points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2
      });
    }
  }

  function clipPolygon(poly, M, D) {
    const result = [];
    if (poly.length === 0) return result;

    function isInside(pt) {
      return (M.x - pt.x) * D.x + (M.y - pt.y) * D.y >= -1e-6;
    }

    function getIntersection(A, B) {
      const num = (M.x - A.x) * D.x + (M.y - A.y) * D.y;
      const den = (B.x - A.x) * D.x + (B.y - A.y) * D.y;
      if (Math.abs(den) < 1e-9) return A;
      const t = num / den;
      return {
        x: A.x + t * (B.x - A.x),
        y: A.y + t * (B.y - A.y)
      };
    }

    for (let i = 0; i < poly.length; i++) {
      const A = poly[i];
      const B = poly[(i + 1) % poly.length];

      const A_in = isInside(A);
      const B_in = isInside(B);

      if (A_in) {
        if (B_in) {
          result.push(B);
        } else {
          result.push(getIntersection(A, B));
        }
      } else {
        if (B_in) {
          result.push(getIntersection(A, B));
          result.push(B);
        }
      }
    }
    return result;
  }

  function getCentroid(poly) {
    let area = 0;
    let cx = 0;
    let cy = 0;
    const k = poly.length;
    
    for (let i = 0; i < k; i++) {
      const A = poly[i];
      const B = poly[(i + 1) % k];
      
      const factor = (A.x * B.y - B.x * A.y);
      area += factor;
      cx += (A.x + B.x) * factor;
      cy += (A.y + B.y) * factor;
    }
    
    area = area / 2.0;
    if (Math.abs(area) < 1e-6) {
      let sx = 0, sy = 0;
      poly.forEach(p => { sx += p.x; sy += p.y; });
      return { x: sx / k, y: sy / k };
    }
    
    return {
      x: cx / (6.0 * area),
      y: cy / (6.0 * area)
    };
  }

  generatePoints();

  function loop() {
    ctx.clearRect(0, 0, width, height);

    const style = getComputedStyle(document.body);
    const lineColor = style.getPropertyValue('--canvas-line').trim() || '#f1e9d8';
    const dotColor = style.getPropertyValue('--canvas-dot').trim() || '#8c7965';

    points.forEach(p => {
      p.x += p.vx * speedFactor;
      p.y += p.vy * speedFactor;

      if (p.x < 0) { p.x = 0; p.vx = -p.vx; }
      if (p.x > width) { p.x = width; p.vx = -p.vx; }
      if (p.y < 0) { p.y = 0; p.vy = -p.vy; }
      if (p.y > height) { p.y = height; p.vy = -p.vy; }
    });

    let activeSites = points.map((p, idx) => ({ x: p.x, y: p.y, isMouse: false, originalIndex: idx }));
    if (mouse.active) {
      activeSites.push({ x: mouse.x, y: mouse.y, isMouse: true });
    }

    const box = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];

    activeSites.forEach((site, i) => {
      let cellPoly = [...box];

      for (let j = 0; j < activeSites.length; j++) {
        if (i === j) continue;
        const other = activeSites[j];

        const M = {
          x: (site.x + other.x) / 2,
          y: (site.y + other.y) / 2
        };

        const D = {
          x: other.x - site.x,
          y: other.y - site.y
        };

        cellPoly = clipPolygon(cellPoly, M, D);
        if (cellPoly.length === 0) break;
      }

      if (cellPoly.length > 0) {
        ctx.beginPath();
        ctx.moveTo(cellPoly[0].x, cellPoly[0].y);
        for (let k = 1; k < cellPoly.length; k++) {
          ctx.lineTo(cellPoly[k].x, cellPoly[k].y);
        }
        ctx.closePath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (relaxation > 0 && !site.isMouse) {
          const centroid = getCentroid(cellPoly);
          const orig = points[site.originalIndex];
          orig.x = orig.x * (1 - relaxation) + centroid.x * relaxation;
          orig.y = orig.y * (1 - relaxation) + centroid.y * relaxation;
        }
      }

      ctx.beginPath();
      ctx.arc(site.x, site.y, site.isMouse ? 3.5 : 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = site.isMouse ? 'var(--accent-color)' : dotColor;
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
