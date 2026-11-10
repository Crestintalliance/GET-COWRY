import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Country } from "../api";
import { countryName, formatPrice } from "../i18n";
import { useLang } from "../layout";

/** Countries Cowry markets first. Shown on the home page when the supplier lists them. */
const FEATURED = ["GN", "SN", "CI", "ML", "NG", "GH"];

export function findCountry(query: string, countries: Country[], lang: "en" | "fr"): Country | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return countries.find(
    (c) =>
      c.countryCode.toLowerCase() === q ||
      c.countryName.toLowerCase().startsWith(q) ||
      countryName(c.countryCode, c.countryName, lang).toLowerCase().startsWith(q),
  );
}

export function Home() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [countries, setCountries] = useState<Country[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.countries().then(setCountries).catch(() => setCountries([]));
  }, []);

  const featured = FEATURED.map((code) => countries.find((c) => c.countryCode === code)).filter(
    (c): c is Country => Boolean(c),
  );

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const match = findCountry(query, countries, lang);
    navigate(match ? `/${lang}/countries/${match.countryCode.toLowerCase()}` : `/${lang}/countries?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <section className="container hero">
        <span className="pill">{t.hero.pill}</span>
        <h1>
          {t.hero.title1}
          <br />
          <span>{t.hero.title2}</span>
        </h1>
        <p>{t.hero.body}</p>
        <form className="search" role="search" onSubmit={onSearch}>
          <label htmlFor="dest" className="sr-only">
            {t.hero.searchLabel}
          </label>
          <input
            id="dest"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.hero.searchPlaceholder}
            autoComplete="off"
          />
          <button className="btn btn-lime" type="submit">
            {t.hero.searchButton}
          </button>
        </form>
      </section>

      {featured.length > 0 && (
        <section className="container section">
          <h2>{t.popular.title}</h2>
          <p className="lead">{t.popular.lead}</p>
          <div className="grid">
            {featured.map((c) => (
              <Link key={c.countryCode} to={`/${lang}/countries/${c.countryCode.toLowerCase()}`} className="country">
                <span className="code">{c.countryCode}</span>
                <span>
                  {countryName(c.countryCode, c.countryName, lang)}
                  <small>
                    {t.countries.from} {formatPrice(c.fromCents, lang)}
                  </small>
                </span>
              </Link>
            ))}
          </div>
          <p>
            <Link to={`/${lang}/countries`}>{t.popular.all} →</Link>
          </p>
        </section>
      )}

      <section className="light">
        <div className="container section">
          <h2>{t.why.title}</h2>
          <div className="grid" style={{ marginTop: 24 }}>
            {t.why.items.map((f) => (
              <div className="feature" key={f.h}>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 style={{ marginBottom: 24 }}>{t.steps.title}</h2>
        <ol className="steps">
          {t.steps.items.map((s) => (
            <li key={s.h}>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container section">
        <div className="cta">
          <h2>{t.cta.title}</h2>
          <Link to={`/${lang}/countries`} className="btn btn-dark">
            {t.cta.button}
          </Link>
        </div>
      </section>
    </>
  );
}
