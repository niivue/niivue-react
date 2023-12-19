import React from 'react'
import ReactDOM from 'react-dom/client'
import ModulateScalar from './ModulateScalar.tsx'
import ReadmeExample from "./ReadmeExample.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModulateScalar />
    {/*<ReadmeExample />*/}
  </React.StrictMode>,
)
