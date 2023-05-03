import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MantineProvider } from "@mantine/core";
import "./samples/node-api";

import "./index.css";
import { Notifications } from "@mantine/notifications";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider
            theme={{
                primaryColor: "indigo",
            }}
            withGlobalStyles
            withNormalizeCSS
        >
            <Notifications />
            <App />
        </MantineProvider>
    </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
