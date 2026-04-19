import SwiftUI
import AppKit

struct EarningsView: View {
    @EnvironmentObject private var vm: AppViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                header
                if let summary = vm.earnings {
                    summaryCard(summary)
                    payoutsCard(summary)
                } else {
                    emptyCard
                    reservedSection("THIS WEEK") {
                        HStack(spacing: 12) {
                            reservedMetric("TODAY")
                            reservedMetric("LAST 7D")
                            reservedMetric("PENDING")
                        }
                    }
                    reservedSection("RECENT PAYOUTS") {
                        VStack(spacing: 0) {
                            ForEach(0..<3, id: \.self) { _ in
                                reservedPayoutRow
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(CC.bg)
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("EARNINGS").eyebrow()
            Text("Turn idle into income.")
                .font(.ccDisplay(size: 22, weight: .medium))
                .foregroundStyle(CC.text)
                .tracking(-0.5)
        }
    }

    // MARK: - Empty state

    private var emptyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "dollarsign.circle")
                    .font(.system(size: 18))
                    .foregroundStyle(CC.positive)
                Text("Payouts arrive weekly.")
                    .font(.ccDisplay(size: 14, weight: .medium))
                    .foregroundStyle(CC.text)
            }
            Text("You’ll see your earnings here once billing is on. A free $30 credit lands at signup once Stripe goes live.")
                .font(.ccDisplay(size: 12))
                .foregroundStyle(CC.text2)
                .fixedSize(horizontal: false, vertical: true)
            Button(action: openPricing) {
                Text("See pricing")
            }
            .buttonStyle(CCGhostButtonStyle())
            .padding(.top, 2)
        }
        .ccCard()
    }

    private func openPricing() {
        guard let url = URL(string: "https://commoncompute.ai/pricing") else { return }
        NSWorkspace.shared.open(url)
    }

    // MARK: - Reserved sections (M6 placeholders)

    private func reservedSection<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(label).eyebrow()
            content()
        }
        .ccCard()
    }

    private func reservedMetric(_ label: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).eyebrow()
            Text("$ —")
                .font(.ccMono(size: 20, weight: .medium))
                .foregroundStyle(CC.text3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var reservedPayoutRow: some View {
        HStack {
            Text("—")
                .font(.ccMono(size: 11))
                .foregroundStyle(CC.text4)
            Spacer()
            Text("$ —")
                .font(.ccMono(size: 11))
                .foregroundStyle(CC.text4)
        }
        .padding(.vertical, 8)
        .overlay(alignment: .bottom) {
            Rectangle().fill(CC.lineSoft).frame(height: 1)
        }
    }

    // MARK: - Populated (M6 will hit this path)

    private func summaryCard(_ s: EarningsSummary) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("THIS WEEK").eyebrow()
            HStack(spacing: 12) {
                metric("TODAY", s.todayUSD)
                metric("LAST 7D", s.last7USD)
                metric("PENDING", s.pendingUSD)
            }
        }
        .ccCard()
    }

    private func metric(_ label: String, _ value: Decimal) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).eyebrow()
            Text(format(value))
                .font(.ccMono(size: 20, weight: .medium))
                .foregroundStyle(CC.positive)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func payoutsCard(_ s: EarningsSummary) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("RECENT PAYOUTS").eyebrow()
            VStack(spacing: 0) {
                ForEach(Array(s.payouts.enumerated()), id: \.element.id) { idx, row in
                    HStack {
                        Text(dateFormatter.string(from: row.date))
                            .font(.ccMono(size: 11))
                            .foregroundStyle(CC.text2)
                        Spacer()
                        Text(row.status.uppercased())
                            .font(.ccMono(size: 9, weight: .medium))
                            .tracking(0.6)
                            .foregroundStyle(CC.text3)
                        Text(format(row.amountUSD))
                            .font(.ccMono(size: 11, weight: .medium))
                            .foregroundStyle(CC.positive)
                            .frame(width: 80, alignment: .trailing)
                    }
                    .padding(.vertical, 8)
                    if idx < s.payouts.count - 1 {
                        Rectangle().fill(CC.lineSoft).frame(height: 1)
                    }
                }
            }
        }
        .ccCard()
    }

    private func format(_ d: Decimal) -> String {
        let fmt = NumberFormatter()
        fmt.numberStyle = .currency
        fmt.currencyCode = "USD"
        return fmt.string(from: d as NSDecimalNumber) ?? "$0.00"
    }

    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f
    }()
}
