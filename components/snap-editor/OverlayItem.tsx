import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, Alert, View, StyleSheet, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';
import { X } from 'lucide-react-native';

export type OverlayData = {
  id: string;
  type: 'sticker' | 'caption' | 'emoji';
  source?: ImageSourcePropType; // for sticker
  text?: string; // for caption or emoji
  color?: string; // for caption text color
  fontSize?: number; // for caption text size
  fontFamily?: string; // for caption font family
  x: number;
  y: number;
  scale: number;
};

interface OverlayItemProps {
  data: OverlayData;
  onUpdate: (data: OverlayData) => void;
  onDelete?: (id: string) => void;
  onEdit?: (data: OverlayData) => void;
  editable?: boolean;
}

const OverlayItem: React.FC<OverlayItemProps> = ({ data, onUpdate, onDelete, onEdit, editable = true }) => {
  const translateX = useSharedValue(data.x);
  const translateY = useSharedValue(data.y);
  const scale = useSharedValue(data.scale);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  // Sync back to parent when gesture ends
  const updateParent = () => {
    onUpdate({ ...data, x: translateX.value, y: translateY.value, scale: scale.value });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const handleEdit = () => {
    if (onEdit && data.type === 'caption') {
      onEdit(data);
    }
  };

  const showDeleteOption = () => {
    setShowDeleteButton(true);
    setIsSelected(true);
  };

  const hideDeleteOption = () => {
    setShowDeleteButton(false);
    setIsSelected(false);
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      runOnJS(hideDeleteOption)();
      runOnJS(() => setIsSelected(true))();
    })
    .onUpdate(e => {
      translateX.value = data.x + e.translationX;
      translateY.value = data.y + e.translationY;
    })
    .onEnd(() => {
      data.x = translateX.value;
      data.y = translateY.value;
      updateParent();
      runOnJS(() => setIsSelected(false))();
    })
    .shouldCancelWhenOutside(false)
    .minDistance(0);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      runOnJS(() => setIsSelected(true))();
    })
    .onUpdate(e => {
      scale.value = Math.max(0.3, Math.min(data.scale * e.scale, 4));
    })
    .onEnd(() => {
      data.scale = scale.value;
      updateParent();
      runOnJS(() => setIsSelected(false))();
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      if (editable && onDelete) {
        runOnJS(showDeleteOption)();
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (editable && onEdit && data.type === 'caption') {
        runOnJS(handleEdit)();
      }
    });

  const tap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (showDeleteButton) {
        runOnJS(hideDeleteOption)();
      }
    });

  const composed = Gesture.Race(
    Gesture.Simultaneous(pan, pinch),
    longPress,
    doubleTap,
    tap
  );

  useEffect(() => {
    // update when parent changes (not occurs often)
    translateX.value = withTiming(data.x);
    translateY.value = withTiming(data.y);
    scale.value = withTiming(data.scale);
  }, [data]);

  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'web') {
      // On web the hit-box follows CSS transforms, so we can keep translateX/Y.
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
      } as const;
    }

    // On native (iOS/Android) the touch target does NOT move with transforms, so
    // we use absolute positioning for X/Y and only transform for scaling.
    return {
      left: translateX.value,
      top: translateY.value,
      transform: [{ scale: scale.value }],
    } as const;
  });

  const getTextStyle = () => {
    const baseStyle = {
      color: data.color || '#fff',
      fontSize: data.fontSize || 32,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    };

    switch (data.fontFamily) {
      case 'System-Bold':
        return { ...baseStyle, fontWeight: 'bold' as const };
      case 'System-Italic':
        return { ...baseStyle, fontStyle: 'italic' as const };
      case 'monospace':
        return { ...baseStyle, fontFamily: 'monospace' };
      default:
        return baseStyle;
    }
  };

  return (
    <GestureDetector gesture={editable ? composed : Gesture.Pan()}>
      <Animated.View style={[{ position: 'absolute' }, animatedStyle]}>
        <View style={isSelected ? styles.selectedContainer : undefined}>
          {data.type === 'sticker' && data.source ? (
            <Image source={data.source} style={{ width: 100, height: 100 }} resizeMode="contain" />
          ) : data.type === 'emoji' ? (
            <Text style={{ fontSize: 64 }}>
              {data.text || '😀'}
            </Text>
          ) : (
            <Text style={getTextStyle()}>
              {data.text || 'Text'}
            </Text>
          )}
        </View>
        
        {showDeleteButton && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.deleteButtonBackground}>
              <X size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  selectedContainer: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1000,
  },
  deleteButtonBackground: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default OverlayItem; 