/* Portfolio Main Javascript Application */

// 1. Vite Glob Imports (Eagerly bundled at build time)
const experienceModules = import.meta.glob('./content/experience/*.md', { query: '?raw', import: 'default', eager: true });
const projectModules = import.meta.glob('./content/projects/*.md', { query: '?raw', import: 'default', eager: true });

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  try {
    // Fetch remaining page configuration (profile, quote, links)
    const response = await fetch('/config.json');
    if (!response.ok) throw new Error(`Failed to load config: ${response.status}`);
    const config = await response.json();

    // Parse and load Markdown files
    const experiences = loadExperiences();
    const projects = loadProjects();

    // Render HTML components
    renderProfile(config);
    renderExperiences(experiences);
    renderProjects(projects);
    renderLinks(config);

    // Initialize interactive behaviors
    initMarkdownLoader(experiences, projects);
    initVoronoiBackground();
    initVirtualCompanion();
    initHamsterDance();
    initDijkstraMaze();
  } catch (error) {
    console.error('Initialization error:', error);
    document.body.innerHTML += `<div style="position:fixed; top:20px; left:20px; color:red; font-size:12px; z-index:9999;">Error loading configuration data.</div>`;
  }
}

/* ==========================================
   METADATA / FRONTMATTER PARSING ENGINE
   ========================================== */
function parseFrontmatter(rawText) {
  // Regex to split frontmatter block starting/ending with ---
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

function loadExperiences() {
  const experiences = [];
  for (const path in experienceModules) {
    const rawContent = experienceModules[path];
    const filename = path.split('/').pop().replace('.md', '');
    const { metadata, body } = parseFrontmatter(rawContent);

    // Render markdown body to HTML safely using marked.js if available
    const bodyHtml = (typeof marked !== 'undefined') 
      ? marked.parse(body) 
      : body.split('\n').map(l => l.trim() ? `<p>${l.trim()}</p>` : '').join('');

    experiences.push({
      id: filename,
      title: metadata.title || 'Untitled',
      company: metadata.company || '',
      subtitle: metadata.subtitle || '',
      location: metadata.location || '',
      dateRange: metadata.dateRange || '',
      isActive: metadata.isActive !== false,
      tags: metadata.tags || [],
      order: metadata.order || 999,
      bodyHtml
    });
  }

  // Sort chronologically/hierarchically using 'order' key
  return experiences.sort((a, b) => a.order - b.order);
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
function renderProfile(config) {
  const profile = config.profile;

  document.title = `${profile.name} | Portfolio`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `${profile.name} - Portfolio. ${profile.roles.join(', ')}.`);
  }

  document.getElementById('profile-name').textContent = profile.name;
  const locationEl = document.getElementById('profile-location');
  if (locationEl) {
    locationEl.textContent = profile.location;
  }
  


  const resumeLink = document.getElementById('resume-link');
  resumeLink.href = profile.resumeUrl;
  resumeLink.textContent = "résumé ↗";

  const rolesContainer = document.getElementById('roles-container');
  rolesContainer.innerHTML = '';
  
  const openBracket = document.createElement('span');
  openBracket.className = 'bracket';
  openBracket.textContent = '[ ';
  rolesContainer.appendChild(openBracket);

  profile.roles.forEach((role, index) => {
    const roleSpan = document.createElement('span');
    roleSpan.className = 'role-tag';
    roleSpan.textContent = role;
    rolesContainer.appendChild(roleSpan);

    if (index < profile.roles.length - 1) {
      const bullet = document.createElement('span');
      bullet.className = 'bullet';
      bullet.textContent = ' · ';
      rolesContainer.appendChild(bullet);
    }
  });

  const closeBracket = document.createElement('span');
  closeBracket.className = 'bracket';
  closeBracket.textContent = ' ]';
  rolesContainer.appendChild(closeBracket);

  // Waterloo SE tagline rendering
  document.getElementById('profile-education').textContent = profile.education;

}

