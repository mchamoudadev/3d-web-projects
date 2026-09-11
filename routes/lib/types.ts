export type Language = "so" | "en";
export type Coordinate = [number, number];
export type Category =
  | "school"
  | "restaurant"
  | "fuel"
  | "shop"
  | "hospital"
  | "clinic"
  | "market"
  | "mosque"
  | "government"
  | "hotel"
  | "university"
  | "district"
  | "landmark"
  | "airport"
  | "beach";
export interface Place {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  district: string;
  lat: number;
  lng: number;
  description: string;
  source: "osm" | "manual";
  osm_id: string | null;
  name_so?: string;
  score?: number;
}
export interface Maneuver {
  type: string;
  modifier?: string;
  location: Coordinate;
  bearing_before: number;
  bearing_after: number;
  exit?: number;
}
export interface RouteStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: Maneuver;
  geometry: { type: "LineString"; coordinates: Coordinate[] };
}
export interface DrivingRoute {
  distance: number;
  duration: number;
  geometry: { type: "LineString"; coordinates: Coordinate[] };
  legs: { steps: RouteStep[] }[];
}
export interface Direction {
  text: string;
  location: Coordinate;
  distance: number;
  modifier: string;
  progress: number;
  place?: Place;
}
export interface RouteResult {
  cameraRoute?: Coordinate[];
  route: DrivingRoute;
  directions: Direction[];
  origin: Place | null;
  destination: Place;
  places: Place[];
  language: Language;
}
