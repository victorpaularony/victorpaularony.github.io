const GITHUB_USERNAME = 'VictorPaulArony';
const GITHUB_API = 'https://api.github.com';

// Language colors (GitHub linguist palette)
const LANG_COLORS = {
  'Go': '#00ADD8',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Shell': '#89e051',
  'C++': '#f34b7d',
  'C': '#555555',
  'Rust': '#dea584',
  'Java': '#b07219',
  'Solidity': '#AA6746',
};

// Devicon class names (https://devicon.dev)
const DEVICON_MAP = {
  'Go': 'go',
  'JavaScript': 'javascript',
  'TypeScript': 'typescript',
  'Python': 'python',
  'HTML': 'html5',
  'CSS': 'css3',
  'Shell': 'bash',
  'C++': 'cplusplus',
  'C': 'c',
  'Rust': 'rust',
  'Java': 'java',
  'Ruby': 'ruby',
  'PHP': 'php',
  'Swift': 'swift',
  'Kotlin': 'kotlin',
  'Dart': 'dart',
  'Dockerfile': 'docker',
  'Vue': 'vuejs',
  'Solidity': 'solidity',
};

// ── Smooth Scroll ────────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ── GitHub API helpers ────────────────────────────────────────────────────────
async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`);
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${path}`);
  return res.json();
}

function langColor(lang) {
  return LANG_COLORS[lang] || '#4b57ff';
}

function prettyName(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function getCommitCount(repoName) {
  try {
    // We use per_page=1 and check the Link header to get the total number of commits
    const res = await fetch(`${GITHUB_API}/repos/${GITHUB_USERNAME}/${repoName}/commits?author=${GITHUB_USERNAME}&per_page=1`);
    if (!res.ok) return 0;

    const link = res.headers.get('Link');
    if (!link) {
      // If there's no link header, there's either 1 page of results or none.
      // Check the body to be sure.
      const commits = await res.json();
      return commits.length;
    }

    const match = link.match(/&page=(\d+)>; rel="last"/);
    return match ? parseInt(match[1]) : 1;
  } catch (err) {
    return 0;
  }
}

// ── Render GitHub profile into About section ──────────────────────────────────
function renderProfile(p) {
  const avatar = document.getElementById('gh-avatar');
  if (avatar) {
    avatar.src = p.avatar_url;
    avatar.alt = p.name || GITHUB_USERNAME;
  }

  document.documentElement.style.setProperty('--profile-bg', `url(${p.avatar_url})`);

  const loc = document.getElementById('gh-location');
  if (loc && p.location) {
    loc.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.location}`;
  }

  const stats = document.getElementById('gh-stats');
  if (stats) {
    stats.innerHTML = `
      <div class="gh-stat">
        <span class="gh-stat-value">${p.public_repos}</span>
        <span class="gh-stat-label">Repositories</span>
      </div>
      <div class="gh-stat">
        <span class="gh-stat-value">${p.followers}</span>
        <span class="gh-stat-label">Followers</span>
      </div>
      <div class="gh-stat">
        <span class="gh-stat-value">${p.following}</span>
        <span class="gh-stat-label">Following</span>
      </div>
    `;
  }
}

// ── Render repos as project cards ─────────────────────────────────────────────
function renderProjects(repos) {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const hasLive = r => r.homepage && r.homepage.trim().length > 0;

  // Primary list: non-fork repos with a description AND a live deployment
  let list = repos
    .filter(r => !r.fork && r.description && hasLive(r))
    .sort((a, b) =>
      b.stargazers_count - a.stargazers_count ||
      new Date(b.updated_at) - new Date(a.updated_at)
    );

  // Fallback: if none have a homepage, show all non-fork repos with descriptions
  const usingFallback = list.length === 0;
  if (usingFallback) {
    list = repos
      .filter(r => !r.fork && r.description)
      .sort((a, b) =>
        b.stargazers_count - a.stargazers_count ||
        new Date(b.updated_at) - new Date(a.updated_at)
      );
  }

  if (list.length === 0) {
    grid.innerHTML = '<p class="gh-error">No public projects found on GitHub.</p>';
    return;
  }

  if (usingFallback) {
    const note = document.createElement('p');
    note.className = 'gh-fallback-note';
    note.innerHTML = 'No deployed projects found — showing all public repositories. ' +
      'Add a <strong>Website</strong> URL to a repo on GitHub to feature it here.';
    grid.before(note);
  }

  grid.innerHTML = list.map(repo => {
    const lang = repo.language || 'Code';
    const topics = (repo.topics || [])
      .slice(0, 5)
      .map(t => `<span class="repo-topic">${t}</span>`)
      .join('');
    const liveBtn = repo.homepage
      ? `<a href="${repo.homepage}" target="_blank" class="repo-link repo-link-live">
           <i class="fas fa-external-link-alt"></i> Live
         </a>`
      : '';

    return `
      <div class="project-card">
        <div class="repo-header">
          <span class="repo-lang-dot"></span>
          <span class="repo-lang-name">${lang}</span>
          ${repo.stargazers_count > 0
        ? `<span class="repo-stars"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>`
        : ''}
        </div>
        <div class="repo-body">
          <h3>${prettyName(repo.name)}</h3>
          <p>${repo.description}</p>
          ${topics ? `<div class="repo-topics">${topics}</div>` : ''}
          <div class="repo-meta">
            <span title="Forks"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
            <span title="Last updated">${new Date(repo.updated_at).toLocaleDateString()}</span>
          </div>
          <div class="repo-links">
            <a href="${repo.html_url}" target="_blank" class="repo-link">
              <i class="fab fa-github"></i> GitHub
            </a>
            ${liveBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Aggregate language usage from repos ───────────────────────────────────────
async function aggregateLanguages(repos) {
  const langCommits = {};
  const MAX_REPOS = 30; // Limit to stay within GitHub's unauthenticated rate limit

  const relevantRepos = repos.filter(r => !r.fork && r.language).slice(0, MAX_REPOS);

  // Fetch commit counts for relevant repos in parallel (small batches to be safe)
  const BATCH_SIZE = 10;
  for (let i = 0; i < relevantRepos.length; i += BATCH_SIZE) {
    const batch = relevantRepos.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (repo) => {
      const count = await getCommitCount(repo.name);
      langCommits[repo.language] = (langCommits[repo.language] || 0) + count;
    }));
  }

  let total = Object.values(langCommits).reduce((s, v) => s + v, 0);

  // Fallback: If we couldn't get any commit data (likely rate limit), 
  // fall back to counting repositories.
  if (total === 0) {
    repos
      .filter(r => !r.fork && r.language)
      .forEach(r => { langCommits[r.language] = (langCommits[r.language] || 0) + 1; });
    total = Object.values(langCommits).reduce((s, v) => s + v, 0);
  }

  if (total === 0) return [];

  return Object.entries(langCommits)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({
      lang,
      count,
      percent: Math.round((count / total) * 100)
    }));
}

