import React, { useEffect } from 'react';
import { Image, Text, TouchableOpacity, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';

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

  // Sync back to parent when gesture ends
  const updateParent = () => {
    onUpdate({ ...data, x: translateX.value, y: translateY.value, scale: scale.value });
  };

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Item',
        'Are you sure you want to delete this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(data.id) }
        ]
      );
    }
  };

  const handleEdit = () => {
    if (onEdit && data.type === 'caption') {
      onEdit(data);
    }
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      // store start positions in gesture context implicitly via closures
    })
    .onUpdate(e => {
      translateX.value = data.x + e.translationX;
      translateY.value = data.y + e.translationY;
    })
    .onEnd(() => {
      updateParent();
    });

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(0.3, Math.min(data.scale * e.scale, 4));
    })
    .onEnd(() => {
      updateParent();
    });

  const longPress = Gesture.LongPress()
    .minDuration(800)
    .onEnd(() => {
      if (editable && onDelete) {
        runOnJS(handleDelete)();
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (editable && onEdit && data.type === 'caption') {
        runOnJS(handleEdit)();
      }
    });

  const composed = Gesture.Simultaneous(pan, pinch, longPress, doubleTap);

  useEffect(() => {
    // update when parent changes (not occurs often)
    translateX.value = withTiming(data.x);
    translateY.value = withTiming(data.y);
    scale.value = withTiming(data.scale);
  }, [data]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

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
      </Animated.View>
    </GestureDetector>
  );
};

export default OverlayItem; 