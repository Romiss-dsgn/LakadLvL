import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { styles } from "../styles";

type ProgressBarProps = {
  progress: number;
  tint: string;
  trackStyle?: StyleProp<ViewStyle>;
};

export function ProgressBar({
  progress,
  tint,
  trackStyle,
}: ProgressBarProps) {
  return (
    <View style={[styles.progressTrack, trackStyle]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
            backgroundColor: tint,
          },
        ]}
      />
    </View>
  );
}
