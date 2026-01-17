
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Constants from 'expo-constants';

export type LatLng = { latitude: number; longitude: number };

interface Props {
  style?: any;
  origin?: LatLng | string;
  destination?: LatLng | string;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onRouteReady?: (info: { distanceKm: number; durationMin: number }) => void;
  children?: React.ReactNode;
}

function getKeys() {
  const extra: any = (Constants.expoConfig?.extra ?? {});
  const SDK_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_SDK_KEY ||
    extra.googleSdkKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    extra.googleMapsApiKey || "";
  const WEB_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_KEY ||
    extra.googleWebKey ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  return { SDK_KEY, WEB_KEY };
}

async function geocodeIfNeeded(input: LatLng | string | undefined, WEB_KEY: string): Promise<LatLng | null> {
  if (!input) return null;
  if (typeof input !== 'string') return input;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${WEB_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (loc) return { latitude: loc.lat, longitude: loc.lng };
  } catch {}
  return null;
}

const CustomMapView: React.FC<Props> = ({
  style,
  origin,
  destination,
  initialRegion = { latitude: -23.5615, longitude: -46.656, latitudeDelta: 0.05, longitudeDelta: 0.05 },
  showsUserLocation,
  showsMyLocationButton,
  onRouteReady,
  children
}) => {
  const mapRef = useRef<MapView>(null);
  const { WEB_KEY } = getKeys();
  const [o, setO] = useState<LatLng | null>(null);
  const [d, setD] = useState<LatLng | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const oRes = await geocodeIfNeeded(origin, WEB_KEY);
      const dRes = await geocodeIfNeeded(destination, WEB_KEY);
      if (!mounted) return;
      setO(oRes);
      setD(dRes);
      if (!WEB_KEY) setErr('Falta Google Web Key para Directions/Geocoding.');
    })();
    return () => { mounted = false; };
  }, [origin, destination, WEB_KEY]);

  const hasRoute = !!(o && d);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS !== 'web' ? 'google' : undefined}
        initialRegion={initialRegion}
        showsUserLocation={!!showsUserLocation}
        showsMyLocationButton={!!showsMyLocationButton}
      >
        {o && <Marker coordinate={o} title="Origem" />}
        {d && <Marker coordinate={d} title="Destino" />}
        {hasRoute && WEB_KEY ? (
          <MapViewDirections
            origin={o!}
            destination={d!}
            apikey={WEB_KEY}
            strokeWidth={5}
            strokeColor="#111"
            onReady={(res) => {
              mapRef.current?.fitToCoordinates(res.coordinates, {
                edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
                animated: true
              });
              onRouteReady?.({ distanceKm: res.distance, durationMin: Math.round(res.duration) });
            }}
            onError={(e) => setErr(typeof e === 'string' ? e : 'Erro ao calcular rota')}
          />
        ) : null}
        {children}
      </MapView>

      {!!err && (
        <View style={styles.banner}><Text style={styles.bannerText}>{err}</Text></View>
      )}
    </View>
  );
};

export default CustomMapView;

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: '#000', padding: 10, borderRadius: 10, opacity: 0.85 },
  bannerText: { color: '#fff', fontWeight: '600' }
});
