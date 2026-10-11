// src/screens/LoginScreen.js
//
// Login and Signup screen. Now talks to the server through AuthContext.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer"); // "customer" | "manager"

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onChangeField = (setter, field) => (text) => {
    setter(text);
    clearError(field);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("customer");
    setErrors({});
    setShowPassword(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8 || !/\d/.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters and include a digit.";
    }

    if (isSignup) {
      if (!fullName.trim()) {
        newErrors.fullName = "Full name is required.";
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const navigateForRole = (userRole) => {
    if (userRole === "manager") {
      navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "Menu" }] });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isSignup) {
        const newUser = await signup({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
        });
        navigateForRole(newUser.role);
      } else {
        const user = await login(email, password);
        if (!user) {
          Alert.alert(
            "Login failed",
            "Incorrect email or password, or the server cannot be reached."
          );
          return;
        }
        navigateForRole(user.role);
      }
    } catch (err) {
      Alert.alert(
        "Signup failed",
        err.message === "EMAIL_EXISTS"
          ? "An account with this email already exists."
          : err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Restaurant App</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, !isSignup && styles.tabButtonActive]}
            onPress={() => switchMode("login")}
          >
            <Text style={[styles.tabText, !isSignup && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, isSignup && styles.tabButtonActive]}
            onPress={() => switchMode("signup")}
          >
            <Text style={[styles.tabText, isSignup && styles.tabTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {isSignup && (
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              value={fullName}
              onChangeText={onChangeField(setFullName, "fullName")}
              placeholder="Ayesha Khan"
              autoCapitalize="words"
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={onChangeField(setEmail, "email")}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              value={password}
              onChangeText={onChangeField(setPassword, "password")}
              placeholder="At least 8 characters, 1 digit"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {isSignup && (
          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={confirmPassword}
              onChangeText={onChangeField(setConfirmPassword, "confirmPassword")}
              placeholder="Re-enter your password"
              secureTextEntry={!showPassword}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>
        )}

        {isSignup && (
          <View style={styles.field}>
            <Text style={styles.label}>I am a</Text>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabButton, role === "customer" && styles.tabButtonActive]}
                onPress={() => setRole("customer")}
              >
                <Text style={[styles.tabText, role === "customer" && styles.tabTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, role === "manager" && styles.tabButtonActive]}
                onPress={() => setRole("manager")}
              >
                <Text style={[styles.tabText, role === "manager" && styles.tabTextActive]}>
                  Manager
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{isSignup ? "Create Account" : "Log In"}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Demo accounts — customer@demo.com / Pass1234{"\n"}
          manager@demo.com / Manager123
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  tabRow: { flexDirection: "row", marginBottom: 16, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#ddd" },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: "#f4f4f4" },
  tabButtonActive: { backgroundColor: "#c0392b" },
  tabText: { fontWeight: "600", color: "#555" },
  tabTextActive: { color: "#fff" },
  field: { marginBottom: 14 },
  label: { marginBottom: 6, fontWeight: "600", color: "#333" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  inputError: { borderColor: "#c0392b" },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1 },
  toggleText: { marginLeft: 10, color: "#c0392b", fontWeight: "600" },
  errorText: { color: "#c0392b", marginTop: 4, fontSize: 13 },
  submitButton: { backgroundColor: "#c0392b", borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { marginTop: 20, textAlign: "center", color: "#888", fontSize: 12 },
});