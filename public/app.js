let activePaneId = 'w2:p1';
let activeWsId = 'w2';
let currentCwd = 'H:\\AI Project\\3D STUDIO FORGE';
let allProjects = [];
let allPanes = [];
let pollTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadAll();

  // Enter to send
  document.getElementById('mainCmdInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendActivePaneCommand();
    }
  });

  // Start polling active pane
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollActivePanes, 2000);
});

function focusInput() {
  const input = document.getElementById('mainCmdInput');
  if (input) input.focus();
}

function toggleSidebar() {
  const drawer = document.getElementById('sidebarDrawer');
  const backdrop = document.getElementById('sidebarBackdrop');
  const isClosed = drawer.classList.contains('-translate-x-full');

  if (isClosed) {
    drawer.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  } else {
    drawer.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }
}

function closeSidebar() {
  const drawer = document.getElementById('sidebarDrawer');
  const backdrop = document.getElementById('sidebarBackdrop');
  drawer.classList.add('-translate-x-full');
  backdrop.classList.add('hidden');
}

async function loadAll() {
  await loadProjects();
  await loadPanes();
}

// 1. Load Projects List
async function loadProjects() {
  const container = document.getElementById('projectsList');
  try {
    const res = await fetch('/api/projects');
    const data = await res.json();

    if (data.success) {
      allProjects = data.projects;
      document.getElementById('projectCount').textContent = allProjects.length;
      if (data.activeWorkspaceId) activeWsId = data.activeWorkspaceId;
      renderProjectsList(allProjects);
    }
  } catch (e) {
    container.innerHTML = '<div class="text-red-400 p-2 text-xs">Lỗi tải dự án</div>';
  }
}

function renderProjectsList(projects) {
  const container = document.getElementById('projectsList');
  container.innerHTML = projects.map((p, idx) => {
    const isCurrent = currentCwd.toLowerCase() === p.path.toLowerCase();
    const activeClass = isCurrent ? 'bg-[#1f2937] text-emerald-400 border-l-2 border-emerald-400 font-bold' : 'text-gray-400 hover:bg-[#161b22] hover:text-white';

    return `
      <div onclick="switchProject('${p.path.replace(/\\/g, '\\\\')}', '${p.name}')" 
           class="px-2.5 py-2 rounded cursor-pointer transition flex items-center justify-between ${activeClass}">
        <div class="flex items-center space-x-2 truncate">
          <span class="text-gray-600 text-[10px] w-5 text-right font-mono">${idx + 1}</span>
          <span class="truncate">${p.name}</span>
        </div>
        ${isCurrent ? '<span class="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">active</span>' : ''}
      </div>
    `;
  }).join('');
}

function filterProjects() {
  const query = document.getElementById('searchProjectInput').value.toLowerCase().trim();
  const filtered = allProjects.filter(p => p.name.toLowerCase().includes(query));
  renderProjectsList(filtered);
}

// 2. Switch Project Workspace
async function switchProject(projectPath, label) {
  currentCwd = projectPath;
  document.getElementById('activeWorkspaceLabel').textContent = label;
  closeSidebar();

  try {
    const res = await fetch('/api/workspaces/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectPath, label })
    });
    const data = await res.json();
    if (data.success) {
      activeWsId = data.activeWorkspaceId;
      await loadProjects();
      await loadPanes();
    }
  } catch (e) {
    alert('Lỗi chuyển dự án: ' + e.message);
  }
}

