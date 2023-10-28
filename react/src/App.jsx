import { useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'popper.js/dist/umd/popper.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import Nav from './Navbar/Navbar';
import Map from './Map/Map';
import LayerControl from './LayerControl/LayerControl';

function App() {
  const [count, setCount] = useState(0)



  return (
    <>
      <Nav />
      <div className="container mt-3">
        <div className="row">
          <div className="col-sm-8">
            <Map />
          </div>
          <div className="col-sm-4">
            <LayerControl />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
