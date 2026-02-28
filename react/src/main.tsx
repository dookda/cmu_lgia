import { createRoot } from 'react-dom/client'
import { App } from './App'

// Design tokens — must be first
import './tokens/tokens.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const container = document.getElementById('root')!
createRoot(container).render(<App />)
