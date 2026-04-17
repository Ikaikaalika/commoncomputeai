export interface OpenApiOptions {
  title: string;
  version: string;
  baseUrl: string;
}

export function buildOpenApiDocument(options: OpenApiOptions): Record<string, unknown> {
  const serverUrl = options.baseUrl.replace(/\/$/, "");

  return {
    openapi: "3.1.0",
    info: {
      title: options.title,
      version: options.version,
      description: "CommonCompute control-plane API for GPU marketplace orchestration."
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "Auth" },
      { name: "Jobs" },
      { name: "Providers" },
      { name: "Agent" },
      { name: "Market" },
      { name: "Account" },
      { name: "Admin" },
      { name: "Billing" },
      { name: "Meta" }
    ],
    paths: {
      "/healthz": {
        get: {
          tags: ["Meta"],
          summary: "Health check"
        }
      },
      "/v1/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Create a customer/provider account"
        }
      },
      "/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and return JWT"
        }
      },
      "/v1/jobs": {
        post: {
          tags: ["Jobs"],
          summary: "Create a new inference or training job"
        }
      },
      "/v1/jobs/{job_id}": {
        get: {
          tags: ["Jobs"],
          summary: "Get job state"
        }
      },
      "/v1/jobs/{job_id}/cancel": {
        post: {
          tags: ["Jobs"],
          summary: "Cancel a queued/reserved/running job"
        }
      },
      "/v1/providers/onboard": {
        post: {
          tags: ["Providers"],
          summary: "Create provider profile"
        }
      },
      "/v1/providers/kyc/submit": {
        post: {
          tags: ["Providers"],
          summary: "Submit/verify provider KYC"
        }
      },
      "/v1/providers/capabilities": {
        post: {
          tags: ["Providers"],
          summary: "Upsert provider GPU capabilities"
        }
      },
      "/v1/providers/heartbeat": {
        post: {
          tags: ["Providers"],
          summary: "Update provider liveness"
        }
      },
      "/v1/agent/poll": {
        post: {
          tags: ["Agent"],
          summary: "Poll for reserved job assignment"
        }
      },
      "/v1/agent/job/{job_id}/start": {
        post: {
          tags: ["Agent"],
          summary: "Mark assigned job running"
        }
      },
      "/v1/agent/job/{job_id}/complete": {
        post: {
          tags: ["Agent"],
          summary: "Complete assigned job and meter usage"
        }
      },
      "/v1/market/providers": {
        get: {
          tags: ["Market"],
          summary: "List verified online provider inventory"
        }
      },
      "/v1/market/pricing/estimate": {
        get: {
          tags: ["Market"],
          summary: "Estimate hourly price for requested workload constraints"
        }
      },
      "/v1/account/me": {
        get: {
          tags: ["Account"],
          summary: "Get current account and optional provider profile"
        }
      },
      "/v1/account/jobs": {
        get: {
          tags: ["Account"],
          summary: "List jobs relevant to current principal"
        }
      },
      "/v1/admin/overview": {
        get: {
          tags: ["Admin"],
          summary: "Operational summary metrics"
        }
      },
      "/v1/admin/audit": {
        get: {
          tags: ["Admin"],
          summary: "Read recent audit trail events"
        }
      },
      "/v1/billing/webhook/stripe": {
        post: {
          tags: ["Billing"],
          summary: "Stripe webhook ingestion"
        }
      },
      "/v1/meta/openapi": {
        get: {
          tags: ["Meta"],
          summary: "OpenAPI document"
        }
      },
      "/v1/meta/system": {
        get: {
          tags: ["Meta"],
          summary: "System capability summary"
        }
      }
    }
  };
}
