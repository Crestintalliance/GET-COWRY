import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, type Country } from "../api";
import { DestinationPicker } from "../components/DestinationPicker";
import { Flag } from "../components/Flag";
import { countryName } from "../i18n";
import { tripPath } from "./Home";
import { REGIONS, regionOf, type Region } from "../regions";
import { Page, useLang } from "../layout";

export function Countries() {
  const { lang, t } = useLang();
  const [params] = useSearchParams();
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [error, setError] = useState(false);
  const [filter] = useState(params.get("q") ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [region, setRegion] = useState<Region | "all" | "other">("all");
  const navigate = useNavigate();

  useEffect(() => {
    api.countries().then(setCountries).catch(() => setError(true));
  }, []);

  const q = filter.trim().toLowerCase();
  const shown = (countries ?? [])
    .map((c) => ({ ...c, label: countryName(c.countryCode, c.countryName, lang) }))
    .filter((c) => !q || c.label.toLowerCase().includes(q) || c.countryCode.toLowerCase() === q)
    .filter((c) => region === "all" || (regionOf(c.countryCode) ?? "other") === region)
    .sort((a, b) => a.label.localeCompare(b.label, lang));

  return (
    <Page>
      <h1 style={{ margin: "0 0 8px" }}>{t.countries.title}</h1>
      <p className="lead">{t.countries.lead}</p>
      <div style={{ marginBottom: 28 }}>
        <DestinationPicker
          countries={countries ?? []}
          selected={picked}
          onChange={setPicked}
          onSubmit={() => picked.length && navigate(tripPath(lang, picked))}
          submitLabel={t.hero.searchButton}
        />
      </div>
      <div className="tabs" role="group" aria-label={t.countries.title}>
        {(["all", ...REGIONS, "other"] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === region}
            className={r === region ? "tab active" : "tab"}
            onClick={() => setRegion(r)}
          >
            {t.regions[r]}
          </button>
        ))}
      </div>
      {error && <p className="error">{t.error}</p>}
      {!countries && !error && <p>{t.loading}</p>}
      {countries && shown.length === 0 && <p>{t.countries.empty}</p>}
      <div className="grid">
        {shown.map((c) => (
          <Link key={c.countryCode} to={`/${lang}/countries/${c.countryCode.toLowerCase()}`} className="country">
            <Flag code={c.countryCode} />
            <span>
              {c.label}
              <small>
                {c.planCount} {c.planCount === 1 ? t.countries.plan : t.countries.plans}
              </small>
            </span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
