import { NonRetryableError } from "cloudflare:workflows";
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { TrainingWorkflowParams, WorkerEnv } from "../env";

export class TrainingLifecycleWorkflow extends WorkflowEntrypoint<WorkerEnv, TrainingWorkflowParams> {
  async run(event: WorkflowEvent<TrainingWorkflowParams>, step: WorkflowStep) {
    const job = await step.do("load training job", async () => {
      const row = await this.env.DB.prepare("SELECT id, workload_type FROM jobs WHERE id = ?1")
        .bind(event.payload.job_id)
        .first<{ id: string; workload_type: string }>();
      if (!row) {
        throw new NonRetryableError("Job not found");
      }
      if (row.workload_type !== "training") {
        throw new NonRetryableError("Workflow can only run for training jobs");
      }
      return row;
    });

    await step.do("enqueue allocation", async () => {
      await this.env.JOB_EVENTS.send({
        channel: "job-events",
        type: "job_created",
        job_id: job.id
      });
      return { enqueued: true };
    });

    let terminalStatus: "completed" | "failed" | "cancelled" | "timed_out" = "timed_out";

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const snapshot = await step.do(`poll training status ${attempt}`, async () => {
        const row = await this.env.DB.prepare("SELECT status FROM jobs WHERE id = ?1").bind(job.id).first<{ status: string }>();
        return row?.status ?? "unknown";
      });

      if (snapshot === "completed") {
        terminalStatus = "completed";
        break;
      }

      if (snapshot === "failed") {
        terminalStatus = "failed";
        break;
      }

      if (snapshot === "cancelled") {
        terminalStatus = "cancelled";
        break;
      }

      await step.sleep(`wait for training progress ${attempt}`, "15 seconds");
    }

    if (terminalStatus !== "completed") {
      if (terminalStatus === "failed" || terminalStatus === "cancelled") {
        throw new NonRetryableError(`Training ended with status ${terminalStatus}`);
      }

      throw new Error("Training did not complete in workflow window");
    }

    await step.do("queue invoice settlement", async () => {
      await this.env.BILLING_EVENTS.send({
        channel: "billing-events",
        type: "invoice_settle",
        job_id: job.id
      });

      await this.env.DB.prepare(
        "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'training_workflow_settled', ?3, datetime('now'))"
      )
        .bind(crypto.randomUUID(), job.id, JSON.stringify({ workflow_instance_id: event.instanceId }))
        .run();

      return { settled: true };
    });

    return {
      job_id: job.id,
      status: "completed"
    };
  }
}
