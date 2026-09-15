import React from 'react';
import { CategoryDetailScreen } from './CategoryDetailScreen';
import { MaterialItem, CategoryId } from '../types';

export interface ShopScreenProps {
  onSelectItem: (item: MaterialItem) => void;
  onSelectCategoryTab?: (categoryId: CategoryId | 'all' | 'services' | 'services-catalog') => void;
  selectedCategoryId?: CategoryId | 'all' | 'services' | 'services-catalog' | null;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  onBack?: () => void;
  materials?: MaterialItem[];
  categories?: any[];
  services?: any[];
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  selectedCategoryId,
  onSelectCategoryTab,
  onSelectItem,
  favoriteIds,
  onToggleFavorite,
  searchQuery = '',
  onSearchChange,
  viewMode = 'grid',
  onViewModeChange,
  onBack,
  materials,
  categories,
  services,
}) => {
  return (
    <CategoryDetailScreen
      categoryId={(selectedCategoryId as any) || 'all'}
      onSelectCategoryTab={(catId) => {
        if (onSelectCategoryTab) onSelectCategoryTab(catId as any);
      }}
      onSelectItem={onSelectItem}
      favoriteIds={favoriteIds}
      onToggleFavorite={onToggleFavorite}
      searchQuery={searchQuery}
      onClearSearch={() => {
        if (onSearchChange) onSearchChange('');
      }}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      onBack={onBack}
      materials={materials}
      categories={categories}
      services={services}
    />
  );
};

export default ShopScreen;
