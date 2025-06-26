import React, { useEffect } from 'react';
import { Image, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import type { ImageSourcePropType } from 'react-native';

export type OverlayData = {
  id: string;
  type: 'sticker' | 'caption';
  source?: ImageSourcePropType; // for sticker
  text?: string; // for caption
  x: number;
  y: number;
  scale: number;
};

interface OverlayItemProps {
  data: OverlayData;
  onUpdate: (data: OverlayData) => void;
  editable?: boolean;
}

const OverlayItem: React.FC<OverlayItemProps> = ({ data, onUpdate, editable = true }) => {
  const translateX = useSharedValue(data.x);
  const translateY = useSharedValue(data.y);
  const scale = useSharedValue(data.scale);

  // Sync back to parent when gesture ends
  const updateParent = () => {
    onUpdate({ ...data, x: translateX.value, y: translateY.value, scale: scale.value });
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

  const composed = Gesture.Simultaneous(pan, pinch);

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

  return (
    <GestureDetector gesture={editable ? composed : Gesture.Pan()}>
      <Animated.View style={[{ position: 'absolute' }, animatedStyle]}>
        {data.type === 'sticker' && data.source ? (
          <Image source={data.source} style={{ width: 100, height: 100 }} resizeMode="contain" />
        ) : (
          <Text
            style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {data.text || 'Text'}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

export default OverlayItem; 