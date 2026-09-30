"use client";

export interface CheckoutState {
  size: string | null;
  promoText: string;
  name: string;
  email: string;
  addr: string;
  city: string;
  zip: string;
  shipping: "standard" | "express";
  total: number;
  totalNote: string | null;
  sizeError: boolean;
  feedback: { key: number; target: string; message: string; tone: "error" | "success" | "info" }[];
  orderPlaced: boolean;
  outcome: "abandoned" | "completed" | null;
  outcomeReason: string | null;
}

export const INITIAL_CHECKOUT: CheckoutState = {
  size: null,
  promoText: "",
  name: "",
  email: "",
  addr: "",
  city: "",
  zip: "",
  shipping: "standard",
  total: 64,
  totalNote: null,
  sizeError: false,
  feedback: [],
  orderPlaced: false,
  outcome: null,
  outcomeReason: null,
};

function Feedback({ s, target }: { s: CheckoutState; target: string }) {
  const f = s.feedback.filter((x) => x.target === target).slice(-1)[0];
  if (!f) return null;
  return <p className={`mock-feedback mock-feedback--${f.tone}`}>{f.message}</p>;
}

export default function CheckoutMock({ s }: { s: CheckoutState }) {
  if (s.orderPlaced) {
    return (
      <div className="mock mock--done">
        <div className="mock-done-badge">Order placed</div>
        <p className="mock-done-sub">Nimbus Hoodie - size M - ships to {s.name || "Sam Rao"}</p>
        <p className="mock-done-total">${s.total}.00</p>
      </div>
    );
  }
  return (
    <div className="mock">
      <header className="mock-head">
        <span className="mock-logo">Nimbus Supply Co.</span>
        <span className="mock-step">Checkout</span>
      </header>

      <div className="mock-product">
        <div className="mock-thumb">N</div>
        <div>
          <p className="mock-product-name">Nimbus Hoodie</p>
          <p className="mock-product-price">$64.00</p>
        </div>
      </div>

      <div className={`mock-block ${s.sizeError ? "mock-block--error" : ""}`} id="size-group">
        <span className="mock-label">Size</span>
        <div className="mock-sizes">
          {["S", "M", "L"].map((z) => (
            <span key={z} id={`size-${z}`} className={`mock-size ${s.size === z ? "mock-size--on" : ""}`}>
              {z}
            </span>
          ))}
        </div>
        <Feedback s={s} target="size-group" />
      </div>

      <div className="mock-block" id="promo-row">
        <span className="mock-label">Promo code</span>
        <div className="mock-promo">
          <span className="mock-input" id="promo-input">{s.promoText || <i>Code</i>}</span>
          <span className="mock-btn mock-btn--ghost" id="btn-apply-promo">Apply</span>
        </div>
        <Feedback s={s} target="promo-row" />
      </div>

      <div className="mock-block">
        <span className="mock-label">Contact & shipping address</span>
        <span className="mock-input" id="field-name">{s.name || <i>Full name</i>}</span>
        <span className="mock-input" id="field-email">{s.email || <i>Email</i>}</span>
        <span className="mock-input" id="field-addr">{s.addr || <i>Street address</i>}</span>
        <span className="mock-input" id="field-city">{s.city || <i>City</i>}</span>
        <span className="mock-input" id="field-zip">{s.zip || <i>ZIP</i>}</span>
      </div>

      <div className="mock-block">
        <span className="mock-label">Shipping</span>
        <div className={`mock-ship ${s.shipping === "standard" ? "mock-ship--on" : ""}`} id="ship-standard">
          <span>Standard (5-7 days)</span><span>Free</span>
        </div>
        <div className={`mock-ship ${s.shipping === "express" ? "mock-ship--on" : ""}`} id="ship-express">
          <span>Express (1-2 days)</span><span>+$8.00</span>
        </div>
        <Feedback s={s} target="ship-express" />
      </div>

      <div className="mock-total" id="total-row">
        <span>Total</span>
        <span className="mock-total-num">${s.total}.00</span>
      </div>
      {s.totalNote && <p className="mock-total-note">{s.totalNote}</p>}

      <span className="mock-btn mock-btn--primary" id="btn-place-order">
        Place order - $64.00
      </span>
      {s.outcome === "abandoned" && <p className="mock-abandoned">Session abandoned</p>}
    </div>
  );
}
