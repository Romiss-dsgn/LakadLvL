import { Feather, Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "../styles";

type LoginScreenProps = {
  email: string;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginScreen({
  email,
  errorMessage,
  isSubmitting,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <View style={styles.centeredStage}>
      <View style={styles.loginCard}>
        <View style={styles.loginBadge}>
          <Feather name="cpu" size={18} color="#08111E" />
        </View>
        <Text style={styles.loginTitle}>COMMAND ACCESS</Text>
        <Text style={styles.loginSubtitle}>
          Enter credentials and launch your LakadLvL command center.
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={onEmailChange}
            placeholder="demo@lakadlvl.app"
            placeholderTextColor="#657288"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            onChangeText={onPasswordChange}
            placeholder="••••••••"
            placeholderTextColor="#657288"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={onSubmit}>
          <Ionicons name="log-in-outline" size={18} color="#08111E" />
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "CONNECTING..." : "LOGIN"}
          </Text>
        </Pressable>

        {errorMessage ? (
          <Text style={styles.loginError}>{errorMessage}</Text>
        ) : null}

        <Text style={styles.loginHint}>
          First-time credentials will create an account if sign-in fails.
        </Text>
      </View>
    </View>
  );
}
