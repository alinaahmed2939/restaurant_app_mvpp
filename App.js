// App.js

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import MenuScreen from "./src/screens/MenuScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";

const Stack = createNativeStackNavigator();

function PlaceholderScreen({ route }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{route.name} screen — coming in a later question</Text>
    </View>
  );
}

function RootNavigator() {
  const { currentUser, isRestoring } = useAuth();

  // Wait until the saved login has been loaded from AsyncStorage
  if (isRestoring) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c0392b" />
      </View>
    );
  }

  const initialRoute = !currentUser
    ? "Login"
    : currentUser.role === "manager"
    ? "Dashboard"
    : "Menu";

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Dashboard" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  text: { fontSize: 16, textAlign: "center", color: "#555" },
});