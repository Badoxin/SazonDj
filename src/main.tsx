import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Semantic UI se carga por componentes y SIN reset.css ni site.css.
// El manual importa "semantic-ui-css/semantic.min.css", pero ese archivo trae reglas globales
// (html { font-size: 14px }, estilos de h1, a, p, body...) que cambiarían el diseño de todo el sitio.
import "semantic-ui-css/components/button.min.css";
import "semantic-ui-css/components/checkbox.min.css";
import "semantic-ui-css/components/dimmer.min.css";
import "semantic-ui-css/components/form.min.css";
import "semantic-ui-css/components/header.min.css";
import "semantic-ui-css/components/icon.min.css";
import "semantic-ui-css/components/input.min.css";
import "semantic-ui-css/components/label.min.css";
import "semantic-ui-css/components/loader.min.css";
import "semantic-ui-css/components/message.min.css";
import "semantic-ui-css/components/modal.min.css";
import "semantic-ui-css/components/table.min.css";
import "semantic-ui-css/components/transition.min.css";
import "react-toastify/ReactToastify.css";

import "./index.css";
import "./extras.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
