import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Plan } from "../api";
import { countryName, formatData, formatPrice } from "../i18n";
import { Page, useLang } from "../layout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The middle plan is highlighted as "most popular" when there are three or more. */
function featuredIndex(plans: Plan[]): number {
  return plans.length >= 3 ? Math.floor(plans.length / 2) : -1;
}

export function Country() {
  const { lang, t } = useLang();
  const code = (useParams().code ?? "").toUpperCase();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPlans(null);
    api
      .plans(code)
      .then((p) => {
        setPlans(p);
        const f = featuredIndex(p);
        setSelected(p[f >= 0 ? f : 0]?.planCode ?? null);
      })
      .catch(() => setError(t.error));
  }, [code, t.error]);

  const name = plans?.[0] ? countryName(code, plans[0].countryName, lang) : code;
  const network = plans?.[0]?.networks.map((n) => `${n.operator} ${n.type}`.trim()).join(", ");

  async function onPay(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) return setError(t.country.pickFirst);
    if (!EMAIL_RE.test(email)) return setError(t.country.badEmail);
    setBusy(true);
    try {
      const res = await api.checkout({ countryCode: code, planCode: selected, email, locale: lang });
      window.location.assign(res.checkoutUrl);
    } catch {
      setError(t.error);
      setBusy(false);
    }
  }

  return (
    <Page>
      <p>
        <Link to={`/${lang}/countries`}>← {t.country.back}</Link>
      </p>
      <h1 style={{ margin: "0 0 8px" }}>{name}</h1>
      {network && <p className="lead">{network}</p>}
      <p className="lead">{t.country.lead}</p>

      {!plans && !error && <p>{t.loading}</p>}
      {plans && plans.length === 0 && <p>{t.country.none}</p>}

      {plans && plans.length > 0 && (
        <form onSubmit={onPay}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sr-only">{t.country.choose}</legend>
            <div className="grid">
              {plans.map((p, i) => {
                const featured = i === featuredIndex(plans);
                const isSel = selected === p.planCode;
                return (
                  <label key={p.planCode} className={`plan${featured ? " featured" : ""}${isSel ? " selected" : ""}`}>
                    <input
                      type="radio"
                      name="plan"
                      value={p.planCode}
                      checked={isSel}
                      onChange={() => setSelected(p.planCode)}
                      className="sr-only"
                    />
                    <span className="tag">{featured ? t.country.popular : " "}</span>
                    <span className="gb">{formatData(p.dataBytes)}</span>
                    <span className="meta">
                      {p.validityDays} {t.country.days}
                    </span>
                    <span className="price">{formatPrice(p.priceCents, lang)}</span>
                    <span className={`btn ${featured ? "btn-dark" : "btn-outline"}`} aria-hidden="true">
                      {isSel ? t.country.chosen : t.country.choose}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="panel" style={{ marginTop: 28, maxWidth: 560 }}>
            <div className="field">
              <label htmlFor="email">{t.country.emailLabel}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby="email-hint"
                required
              />
              <span id="email-hint" className="notice">
                {t.country.emailHint}
              </span>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-lime" type="submit" disabled={busy} style={{ width: "100%" }}>
              {busy ? t.country.paying : t.country.pay}
            </button>
            <p className="notice" style={{ marginBottom: 0 }}>
              {t.country.compat}
            </p>
          </div>
        </form>
      )}
      {error && !plans && <p className="error">{error}</p>}
    </Page>
  );
}
