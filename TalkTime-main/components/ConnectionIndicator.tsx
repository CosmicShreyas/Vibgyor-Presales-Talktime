import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useConnection } from '@/contexts/ConnectionContext';
import { Colors } from '@/constants/theme';

export function ConnectionIndicator() {
  const { status } = useConnection();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breatheAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (status === 'connected') {
      // Breathing animation for connected state
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (status === 'reconnecting') {
      // Blinking animation for reconnecting state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animations for disconnected state
      pulseAnim.setValue(1);
      breatheAnim.setValue(1);
    }

    return () => {
      pulseAnim.stopAnimation();
      breatheAnim.stopAnimation();
    };
  }, [status]);

  const getColor = () => {
    switch (status) {
      case 'connected':
        return Colors.success;
      case 'reconnecting':
        return Colors.warning;
      case 'disconnected':
        return Colors.error;
      default:
        return Colors.success;
    }
  };

  const getOpacity = () => {
    if (status === 'connected') {
      return breatheAnim;
    } else if (status === 'reconnecting') {
      return pulseAnim;
    }
    return 1;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: getColor(),
            opacity: getOpacity(),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
