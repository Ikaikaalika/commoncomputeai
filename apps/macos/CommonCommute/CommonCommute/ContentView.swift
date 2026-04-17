import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        NavigationSplitView {
            List {
                Text("Provider Worker")
                Text("Task Runner")
                Text("Earnings")
            }
            .navigationTitle("Common Commute")
        } detail: {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    authCard
                    deviceCard
                    taskCard
                    outputCard
                }
                .padding(24)
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text("Turn idle Macs into paid compute")
                    .font(.largeTitle)
                    .bold()
                Text("Embeddings, transcription, OCR, and video job execution.")
                    .foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                Text("Accrued earnings")
                    .foregroundStyle(.secondary)
                Text(currency(viewModel.accruedEarningsCents))
                    .font(.title)
                    .bold()
            }
        }
    }

    private var authCard: some View {
        GroupBox("Provider auth") {
            VStack(alignment: .leading, spacing: 12) {
                TextField("Full name", text: $viewModel.fullName)
                TextField("Email", text: $viewModel.email)
                SecureField("Password", text: $viewModel.password)
                HStack {
                    Button("Register") { Task { await viewModel.registerProvider() } }
                    Button("Login") { Task { await viewModel.loginProvider() } }
                }
            }
            .textFieldStyle(.roundedBorder)
        }
    }

    private var deviceCard: some View {
        GroupBox("Device enrollment") {
            VStack(alignment: .leading, spacing: 12) {
                TextField("Device name", text: $viewModel.deviceName)
                HStack {
                    Stepper("CPU cores: \(viewModel.cpuCores)", value: $viewModel.cpuCores, in: 1...32)
                    Stepper("Memory GB: \(viewModel.memoryGB)", value: $viewModel.memoryGB, in: 4...128, step: 4)
                }
                TextField("GPU class", text: $viewModel.gpuClass)
                Button("Enroll device") { Task { await viewModel.enrollDevice() } }
            }
            .textFieldStyle(.roundedBorder)
        }
    }

    private var taskCard: some View {
        GroupBox("Task execution") {
            VStack(alignment: .leading, spacing: 12) {
                if let task = viewModel.currentTask {
                    Text("Current task: #\(task.id) — \(task.workload_type)")
                    Text(task.payload_json)
                        .font(.system(.body, design: .monospaced))
                } else {
                    Text("No task claimed")
                        .foregroundStyle(.secondary)
                }
                HStack {
                    Button("Poll for task") { Task { await viewModel.pollTask() } }
                    Button("Complete task") { Task { await viewModel.completeTask() } }
                }
            }
        }
    }

    private var outputCard: some View {
        GroupBox("Output") {
            Text(viewModel.output)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
        }
    }

    private func currency(_ cents: Int) -> String {
        let value = Double(cents) / 100.0
        return value.formatted(.currency(code: "USD"))
    }
}
