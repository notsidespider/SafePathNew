/**
 * SafeHaven Map Screen
 * Shows nearby safe locations for domestic violence victims
 * Works offline with pre-loaded data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES, RESOURCE_TYPES } from '../constants';
import { LocationService } from '../services/LocationService';
import { DatabaseService } from '../services/DatabaseService';

const SafeHavenMapScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    filterResources();
  }, [selectedType, resources]);

  const initializeMap = async () => {
    try {
      // Get user location
      const locationResult = await LocationService.getLocationForEmergency();
      if (locationResult.success) {
        setUserLocation({
          latitude: locationResult.location.latitude,
          longitude: locationResult.location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } else {
        // Default to Sunyani, Ghana if location fails
        setUserLocation({
          latitude: 7.3396,
          longitude: -2.3266,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        Alert.alert('Location', 'Using default location. Enable GPS for accurate results.');
      }

      // Load resources from database
      const allResources = await DatabaseService.getSafetyResources();
      setResources(allResources);
      setLoading(false);
    } catch (error) {
      console.error('Map initialization error:', error);
      setLoading(false);
    }
  };

  const filterResources = () => {
    if (selectedType === 'all') {
      setFilteredResources(resources);
    } else {
      setFilteredResources(resources.filter(r => r.type === selectedType));
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case RESOURCE_TYPES.POLICE:
        return '#3498db';
      case RESOURCE_TYPES.SHELTER:
        return '#e74c3c';
      case RESOURCE_TYPES.HOSPITAL:
        return '#27ae60';
      case RESOURCE_TYPES.COUNSELING:
        return '#9b59b6';
      case RESOURCE_TYPES.LEGAL:
        return '#f39c12';
      default:
        return COLORS.primary;
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case RESOURCE_TYPES.POLICE:
        return 'shield-account';
      case RESOURCE_TYPES.SHELTER:
        return 'home-heart';
      case RESOURCE_TYPES.HOSPITAL:
        return 'hospital-box';
      case RESOURCE_TYPES.COUNSELING:
        return 'account-voice';
      case RESOURCE_TYPES.LEGAL:
        return 'gavel';
      default:
        return 'map-marker';
    }
  };

  const handleMarkerPress = (resource) => {
    setSelectedResource(resource);
  };

  const getDirections = (resource) => {
    if (!resource.latitude || !resource.longitude) {
      Alert.alert('Error', 'Location coordinates not available');
      return;
    }

    const url = Platform.select({
      ios: `maps:0,0?q=${resource.latitude},${resource.longitude}`,
      android: `geo:0,0?q=${resource.latitude},${resource.longitude}(${encodeURIComponent(resource.name)})`,
    });

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const callResource = (phone) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not make phone call');
    });
  };

  const calculateDistance = (resource) => {
    if (!userLocation || !resource.latitude || !resource.longitude) {
      return null;
    }

    const distance = LocationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      resource.latitude,
      resource.longitude
    );

    return distance.toFixed(1);
  };

  const filterButtons = [
    { type: 'all', label: 'All', icon: 'map-marker-multiple' },
    { type: RESOURCE_TYPES.POLICE, label: 'Police', icon: 'shield-account' },
    { type: RESOURCE_TYPES.SHELTER, label: 'Shelters', icon: 'home-heart' },
    { type: RESOURCE_TYPES.HOSPITAL, label: 'Hospitals', icon: 'hospital-box' },
    { type: RESOURCE_TYPES.COUNSELING, label: 'Counseling', icon: 'account-voice' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Icon name="map-search" size={64} color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading SafeHaven Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SafeHaven Map</Text>
        <Text style={styles.subtitle}>
          {filteredResources.length} safe location{filteredResources.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterButton,
              selectedType === filter.type && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType(filter.type)}
          >
            <Icon
              name={filter.icon}
              size={20}
              color={selectedType === filter.type ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedType === filter.type && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={userLocation}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {filteredResources.map((resource) => (
          <Marker
            key={resource.id}
            coordinate={{
              latitude: resource.latitude,
              longitude: resource.longitude,
            }}
            pinColor={getMarkerColor(resource.type)}
            onPress={() => handleMarkerPress(resource)}
          />
        ))}
      </MapView>

      {/* Resource Details Card */}
      {selectedResource && (
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <View style={styles.detailsHeaderLeft}>
              <Icon
                name={getMarkerIcon(selectedResource.type)}
                size={32}
                color={getMarkerColor(selectedResource.type)}
              />
              <View style={styles.detailsInfo}>
                <Text style={styles.detailsName}>{selectedResource.name}</Text>
                <Text style={styles.detailsType}>
                  {selectedResource.type.toUpperCase()}
                  {calculateDistance(selectedResource) && 
                    ` • ${calculateDistance(selectedResource)} km away`
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedResource(null)}>
              <Icon name="close" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {selectedResource.address && (
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={18} color={COLORS.gray} />
              <Text style={styles.detailText}>{selectedResource.address}</Text>
            </View>
          )}

          {selectedResource.phone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={18} color={COLORS.gray} />
              <Text style={styles.detailText}>{selectedResource.phone}</Text>
            </View>
          )}

          {selectedResource.hours && (
            <View style={styles.detailRow}>
              <Icon name="clock-outline" size={18} color={COLORS.gray} />
              <Text style={styles.detailText}>{selectedResource.hours}</Text>
            </View>
          )}

          {selectedResource.description && (
            <Text style={styles.detailsDescription}>{selectedResource.description}</Text>
          )}

          <View style={styles.detailsActions}>
            {selectedResource.phone && (
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => callResource(selectedResource.phone)}
              >
                <Icon name="phone" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.directionsButton]}
              onPress={() => getDirections(selectedResource)}
            >
              <Icon name="directions" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="map-marker-off" size={48} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No {selectedType} locations found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  header: {
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  subtitle: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterContent: {
    padding: SIZES.padding,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: SIZES.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  map: {
    flex: 1,
  },
  detailsCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    padding: SIZES.padding * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.margin,
  },
  detailsHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsInfo: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  detailsName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  detailsType: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: SIZES.caption,
    color: COLORS.darkGray,
    flex: 1,
  },
  detailsDescription: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 8,
    lineHeight: 18,
  },
  detailsActions: {
    flexDirection: 'row',
    marginTop: SIZES.margin * 1.5,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 6,
  },
  callButton: {
    backgroundColor: COLORS.success,
  },
  directionsButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: SIZES.body,
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 2,
    marginHorizontal: SIZES.margin * 2,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    marginTop: SIZES.margin,
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
});

export default SafeHavenMapScreen;
