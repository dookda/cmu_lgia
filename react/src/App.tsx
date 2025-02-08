// src/App.tsx
import React from 'react';
import MapContainer from './components/MapContainer';
import Sidebar from './components/SideBar';
import DataPanel from './components/DataPanel';
import { MapProvider } from './MapContext';

const App: React.FC = () => {
  return (
    <MapProvider>
      <div className="app">
        <header>
          <h4 className="text-center">
            ระบบภูมิสารสนเทศชุมชน (LGIA: Local Geo-Info Application)
          </h4>
        </header>
        <nav className="navbar navbar-light bg-light">
          <ul className="nav justify-content-end">
            <li className="nav-item">
              <a className="nav-link" href="#">
                รายงาน
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="./../input/index.html">
                การจัดการข้อมูล
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="./../manage/index.html">
                การจัดการระบบ
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                ออกจากระบบ
              </a>
            </li>
          </ul>
        </nav>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-3 mt-2">
              <Sidebar />
            </div>
            <div className="col-md-9 mt-2">
              <MapContainer />
              <DataPanel />
            </div>
          </div>
        </div>
      </div>
    </MapProvider>
  );
};

export default App;
