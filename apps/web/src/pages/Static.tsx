import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { helpHref, Page, useLang } from "../layout";

export function Install() {
  const { t } = useLang();
  return (
    <Page>
      <div className="prose">
        <h1>{t.install.title}</h1>
        <p>{t.install.lead}</p>
        <h2>{t.install.iphone}</h2>
        <ol>
          {t.install.iphoneSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <h2>{t.install.android}</h2>
        <ol>
          {t.install.androidSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p>
          <a href={helpHref()}>{t.install.help}</a>
        </p>
      </div>
    </Page>
  );
}

/** Placeholder legal pages. Real text must be written and reviewed before launch. */
export function Legal({ kind }: { kind: "terms" | "refunds" | "privacy" }) {
  const { t } = useLang();
  return (
    <Page>
      <div className="prose">
        <h1>{t.legal[kind]}</h1>
        <p className="error">{t.legal.draft}</p>
      </div>
    </Page>
  );
}

/** Development-only stand-in for Stripe Checkout. The API only accepts it when no Stripe keys are set. */
export function DevPay() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const id = params.get("order") ?? "";
  const token = params.get("token") ?? "";
  const lang = params.get("lang") === "fr" ? "fr" : "en";

  async function pay() {
    setBusy(true);
    try {
      await api.devPay(id);
      navigate(`/${lang}/order/${id}?token=${encodeURIComponent(token)}`);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="panel" style={{ maxWidth: 520 }}>
        <h1 style={{ marginTop: 0 }}>{t.dev.title}</h1>
        <p className="notice">{t.dev.body}</p>
        {error && <p className="error">{t.error}</p>}
        <button className="btn btn-lime" onClick={pay} disabled={busy}>
          {t.dev.pay}
        </button>
      </div>
    </Page>
  );
}
