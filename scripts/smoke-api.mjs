#!/usr/bin/env node

const apiBase = (process.env.API_BASE ?? "http://127.0.0.1:8000").replace(/\/$/, "");

function randomSuffix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function fetchText(path) {
  const response = await fetch(`${apiBase}${path}`);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${path}\n${text}`);
  }
  return text;
}

async function request(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${path}\n${JSON.stringify(json, null, 2)}`);
  }

  return json;
}

async function main() {
  console.log(`Using API base: ${apiBase}`);

  const landing = await fetchText("/");
  if (!landing.includes("Common Commute")) {
    throw new Error("Landing page did not render expected brand");
  }

  await fetchText("/providers");
  await fetchText("/developers");
  await fetchText("/pricing");
  await fetchText("/security");
  await fetchText("/download");
  await fetchText("/docs");

  const suffix = randomSuffix();
  const customerEmail = `customer-${suffix}@example.com`;
  const providerEmail = `provider-${suffix}@example.com`;
  const password = `SmokePass-${suffix}-A!123456789`;

  console.log("1) Registering provider and customer");
  const providerSignup = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: providerEmail,
      password,
      full_name: "Smoke Provider",
      role: "provider"
    })
  });

  const customerSignup = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: customerEmail,
      password,
      full_name: "Smoke Customer",
      role: "customer"
    })
  });

  const providerToken = providerSignup.token;
  const customerToken = customerSignup.token;

  console.log("2) Creating provider device");
  const device = await request("/providers/devices", {
    method: "POST",
    headers: { authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({
      name: "Smoke Mac",
      cpu_cores: 12,
      memory_gb: 32,
      gpu_class: "Apple Silicon"
    })
  });

  console.log("3) Creating customer job");
  const createdJob = await request("/customers/jobs", {
    method: "POST",
    headers: { authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      title: "Smoke embeddings job",
      workload_type: "embeddings",
      price_cents: 1000,
      total_tasks: 2,
      input_uri: "s3://demo/input.jsonl"
    })
  });

  console.log("4) Polling and completing tasks");
  const firstTask = await request("/worker/poll", {
    method: "POST",
    headers: { authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ device_id: device.id })
  });

  await request(`/worker/tasks/${firstTask.task.id}/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ result_uri: `local://task/result/${firstTask.task.id}` })
  });

  const secondTask = await request("/worker/poll", {
    method: "POST",
    headers: { authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ device_id: device.id })
  });

  await request(`/worker/tasks/${secondTask.task.id}/complete`, {
    method: "POST",
    headers: { authorization: `Bearer ${providerToken}` },
    body: JSON.stringify({ result_uri: `local://task/result/${secondTask.task.id}` })
  });

  const finalJob = await request(`/customers/jobs/${createdJob.id}`, {
    headers: { authorization: `Bearer ${customerToken}` }
  });

  const providerMe = await request("/providers/me", {
    headers: { authorization: `Bearer ${providerToken}` }
  });

  if (finalJob.status !== "completed" || finalJob.completed_tasks !== 2) {
    throw new Error(`Unexpected final job state: ${JSON.stringify(finalJob, null, 2)}`);
  }

  if (!Array.isArray(providerMe.ledger) || providerMe.ledger.length !== 2) {
    throw new Error(`Unexpected provider ledger state: ${JSON.stringify(providerMe, null, 2)}`);
  }

  console.log("✅ Smoke flow completed");
  console.log(JSON.stringify({
    job_id: finalJob.id,
    status: finalJob.status,
    assigned_device_id: device.id,
    customer_email: customerEmail,
    provider_email: providerEmail
  }, null, 2));
}

main().catch((error) => {
  console.error("❌ Smoke flow failed");
  console.error(error);
  process.exit(1);
});