function renderExperiences(experiences) {
  const container = document.getElementById('experience-list-container');
  if (!container) return;

  const html = experiences.map((exp, index) => {
    const collapsedClass = index >= 2 ? 'collapsed-item' : '';
    return `
      <article class="timeline-item ${collapsedClass}" id="exp-${exp.id}" data-id="${exp.id}" data-type="experience">
        <div class="timeline-meta">
          <span class="${exp.isActive ? 'timeline-dot-active' : 'timeline-dot'}"></span>
          <span class="timeline-date">${exp.dateRange}</span>
          <span class="timeline-loc">${exp.location}</span>
        </div>
        <div class="timeline-details">
          <h3 class="item-title">${exp.title} <span class="item-company">@ ${exp.company}</span></h3>
          <p class="item-subtitle">${exp.subtitle}</p>
          ${exp.tags && exp.tags.length > 0 ? `
            <div class="badge-row">
              ${exp.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = html;

  if (experiences.length > 2) {
    const seeAllBtn = document.createElement('button');
    seeAllBtn.className = 'see-all-btn';
    seeAllBtn.innerHTML = `see all experiences (${experiences.length}) ↗`;
    
    seeAllBtn.addEventListener('click', () => {
      const isExpanded = seeAllBtn.classList.contains('active');
      const items = container.querySelectorAll('.timeline-item.collapsed-item');
      if (isExpanded) {
        // Collapse
        items.forEach(el => el.classList.remove('reveal-item'));
        seeAllBtn.innerHTML = `see all experiences (${experiences.length}) ↗`;
        seeAllBtn.classList.remove('active');
        document.getElementById('experience-section').scrollIntoView({ behavior: 'smooth' });
      } else {
        // Expand
        items.forEach(el => el.classList.add('reveal-item'));
        seeAllBtn.innerHTML = `show less ↩`;
        seeAllBtn.classList.add('active');
      }
    });

    container.appendChild(seeAllBtn);
  }
}

function renderProjects(projects) {
  const container = document.getElementById('project-list-container');
  if (!container) return;

  // We show up to 6 projects by default on the homepage
  const projectsToShow = projects.slice(0, 6);

  const html = projectsToShow.map(proj => {
    // Extract first image from bodyHtml
    const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/i;
    const match = proj.bodyHtml.match(imgRegex);
    let imageUrl = '';

    if (match) {
      imageUrl = match[1];
    } else {
      imageUrl = '/bramfire_mockup.png';
    }

    return `
      <article class="dump-project-item" id="proj-${proj.id}">
        <div class="dump-project-image-container">
          <img src="${imageUrl}" alt="${proj.title}" class="dump-project-image" loading="lazy">
        </div>
        <div class="dump-project-content">
          <div class="dump-project-header">
            <h3 class="dump-project-title">${proj.title}</h3>
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

  if (projects.length > 6) {
    const seeAllBtn = document.createElement('a');
    seeAllBtn.className = 'see-all-btn';
    seeAllBtn.href = '/projects.html';
    seeAllBtn.innerHTML = `see all projects (${projects.length}) ↗`;
    seeAllBtn.style.gridColumn = '1 / -1';
    container.appendChild(seeAllBtn);
  }
}

function renderLinks(config) {
  const container = document.getElementById('links-list-container');
  if (!container || !config.links) return;

  const totalColumns = 3;
  const cols = Array.from({ length: totalColumns }, () => []);
  
  config.links.forEach((link, index) => {
    cols[index % totalColumns].push(link);
  });

  container.innerHTML = cols.map(columnLinks => `
    <div class="link-column">
      ${columnLinks.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="social-link">${l.name}</a>
      `).join('')}
    </div>
  `).join('');
}









/* ==========================================
   5. FULL-SCREEN CONTENT OVERLAY MODAL
   ========================================== */
function initMarkdownLoader(experiences, projects) {
  const triggerSelectors = '.timeline-item, .dump-project-item';
  const triggers = document.querySelectorAll(triggerSelectors);
  const modal = document.getElementById('content-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!modal || !closeBtn) return;

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Close Events
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  // Open Events
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.classList.contains('tag-badge') || e.target.closest('a')) {
        return;
      }

      const id = trigger.getAttribute('data-id') || trigger.getAttribute('id').replace('proj-', '');
      const type = trigger.getAttribute('data-type') || (trigger.classList.contains('timeline-item') ? 'experience' : 'projects');
      
      const data = (type === 'experience')
        ? experiences.find(exp => exp.id === id)
        : projects.find(proj => proj.id === id);

      if (!data) return;

      // Populate Modal Fields
      document.getElementById('modal-title').textContent = data.title + (data.company ? ` @ ${data.company}` : '');
      document.getElementById('modal-subtitle').textContent = data.subtitle || '';
      document.getElementById('modal-date').textContent = data.dateRange || '';
      document.getElementById('modal-loc').textContent = data.location || '';
      
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
    });
  });
}

/* ==========================================
   5b. DIJKSTRA MAZE SOLVER WIDGET
   ========================================== */
function initDijkstraMaze() {
  const gridContainer = document.getElementById('dijkstra-grid');
  const solveBtn = document.getElementById('dijkstra-solve-btn');
  const randBtn = document.getElementById('dijkstra-rand-btn');
  const clearBtn = document.getElementById('dijkstra-clear-btn');
  
  if (!gridContainer || !solveBtn || !randBtn || !clearBtn) return;

  const rows = 10;
  const cols = 10;
  const startNode = { r: 1, c: 1 };
  const endNode = { r: 8, c: 8 };

  let gridState = Array(rows).fill(null).map(() => Array(cols).fill('empty'));
  gridState[startNode.r][startNode.c] = 'start';
  gridState[endNode.r][endNode.c] = 'end';

  let cellElements = Array(rows).fill(null).map(() => Array(cols).fill(null));
  let isDrawing = false;
  let drawMode = 'wall';
  let isAnimating = false;

  // Build grid DOM
  gridContainer.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'maze-cell';
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (r === startNode.r && c === startNode.c) {
        cell.classList.add('cell-start');
        cell.textContent = 'S';
      } else if (r === endNode.r && c === endNode.c) {
        cell.classList.add('cell-end');
        cell.textContent = 'E';
      } else {
        cell.classList.add('cell-empty');
      }

      gridContainer.appendChild(cell);
      cellElements[r][c] = cell;

      // Mouse events
      cell.addEventListener('mousedown', (e) => {
        if (isAnimating) return;
        e.preventDefault();
        const cr = parseInt(cell.dataset.r);
        const cc = parseInt(cell.dataset.c);
        if ((cr === startNode.r && cc === startNode.c) || (cr === endNode.r && cc === endNode.c)) return;

        isDrawing = true;
        if (gridState[cr][cc] === 'wall') {
          drawMode = 'empty';
          gridState[cr][cc] = 'empty';
          cell.className = 'maze-cell cell-empty';
        } else {
          drawMode = 'wall';
          gridState[cr][cc] = 'wall';
          cell.className = 'maze-cell cell-wall';
        }
      });

      cell.addEventListener('mouseenter', () => {
        if (isAnimating || !isDrawing) return;
        const cr = parseInt(cell.dataset.r);
        const cc = parseInt(cell.dataset.c);
        if ((cr === startNode.r && cc === startNode.c) || (cr === endNode.r && cc === endNode.c)) return;

        if (drawMode === 'wall') {
          gridState[cr][cc] = 'wall';
          cell.className = 'maze-cell cell-wall';
        } else {
          gridState[cr][cc] = 'empty';
          cell.className = 'maze-cell cell-empty';
        }
      });
    }
  }

  // Global mouseup handling
  const handleMouseUp = () => {
    isDrawing = false;
  };
  document.addEventListener('mouseup', handleMouseUp);

  function resetSearchOnly() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cellElements[r][c];
        cell.classList.remove('cell-visited', 'cell-path');
        if (r === startNode.r && c === startNode.c) {
          cell.className = 'maze-cell cell-start';
        } else if (r === endNode.r && c === endNode.c) {
          cell.className = 'maze-cell cell-end';
        } else if (gridState[r][c] === 'wall') {
          cell.className = 'maze-cell cell-wall';
        } else {
          cell.className = 'maze-cell cell-empty';
        }
      }
    }
  }

  function runDijkstra() {
    const dist = Array(rows).fill(null).map(() => Array(cols).fill(Infinity));
    const prev = Array(rows).fill(null).map(() => Array(cols).fill(null));
    const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
    
    dist[startNode.r][startNode.c] = 0;
    
    const visitedOrder = [];
    let endFound = false;

    for (let i = 0; i < rows * cols; i++) {
      let minVal = Infinity;
      let minNode = null;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!visited[r][c] && dist[r][c] < minVal) {
            minVal = dist[r][c];
            minNode = { r, c };
          }
        }
      }

      if (!minNode || minVal === Infinity) break;

      const { r, c } = minNode;
      visited[r][c] = true;

      if (!(r === startNode.r && c === startNode.c) && !(r === endNode.r && c === endNode.c)) {
        visitedOrder.push({ r, c });
      }

      if (r === endNode.r && c === endNode.c) {
        endFound = true;
        break;
      }

      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 }
      ];

      for (const n of neighbors) {
        if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
          if (gridState[n.r][n.c] !== 'wall' && !visited[n.r][n.c]) {
            const alt = dist[r][c] + 1;
            if (alt < dist[n.r][n.c]) {
              dist[n.r][n.c] = alt;
              prev[n.r][n.c] = { r, c };
            }
          }
        }
      }
    }

    let path = [];
    if (endFound) {
      let curr = prev[endNode.r][endNode.c];
      while (curr && !(curr.r === startNode.r && curr.c === startNode.c)) {
        path.push(curr);
        curr = prev[curr.r][curr.c];
      }
      path.reverse();
    }

    return { visitedOrder, path };
  }

  function animateDijkstra() {
    if (isAnimating) return;
    isAnimating = true;
    resetSearchOnly();

    const { visitedOrder, path } = runDijkstra();
    let step = 0;

    function drawSearchStep() {
      if (step < visitedOrder.length) {
        const { r, c } = visitedOrder[step];
        cellElements[r][c].className = 'maze-cell cell-visited';
        step++;
        setTimeout(drawSearchStep, 25);
      } else {
        let pathStep = 0;
        function drawPathStep() {
          if (pathStep < path.length) {
            const { r, c } = path[pathStep];
            cellElements[r][c].className = 'maze-cell cell-path';
            pathStep++;
            setTimeout(drawPathStep, 40);
          } else {
            isAnimating = false;
          }
        }
        if (path.length > 0) {
          drawPathStep();
        } else {
          isAnimating = false;
        }
      }
    }

    drawSearchStep();
  }

  function randomizeMaze() {
    resetSearchOnly();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) continue;
        if (Math.random() < 0.28) {
          gridState[r][c] = 'wall';
          cellElements[r][c].className = 'maze-cell cell-wall';
        } else {
          gridState[r][c] = 'empty';
          cellElements[r][c].className = 'maze-cell cell-empty';
        }
      }
    }
  }

  solveBtn.addEventListener('click', () => {
    if (isAnimating) return;
    animateDijkstra();
  });

  randBtn.addEventListener('click', () => {
    if (isAnimating) return;
    randomizeMaze();
  });

  clearBtn.addEventListener('click', () => {
    if (isAnimating) return;
    gridState = Array(rows).fill(null).map(() => Array(cols).fill('empty'));
    gridState[startNode.r][startNode.c] = 'start';
    gridState[endNode.r][endNode.c] = 'end';
    resetSearchOnly();
  });

  // Randomize the maze by default on load
  randomizeMaze();
}

