export type LayerType = 'Point' | 'LineString' | 'Polygon'

export interface Layer {
  gid: number
  formid: string
  division: string
  layername: string
  layertype: LayerType
  ts: string
}

export interface LayerColumn {
  column_name: string
  column_type: string
  column_desc: string
}

export interface CreateLayerPayload {
  division: string
  layername: string
  layertype: LayerType
  columns: LayerColumn[]
}

export interface CreateLayerResponse {
  formid: string
}

// Flat row returned by POST /api/v2/load_layer
export interface GeoFeature {
  id: number
  refid: string
  ts: string
  style: string | null
  geojson: string | null   // ST_AsGeoJSON(geom) — stringified GeoJSON geometry
  [key: string]: unknown   // dynamic column values
}
