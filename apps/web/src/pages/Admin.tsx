import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Page } from "../layout";

const BASE = import.meta.env.VITE_API_URL ?? "";
const KEY = "cowry.admin";

type Status = "pending" | "approved" | "rejected";
interface Suggestion {
  id: string;
  countryCode: string;
  category: "eat" | "do" | "go";
  name: string;
  area: string;
  note: string;
  submittedBy: string | null;
  status: Status;
  createdAt: string;
}

/** Review screen for traveler recommendations. Not linked from the site; needs the ADMIN_TOKEN. */
export function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(KEY) ?? "");
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<Status>("pending");
  const [rows, setRows] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const res = await fetch(`${BASE}/api/admin/suggestions?status=${tab}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      sessionStorage.removeItem(KEY);
      setToken("");
      return setError("Wrong password.");
    }
    if (!res.ok) return setError("Couldn't load recommendations.");
    setRows(((await res.json()) as { suggestions: Suggestion[] }).suggestions);
  }, [token, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, status: Status) {
    const res = await fetch(`${BASE}/api/admin/suggestions/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return setError("Couldn't save that change.");
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  function signIn(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(KEY, draft);
    setToken(draft);
    setDraft("");
  }

  if (!token) {
    return (
      <Page>
        <h1>Review recommendations</h1>
        <form onSubmit={signIn} style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 520 }}>
          <label htmlFor="pw" className="sr-only">
            Password
          </label>
          <input
            id="pw"
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="admin-input"
          />
          <button className="btn btn-lime" type="submit">
            Sign in
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </Page>
    );
  }

  return (
    <Page>
      <h1>Review recommendations</h1>
      <div className="tabs" role="tablist">
        {(["pending", "approved", "rejected"] as Status[]).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={s === tab} className={s === tab ? "tab active" : "tab"} onClick={() => setTab(s)}>
            {s[0]!.toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {rows?.length === 0 && <p>Nothing here.</p>}
      <div style={{ display: "grid", gap: 14 }}>
        {rows?.map((r) => (
          <div key={r.id} className="admin-card">
            <p className="admin-meta">
              {r.countryCode} · {r.category.toUpperCase()} · {new Date(r.createdAt).toLocaleDateString()}
              {r.submittedBy ? ` · from ${r.submittedBy}` : ""}
            </p>
            <h3 style={{ margin: "4px 0" }}>{r.name}</h3>
            {r.area && <p className="admin-meta">{r.area}</p>}
            {r.note && <p>{r.note}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {r.status !== "approved" && (
                <button className="btn btn-lime" type="button" onClick={() => review(r.id, "approved")}>
                  Approve
                </button>
              )}
              {r.status !== "rejected" && (
                <button className="btn btn-outline" type="button" onClick={() => review(r.id, "rejected")}>
                  Reject
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
