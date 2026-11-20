import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, type Country, type Plan } from "../api";
import { DestinationPicker } from "../components/DestinationPicker";
import { countryName, formatPrice } from "../i18n";
import { Page, useLang } from "../layout";
import { dataTitle, perDayText, unlimitedNote } from "../unlimited";

export function parseTrip(value: string | null): string[] {
  return [...new Set((value ?? "").split(",").map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))];
}

/** Several destinations at once: one section of plans per country. */
export function Trip() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const codes = parseTrip(params.get("to"));
  const [countries, setCountries] = useState<Country[]>([]);
  const [plans, setPlans] = useState<Record<string, Plan[] | "error">>({});

  useEffect(() => {
    api.countries().then(setCountries).catch(() => setCountries([]));
  }, []);

  const key = codes.join(",");
  useEffect(() => {
    for (const code of codes) {
      if (plans[code]) continue;
      api
        .plans(code)
        .then((p) => setPlans((prev) => ({ ...prev, [code]: p })))
        .catch(() => setPlans((prev) => ({ ...prev, [code]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function setCodes(next: string[]) {
    setParams(next.length ? { to: next.join(",").toLowerCase() } : {}, { replace: true });
  }

  const nameOf = (code: string) => {
    const c = countries.find((x) => x.countryCode === code);
    return c ? countryName(code, c.countryName, lang) : code;
  };

  return (
    <Page>
      <h1 style={{ margin: "0 0 8px" }}>{t.trip.title}</h1>
      <p className="lead">{t.trip.lead}</p>
      <div style={{ margin: "20px 0 36px" }}>
        <DestinationPicker
          countries={countries}
          selected={codes}
          onChange={setCodes}
        />
      </div>

      {codes.length === 0 && <p>{t.picker.pickOne}</p>}

      {codes.map((code) => {
        const list = plans[code];
        return (
          <section key={code} className="trip-country">
            <h2>{nameOf(code)}</h2>
            {!list && <p>{t.loading}</p>}
            {list === "error" && <p className="error">{t.error}</p>}
            {Array.isArray(list) && list.length === 0 && <p>{t.trip.none}</p>}
            {Array.isArray(list) && list.length > 0 && (
              <div className="grid">
                {list.map((p) => (
                  <div className="plan" key={p.planCode}>
                    <span className="gb">{dataTitle(p, lang)}</span>
                    <span className="meta">
                      {p.validityDays} {t.country.days}
                      {perDayText(p.unlimited, lang) ? ` · ${perDayText(p.unlimited, lang)}` : ""}
                    </span>
                    {p.unlimited && <span className="plan-note">{unlimitedNote(p.unlimited, lang)}</span>}
                    <span className="price">{formatPrice(p.priceCents, lang)}</span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() =>
                        navigate(`/${lang}/countries/${code.toLowerCase()}?plan=${encodeURIComponent(p.planCode)}`)
                      }
                    >
                      {t.trip.buy}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <p style={{ marginTop: 32 }}>
        <Link to={`/${lang}/countries`}>{t.popular.all} →</Link>
      </p>
    </Page>
  );
}
