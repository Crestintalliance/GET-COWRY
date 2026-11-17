import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { DICTS, isLang, LANG_NAMES, LANGS, type Dict, type Lang } from "./i18n";

interface LangCtx {
  lang: Lang;
  t: Dict;
}
const Ctx = createContext<LangCtx>({ lang: "en", t: DICTS.en });
export const useLang = () => useContext(Ctx);

export function helpHref(): string {
  const n = import.meta.env.VITE_WHATSAPP_NUMBER;
  return n ? `https://wa.me/${n.replace(/\D/g, "")}` : "mailto:hello@joincowry.com";
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <ellipse cx="18" cy="18" rx="12" ry="16" fill="#B8F35A" />
      <path d="M18 5 C 14 12, 22 24, 18 31" stroke="#06281C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function LangLayout() {
  const params = useParams();
  const { pathname, search } = useLocation();
  const queryLang = new URLSearchParams(search).get("lang") ?? undefined;
  const lang: Lang = isLang(params.lang) ? params.lang : isLang(queryLang) ? queryLang : "en";
  const t = DICTS[lang];
  const navigate = useNavigate();
  const pathFor = (to: Lang) => pathname.replace(new RegExp(`^/(${LANGS.join("|")})(?=/|$)`), `/${to}`) + search;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <Ctx.Provider value={{ lang, t }}>
      <div className="container">
        <header className="site-header">
          <Link to={`/${lang}`} className="brand">
            <Logo />
            JoinCowry
          </Link>
          <nav className="nav" aria-label="Main">
            <Link to={`/${lang}/countries`}>{t.nav.destinations}</Link>
            <Link to={`/${lang}/install`}>{t.nav.how}</Link>
            <a href={helpHref()}>{t.nav.help}</a>
            <label className="lang-select">
              <span className="sr-only">{t.nav.language}</span>
              <select value={lang} onChange={(e) => navigate(pathFor(e.target.value as Lang))}>
                {LANGS.map((l) => (
                  <option key={l} value={l} lang={l}>
                    {LANG_NAMES[l]}
                  </option>
                ))}
              </select>
            </label>
          </nav>
        </header>
      </div>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <span>© {new Date().getFullYear()} {t.footer.rights}</span>
          <nav aria-label="Footer">
            <Link to={`/${lang}/install`}>{t.footer.install}</Link>
            <Link to={`/${lang}/terms`}>{t.footer.terms}</Link>
            <Link to={`/${lang}/refunds`}>{t.footer.refunds}</Link>
            <Link to={`/${lang}/privacy`}>{t.footer.privacy}</Link>
          </nav>
        </div>
      </footer>
    </Ctx.Provider>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="container section">{children}</div>;
}
