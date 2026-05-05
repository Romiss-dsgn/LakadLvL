import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { styles } from "../styles";

export function LaunchScreen() {
  return (
    <View style={styles.centeredStage}>
      <View style={styles.launchLogoWrap}>
        <View style={styles.launchLogo}>
          <Feather name="activity" size={42} color="#07111F" />
        </View>
      </View>
      <Text style={styles.launchTitle}>LAKADLVL</Text>
      <Text style={styles.launchTagline}>
        Level up your health. Build from anywhere.
      </Text>
    </View>
  );
}
