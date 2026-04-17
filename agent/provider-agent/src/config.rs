use clap::Parser;

#[derive(Debug, Parser, Clone)]
#[command(name = "provider-agent", about = "CommonCompute provider agent")]
pub struct Config {
    #[arg(long, env = "COMMONCOMPUTE_API_BASE", default_value = "http://127.0.0.1:8787")]
    pub api_base: String,

    #[arg(long, env = "COMMONCOMPUTE_API_TOKEN")]
    pub api_token: String,

    #[arg(long, env = "COMMONCOMPUTE_PROVIDER_ID")]
    pub provider_id: String,

    #[arg(long, env = "COMMONCOMPUTE_POLL_INTERVAL_SECS", default_value_t = 10)]
    pub poll_interval_secs: u64,

    #[arg(long, env = "COMMONCOMPUTE_GPU_MODEL", default_value = "NVIDIA RTX 4090")]
    pub gpu_model: String,

    #[arg(long, env = "COMMONCOMPUTE_GPU_COUNT", default_value_t = 1)]
    pub gpu_count: u32,

    #[arg(long, env = "COMMONCOMPUTE_GPU_VRAM_GB", default_value_t = 24.0)]
    pub vram_gb: f64,

    #[arg(long, env = "COMMONCOMPUTE_DRIVER_VERSION", default_value = "unknown")]
    pub driver_version: String,

    #[arg(long, env = "COMMONCOMPUTE_RUNTIME_VERSION", default_value = "unknown")]
    pub runtime_version: String,

    #[arg(long, env = "COMMONCOMPUTE_RUNTIME_ADAPTER", default_value = "cuda")]
    pub runtime_adapter: String,

    #[arg(long, env = "COMMONCOMPUTE_BENCHMARK_SCORE", default_value_t = 500.0)]
    pub benchmark_score: f64,

    #[arg(long, env = "COMMONCOMPUTE_RELIABILITY_SCORE", default_value_t = 0.8)]
    pub reliability_score: f64,

    #[arg(long, env = "COMMONCOMPUTE_ATTESTATION_HASH", default_value = "local-dev-attestation")]
    pub attestation_hash: String,
}
