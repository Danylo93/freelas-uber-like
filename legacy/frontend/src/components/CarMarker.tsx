
import React, { useEffect, useMemo, useRef } from 'react';
import MapView, { AnimatedRegion, MarkerAnimated } from 'react-native-maps';
import { Image } from 'react-native';

export type LatLng = { latitude: number; longitude: number; heading?: number };

type Props = {
  position: LatLng;
  duration?: number;
  onStep?: (p: LatLng) => void;
  mapRef?: React.RefObject<MapView>;
};

function clampAngle(a: number) { return ((a % 360) + 360) % 360; }

export default function CarMarker({ position, duration = 800, onStep, mapRef }: Props) {
  const region = useMemo(
    () => new AnimatedRegion({ latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0, longitudeDelta: 0 }),
    []
  );
  const lastHeading = useRef(position.heading ?? 0);

  useEffect(() => {
    region.timing({
      latitude: position.latitude, longitude: position.longitude, duration, useNativeDriver: false,
      toValue: 0,
      latitudeDelta: 0,
      longitudeDelta: 0
    })
      .start(({ finished }) => { if (finished) onStep?.(position); });

    if (mapRef?.current) {
      mapRef.current.animateCamera({ center: { latitude: position.latitude, longitude: position.longitude }, zoom: 16 }, { duration: duration * 0.9 });
    }
    lastHeading.current = position.heading ?? lastHeading.current;
  }, [position.latitude, position.longitude]);

  const rotation = clampAngle(position.heading ?? lastHeading.current);

  return (
    <MarkerAnimated coordinate={region} anchor={{ x: 0.5, y: 0.5 }} flat rotation={rotation} tracksViewChanges={false}>
      <Image source={require('../assets/car-top.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
    </MarkerAnimated>
  );
}
