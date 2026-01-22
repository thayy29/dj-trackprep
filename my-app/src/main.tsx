import './styles/global.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Home } from './screen/home';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>
)