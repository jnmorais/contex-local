import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, View, Button, Text, ActivityIndicator, Alert } from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";
import { throttle } from 'lodash';

interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number; timestamp: number }>>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setErrorMsg("Permissão negada para acessar a localização");
      setIsLoading(false);
      return;
    }

    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      setLocation(currentLocation as LocationObject);
      
      const newCoordinate = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date().getTime()
      };

      setRouteCoordinates(prevCoordinates => [...prevCoordinates, newCoordinate]);

      const existingLocations = await AsyncStorage.getItem('locationHistory');
      const locations = existingLocations ? JSON.parse(existingLocations) : [];
      locations.push(newCoordinate);
      await AsyncStorage.setItem('locationHistory', JSON.stringify(locations));

      mapRef.current?.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setErrorMsg("Erro ao obter localização");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const throttledGetLocation = throttle(getLocation, 1000);

  const clearLocationHistory = async () => {
    try {
      await AsyncStorage.removeItem('locationHistory');
      setRouteCoordinates([]);
    } catch (error) {
      console.error('Erro ao limpar o histórico de localização:', error);
    }
  };

  const startTracking = async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert("Sem conexão", "Por favor, verifique sua conexão com a internet.");
      return;
    }
    setIsTracking(true);
    throttledGetLocation();
    intervalRef.current = setInterval(throttledGetLocation, 5000);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    clearLocationHistory();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#006400"
              strokeWidth={6}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>{errorMsg || "Carregando mapa..."}</Text>
        </View>
      )}
      <View style={styles.buttonContainer}>
        {!isTracking ? (
          <Button title="Iniciar Rastreamento" onPress={startTracking} />
        ) : (
          <Button title="Parar Rastreamento" onPress={stopTracking} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
  },
});