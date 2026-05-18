import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useCountUp(target: number, duration: number = 1500) {
  const [displayValue, setDisplayValue] = useState(0);
  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listenerId = animated.addListener(({ value }) => setDisplayValue(Math.floor(value)));
    Animated.timing(animated, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
    return () => animated.removeListener(listenerId);
  }, [target]);

  return displayValue;
}
