import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as Location from "expo-location";

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
  };

  useEffect(() => {
    getLocation();
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
