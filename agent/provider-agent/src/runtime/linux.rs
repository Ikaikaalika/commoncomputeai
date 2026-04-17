use anyhow::Result;
use serde_json::Value;
use tokio::time::{sleep, Duration};
use tracing::info;

use crate::types::JobExecutionResult;

pub async fn execute(job_id: &str, job_spec: &Value) -> Result<JobExecutionResult> {
    info!("linux runtime (rootless container stub) executing job {}: {}", job_id, job_spec);
    sleep(Duration::from_secs(3)).await;

    Ok(JobExecutionResult {
        gpu_seconds: 120.0,
        storage_gb_hours: 0.5,
        egress_bytes: 1024,
        artifact_keys: vec![format!("jobs/{}/artifacts/linux-result.json", job_id)],
    })
}
