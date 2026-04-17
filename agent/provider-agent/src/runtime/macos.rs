use anyhow::Result;
use serde_json::Value;
use tokio::time::{sleep, Duration};
use tracing::warn;

use crate::types::JobExecutionResult;

pub async fn execute(job_id: &str, job_spec: &Value) -> Result<JobExecutionResult> {
    warn!(
        "macOS Metal profile is limited in MVP. Executing reduced-capability stub for job {}: {}",
        job_id,
        job_spec
    );
    sleep(Duration::from_secs(2)).await;

    Ok(JobExecutionResult {
        gpu_seconds: 90.0,
        storage_gb_hours: 0.3,
        egress_bytes: 512,
        artifact_keys: vec![format!("jobs/{}/artifacts/macos-result.json", job_id)],
    })
}
