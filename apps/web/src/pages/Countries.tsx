import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type Country } from "../api";
import { countryName, formatPrice } from "../i18n";
import { Page, useLang } from "../layout";

export function Countries() {
  const { lang, t } = useLang();
  const [params] = useSearchParams();
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState(params.get("q") ?? "");

  useEffect(() => {
    api.countries().then(setCountries).catch(() => setError(true));
  }, []);

  const q = filter.trim().toLowerCase();
  const shown = (countries ?? [])
    .map((c) => ({ ...c, label: countryName(c.countryCode, c.countryName, lang) }))
    .filter((c) => !q || c.label.toLowerCase().includes(q) || c.countryCode.toLowerCase() === q)
    .sort((a, b) => a.label.localeCompare(b.label, lang));

  return (
    <Page>
      <h1 style={{ margin: "0 0 8px" }}>{t.countries.title}</h1>
      <p className="lead">{t.countries.lead}</p>
      <div className="search" style={{ marginBottom: 28 }}>
        <label htmlFor="filter" className="sr-only">
          {t.hero.searchLabel}
        </label>
        <input id="filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t.hero.searchPlaceholder} />
      </div>
      {error && <p className="error">{t.error}</p>}
      {!countries && !error && <p>{t.loading}</p>}
      {countries && shown.length === 0 && <p>{t.countries.empty}</p>}
      <div className="grid">
        {shown.map((c) => (
          <Link key={c.countryCode} to={`/${lang}/countries/${c.countryCode.toLowerCase()}`} className="country">
            <span className="code">{c.countryCode}</span>
            <span>
              {c.label}
              <small>
                {t.countries.from} {formatPrice(c.fromCents, lang)} · {c.planCount}{" "}
                {c.planCount === 1 ? t.countries.plan : t.countries.plans}
              </small>
            </span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
