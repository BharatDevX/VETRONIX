import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Colors from "../../../theme/color";
import { RootStackParamList } from "../../../navigation/AppNavigator";

import { getSession } from "../../auth/services/session.service";
import { getEmployee } from "../../auth/services/employee.service";
import { useAuthStore } from "../../auth/store/auth.store";

type NavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

export default function SplashScreen() {
  const navigation = useNavigation<NavProp>();

  const setEmployee = useAuthStore(
    (state) => state.setEmployee
  );

  // --- animation values (visual only, no logic impact) ---
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(8)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoOpacity, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Ambient pulsing ring behind the logo, loops forever
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.6,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.35,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    initialize();
  }, []);

  async function initialize() {
    try {
      const session = await getSession();

      if (!session) {
        navigation.replace("Login");
        return;
      }

      const employee = await getEmployee(session.user.id);

      setEmployee(employee);

      navigation.replace("Home");
    } catch (error) {
      navigation.replace("Login");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />

        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            alignItems: "center",
          }}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoInitial}>V</Text>
          </View>

          <Text style={styles.logo}>Vetronix</Text>
        </Animated.View>
      </View>

      <Animated.Text
        style={[
          styles.text,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        Employee App
      </Animated.Text>

      <Animated.View style={{ opacity: loaderOpacity, marginTop: 28 }}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  logoWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },

  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  logoInitial: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },

  logo: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  text: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    marginTop: 6,
    letterSpacing: 0.3,
  },
});