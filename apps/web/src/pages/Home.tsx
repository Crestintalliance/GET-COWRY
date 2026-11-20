import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Country } from "../api";
import { DestinationPicker } from "../components/DestinationPicker";
import { Flag } from "../components/Flag";
import { Globe } from "../components/Globe";
import { countryName, type Lang } from "../i18n";
import { useLang } from "../layout";
import { FEATURED, HOME_TABS, type HomeTab } from "../regions";

/** One country opens its page; several open the trip page with a section per country. */
export function tripPath(lang: string, codes: string[]): string {
  return codes.length === 1
    ? `/${lang}/countries/${codes[0]!.toLowerCase()}`
    : `/${lang}/trip?to=${codes.join(",").toLowerCase()}`;
}


export function findCountry(query: string, countries: Country[], lang: Lang): Country | undefined {
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
  const [picked, setPicked] = useState<string[]>([]);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    api.countries().then(setCountries).catch(() => setCountries([]));
  }, []);

  const [region, setRegion] = useState<HomeTab>("africa");
  const pick = (r: HomeTab) =>
    FEATURED[r].map((code) => countries.find((c) => c.countryCode === code)).filter((c): c is Country => Boolean(c));
  const tabs = HOME_TABS.filter((r) => pick(r).length > 0);
  const featured = pick(tabs.includes(region) ? region : (tabs[0] ?? region));

  function onSearch() {
    if (!picked.length) return setHint(true);
    navigate(tripPath(lang, picked));
  }

  return (
    <>
      <section className="container hero-split">
        <div className="hero-globe">
          <Globe />
        </div>
        <div className="hero-copy">
        <h1 className="count-title">{t.hero.count}</h1>
        <p>{t.hero.countSub}</p>
        <div role="search">
          <DestinationPicker
            countries={countries}
            selected={picked}
            onChange={(c) => {
              setPicked(c);
              setHint(false);
            }}
            onSubmit={onSearch}
            submitLabel={t.hero.searchButton}
          />
          {hint && (
            <p className="error" role="alert">
              {t.picker.pickOne}
            </p>
          )}
        </div>
        </div>
      </section>

      <section className="container section steps-section">
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

      {featured.length > 0 && (
        <section className="container section">
          <h2>{t.popular.title}</h2>
          <p className="lead">{t.popular.lead}</p>
          {tabs.length > 1 && (
            <div className="tabs" role="tablist" aria-label={t.popular.title}>
              {tabs.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={r === region}
                  className={r === region ? "tab active" : "tab"}
                  onClick={() => setRegion(r)}
                >
                  {t.regions[r]}
                </button>
              ))}
            </div>
          )}
          <div className="grid">
            {featured.map((c) => (
              <Link key={c.countryCode} to={`/${lang}/countries/${c.countryCode.toLowerCase()}`} className="country">
                <Flag code={c.countryCode} />
                <span>
                  {countryName(c.countryCode, c.countryName, lang)}
                  <small>
                    {c.planCount} {c.planCount === 1 ? t.countries.plan : t.countries.plans}
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
