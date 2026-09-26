import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

const HENDERSON = { latitude: 37.8362, longitude: -87.5901, latitudeDelta: 0.09, longitudeDelta: 0.09 };

export function PropertyMap({
  points,
  style,
  scrollEnabled = true,
}: {
  points: MapPoint[];
  style?: object;
  scrollEnabled?: boolean;
}) {
  const first = points[0];
  const region = first
    ? {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: points.length > 1 ? 0.09 : 0.02,
        longitudeDelta: points.length > 1 ? 0.09 : 0.02,
      }
    : HENDERSON;

  return (
    <MapView style={[styles.map, style]} initialRegion={region} scrollEnabled={scrollEnabled}>
      {points.map((point) => (
        <Marker
          key={point.id}
          coordinate={{ latitude: point.latitude, longitude: point.longitude }}
          title={point.title}
          description={point.description}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
