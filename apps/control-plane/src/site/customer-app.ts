export function renderCustomerApp(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CommonCompute Customer App</title>
    <meta name="description" content="Create and manage AI inference/training GPU jobs on CommonCompute." />
    <meta name="theme-color" content="#0b6f66" />
    <style>
      :root {
        --ink: #102328;
        --ink-soft: #315159;
        --bg: #f3f9fa;
        --card: #ffffff;
        --line: #c4dde1;
        --teal: #0b6f66;
        --teal-2: #109084;
        --mint: #e4f7f4;
        --orange: #d7692f;
        --gold: #f4bd56;
        --danger: #b24334;
        --danger-soft: #ffe8e3;
        --ok: #1e7d57;
        --ok-soft: #e5f7ef;
        --shadow: 0 16px 34px rgba(6, 52, 59, 0.14);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Avenir Next", "Nunito Sans", "Trebuchet MS", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(1000px 380px at 95% -10%, #dff5f1, transparent 68%),
          radial-gradient(800px 320px at -5% -20%, #ffe8d8, transparent 62%),
          var(--bg);
      }

      .shell {
        max-width: 1220px;
        margin: 0 auto;
        padding: 24px;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .mark {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background:
          conic-gradient(from 220deg, var(--orange), var(--gold), #56b9b0, var(--teal), var(--orange));
      }

      .brand strong {
        font-size: 1.1rem;
      }

      .top-actions {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .btn {
        border: 1px solid transparent;
        border-radius: 12px;
        padding: 9px 14px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }

      .btn-primary {
        background: var(--teal);
        color: #f2fffd;
      }

      .btn-secondary {
        background: var(--mint);
        border-color: #8fd1c8;
        color: #0e5d56;
      }

      .btn-danger {
        background: var(--danger-soft);
        border-color: #f2b8ae;
        color: var(--danger);
      }

      .status-banner {
        margin-top: 14px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #ffffff;
        padding: 10px 12px;
        color: var(--ink-soft);
      }

      .status-banner.error {
        border-color: #efb2a7;
        background: #fff0ec;
        color: #8e2f21;
      }

      .status-banner.success {
        border-color: #9fd8be;
        background: #ebfbf2;
        color: #1d6f4d;
      }

      .split {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 340px 1fr;
        gap: 16px;
      }

      .panel {
        border: 1px solid var(--line);
        background: var(--card);
        border-radius: 18px;
        box-shadow: var(--shadow);
      }

      .panel h2,
      .panel h3 {
        margin: 0;
      }

      .panel-body {
        padding: 18px;
      }

      .panel-muted {
        color: var(--ink-soft);
        font-size: 0.92rem;
      }

      .auth-stack {
        display: grid;
        gap: 12px;
      }

      .auth-card {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px;
        background: #f9fefe;
      }

      label {
        display: grid;
        gap: 6px;
        margin-bottom: 10px;
        font-weight: 700;
        font-size: 0.89rem;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid #a8cfd3;
        border-radius: 10px;
        padding: 10px;
        background: #fff;
        font: inherit;
        color: var(--ink);
      }

      textarea {
        min-height: 72px;
        resize: vertical;
      }

      .row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .row-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .dashboard {
        display: grid;
        gap: 14px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .info {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: #f7fdfd;
        padding: 11px;
      }

      .info .k {
        font-size: 1.2rem;
        font-weight: 800;
      }

      .info .l {
        margin-top: 4px;
        color: var(--ink-soft);
        font-size: 0.82rem;
      }

      .job-table-wrap {
        overflow: auto;
        border: 1px solid var(--line);
        border-radius: 12px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 860px;
      }

      th,
      td {
        text-align: left;
        padding: 10px;
        border-bottom: 1px solid #e2eff1;
        vertical-align: top;
      }

      th {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--ink-soft);
        background: #f6fcfc;
      }

      .pill {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 0.78rem;
        border: 1px solid #abcfd3;
        background: #eef9fa;
      }

      .pill.running {
        background: #fff7e7;
        border-color: #f0d08e;
      }

      .pill.completed {
        background: var(--ok-soft);
        border-color: #9ed9b7;
      }

      .pill.failed,
      .pill.cancelled {
        background: var(--danger-soft);
        border-color: #efb7ad;
      }

      .job-actions {
        display: inline-flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .muted {
        color: var(--ink-soft);
      }

      .hidden {
        display: none !important;
      }

      .logs {
        white-space: pre-wrap;
        background: #f8fcfd;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 10px;
        font-family: "SFMono-Regular", Menlo, Consolas, monospace;
        font-size: 0.78rem;
        max-height: 300px;
        overflow: auto;
      }

      .footer {
        margin-top: 16px;
        text-align: center;
        color: var(--ink-soft);
        font-size: 0.85rem;
      }

      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .panel {
        animation: rise 0.4s ease both;
      }

      @media (max-width: 1080px) {
        .split {
          grid-template-columns: 1fr;
        }

        .info-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 680px) {
        .row-2,
        .row-3,
        .info-grid {
          grid-template-columns: 1fr;
        }

        .shell {
          padding: 14px;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="mark" aria-hidden="true"></div>
          <div>
            <strong>CommonCompute Customer App</strong>
            <div class="muted">Submit AI jobs, track status, and manage usage</div>
          </div>
        </div>
        <div class="top-actions">
          <a class="btn btn-secondary" href="/">Marketing Site</a>
          <button class="btn btn-danger hidden" id="logoutBtn" type="button">Logout</button>
        </div>
      </header>

      <div id="statusBanner" class="status-banner">Ready. Create an account or log in.</div>

      <div class="split">
        <aside class="panel">
          <div class="panel-body auth-stack" id="authPanel">
            <section class="auth-card">
              <h3>Create Customer Account</h3>
              <p class="panel-muted">Turnstile is bypassed in current environment; production will validate it.</p>
              <form id="signupForm">
                <label>
                  Email
                  <input required type="email" name="email" placeholder="you@example.com" />
                </label>
                <label>
                  Password
                  <input required minlength="12" type="password" name="password" placeholder="At least 12 characters" />
                </label>
                <button class="btn btn-primary" type="submit">Sign Up</button>
              </form>
            </section>

            <section class="auth-card">
              <h3>Login</h3>
              <form id="loginForm">
                <label>
                  Email
                  <input required type="email" name="email" placeholder="you@example.com" />
                </label>
                <label>
                  Password
                  <input required type="password" name="password" placeholder="Your password" />
                </label>
                <button class="btn btn-secondary" type="submit">Login</button>
              </form>
            </section>

            <section class="auth-card">
              <h3>Pricing Estimate</h3>
              <form id="estimateForm">
                <div class="row-2">
                  <label>
                    Workload
                    <select name="workload_type">
                      <option value="inference">Inference</option>
                      <option value="training">Training</option>
                    </select>
                  </label>
                  <label>
                    Runtime
                    <select name="runtime">
                      <option value="cuda">CUDA</option>
                      <option value="rocm">ROCm</option>
                      <option value="metal">Metal</option>
                    </select>
                  </label>
                </div>
                <div class="row-2">
                  <label>
                    Min VRAM (GB)
                    <input type="number" step="1" min="1" name="min_vram_gb" value="16" />
                  </label>
                  <label>
                    Min GPU Count
                    <input type="number" step="1" min="1" name="min_gpu_count" value="1" />
                  </label>
                </div>
                <button class="btn btn-secondary" type="submit">Estimate Price</button>
              </form>
              <div id="estimateResult" class="panel-muted" style="margin-top:10px;">No estimate run yet.</div>
            </section>
          </div>
        </aside>

        <main class="dashboard">
          <section class="panel">
            <div class="panel-body">
              <h2>Customer Dashboard</h2>
              <p class="panel-muted">Your account metrics and current marketplace activity.</p>
              <div class="info-grid">
                <div class="info"><div class="k" id="statQueued">0</div><div class="l">Queued Jobs</div></div>
                <div class="info"><div class="k" id="statRunning">0</div><div class="l">Running Jobs</div></div>
                <div class="info"><div class="k" id="statCompleted">0</div><div class="l">Completed Jobs</div></div>
                <div class="info"><div class="k" id="statProviders">0</div><div class="l">Verified Online Providers</div></div>
              </div>
              <div class="panel-muted" style="margin-top:12px;">Signed in as: <span id="whoami">anonymous</span></div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-body">
              <h3>Create Job</h3>
              <p class="panel-muted">Start inference or training work. Jobs are matched to verified provider capacity.</p>
              <form id="createJobForm">
                <div class="row-3">
                  <label>
                    Workload
                    <select name="workload_type">
                      <option value="inference">Inference</option>
                      <option value="training">Training</option>
                    </select>
                  </label>
                  <label>
                    Runtime
                    <select name="runtime">
                      <option value="cuda">CUDA</option>
                      <option value="rocm">ROCm</option>
                      <option value="metal">Metal</option>
                    </select>
                  </label>
                  <label>
                    SLA Tier
                    <select name="sla_tier">
                      <option value="standard">Standard</option>
                      <option value="best_effort">Best Effort</option>
                      <option value="critical">Critical</option>
                    </select>
                  </label>
                </div>

                <div class="row-3">
                  <label>
                    Container Image
                    <input type="text" name="image" value="ghcr.io/commoncompute/demo:latest" required />
                  </label>
                  <label>
                    Min VRAM (GB)
                    <input type="number" name="min_vram_gb" min="1" step="1" value="16" required />
                  </label>
                  <label>
                    Min GPU Count
                    <input type="number" name="min_gpu_count" min="1" step="1" value="1" required />
                  </label>
                </div>

                <div class="row-2">
                  <label>
                    Command (space separated)
                    <input type="text" name="command" value="python serve.py" required />
                  </label>
                  <label>
                    Budget Cap USD
                    <input type="number" name="budget_cap_usd" min="1" step="0.01" value="25" required />
                  </label>
                </div>

                <label>
                  Allowed Jurisdictions (comma-separated)
                  <input type="text" name="jurisdictions" value="US" />
                </label>

                <button class="btn btn-primary" type="submit">Submit Job</button>
              </form>
            </div>
          </section>

          <section class="panel">
            <div class="panel-body">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                <h3>Your Jobs</h3>
                <div class="job-actions">
                  <button class="btn btn-secondary" id="refreshJobsBtn" type="button">Refresh Jobs</button>
                  <button class="btn btn-secondary" id="refreshStatsBtn" type="button">Refresh Stats</button>
                </div>
              </div>
              <div class="job-table-wrap" style="margin-top:10px;">
                <table>
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Workload</th>
                      <th>Budget</th>
                      <th>Provider</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="jobsBody"></tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-body">
              <h3>Job Logs</h3>
              <div id="logsPane" class="logs">Select a job and click "Logs" to inspect lifecycle events.</div>
            </div>
          </section>
        </main>
      </div>

      <div class="footer">Customer app runs on commoncompute.ai and calls same-origin API routes.</div>
    </div>

    <script>
      const state = {
        token: localStorage.getItem('cc_customer_token') || '',
        user: null,
        jobs: []
      };

      const els = {
        statusBanner: document.getElementById('statusBanner'),
        signupForm: document.getElementById('signupForm'),
        loginForm: document.getElementById('loginForm'),
        logoutBtn: document.getElementById('logoutBtn'),
        estimateForm: document.getElementById('estimateForm'),
        estimateResult: document.getElementById('estimateResult'),
        createJobForm: document.getElementById('createJobForm'),
        jobsBody: document.getElementById('jobsBody'),
        logsPane: document.getElementById('logsPane'),
        refreshJobsBtn: document.getElementById('refreshJobsBtn'),
        refreshStatsBtn: document.getElementById('refreshStatsBtn'),
        whoami: document.getElementById('whoami'),
        statQueued: document.getElementById('statQueued'),
        statRunning: document.getElementById('statRunning'),
        statCompleted: document.getElementById('statCompleted'),
        statProviders: document.getElementById('statProviders')
      };

      function setStatus(message, tone) {
        els.statusBanner.textContent = message;
        els.statusBanner.classList.remove('error', 'success');
        if (tone === 'error') els.statusBanner.classList.add('error');
        if (tone === 'success') els.statusBanner.classList.add('success');
      }

      async function api(path, options) {
        const opts = options || {};
        const headers = Object.assign({ 'content-type': 'application/json' }, opts.headers || {});
        if (state.token && opts.auth !== false) {
          headers.authorization = 'Bearer ' + state.token;
        }

        const response = await fetch(path, {
          method: opts.method || 'GET',
          headers,
          body: opts.body ? JSON.stringify(opts.body) : undefined
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch (_err) {
          payload = null;
        }

        if (!response.ok) {
          const message = payload && payload.error ? payload.error : 'Request failed';
          throw new Error(message + ' (' + response.status + ')');
        }

        return payload;
      }

      function parseCommand(commandText) {
        return String(commandText)
          .trim()
          .split(/\s+/)
          .filter(Boolean);
      }

      function parseJurisdictions(text) {
        return String(text || '')
          .split(',')
          .map(function (part) { return part.trim(); })
          .filter(Boolean);
      }

      function statusPillClass(status) {
        if (status === 'running') return 'pill running';
        if (status === 'completed') return 'pill completed';
        if (status === 'failed' || status === 'cancelled') return 'pill failed';
        return 'pill';
      }

      function canCancel(status) {
        return status === 'queued' || status === 'reserved' || status === 'running';
      }

      function summarizeJobStats(jobs) {
        const stats = { queued: 0, running: 0, completed: 0 };
        jobs.forEach(function (job) {
          if (job.status === 'queued') stats.queued += 1;
          if (job.status === 'running') stats.running += 1;
          if (job.status === 'completed') stats.completed += 1;
        });
        return stats;
      }

      function renderJobsTable() {
        const rows = state.jobs || [];
        if (rows.length === 0) {
          els.jobsBody.innerHTML = '<tr><td colspan="7" class="muted">No jobs yet. Create one above.</td></tr>';
          return;
        }

        const html = rows.map(function (job) {
          const updated = job.updated_at || job.created_at || '';
          const provider = job.assigned_provider_id || '-';
          const cancelBtn = canCancel(job.status)
            ? '<button class="btn btn-danger" data-action="cancel" data-job="' + job.id + '">Cancel</button>'
            : '';

          return '<tr>' +
            '<td><code>' + job.id + '</code></td>' +
            '<td><span class="' + statusPillClass(job.status) + '">' + job.status + '</span></td>' +
            '<td>' + job.workload_type + '</td>' +
            '<td>$' + Number(job.budget_cap_usd).toFixed(2) + '</td>' +
            '<td><code>' + provider + '</code></td>' +
            '<td>' + updated + '</td>' +
            '<td><div class="job-actions">' +
              '<button class="btn btn-secondary" data-action="logs" data-job="' + job.id + '">Logs</button>' +
              cancelBtn +
            '</div></td>' +
          '</tr>';
        }).join('');

        els.jobsBody.innerHTML = html;
      }

      async function refreshAccount() {
        if (!state.token) {
          els.whoami.textContent = 'anonymous';
          return;
        }

        const data = await api('/v1/account/me');
        state.user = data.user || null;
        els.whoami.textContent = state.user ? state.user.email + ' (' + state.user.role + ')' : 'authenticated';
      }

      async function refreshJobs() {
        if (!state.token) {
          state.jobs = [];
          renderJobsTable();
          return;
        }

        const data = await api('/v1/account/jobs?limit=100');
        state.jobs = data.jobs || [];
        renderJobsTable();

        const stats = summarizeJobStats(state.jobs);
        els.statQueued.textContent = String(stats.queued);
        els.statRunning.textContent = String(stats.running);
        els.statCompleted.textContent = String(stats.completed);
      }

      async function refreshMarketStats() {
        const data = await api('/v1/market/stats', { auth: false });
        const providers = data && data.providers ? data.providers : {};
        els.statProviders.textContent = String(Number(providers.verified_online || 0));
      }

      async function runEstimate(formData) {
        const query = new URLSearchParams({
          workload_type: formData.get('workload_type'),
          runtime: formData.get('runtime'),
          min_vram_gb: formData.get('min_vram_gb'),
          min_gpu_count: formData.get('min_gpu_count'),
          jurisdiction: 'US'
        });

        const data = await api('/v1/market/pricing/estimate?' + query.toString(), { auth: false });
        if (!data || !data.estimate) {
          els.estimateResult.textContent = 'No compatible providers online for this shape right now.';
          return;
        }

        els.estimateResult.textContent =
          'Lowest $' + Number(data.estimate.lowest_price_per_gpu_hour_usd).toFixed(4) +
          '/hr, median $' + Number(data.estimate.median_price_per_gpu_hour_usd).toFixed(4) +
          '/hr, est. start in ~' + String(data.estimate.estimated_start_window_seconds) + 's';
      }

      async function signup(formData) {
        const payload = await api('/v1/auth/signup', {
          method: 'POST',
          auth: false,
          body: {
            email: formData.get('email'),
            password: formData.get('password'),
            role: 'customer'
          }
        });

        if (!payload || !payload.token) {
          throw new Error('Signup returned no token');
        }

        state.token = payload.token;
        localStorage.setItem('cc_customer_token', state.token);
        setStatus('Signup complete and authenticated.', 'success');
      }

      async function login(formData) {
        const payload = await api('/v1/auth/login', {
          method: 'POST',
          auth: false,
          body: {
            email: formData.get('email'),
            password: formData.get('password')
          }
        });

        if (!payload || !payload.token) {
          throw new Error('Login returned no token');
        }

        state.token = payload.token;
        localStorage.setItem('cc_customer_token', state.token);
        setStatus('Logged in.', 'success');
      }

      async function createJob(formData) {
        const command = parseCommand(formData.get('command'));
        if (command.length === 0) {
          throw new Error('Command cannot be empty');
        }

        const jurisdictions = parseJurisdictions(formData.get('jurisdictions'));
        const payload = {
          job_spec: {
            workload_type: String(formData.get('workload_type')),
            image: String(formData.get('image')),
            command,
            gpu_constraints: {
              runtime: String(formData.get('runtime')),
              min_vram_gb: Number(formData.get('min_vram_gb')),
              min_gpu_count: Number(formData.get('min_gpu_count')),
              model_allowlist: [],
              jurisdiction_allowlist: jurisdictions.length ? jurisdictions : ['US']
            },
            network_policy: {
              egress_default_deny: true,
              allowlist_domains: [],
              allowlist_cidrs: [],
              dns_policy: 'platform'
            },
            mounts: [],
            budget_cap_usd: Number(formData.get('budget_cap_usd')),
            sla_tier: String(formData.get('sla_tier'))
          }
        };

        const result = await api('/v1/jobs', {
          method: 'POST',
          body: payload
        });

        setStatus('Job submitted: ' + result.job_id, 'success');
        await refreshJobs();
      }

      async function loadLogs(jobId) {
        const data = await api('/v1/jobs/' + encodeURIComponent(jobId) + '/logs');
        const lines = [];
        lines.push('job_id: ' + jobId);
        lines.push('event_count: ' + (data.events ? data.events.length : 0));
        lines.push('');

        (data.events || []).forEach(function (event) {
          lines.push('[' + event.created_at + '] ' + event.event_type);
          lines.push(JSON.stringify(event.event));
          lines.push('');
        });

        if (data.latest_log) {
          lines.push('--- latest_log ---');
          lines.push(String(data.latest_log));
        }

        els.logsPane.textContent = lines.join('\n');
      }

      async function cancelJob(jobId) {
        await api('/v1/jobs/' + encodeURIComponent(jobId) + '/cancel', {
          method: 'POST',
          body: {}
        });
        setStatus('Job cancelled: ' + jobId, 'success');
        await refreshJobs();
      }

      function bindJobTableActions() {
        els.jobsBody.addEventListener('click', async function (event) {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;

          const action = target.getAttribute('data-action');
          const jobId = target.getAttribute('data-job');
          if (!action || !jobId) return;

          try {
            if (action === 'logs') {
              await loadLogs(jobId);
              setStatus('Loaded logs for ' + jobId + '.', 'success');
            }
            if (action === 'cancel') {
              await cancelJob(jobId);
            }
          } catch (error) {
            setStatus(String(error.message || error), 'error');
          }
        });
      }

      async function refreshAll() {
        await Promise.all([refreshAccount(), refreshJobs(), refreshMarketStats()]);
      }

      function setAuthUi() {
        const loggedIn = Boolean(state.token);
        if (loggedIn) {
          els.logoutBtn.classList.remove('hidden');
        } else {
          els.logoutBtn.classList.add('hidden');
          state.user = null;
          state.jobs = [];
          renderJobsTable();
          els.whoami.textContent = 'anonymous';
          els.statQueued.textContent = '0';
          els.statRunning.textContent = '0';
          els.statCompleted.textContent = '0';
        }
      }

      function startAutoRefresh() {
        setInterval(function () {
          if (!state.token) return;
          refreshJobs().catch(function () {});
          refreshMarketStats().catch(function () {});
        }, 12000);
      }

      els.signupForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(els.signupForm);

        try {
          await signup(formData);
          setAuthUi();
          await refreshAll();
        } catch (error) {
          setStatus(String(error.message || error), 'error');
        }
      });

      els.loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(els.loginForm);

        try {
          await login(formData);
          setAuthUi();
          await refreshAll();
        } catch (error) {
          setStatus(String(error.message || error), 'error');
        }
      });

      els.logoutBtn.addEventListener('click', function () {
        state.token = '';
        localStorage.removeItem('cc_customer_token');
        setAuthUi();
        setStatus('Logged out.', 'success');
      });

      els.estimateForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const formData = new FormData(els.estimateForm);

        try {
          await runEstimate(formData);
          setStatus('Estimate loaded.', 'success');
        } catch (error) {
          setStatus(String(error.message || error), 'error');
        }
      });

      els.createJobForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        if (!state.token) {
          setStatus('Login required before job creation.', 'error');
          return;
        }

        const formData = new FormData(els.createJobForm);

        try {
          await createJob(formData);
        } catch (error) {
          setStatus(String(error.message || error), 'error');
        }
      });

      els.refreshJobsBtn.addEventListener('click', function () {
        refreshJobs()
          .then(function () { setStatus('Jobs refreshed.', 'success'); })
          .catch(function (error) { setStatus(String(error.message || error), 'error'); });
      });

      els.refreshStatsBtn.addEventListener('click', function () {
        refreshMarketStats()
          .then(function () { setStatus('Marketplace stats refreshed.', 'success'); })
          .catch(function (error) { setStatus(String(error.message || error), 'error'); });
      });

      bindJobTableActions();
      setAuthUi();
      refreshMarketStats().catch(function () {});

      if (state.token) {
        refreshAll()
          .then(function () { setStatus('Authenticated session restored.', 'success'); })
          .catch(function (error) { setStatus(String(error.message || error), 'error'); });
      }

      startAutoRefresh();
    </script>
  </body>
</html>`;
}
