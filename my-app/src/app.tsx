import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Home } from './screen/home';
import "./styles/global.css";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Home />
  </StrictMode>,
)
