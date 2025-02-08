// src/components/DataPanel.tsx
import React, { useState, useContext, useRef } from 'react';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net-bs5';
import { MapContext } from '../MapContext';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';

interface Column {
    col_id: string;
    col_name: string;
}

interface FeatureData {
    refid: string;
    geojson: string;
    [key: string]: any;
}

const DataPanel: React.FC = () => {
    const { map, featuresMap, markersMap, currentFormId } = useContext(MapContext)!;
    const [columns, setColumns] = useState<Column[]>([]);
    const [selectedLayer, setSelectedLayer] = useState<string>('');
    const tableRef = useRef<HTMLTableElement>(null);
    const server = 'http://localhost:3000';
    const loadColumnList = async (formid: string) => {
        if (!map.current) return;
        // Destroy existing DataTable if exists
        if ($.fn.DataTable.isDataTable('#table')) {
            $('#table').DataTable().destroy();
            if (tableRef.current) tableRef.current.innerHTML = '';
        }
        try {
            const columnsResponse = await axios.post('/api/load_column_description', { formid });
            setColumns(columnsResponse.data);
            const headerHtml = columnsResponse.data.map((col: Column) => `<th>${col.col_name}</th>`).join('');
            if (tableRef.current) {
                tableRef.current.innerHTML = `<thead><tr>${headerHtml}</tr></thead><tbody></tbody>`;
            }
            const r = await axios.post(server + '/api/load_layer', { formid });
            // Initialize DataTable with a Zoom button in the first column
            const colDefs = [
                {
                    data: 'refid',
                    render: function (data: any, type: any, row: any) {
                        return `<button class="btn btn-sm btn-primary zoom-btn" data-refid="${data}">Zoom</button>`;
                    },
                    className: 'text-center'
                },
                ...columnsResponse.data.map((col: Column) => ({ data: col.col_id, className: 'text-center' }))
            ];

            const table = $('#table').DataTable({
                data: r.data,
                columns: colDefs,
                scrollX: true,
                autoWidth: true,
                initComplete: function () {
                    this.api().columns.adjust();
                }
            });

            // Filter map features when DataTable search changes
            table.on('search.dt', function () {
                const filteredData = table.rows({ search: 'applied' }).data().toArray();
                const filteredRefIds = filteredData.map((row: FeatureData) => row.refid);

                if (featuresMap.current[formid]) {
                    featuresMap.current[formid].forEach(feature => {
                        const visibility = filteredRefIds.includes(feature) ? 'visible' : 'none';
                        map.current!.setLayoutProperty(feature, 'visibility', visibility);
                    });
                }

                if (markersMap.current[formid]) {
                    markersMap.current[formid].forEach((marker, index) => {
                        const refid = r.data[index].refid;
                        marker.getElement().style.display = filteredRefIds.includes(refid) ? 'block' : 'none';
                    });
                }
            });

            // Zoom button event
            $('#table tbody').on('click', '.zoom-btn', function () {
                const refid = $(this).data('refid');
                zoomToFeature(refid, formid, r.data);
            });

            currentFormId.current = formid;
        } catch (error) {
            console.error('Failed to load column list:', error);
        }
    };

    const zoomToFeature = (refid: string, formid: string, featureData: FeatureData[]) => {
        if (!map.current) return;
        const feature = featureData.find(f => f.refid === refid);
        if (!feature || !feature.geojson) return;
        const data = JSON.parse(feature.geojson);
        let popupContent = `<strong>Reference ID:</strong> ${refid}<br>`;
        Object.entries(feature).forEach(([key, value]) => {
            if (key !== 'geojson' && key !== 'refid') {
                popupContent += `<strong>${key}:</strong> ${value}<br>`;
            }
        });
        if (data.type === 'Point') {
            map.current.flyTo({ center: data.coordinates, zoom: 18, essential: true });
            new maplibregl.Popup({ offset: 25 })
                .setLngLat(data.coordinates)
                .setHTML(popupContent)
                .addTo(map.current);
        } else if (data.type === 'Polygon' || data.type === 'LineString') {
            const bbox = turf.bbox(data);
            map.current.fitBounds(bbox, { padding: 50 });
            const center = turf.centerOfMass(data).geometry.coordinates;
            new maplibregl.Popup({ offset: 25 })
                .setLngLat(center)
                .setHTML(popupContent)
                .addTo(map.current);
        }
    };

    const handleLayerSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const formid = event.target.value;
        setSelectedLayer(formid);
        loadColumnList(formid);
    };

    return (
        <div>
            <div className="data-query row">
                <div className="col-md-2 d-flex align-items-center justify-content-center">
                    <label className="mt-1 text-center" htmlFor="layerSelect">
                        สอบถามข้อมูล
                    </label>
                </div>
                <div className="col-md-10">
                    <div className="row">
                        <div className="col-md-4 mt-2">
                            <select
                                className="form-select"
                                id="layerSelect"
                                value={selectedLayer}
                                onChange={handleLayerSelectChange}
                            >
                                <option value="">เลือกชั้นแผนที่</option>
                                {/* Options can be dynamically populated (e.g. via a shared state updated by LayerList) */}
                            </select>
                        </div>
                        <div className="col-md-4 mt-2">
                            <input
                                className="form-control"
                                type="text"
                                name="select-col"
                                id="select-col"
                                placeholder="เลือกคอลัมน์"
                            />
                        </div>
                        <div className="col-md-4 mt-2">
                            <input
                                className="form-control"
                                type="text"
                                name="keyword"
                                id="keyword"
                                placeholder="ค่าที่ต้องการค้น"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="data-table mt-2">
                <table id="table" className="table table-striped nowrap" ref={tableRef}></table>
            </div>
        </div>
    );
};

export default DataPanel;
