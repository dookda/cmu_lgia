// src/components/Sidebar.tsx
import React from 'react';
import LayerList from './LayerList';

const Sidebar: React.FC = () => {
    return (
        <div>
            <div className="side-panel p-2">
                <h6>หน่วยงาน: สำนักงานพัฒนาชุมชน</h6>
                <LayerList />
            </div>
        </div>
    );
};

export default Sidebar;
