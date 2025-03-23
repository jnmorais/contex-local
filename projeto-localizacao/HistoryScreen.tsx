import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface LocationItem {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export default function HistoryScreen() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLocations = async () => {
    try {
      const storedLocations = await AsyncStorage.getItem('locationHistory');
      if (storedLocations) {
        const parsedLocations = JSON.parse(storedLocations);
        parsedLocations.sort((a: LocationItem, b: LocationItem) => b.timestamp - a.timestamp);
        setLocations(parsedLocations);
      } else {
        setLocations([]); 
      }
    } catch (error) {
      console.error('Erro ao carregar localizações:', error);
      setLocations([]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadLocations().then(() => setRefreshing(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadLocations();
    }, [])
  );

  const renderItem = ({ item }: { item: LocationItem }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>Latitude: {item.latitude.toFixed(6)}</Text>
      <Text style={styles.itemText}>Longitude: {item.longitude.toFixed(6)}</Text>
      <Text style={styles.itemText}>Data: {new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {locations.length > 0 ? (
        <FlatList
          data={locations}
          renderItem={renderItem}
          keyExtractor={(item) => item.timestamp.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma localização registrada.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  item: {
    backgroundColor: '#e0e0e0',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 5,
  },
  itemText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});