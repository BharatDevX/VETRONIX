import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Colors from "../../../theme/color";
import { RootStackParamList } from "../../../navigation/AppNavigator";

import AppInput from "../../../components/ui/AppInput";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import ScreenHeader from "../../../components/ui/ScreenHeader";

import { useAuth } from "../hooks/useAuth";

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();

  const [employeeId, setEmployeeId] = useState("");

  const [password, setPassword] = useState("");

  const { signIn, loading } = useAuth();

  // --- animation values (visual only, no logic impact) ---
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleLogin() {
    const success = await signIn(
      employeeId.trim(),
      password
    );

    if (success) {
      navigation.replace("Home");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandWrap}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandInitial}>V</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <ScreenHeader
            title="Vetronix"
            subtitle="Employee Login"
          />

          <View style={styles.form}>
            <AppInput
              label="Employee ID"
              placeholder="Enter Employee ID"
              value={employeeId}
              onChangeText={setEmployeeId}
            />

            <AppInput
              label="Password"
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <PrimaryButton
            title="LOGIN"
            loading={loading}
            onPress={handleLogin}
          />
        </Animated.View>

        <Text style={styles.footerText}>
          Secure access for Vetronix employees
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  brandWrap: {
    alignItems: "center",
    marginBottom: 20,
  },

  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  brandInitial: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  form: {
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },

  footerText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12.5,
    color: "#8A8F98",
    letterSpacing: 0.2,
  },
});