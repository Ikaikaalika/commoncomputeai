from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class StripeConnectStub:
    """Placeholder for Stripe Connect integration.

    Swap this with the official Stripe SDK when you're ready to:
    - create connected accounts
    - launch hosted onboarding
    - create payout destinations
    - reconcile platform fees
    """

    secret_key: Optional[str] = None

    def create_connected_account(self, user_id: int, email: str) -> dict:
        return {
            "user_id": user_id,
            "email": email,
            "stripe_account_id": f"acct_demo_{user_id}",
            "onboarding_url": f"https://dashboard.stripe.com/test/connect/accounts/acct_demo_{user_id}",
        }
