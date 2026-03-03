import { createRoot } from 'react-dom/client'
import { App } from './App'

// Use V2 Dashlite Theme directly
import 'maplibre-gl/dist/maplibre-gl.css'
import './font.css'

const container = document.getElementById('root')!
createRoot(container).render(<App />)
