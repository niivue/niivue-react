import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  RouteObject,
  NavLink,
} from "react-router-dom";
import { NiivueCanvasForTest } from "./NiivueCanvasForPlaywrightTest.tsx";
import ReadmeExample from "./ReadmeExample.tsx";
import ModulateScalar from "./demos/ModulateScalar.tsx";
import "./index.css";
import Atlas from "./demos/Atlas.tsx";

const nonRootRoutes: RouteObject[] = [
  {
    path: "/readme_example",
    element: <ReadmeExample />,
  },
  {
    path: "/modulate_scalar",
    element: <ModulateScalar />,
  },
  {
    path: "/atlas",
    element: <Atlas />,
  },
  {
    path: "/playwright_harness",
    element: <NiivueCanvasForTest />,
  },
];

const router = createBrowserRouter([
  ...nonRootRoutes,
  {
    path: "/",
    element: (
      <>
        <h1>niivue-react Testing Page</h1>
        <nav>
          <ul>
            {nonRootRoutes
              .map((route) => route.path as string)
              .map((path) => {
                return (
                  <li key={path}>
                    <NavLink to={path}>{path}</NavLink>
                  </li>
                );
              })}
          </ul>
        </nav>
      </>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  // Do NOT use React.StrictMode.
  // See https://github.com/niivue/niivue/issues/912
  <RouterProvider router={router} />,
);
