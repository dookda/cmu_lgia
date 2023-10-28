import { useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'popper.js/dist/umd/popper.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import Nav from './Navbar/Navbar';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Nav />
    </>
  )
}

export default App
