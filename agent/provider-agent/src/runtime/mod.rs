use anyhow::Result;
use serde_json::Value;

use crate::types::JobExecutionResult;

pub mod linux;
pub mod macos;
pub mod windows;

pub async fn execute_job(job_id: &str, job_spec: &Value) -> Result<JobExecutionResult> {
    #[cfg(target_os = "linux")]
    {
        return linux::execute(job_id, job_spec).await;
    }

    #[cfg(target_os = "windows")]
    {
        return windows::execute(job_id, job_spec).await;
    }

    #[cfg(target_os = "macos")]
    {
        return macos::execute(job_id, job_spec).await;
    }

    #[allow(unreachable_code)]
    Ok(JobExecutionResult {
        gpu_seconds: 30.0,
        storage_gb_hours: 0.1,
        egress_bytes: 0,
        artifact_keys: vec![format!("jobs/{}/artifacts/output.txt", job_id)],
    })
}