/* ==========================================
   6. INTERACTIVE VORONOI BACKGROUND CANVAS
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

/* ==========================================
   7. INTERACTIVE PIXEL PET COMPANION
   ========================================== */
function initVirtualCompanion() {
  const companion = document.getElementById('companion-widget');
  const character = document.getElementById('companion-character');
  const bubble = document.getElementById('companion-bubble');
  const pupils = document.querySelectorAll('.eye-pupil');

  if (!companion || !character || !bubble) return;

  const dialogues = [
    "Hi! We are Akshay's 5 dancing hamsters! 🐹🐹🐹🐹🐹",
    "Click us to see us dance and wiggle! 💃",
    "Akshay is probably writing clean code right now... 💻",
    "Make the impossible, possible! ✨",
    "Have you checked out the projects page? 📐",
    "We love dancing beside the quote! 🎈",
    "If you leave us alone, we might fall asleep... 💤",
    "Waterloo SE represents! 🦁",
    "Dark mode looks so cozy here in Forest Obsidian 🌲",
    "Squeak! Have a wonderful day! 😊"
  ];

  let dialogueIndex = 0;
  let bubbleTimeout;
  let idleTimer;
  let zzzInterval;

  function showDialogue() {
    clearTimeout(bubbleTimeout);
    bubble.textContent = dialogues[dialogueIndex];
    bubble.classList.add('active');
    
    dialogueIndex = (dialogueIndex + 1) % dialogues.length;
    
    // Auto-hide bubble after 4 seconds
    bubbleTimeout = setTimeout(() => {
      bubble.classList.remove('active');
    }, 4000);
  }

  function playAnimation() {
    // Randomly choose an animation class: wiggle, jump, spin
    const animations = ['wiggle', 'jump', 'spin'];
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    
    character.classList.remove('wiggle', 'jump', 'spin');
    // Force reflow
    void character.offsetWidth;
    
    character.classList.add(randomAnim);
    
    setTimeout(() => {
      character.classList.remove(randomAnim);
    }, 600);
  }

  // Wake up companion
  function wakeUp() {
    if (companion.classList.contains('sleeping')) {
      companion.classList.remove('sleeping');
      // Clear any Zzz particles
      const particles = companion.querySelectorAll('.zzz-particle');
      particles.forEach(p => p.remove());
      
      // Briefly show dialogue
      bubble.textContent = "Yawn... Back to dancing! ☀️💃";
      bubble.classList.add('active');
      clearTimeout(bubbleTimeout);
      bubbleTimeout = setTimeout(() => {
        bubble.classList.remove('active');
      }, 2000);
    }
  }

  // Go to sleep companion
  function goSleep() {
    companion.classList.add('sleeping');
    bubble.classList.remove('active');
    
    // Clear old intervals
    clearInterval(zzzInterval);
    // Spawn Zzz particles every 2 seconds
    zzzInterval = setInterval(spawnZzz, 2000);
  }

  // Spawn Zzz particles
  function spawnZzz() {
    if (!companion.classList.contains('sleeping')) return;
    const zzz = document.createElement('span');
    zzz.className = 'zzz-particle';
    zzz.textContent = Math.random() > 0.5 ? 'Z' : 'z';
    
    const randomOffset = Math.random() * 16 - 8;
    zzz.style.left = `calc(50% + ${randomOffset}px)`;
    zzz.style.top = '10px';
    
    companion.appendChild(zzz);
    
    setTimeout(() => {
      zzz.remove();
    }, 2500);
  }

  // Reset idle timer on any mouse move / interaction
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (companion.classList.contains('sleeping')) {
      wakeUp();
    }
    
    idleTimer = setTimeout(() => {
      goSleep();
    }, 20000); // 20 seconds of no interaction to sleep
  }

  // Event Listeners
  companion.addEventListener('click', () => {
    resetIdleTimer();
    playAnimation();
    showDialogue();
  });

  // Track cursor movement for eye pupils
  window.addEventListener('mousemove', (e) => {
    resetIdleTimer();
    if (companion.classList.contains('sleeping')) return;

    pupils.forEach(pupil => {
      const rect = pupil.getBoundingClientRect();
      const pupilX = rect.left + rect.width / 2;
      const pupilY = rect.top + rect.height / 2;
      
      const angle = Math.atan2(e.clientY - pupilY, e.clientX - pupilX);
      const distance = Math.min(3, Math.hypot(e.clientX - pupilX, e.clientY - pupilY) / 100);
      
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      
      pupil.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  });

  // Start the idle timer
  resetIdleTimer();
}

/* ==========================================
   8. DANCING HAMSTERS BEAT ENGINE
   ========================================== */
function initHamsterDance() {
  const row = document.getElementById('hamster-dance-row');
  const label = document.getElementById('hamster-label');
  if (!row || !label) return;

  row.addEventListener('click', () => {
    const isFast = row.classList.toggle('fast-beat');
    if (isFast) {
      label.innerHTML = "The beat is dropping! ⚡🔥💃🐹";
      label.style.color = "var(--accent-color)";
    } else {
      label.innerHTML = "Click the hamsters to speed up the beat! ⚡";
      label.style.color = "";
    }
  });
}
