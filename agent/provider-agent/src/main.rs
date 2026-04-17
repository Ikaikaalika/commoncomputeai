mod client;
mod config;
mod runtime;
mod types;

use anyhow::Result;
use clap::Parser;
use tokio::time::{sleep, Duration};
use tracing::{error, info, warn};

use client::ApiClient;
use config::Config;
use types::{CapabilityPayload, CompletionPayload};

fn detect_os() -> String {
    if cfg!(target_os = "linux") {
        "linux".to_string()
    } else if cfg!(target_os = "windows") {
        "windows".to_string()
    } else if cfg!(target_os = "macos") {
        "macos".to_string()
    } else {
        "linux".to_string()
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let config = Config::parse();
    let client = ApiClient::new(
        config.api_base.clone(),
        config.api_token.clone(),
        config.provider_id.clone(),
    );

    let capabilities = CapabilityPayload {
        os: detect_os(),
        adapter: config.runtime_adapter.clone(),
        gpu_count: config.gpu_count,
        gpu_model: config.gpu_model.clone(),
        vram_gb: config.vram_gb,
        driver_version: config.driver_version.clone(),
        runtime_version: config.runtime_version.clone(),
        benchmark_score: config.benchmark_score,
        attestation_hash: config.attestation_hash.clone(),
        reliability_score: config.reliability_score,
    };

    client.upsert_capabilities(&capabilities).await?;
    info!("provider capabilities registered for {}", client.provider_id());

    loop {
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                warn!("received SIGINT, shutting down provider agent");
                break;
            }
            _ = sleep(Duration::from_secs(config.poll_interval_secs)) => {
                if let Err(err) = client.heartbeat("online").await {
                    error!("heartbeat failed: {err:#}");
                    continue;
                }

                match client.poll_job().await {
                    Ok(Some((job_id, job_spec))) => {
                        info!("picked up job {}", job_id);

                        if let Err(err) = client.start_job(&job_id).await {
                            error!("failed to start job {}: {err:#}", job_id);
                            continue;
                        }

                        let _ = client.report_progress(&job_id, "job accepted by provider runtime", 5.0).await;

                        match runtime::execute_job(&job_id, &job_spec).await {
                            Ok(result) => {
                                let completion = CompletionPayload {
                                    provider_id: config.provider_id.clone(),
                                    gpu_seconds: result.gpu_seconds,
                                    storage_gb_hours: result.storage_gb_hours,
                                    egress_bytes: result.egress_bytes,
                                    artifact_keys: result.artifact_keys,
                                };

                                if let Err(err) = client.complete_job(&job_id, completion).await {
                                    error!("failed to report completion for {}: {err:#}", job_id);
                                } else {
                                    info!("job {} completed and reported", job_id);
                                }
                            }
                            Err(err) => {
                                error!("job {} failed in runtime: {err:#}", job_id);
                                let _ = client.fail_job(&job_id, &format!("runtime error: {err:#}"), true).await;
                            }
                        }
                    }
                    Ok(None) => {
                        info!("no job assigned");
                    }
                    Err(err) => {
                        error!("poll error: {err:#}");
                    }
                }
            }
        }
    }

    Ok(())
}
