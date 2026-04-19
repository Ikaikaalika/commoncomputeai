import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var vm: AppViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showRegister = false

    var body: some View {
        ZStack {
            CC.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                if showRegister {
                    RegisterForm(
                        email: $email,
                        password: $password,
                        isLoading: $isLoading,
                        errorMessage: $errorMessage,
                        onSwitch: { showRegister = false }
                    )
                } else {
                    loginForm
                }
            }
        }
        .frame(width: 420, height: showRegister ? 560 : 480)
        .animation(.easeInOut(duration: 0.2), value: showRegister)
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 10) {
            NetworkLogo(size: 56)
            Wordmark(size: .hero)
            Text("Idle Macs. Useful compute.")
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text2)
        }
        .padding(.top, 36)
        .padding(.bottom, 28)
        .frame(maxWidth: .infinity)
    }

    // MARK: - Login form

    private var loginForm: some View {
        VStack(spacing: 14) {
            field("EMAIL", text: $email, contentType: .emailAddress, isSecure: false)
            field("PASSWORD", text: $password, contentType: .password, isSecure: true)

            if let err = errorMessage {
                errorLabel(err)
            }

            Button(action: login) {
                submitLabel("Sign in")
            }
            .buttonStyle(CCPrimaryButtonStyle())
            .disabled(email.isEmpty || password.isEmpty || isLoading)
            .opacity((email.isEmpty || password.isEmpty || isLoading) ? 0.5 : 1.0)

            HStack(spacing: 6) {
                Text("No account?")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text3)
                Button("Create one") { showRegister = true }
                    .buttonStyle(.plain)
                    .font(.ccDisplay(size: 12, weight: .medium))
                    .foregroundStyle(CC.blue)
            }
            .padding(.top, 2)
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 28)
    }

    // MARK: - Actions

    private func login() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                try await vm.login(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }

    // MARK: - Helpers

    @ViewBuilder
    private func field(_ label: String, text: Binding<String>, contentType: NSTextContentType, isSecure: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).eyebrow()
            Group {
                if isSecure {
                    SecureField("", text: text)
                        .textContentType(contentType)
                } else {
                    TextField("", text: text)
                        .textContentType(contentType)
                        .autocorrectionDisabled()
                        .textCase(.lowercase)
                }
            }
            .textFieldStyle(.plain)
            .font(.ccDisplay(size: 13))
            .foregroundStyle(CC.text)
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .background(CC.panel2, in: RoundedRectangle(cornerRadius: 6))
            .overlay(
                RoundedRectangle(cornerRadius: 6).strokeBorder(CC.line, lineWidth: 1)
            )
        }
    }

    @ViewBuilder
    private func submitLabel(_ title: String) -> some View {
        if isLoading {
            ProgressView().controlSize(.small).frame(maxWidth: .infinity)
        } else {
            Text(title).frame(maxWidth: .infinity)
        }
    }

    private func errorLabel(_ msg: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: "exclamationmark.circle")
            Text(msg).font(.ccDisplay(size: 12)).lineLimit(2)
        }
        .foregroundStyle(CC.negative)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - RegisterForm

private struct RegisterForm: View {
    @EnvironmentObject private var vm: AppViewModel
    @Binding var email: String
    @Binding var password: String
    @Binding var isLoading: Bool
    @Binding var errorMessage: String?
    let onSwitch: () -> Void

    @State private var fullName = ""
    @State private var confirmPassword = ""

    var body: some View {
        VStack(spacing: 12) {
            field("FULL NAME", text: $fullName, contentType: .name, isSecure: false, lowercase: false)
            field("EMAIL", text: $email, contentType: .emailAddress, isSecure: false, lowercase: true)
            field("PASSWORD (MIN 8)", text: $password, contentType: .newPassword, isSecure: true, lowercase: false)
            confirmField

            if let err = errorMessage {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.circle")
                    Text(err).font(.ccDisplay(size: 12)).lineLimit(2)
                }
                .foregroundStyle(CC.negative)
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            Button(action: register) {
                if isLoading {
                    ProgressView().controlSize(.small).frame(maxWidth: .infinity)
                } else {
                    Text("Create account").frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(CCPrimaryButtonStyle())
            .disabled(fullName.isEmpty || email.isEmpty || password.count < 8 || password != confirmPassword || isLoading)
            .opacity(fullName.isEmpty || email.isEmpty || password.count < 8 || password != confirmPassword || isLoading ? 0.5 : 1.0)

            HStack(spacing: 6) {
                Text("Already have an account?")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text3)
                Button("Sign in") { onSwitch() }
                    .buttonStyle(.plain)
                    .font(.ccDisplay(size: 12, weight: .medium))
                    .foregroundStyle(CC.blue)
            }
            .padding(.top, 2)
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 24)
    }

    @ViewBuilder
    private func field(_ label: String, text: Binding<String>, contentType: NSTextContentType, isSecure: Bool, lowercase: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).eyebrow()
            Group {
                if isSecure {
                    SecureField("", text: text).textContentType(contentType)
                } else {
                    let tf = TextField("", text: text)
                        .textContentType(contentType)
                        .autocorrectionDisabled()
                    if lowercase {
                        tf.textCase(.lowercase)
                    } else {
                        tf
                    }
                }
            }
            .textFieldStyle(.plain)
            .font(.ccDisplay(size: 13))
            .foregroundStyle(CC.text)
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .background(CC.panel2, in: RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(CC.line, lineWidth: 1))
        }
    }

    private var confirmField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("CONFIRM PASSWORD").eyebrow()
            SecureField("", text: $confirmPassword)
                .textContentType(.newPassword)
                .textFieldStyle(.plain)
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text)
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(CC.panel2, in: RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6).strokeBorder(
                        confirmPassword.isEmpty ? CC.line :
                            (password == confirmPassword ? CC.positive.opacity(0.5) : CC.negative.opacity(0.5)),
                        lineWidth: 1
                    )
                )
        }
    }

    private func register() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                try await vm.register(email: email, password: password, fullName: fullName)
            } catch {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
}
