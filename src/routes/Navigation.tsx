import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { routes } from "./routes";

export function Navigation() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={
              <route.layout>
                <route.component />
              </route.layout>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
