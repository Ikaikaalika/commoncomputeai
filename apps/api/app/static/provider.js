const output = document.getElementById("provider-output");
const API_BASE = (window.COMMONCOMMUTE_API_BASE_URL || "").replace(/\/$/, "") || window.location.origin;
let providerToken = localStorage.getItem("providerToken") || "";
let currentTaskId = null;
let deviceId = Number(localStorage.getItem("providerDeviceId") || 0);

function resolveUrl(path) {
  return new URL(path, API_BASE).toString();
}

async function request(url, method, body, token = providerToken) {
  const response = await fetch(resolveUrl(url), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
}

function show(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

async function showSnapshot(message, extra = {}) {
  const payload = {
    message,
    deviceId,
    currentTaskId,
    ...extra,
  };

  if (providerToken) {
    try {
      payload.provider = await request("/providers/me", "GET");
    } catch (error) {
      payload.provider_error = error instanceof Error ? error.message : String(error);
    }
  }

  show(payload);
}

document.getElementById("provider-register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  payload.role = "provider";
  const data = await request("/auth/register", "POST", payload, "");
  providerToken = data.token;
  localStorage.setItem("providerToken", providerToken);
  await showSnapshot("Registered provider", { response: data });
});

document.getElementById("provider-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  const data = await request("/auth/login", "POST", payload, "");
  providerToken = data.token;
  localStorage.setItem("providerToken", providerToken);
  await showSnapshot("Logged in provider", { response: data });
});

document.getElementById("device-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  payload.cpu_cores = Number(payload.cpu_cores);
  payload.memory_gb = Number(payload.memory_gb);
  const data = await request("/providers/devices", "POST", payload);
  deviceId = data.id;
  localStorage.setItem("providerDeviceId", String(deviceId));
  await showSnapshot("Enrolled device", { response: data });
});

document.getElementById("poll-task-btn").addEventListener("click", async () => {
  const data = await request("/worker/poll", "POST", { device_id: deviceId });
  currentTaskId = data.task?.id ?? null;
  await showSnapshot("Polled for task", { response: data });
});

document.getElementById("complete-task-btn").addEventListener("click", async () => {
  if (!currentTaskId) throw new Error("No current task");
  const data = await request(`/worker/tasks/${currentTaskId}/complete`, "POST", { result_uri: `local://result/${currentTaskId}` });
  currentTaskId = null;
  await showSnapshot("Completed current task", { response: data });
});
