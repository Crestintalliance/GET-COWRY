import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api, ApiError, parseLpa, type OrderView } from "../api";
import { countryName, formatData, formatPrice } from "../i18n";
import { helpHref, Page, useLang } from "../layout";

const POLL_MS = 3000;

export function Order() {
  const { lang, t } = useLang();
  const id = useParams().id ?? "";
  const token = useSearchParams()[0].get("token") ?? "";
  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const o = await api.order(id, token);
        if (stop) return;
        setOrder(o);
        if (o.status !== "fulfilled" && o.status !== "fulfillment_failed") timer = setTimeout(load, POLL_MS);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else if (!stop) timer = setTimeout(load, POLL_MS);
      }
    }
    load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id, token]);

  useEffect(() => {
    const ac = order?.esim?.activationCode;
    if (ac) QRCode.toDataURL(ac, { margin: 1, width: 480 }).then(setQr).catch(() => setQr(null));
  }, [order?.esim?.activationCode]);

  if (notFound) {
    return (
      <Page>
        <p className="error">{t.order.notFound}</p>
      </Page>
    );
  }
  if (!order) {
    return (
      <Page>
        <p>{t.loading}</p>
      </Page>
    );
  }

  const lpa = order.esim ? parseLpa(order.esim.activationCode) : null;

  return (
    <Page>
      <h1 style={{ margin: "0 0 8px" }}>{t.order.title}</h1>
      <p className="lead">
        {countryName(order.countryCode, order.countryCode, lang)} · {formatData(order.dataBytes)} · {order.validityDays}{" "}
        {t.country.days} · {formatPrice(order.retailCents, lang)}
      </p>
      <p>
        <span className="status" role="status">
          {t.order.status[order.status]}
        </span>
      </p>

      {(order.status === "awaiting_payment" || order.status === "paid" || order.status === "provisioning") && (
        <p className="notice">{t.order.waiting}</p>
      )}

      {order.status === "fulfillment_failed" && (
        <div className="panel">
          <p className="error">{t.order.failed}</p>
          <a className="btn btn-lime" href={helpHref()}>
            {t.nav.help}
          </a>
        </div>
      )}

      {order.status === "fulfilled" && order.esim && (
        <div className="panel" style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
          {qr && (
            <div className="qr">
              <img src={qr} alt={t.order.scan} />
            </div>
          )}
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            <p>{t.order.scan}</p>
            {lpa && (
              <>
                <p className="notice">{t.order.manual}</p>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{t.order.smdp}</p>
                <div className="code-box">{lpa.smdp}</div>
                <p style={{ margin: "12px 0 4px", fontWeight: 600 }}>{t.order.code}</p>
                <div className="code-box">{lpa.code}</div>
              </>
            )}
            <p className="notice">{t.order.keep}</p>
            <Link to={`/${lang}/install`} className="btn btn-outline">
              {t.order.guide}
            </Link>
          </div>
        </div>
      )}
    </Page>
  );
}
