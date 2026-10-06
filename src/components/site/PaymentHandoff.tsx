import Logo from "@/components/Logo";

export default function PaymentHandoff() {
  return (
    <div className="payment-handoff" role="status" aria-live="polite">
      <div className="handoff-card">
        <div className="handoff-ticket" aria-hidden="true">
          <span className="handoff-ticket-edge" />
          <span className="handoff-ticket-line handoff-ticket-line-long" />
          <span className="handoff-ticket-line" />
          <span className="handoff-ticket-code" />
        </div>
        <Logo />
        <p className="eyebrow">SECURE CHECKOUT</p>
        <h2>Preparing your payment</h2>
        <p>We’re creating your order, then DPO will open for payment.</p>
        <span className="handoff-progress" aria-hidden="true"><span /></span>
        <small>Keep this window open.</small>
      </div>
    </div>
  );
}
