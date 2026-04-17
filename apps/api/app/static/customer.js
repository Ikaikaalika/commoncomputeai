const customerOutput = document.getElementById("customer-output");
const API_BASE = (window.COMMONCOMMUTE_API_BASE_URL || "").replace(/\/$/, "") || window.location.origin;
let customerToken = localStorage.getItem("customerToken") || "";

function resolveUrl(path) {
  return new URL(path, API_BASE).toString();
}

async function request(url, method, body, token = customerToken) {
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
  customerOutput.textContent = JSON.stringify(data, null, 2);
}

async function showSnapshot(message, extra = {}) {
  const payload = {
    message,
    ...extra,
  };

  if (customerToken) {
    try {
      payload.customer = await request("/customers/me", "GET");
    } catch (error) {
      payload.customer_error = error instanceof Error ? error.message : String(error);
    }
  }

  show(payload);
}

document.getElementById("customer-register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  payload.role = "customer";
  const data = await request("/auth/register", "POST", payload, "");
  customerToken = data.token;
  localStorage.setItem("customerToken", customerToken);
  await showSnapshot("Registered customer", { response: data });
});

document.getElementById("customer-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  const data = await request("/auth/login", "POST", payload, "");
  customerToken = data.token;
  localStorage.setItem("customerToken", customerToken);
  await showSnapshot("Logged in customer", { response: data });
});

document.getElementById("job-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  payload.price_cents = Number(payload.price_cents);
  payload.total_tasks = Number(payload.total_tasks);
  const data = await request("/customers/jobs", "POST", payload);
  await showSnapshot("Created job", { response: data });
});
