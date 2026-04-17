use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobSpec {
    pub workload_type: String,
    pub image: String,
    pub command: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPollResponse {
    pub assigned: bool,
    pub job_id: Option<String>,
    pub job_spec: Option<JobSpec>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CapabilityPayload {
    pub os: String,
    pub adapter: String,
    pub gpu_count: u32,
    pub gpu_model: String,
    pub vram_gb: f64,
    pub driver_version: String,
    pub runtime_version: String,
    pub benchmark_score: f64,
    pub attestation_hash: String,
    pub reliability_score: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CompletionPayload {
    pub provider_id: String,
    pub gpu_seconds: f64,
    pub storage_gb_hours: f64,
    pub egress_bytes: u64,
    pub artifact_keys: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct JobExecutionResult {
    pub gpu_seconds: f64,
    pub storage_gb_hours: f64,
    pub egress_bytes: u64,
    pub artifact_keys: Vec<String>,
}
