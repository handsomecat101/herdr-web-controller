const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3840;
const HERDR_BIN = 'H:\\AI Project\\herdr-prebuilt\\herdr.exe';
const PROJECTS_ROOT = 'H:\\AI Project';

let activeWorkspaceId = 'w2'; // Currently in 3D STUDIO FORGE (w2)

function execHerdr(cmd) {
  return new Promise((resolve) => {
    exec(`"${HERDR_BIN}" ${cmd}`, { cwd: PROJECTS_ROOT }, (err, stdout, stderr) => {
      if (err && !stdout) {
        resolve({ error: err.message || stderr });
      } else {
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          resolve({ raw: stdout ? stdout.trim() : stderr });
        }
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Get All Projects & Workspaces
  if (url.pathname === '/api/projects' && req.method === 'GET') {
    try {
      const dirs = fs.readdirSync(PROJECTS_ROOT, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
        .map(d => ({
          name: d.name,
          path: path.join(PROJECTS_ROOT, d.name)
        }));

      const wsRes = await execHerdr('workspace list');
      const activeWorkspaces = wsRes?.result?.workspaces || [];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        projects: dirs,
        activeWorkspaces,
        activeWorkspaceId
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 2. Open / Switch Project Workspace
  if (url.pathname === '/api/workspaces/open' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { projectPath, label } = JSON.parse(body);
        const wsList = await execHerdr('workspace list');
        const existing = (wsList?.result?.workspaces || []).find(w => w.label === label);

        if (existing) {
          activeWorkspaceId = existing.workspace_id;
        } else {
          const createRes = await execHerdr(`workspace create --cwd "${projectPath}" --label "${label}"`);
          if (createRes?.result?.workspace?.workspace_id) {
            activeWorkspaceId = createRes.result.workspace.workspace_id;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, activeWorkspaceId }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 3. Get Panes and Agents for active workspace
  if (url.pathname === '/api/panes' && req.method === 'GET') {
    const wsId = url.searchParams.get('workspaceId') || activeWorkspaceId;
    const panesRes = await execHerdr(`pane list --workspace ${wsId}`);
    const agentsRes = await execHerdr('agent list');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      workspaceId: wsId,
      panes: panesRes?.result?.panes || [],
      agents: agentsRes?.result?.agents || []
    }));
    return;
  }

  // 4. Read Pane output
  if (url.pathname.startsWith('/api/pane/') && url.pathname.endsWith('/read') && req.method === 'GET') {
    const paneId = url.pathname.split('/')[3];
    const lines = url.searchParams.get('lines') || 60;

    exec(`"${HERDR_BIN}" pane read ${paneId} --lines ${lines}`, { cwd: PROJECTS_ROOT }, (err, stdout) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, paneId, content: stdout || '' }));
    });
    return;
  }

  // 5. Send command to Pane
  if (url.pathname.startsWith('/api/pane/') && url.pathname.endsWith('/run') && req.method === 'POST') {
    const paneId = url.pathname.split('/')[3];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { cmd } = JSON.parse(body);
        exec(`"${HERDR_BIN}" pane run ${paneId} "${cmd.replace(/"/g, '\\"')}"`, { cwd: PROJECTS_ROOT }, (err) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: !err }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 6. Split Pane (with proper target and focus!)
  if (url.pathname === '/api/pane/split' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { paneId, direction } = JSON.parse(body || '{}');
        const targetPane = paneId || 'w2:p1';
        const dirFlag = direction === 'down' ? '--direction down' : '--direction right';

        const splitRes = await execHerdr(`pane split ${targetPane} ${dirFlag} --focus`);
        const newPaneId = splitRes?.result?.pane?.pane_id || null;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, newPaneId, result: splitRes }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Static files
  let filePath = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  }[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end(`Error: ${err.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Herdr Web Controller running on port ${PORT}`);
});
