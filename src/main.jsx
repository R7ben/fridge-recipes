import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SequenceDemo from './SequenceDemo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SequenceDemo />
  </StrictMode>,
)
