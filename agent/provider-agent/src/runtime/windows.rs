use anyhow::Result;
use serde_json::Value;
use tokio::time::{sleep, Duration};
use tracing::info;

use crate::types::JobExecutionResult;

pub async fn execute(job_id: &str, job_spec: &Value) -> Result<JobExecutionResult> {
    info!("windows runtime (WSL2 adapter stub) executing job {}: {}", job_id, job_spec);
    sleep(Duration::from_secs(4)).await;

    Ok(JobExecutionResult {
        gpu_seconds: 130.0,
        storage_gb_hours: 0.55,
        egress_bytes: 2048,
        artifact_keys: vec![format!("jobs/{}/artifacts/windows-result.json", job_id)],
    })
}