// ── Render "USING NOW" language icon grid ─────────────────────────────────────
function renderLanguageGrid(langs) {
  const grid = document.getElementById('skills-using-grid');
  if (!grid) return;

  grid.innerHTML = langs.slice(0, 10).map(({ lang }) => {
    const icon = DEVICON_MAP[lang];
    const color = langColor(lang);
    return `
      <div class="grid-item">
        ${icon
        ? `<i class="devicon-${icon}-plain colored skill-icon"></i>`
        : `<span class="lang-dot-large" style="background:${color}"></span>`}
        <h6>${lang}</h6>
      </div>
    `;
  }).join('');
}

// ── Render technical skill progress bars ──────────────────────────────────────
function renderSkillBars(langs) {
  const container = document.getElementById('tech-skills-bars');
  if (!container) return;

  container.innerHTML = langs.slice(0, 6).map(({ lang, percent }) => {
    return `
      <div class="prgs-bar">
        <span>${lang}</span>
        <div class="progress">
          <div class="skill-percent">${percent}%</div>
          <div class="progress-bar" role="progressbar"
            aria-valuenow="${percent}" aria-valuemax="100"
            style="width:${percent}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Main loader ───────────────────────────────────────────────────────────────
async function loadGitHubData() {
  try {
    const [profile, repos] = await Promise.all([
      ghFetch(`/users/${GITHUB_USERNAME}`),
      ghFetch(`/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=50`)
    ]);

    const langs = await aggregateLanguages(repos);

    renderProfile(profile);
    renderProjects(repos);
    renderLanguageGrid(langs);
    renderSkillBars(langs);
  } catch (err) {
    console.error('GitHub API:', err);
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = `
        <p class="gh-error">
          <i class="fas fa-exclamation-circle"></i>
          Could not load data from GitHub right now. Please visit
          <a href="https://github.com/${GITHUB_USERNAME}" target="_blank">my GitHub profile</a> directly.
        </p>`;
    }
    ['skills-using-grid', 'tech-skills-bars'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="gh-error">Could not load data.</p>';
    });
  }
}

loadGitHubData();
