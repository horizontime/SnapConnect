import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { Filter } from '@/types';
import { Grid, Trees, Camera, Eye } from 'lucide-react-native';

interface FilterSelectorProps {
  filters: Filter[];
  selectedFilter: string | null;
  onSelectFilter: (filterId: string | null) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  filters,
  selectedFilter,
  onSelectFilter,
}) => {
  const getIconForFilter = (iconName: string) => {
    switch (iconName) {
      case 'tree':
        return <Trees size={24} color={colors.card} />;
      case 'grid':
        return <Grid size={24} color={colors.card} />;
      case 'camera':
        return <Camera size={24} color={colors.card} />;
      case 'eye':
        return <Eye size={24} color={colors.card} />;
      default:
        return <Camera size={24} color={colors.card} />;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filters</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterItem,
            selectedFilter === null && styles.selectedFilter,
          ]}
          onPress={() => onSelectFilter(null)}
        >
          <View style={styles.filterIcon}>
            <Camera size={24} color={colors.card} />
          </View>
          <Text style={styles.filterName}>None</Text>
        </TouchableOpacity>
        
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterItem,
              selectedFilter === filter.id && styles.selectedFilter,
            ]}
            onPress={() => onSelectFilter(filter.id)}
          >
            <View style={styles.filterIcon}>
              {getIconForFilter(filter.icon)}
            </View>
            <Text style={styles.filterName}>{filter.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  title: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filtersContainer: {
    paddingHorizontal: 12,
  },
  filterItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    opacity: 0.7,
  },
  selectedFilter: {
    opacity: 1,
  },
  filterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterName: {
    color: colors.card,
    fontSize: 12,
    textAlign: 'center',
  },
});