// 3. Load Panes for Active Workspace
async function loadPanes() {
  const container = document.getElementById('panesContainer');
  const tabsContainer = document.getElementById('paneTabsContainer');

  try {
    const res = await fetch(`/api/panes?workspaceId=${activeWsId}`);
    const data = await res.json();

    if (data.success && data.panes.length > 0) {
      allPanes = data.panes;
      
      if (!allPanes.some(p => p.pane_id === activePaneId)) {
        activePaneId = allPanes[0].pane_id;
      }
      document.getElementById('targetPaneLabel').textContent = activePaneId;

      // Render Dedicated Window Switcher Tabs
      tabsContainer.innerHTML = allPanes.map((p, idx) => {
        const isFocused = p.pane_id === activePaneId;
        const activeTabClass = isFocused 
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 font-bold shadow-sm' 
          : 'bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]';

        return `
          <button onclick="focusPane('${p.pane_id}')" 
                  class="px-2.5 py-1 rounded-md text-xs font-mono transition flex items-center space-x-1.5 shrink-0 ${activeTabClass}">
            <span class="w-2 h-2 rounded-full ${isFocused ? 'bg-amber-400' : 'bg-gray-600'}"></span>
            <span>Cửa sổ ${idx + 1} (${p.pane_id})</span>
            <span class="text-[9px] opacity-75">${p.label || 'cmd'}</span>
          </button>
        `;
      }).join('');

      // On mobile screens (< 768px): Only display active pane full screen!
      const isMobile = window.innerWidth < 768;
      const visiblePanes = isMobile ? allPanes.filter(p => p.pane_id === activePaneId) : allPanes;

      container.innerHTML = visiblePanes.map(p => {
        const isFocused = p.pane_id === activePaneId;
        const borderStyle = isFocused ? 'border-[#f97316] ring-1 ring-[#f97316]/50' : 'border-[#21262d]';

        return `
          <div onclick="focusPane('${p.pane_id}')" 
               class="flex flex-col bg-[#0d1117] border ${borderStyle} rounded-lg overflow-hidden h-full shadow-lg transition">
            
            <!-- Pane Header -->
            <div class="px-2.5 py-1 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between text-xs font-mono shrink-0">
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 rounded-full ${isFocused ? 'bg-[#f97316]' : 'bg-gray-600'}"></span>
                <span class="font-bold text-white text-[11px]">${p.pane_id}</span>
                <span class="text-gray-400 text-[10px]">${p.label || 'cmd'}</span>
              </div>
              <span class="text-[9px] text-gray-500 font-mono">${p.agent_status || 'idle'}</span>
            </div>

            <!-- Pane Terminal Body -->
            <div id="pane_content_${p.pane_id.replace(':', '_')}" 
                 onclick="focusInput()"
                 class="flex-1 p-2 font-mono text-[11px] text-[#c9d1d9] overflow-y-auto whitespace-pre-wrap break-all terminal-scroll select-text bg-[#050811] leading-relaxed cursor-text">
              Đang tải nội dung...
            </div>

            <!-- Pane Bottom Status Bar -->
            <div class="px-2.5 py-0.5 bg-[#090d16] border-t border-[#21262d] text-[9px] font-mono text-gray-500 flex items-center justify-between truncate shrink-0">
              <span class="truncate">${p.cwd}</span>
              <span class="text-emerald-400 shrink-0 ml-2 font-mono">${p.label || 'cmd'}</span>
            </div>
          </div>
        `;
      }).join('');

      visiblePanes.forEach(p => fetchPaneContent(p.pane_id));
    }
  } catch (e) {
    console.error('Lỗi tải panes:', e);
  }
}

// 4. Focus a Pane
function focusPane(paneId) {
  activePaneId = paneId;
  document.getElementById('targetPaneLabel').textContent = paneId;
  loadPanes();
}

// 5. Fetch Content for specific pane
async function fetchPaneContent(paneId) {
  try {
    const res = await fetch(`/api/pane/${paneId}/read?lines=60`);
    const data = await res.json();
    if (data.success) {
      const el = document.getElementById(`pane_content_${paneId.replace(':', '_')}`);
      if (el) {
        el.textContent = data.content || '(Terminal trống)';
        el.scrollTop = el.scrollHeight;
      }
    }
  } catch (e) {}
}

function pollActivePanes() {
  if (activePaneId) {
    fetchPaneContent(activePaneId);
  }
}

// 6. Send Command to Focused Pane
async function sendActivePaneCommand() {
  const input = document.getElementById('mainCmdInput');
  const cmd = input.value.trim();
  if (!cmd || !activePaneId) return;

  input.value = '';
  try {
    await fetch(`/api/pane/${activePaneId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd })
    });
    setTimeout(() => fetchPaneContent(activePaneId), 300);
    setTimeout(() => fetchPaneContent(activePaneId), 1000);
  } catch (e) {
    alert('Lỗi gửi lệnh: ' + e.message);
  }
}

function sendQuick(cmd) {
  document.getElementById('mainCmdInput').value = cmd;
  sendActivePaneCommand();
}

// 7. Create New Window (Split and immediately switch to it!)
async function createNewWindow() {
  try {
    const res = await fetch('/api/pane/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paneId: activePaneId, direction: 'right' })
    });
    const data = await res.json();
    if (data.success && data.newPaneId) {
      activePaneId = data.newPaneId;
    }
    setTimeout(loadPanes, 500);
  } catch (e) {
    alert('Lỗi mở cửa sổ mới: ' + e.message);
  }
}

window.addEventListener('resize', () => {
  loadPanes();
});
