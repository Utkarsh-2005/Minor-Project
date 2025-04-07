import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Import marker images
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icon issues with React-Leaflet (casting to any to bypass TS issues)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Shop {
  lat: number;
  long: number;
  store: string;
}

interface MapRouteProps {
  userLocation: [number, number];
  shops: Shop[];
}

const MapRoute: React.FC<MapRouteProps> = ({ userLocation, shops }) => {
  const [legRoutes, setLegRoutes] = useState<[number, number][][]>([]);

  // Define a palette of colors for each leg
  const legColors = ["red", "green", "blue", "orange", "purple", "magenta"];

  // Helper function: Fetch the road route from OSRM for a given leg.
  const fetchRoute = async (
    start: [number, number],
    end: [number, number]
  ): Promise<[number, number][]> => {
    // OSRM expects coordinates as lon,lat
    const [lat1, lon1] = start;
    const [lat2, lon2] = end;
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        // Convert GeoJSON coordinates ([lon, lat]) to [lat, lon]
        return data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
    return [];
  };

  useEffect(() => {
    const getLegRoutes = async () => {
      // Build an array of points: starting at userLocation, then each shop, then back to userLocation.
      const points: [number, number][] = [
        userLocation,
        ...shops.map((shop) => [shop.lat, shop.long] as [number, number]),
        userLocation,
      ];
      const legs: [number, number][][] = [];
      // Loop over each consecutive pair of points
      for (let i = 0; i < points.length - 1; i++) {
        const leg = await fetchRoute(points[i], points[i + 1]);
        // Remove duplicate endpoint if not the last leg
        if (leg.length > 0 && i < points.length - 2) {
          legs.push(leg.slice(0, -1));
        } else {
          legs.push(leg);
        }
      }
      setLegRoutes(legs);
    };

    if (userLocation && shops.length > 0) {
      getLegRoutes();
    }
  }, [userLocation, shops]);

  return (
    <>
      {/* Inline style to override default Leaflet tooltip styling */}
      <style>
  {`
    .leaflet-tooltip.custom-tooltip {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      margin-top: 20px !important;
      font-size: 0.9rem;
      color: #000;
      margin-right: 25px !important; /* move text 10px left */
    }
    .leaflet-tooltip.custom-tooltip::before,
    .leaflet-tooltip.custom-tooltip::after {
      display: none !important; /* hide tooltip arrow */
    }
  `}
</style>
      <MapContainer center={userLocation} zoom={13} style={{ height: "400px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {/* User's location marker */}
        <Marker position={userLocation}>
          <Popup>Your location</Popup>
          <Tooltip direction="bottom" permanent offset={[0, 8]} className="custom-tooltip">
            Your Location
          </Tooltip>
        </Marker>
        {/* Shop markers */}
        {shops.map((shop, index) => (
          <Marker key={index} position={[shop.lat, shop.long]}>
            <Popup>{shop.store}</Popup>
            <Tooltip direction="bottom" permanent offset={[0, 8]} className="custom-tooltip">
              {`${index + 1}.) ${shop.store}`}
            </Tooltip>
          </Marker>
        ))}
        {/* Draw each leg of the route with a different color */}
        {legRoutes.map((leg, index) => (
          <Polyline
            key={index}
            positions={leg}
            color={legColors[index % legColors.length]}
            weight={6}
            opacity={0.7}
          />
        ))}
      </MapContainer>
    </>
  );
};

export default MapRoute;
