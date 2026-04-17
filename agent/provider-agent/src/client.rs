use anyhow::{anyhow, Result};
use reqwest::{Client, StatusCode};
use serde_json::{json, Value};

use crate::types::{AgentPollResponse, CapabilityPayload, CompletionPayload};

#[derive(Clone)]
pub struct ApiClient {
    client: Client,
    api_base: String,
    token: String,
    provider_id: String,
}

impl ApiClient {
    pub fn new(api_base: String, token: String, provider_id: String) -> Self {
        Self {
            client: Client::new(),
            api_base,
            token,
            provider_id,
        }
    }

    pub fn provider_id(&self) -> &str {
        &self.provider_id
    }

    pub async fn upsert_capabilities(&self, payload: &CapabilityPayload) -> Result<()> {
        let url = format!("{}/v1/providers/capabilities", self.api_base);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(payload)
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("capability upsert failed: {}", res.text().await?));
        }

        Ok(())
    }

    pub async fn heartbeat(&self, status: &str) -> Result<()> {
        let url = format!("{}/v1/providers/heartbeat", self.api_base);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(&json!({
                "provider_id": self.provider_id,
                "status": status
            }))
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("heartbeat failed: {}", res.text().await?));
        }

        Ok(())
    }

    pub async fn poll_job(&self) -> Result<Option<(String, Value)>> {
        let url = format!("{}/v1/agent/poll", self.api_base);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(&json!({ "provider_id": self.provider_id }))
            .send()
            .await?;

        if res.status() == StatusCode::FORBIDDEN {
            return Err(anyhow!("provider is not eligible to receive jobs (likely KYC status)"));
        }

        if !res.status().is_success() {
            return Err(anyhow!("agent poll failed: {}", res.text().await?));
        }

        let payload = res.json::<AgentPollResponse>().await?;
        if !payload.assigned {
            return Ok(None);
        }

        let job_id = payload
            .job_id
            .ok_or_else(|| anyhow!("agent response missing job_id"))?;
        let spec = serde_json::to_value(payload.job_spec).unwrap_or_else(|_| json!({}));

        Ok(Some((job_id, spec)))
    }

    pub async fn start_job(&self, job_id: &str) -> Result<()> {
        let url = format!("{}/v1/agent/job/{}/start", self.api_base, job_id);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(&json!({
                "provider_id": self.provider_id
            }))
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("job start failed: {}", res.text().await?));
        }

        Ok(())
    }

    pub async fn report_progress(&self, job_id: &str, message: &str, progress: f64) -> Result<()> {
        let url = format!("{}/v1/agent/job/{}/progress", self.api_base, job_id);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(&json!({
                "provider_id": self.provider_id,
                "message": message,
                "progress": progress
            }))
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("progress update failed: {}", res.text().await?));
        }

        Ok(())
    }

    pub async fn complete_job(&self, job_id: &str, completion: CompletionPayload) -> Result<()> {
        let url = format!("{}/v1/agent/job/{}/complete", self.api_base, job_id);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(&completion)
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("job completion failed: {}", res.text().await?));
        }

        Ok(())
    }

    pub async fn fail_job(&self, job_id: &str, reason: &str, retryable: bool) -> Result<()> {
        let url = format!("{}/v1/agent/job/{}/fail", self.api_base, job_id);
        let res = self
            .client
            .post(url)
            .bearer_auth(&self.token)
            .json(&json!({
                "provider_id": self.provider_id,
                "reason": reason,
                "retryable": retryable
            }))
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(anyhow!("job failure report failed: {}", res.text().await?));
        }

        Ok(())
    }
}
