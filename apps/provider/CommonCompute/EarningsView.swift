import SwiftUI
import Charts
import AppKit

// Headline question: "How much have I made?"
// Pre-M6: shows an explainer + reserved empty sections that read as
// brand-positive green placeholders.
// Post-M6: `vm.earnings` populates real tiles + a bar chart + payouts.

struct EarningsView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header
                if let summary = vm.earnings {
                    populated(summary)
                } else {
                    empty
                }
            }
            .padding(24)
            .frame(maxWidth: 900)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(CC.bg)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("EARNINGS").eyebrow()
            Text("Turn idle into income.")
                .font(.ccDisplay(size: 26, weight: .medium))
                .foregroundStyle(CC.text)
                .tracking(-0.6)
            Text("Your Mac's work gets paid out every Friday in US dollars.")
                .font(.ccDisplay(size: 13))
                .foregroundStyle(CC.text2)
        }
    }

    // MARK: - Empty state (pre-M6)

    private var empty: some View {
        VStack(alignment: .leading, spacing: 18) {
            emptyCallout
            reservedThisWeek
            reservedTrend
            reservedPayouts
        }
    }

    private var emptyCallout: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: "dollarsign.circle")
                    .font(.system(size: 18))
                    .foregroundStyle(CC.positive)
                Text("Payouts arrive weekly.")
                    .font(.ccDisplay(size: 14, weight: .medium))
                    .foregroundStyle(CC.text)
            }
            Text("You'll see your earnings here once billing is on. A free $30 credit lands at signup once Stripe goes live.")
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text2)
                .fixedSize(horizontal: false, vertical: true)
            Button("See pricing") { open("https://commoncompute.ai/pricing") }
                .buttonStyle(CCGhostButtonStyle())
                .padding(.top, 2)
        }
        .ccCard(padding: 18)
    }

    private var reservedThisWeek: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("THIS WEEK").eyebrow()
            HStack(spacing: 12) {
                reservedTile("TODAY", "Check back after your first job")
                reservedTile("LAST 7 DAYS", "Weekly summary appears once earning starts")
                reservedTile("PENDING", "Arrives next Friday")
            }
        }
        .ccCard(padding: 18)
    }

    private func reservedTile(_ label: String, _ sub: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).eyebrow()
            Text("$ —")
                .font(.ccMono(size: 20, weight: .medium))
                .foregroundStyle(CC.text3)
            Text(sub)
                .font(.ccDisplay(size: 10))
                .foregroundStyle(CC.text3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var reservedTrend: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("LAST 30 DAYS").eyebrow()
            RoundedRectangle(cornerRadius: 8)
                .fill(CC.panel2)
                .frame(height: 140)
                .overlay(
                    Text("Your daily earnings will chart here.")
                        .font(.ccDisplay(size: 12))
                        .foregroundStyle(CC.text3)
                )
        }
        .ccCard(padding: 18)
    }

    private var reservedPayouts: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RECENT PAYOUTS").eyebrow()
            HStack {
                Text("No payouts yet")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text3)
                Spacer()
                Text("$ —")
                    .font(.ccMono(size: 12))
                    .foregroundStyle(CC.text4)
            }
            .padding(.vertical, 10)
        }
        .ccCard(padding: 18)
    }

    // MARK: - Populated (M6)

    private func populated(_ s: EarningsSummary) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            thisWeekCard(s)
            lifetimeCard(s)
            payoutsCard(s)
        }
    }

    private func thisWeekCard(_ s: EarningsSummary) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("THIS WEEK").eyebrow()
            HStack(spacing: 12) {
                metric("TODAY", s.todayUSD, caption: "Updates in real time")
                metric("LAST 7 DAYS", s.last7USD, caption: "Everything earned since last Friday")
                metric("PENDING", s.pendingUSD, caption: "Arrives next Friday")
            }
        }
        .ccCard(padding: 18)
    }

    private func metric(_ label: String, _ value: Decimal, caption: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).eyebrow()
            Text(format(value))
                .font(.ccMono(size: 22, weight: .medium))
                .foregroundStyle(CC.positive)
            Text(caption)
                .font(.ccDisplay(size: 10))
                .foregroundStyle(CC.text3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func lifetimeCard(_ s: EarningsSummary) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("LIFETIME").eyebrow()
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Total earned").font(.ccDisplay(size: 11)).foregroundStyle(CC.text3)
                    // Approximation — real lifetime would come from the backend.
                    Text(format(s.todayUSD + s.last7USD + s.pendingUSD))
                        .font(.ccMono(size: 16, weight: .medium))
                        .foregroundStyle(CC.text)
                }
                Spacer()
            }
        }
        .ccCard(padding: 18)
    }

    private func payoutsCard(_ s: EarningsSummary) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RECENT PAYOUTS").eyebrow()
            if s.payouts.isEmpty {
                Text("No payouts yet — your first arrives next Friday.")
                    .font(.ccDisplay(size: 12))
                    .foregroundStyle(CC.text3)
                    .padding(.vertical, 6)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(s.payouts.enumerated()), id: \.element.id) { idx, row in
                        HStack {
                            Text(dateFormatter.string(from: row.date))
                                .font(.ccMono(size: 11))
                                .foregroundStyle(CC.text2)
                            Spacer()
                            Text(payoutStatus(row.status))
                                .font(.ccMono(size: 9, weight: .medium))
                                .tracking(0.6)
                                .foregroundStyle(CC.text3)
                            Text(format(row.amountUSD))
                                .font(.ccMono(size: 12, weight: .medium))
                                .foregroundStyle(CC.positive)
                                .frame(width: 92, alignment: .trailing)
                        }
                        .padding(.vertical, 8)
                        if idx < s.payouts.count - 1 {
                            Rectangle().fill(CC.lineSoft).frame(height: 1)
                        }
                    }
                }
            }
        }
        .ccCard(padding: 18)
    }

    private func payoutStatus(_ raw: String) -> String {
        switch raw.lowercased() {
        case "paid":    return "PAID"
        case "pending": return "ON THE WAY"
        case "failed":  return "NEEDS ATTENTION"
        default:        return raw.uppercased()
        }
    }

    private func format(_ d: Decimal) -> String {
        let fmt = NumberFormatter()
        fmt.numberStyle = .currency; fmt.currencyCode = "USD"
        return fmt.string(from: d as NSDecimalNumber) ?? "$0.00"
    }

    private func open(_ s: String) {
        if let url = URL(string: s) { NSWorkspace.shared.open(url) }
    }

    private let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "MMM d"; return f
    }()
}
