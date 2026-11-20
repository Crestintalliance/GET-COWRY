import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, type Plan } from "../api";
import { countryName, formatPrice } from "../i18n";
import { Page, useLang } from "../layout";
import { countriesText, dataTitle, groupPlans, groupWords, perDayText, unlimitedNote } from "../unlimited";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The middle country plan: what a family trip most often needs. Global and unlimited plans are never featured. */
function featuredCode(plans: Plan[]): string | null {
  const fixed = plans.filter((p) => !p.unlimited && !p.region);
  return fixed.length >= 3 ? fixed[Math.floor(fixed.length / 2)]!.planCode : null;
}

export function Country() {
  const { lang, t } = useLang();
  const code = (useParams().code ?? "").toUpperCase();
  const wanted = useSearchParams()[0].get("plan");
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [globalPlans, setGlobalPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPlans(null);
    api
      .planSet(code)
      .then(({ plans: p, global }) => {
        setPlans(p);
        setGlobalPlans(global);
        const all = [...p, ...global];
        const pick = all.find((x) => x.planCode === wanted)?.planCode ?? featuredCode(p) ?? all[0]?.planCode ?? null;
        setSelected(pick);
      })
      .catch(() => setError(t.error));
  }, [code, wanted, t.error]);

  const name = plans?.[0] ? countryName(code, plans[0].countryName, lang) : code;
  const network = plans?.[0]?.networks.map((n) => `${n.operator} ${n.type}`.trim()).join(", ");

  const groups = groupPlans(plans ?? [], globalPlans);
  const words = groupWords(lang);
  const featured = featuredCode(plans ?? []);

  const card = (p: Plan) => {
    const isFeatured = p.planCode === featured;
    const isSel = selected === p.planCode;
    const perDay = perDayText(p.unlimited, lang);
    return (
      <label key={p.planCode} className={`plan${isFeatured ? " featured" : ""}${isSel ? " selected" : ""}`}>
        <input
          type="radio"
          name="plan"
          value={p.planCode}
          checked={isSel}
          onChange={() => setSelected(p.planCode)}
          className="sr-only"
        />
        <span className="tag">{isFeatured ? t.country.popular : " "}</span>
        <span className="gb">{dataTitle(p, lang)}</span>
        <span className="meta">
          {p.validityDays} {t.country.days}
          {perDay ? ` · ${perDay}` : ""}
          {p.region ? ` · ${countriesText(p.region.countries.length, lang)}` : ""}
        </span>
        {p.unlimited && <span className="plan-note">{unlimitedNote(p.unlimited, lang)}</span>}
        <span className="price">{formatPrice(p.priceCents, lang)}</span>
        <span className={`btn ${isFeatured ? "btn-dark" : "btn-outline"}`} aria-hidden="true">
          {isSel ? t.country.chosen : t.country.choose}
        </span>
      </label>
    );
  };

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
      {plans && plans.length + globalPlans.length === 0 && <p>{t.country.none}</p>}

      {plans && plans.length + globalPlans.length > 0 && (
        <form onSubmit={onPay}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sr-only">{t.country.choose}</legend>
            {groups.country.length > 0 && <div className="grid">{groups.country.map(card)}</div>}
            {groups.global.length > 0 && (
              <div className="plan-group">
                <h2>{words.globalTitle}</h2>
                <p className="lead">{words.globalSub}</p>
                <div className="grid">{groups.global.map(card)}</div>
              </div>
            )}
            {groups.unlimited.length > 0 && (
              <div className="plan-group">
                <h2>{words.unlimitedTitle}</h2>
                <div className="grid">{groups.unlimited.map(card)}</div>
              </div>
            )}
          </fieldset>

          <div className="panel" style={{ marginTop: 28, maxWidth: 560 }}>
            <div className="field">
              <label htmlFor="email">{t.country.emailLabel}</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
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
