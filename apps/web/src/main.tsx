import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { isLang, type Lang } from "./i18n";
import { LangLayout } from "./layout";
import { Admin } from "./pages/Admin";
import { Countries } from "./pages/Countries";
import { Country } from "./pages/Country";
import { Home } from "./pages/Home";
import { Order } from "./pages/Order";
import { Trip } from "./pages/Trip";
import { DevPay, Install, Legal } from "./pages/Static";
import "./styles.css";

function preferredLang(): Lang {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag?.toLowerCase().slice(0, 2);
    if (isLang(base)) return base;
  }
  return "en";
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to={`/${preferredLang()}`} replace /> },
  {
    path: "/dev-pay",
    element: <LangLayout />,
    children: [{ index: true, element: <DevPay /> }],
  },
  {
    path: "/admin",
    element: <LangLayout />,
    children: [{ index: true, element: <Admin /> }],
  },
  {
    path: "/:lang",
    element: <LangLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "countries", element: <Countries /> },
      { path: "countries/:code", element: <Country /> },
      { path: "trip", element: <Trip /> },
      { path: "order/:id", element: <Order /> },
      { path: "install", element: <Install /> },
      { path: "terms", element: <Legal kind="terms" /> },
      { path: "refunds", element: <Legal kind="refunds" /> },
      { path: "privacy", element: <Legal kind="privacy" /> },
      { path: "*", element: <Navigate to=".." replace /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
