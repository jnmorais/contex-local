import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, ScrollView } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define o tipo para a localização
interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
  };
}

export default function App() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [locationHistory, setLocationHistory] = useState<LocationObject[]>([]);

  // Função para salvar a localização no AsyncStorage
  const saveLocation = async (newLocation: LocationObject) => {
    try {
      const storedLocations = await AsyncStorage.getItem("locations");
      const locations = storedLocations ? JSON.parse(storedLocations) : [];
      locations.push(newLocation);
      await AsyncStorage.setItem("locations", JSON.stringify(locations));
      setLocationHistory(locations);
    } catch (error) {
      console.error("Erro ao salvar a localização:", error);
    }
  };

  const getLocation = async () => {
    // Solicitar permissão
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setErrorMsg("Permissão negada para acessar a localização");
      return;
    }

    // Capturar a localização
    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation as LocationObject);

    // Salvar a localização
    saveLocation(currentLocation as LocationObject);
  };

  // Recuperar histórico salvo
  const loadLocationHistory = async () => {
    try {
      const storedLocations = await AsyncStorage.getItem("locations");
      if (storedLocations) {
        setLocationHistory(JSON.parse(storedLocations));
      }
    } catch (error) {
      console.error("Erro ao carregar o histórico de localização:", error);
    }
  };

  useEffect(() => {
    getLocation();
    loadLocationHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Localização do Usuário</Text>

      {location ? (
        <Text>
          Latitude: {location.coords.latitude}, Longitude:{" "}
          {location.coords.longitude}
        </Text>
      ) : (
        <Text>{errorMsg || "Obtendo localização..."}</Text>
      )}

      <Button title="Atualizar Localização" onPress={getLocation} />

      <Text style={styles.subtitle}>Histórico de Localizações:</Text>
      <ScrollView style={styles.historyContainer}>
        {locationHistory.map((loc, index) => (
          <Text key={index}>
            {index + 1}: Lat {loc.coords.latitude}, Lng {loc.coords.longitude}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  historyContainer: {
    marginTop: 10,
    maxHeight: 200,
    width: "100%",
  },
});
