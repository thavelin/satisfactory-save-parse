export interface Position {
  x: number
  y: number
  z: number
}

export interface GameStats {
  session_name: string
  save_name: string
  play_time_seconds: number
  play_time_formatted: string
  save_date: string
  build_version: number
  is_creative_mode: boolean
  is_modded: boolean
  current_phase: string | null
  active_schematic: string | null
  total_points: number | null
  resource_sink_coupons: number | null
  creatures_killed: Array<{ creature: string; count: number }>
}

export interface ProductionBuilding {
  instance: string
  type: string
  recipe: string | null
  clock_speed_pct: number
  is_producing: boolean
  is_standby: boolean
  position: Position | null
}

export interface InventoryItem {
  item: string
  item_path: string
  quantity: number
}

export interface StorageContainer {
  instance: string
  label: string
  items: InventoryItem[]
  total_slots: number
  used_slots: number
}

export interface PlayerInventory {
  instance: string
  items: InventoryItem[]
}

export interface InventoryData {
  storage_containers: StorageContainer[]
  player_inventories: PlayerInventory[]
  combined_totals: Array<{ item: string; quantity: number }>
}

export interface ResourceNode {
  instance: string
  resource: string
  purity: string
  position: Position | null
}

export interface MapMarker {
  instance: string
  name: string
  type: string
  color: string | null
  position: Position | null
}

export interface NodeSummary {
  resource: string
  Impure: number
  Normal: number
  Pure: number
  Unknown: number
  total: number
}

export interface MapData {
  resource_nodes: ResourceNode[]
  map_markers: MapMarker[]
  node_summary: NodeSummary[]
}

export interface ParseResult {
  id: string
  filename: string
  parsed_at: string
  stats: GameStats
  production: ProductionBuilding[]
  inventory: InventoryData
  map_data: MapData
}

export interface NotionConfig {
  notion_token: string
  stats_page_id: string
  production_db_id: string
  inventory_db_id: string
  map_db_id: string
}
