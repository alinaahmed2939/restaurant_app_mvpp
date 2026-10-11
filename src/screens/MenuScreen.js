// src/screens/MenuScreen.js

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { categories, fetchMenuItems } from "../data/menu";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SEARCH_DEBOUNCE_MS = 400;
const SCROLL_TOP_THRESHOLD = 300;

export default function MenuScreen() {
  const { currentUser, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const debounceTimer = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const scrollOffsetRef = useRef(0);

  const loadMenu = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchMenuItems();
      setMenuItems(data);
    } catch (e) {
      setError("Could not load the menu. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMenu(false);
  }, [loadMenu]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  const handleRetry = () => loadMenu(false);
  const handlePullToRefresh = () => loadMenu(true);

  const handleAddToCart = (item) => {
    Alert.alert("Added", `${item.name} added to cart.`);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const handleScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = y;
    const shouldShow = y > SCROLL_TOP_THRESHOLD;
    setShowScrollTop((prev) => (prev === shouldShow ? prev : shouldShow));
  };

  const handleScrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  const visibleItems = menuItems
    .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
    .filter(
      (item) =>
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery)
    );

  const renderCategoryChip = (id, label) => {
    const active = selectedCategory === id;
    return (
      <TouchableOpacity
        key={id}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setSelectedCategory(id)}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.isAvailable && styles.cardUnavailable]}>
      <View style={styles.imageBox}>
        <Text style={styles.imageEmoji}>{item.image}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.isSpecial && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>Daily Special</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooterRow}>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          <TouchableOpacity
            style={[styles.addButton, !item.isAvailable && styles.addButtonDisabled]}
            disabled={!item.isAvailable}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addButtonText}>
              {item.isAvailable ? "Add to Cart" : "Unavailable"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.greeting}>Hi, {currentUser?.fullName?.split(" ")[0] || "there"} 👋</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>{isDark ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.header}>Our Menu</Text>

      <View style={styles.searchRow}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor={colors.subtext}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
        data={[{ id: "all", name: "All" }, ...categories]}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => renderCategoryChip(item.id, item.name)}
      />

      <FlatList
        ref={listRef}
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.centerScreen}>
            <Text style={styles.emptyText}>
              {searchQuery ? `No dishes match "${searchInput}".` : "No items in this category yet."}
            </Text>
          </View>
        }
      />

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopButton} onPress={handleScrollToTop}>
          <Text style={styles.scrollTopText}>↑ Top</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    centerScreen: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    loadingText: { marginTop: 10, color: colors.subtext },
    errorEmoji: { fontSize: 36, marginBottom: 8 },
    errorText: { textAlign: "center", color: colors.subtext, marginBottom: 16 },
    retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
    retryButtonText: { color: "#fff", fontWeight: "700" },
    emptyText: { color: colors.subtext, marginTop: 40, textAlign: "center", paddingHorizontal: 24 },

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    greeting: { fontSize: 14, fontWeight: "600", color: colors.text },
    topBarActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconButton: { paddingVertical: 4, paddingHorizontal: 6 },
    iconButtonText: { fontSize: 16 },
    logoutText: { color: colors.primary, fontWeight: "700", fontSize: 13 },

    header: { fontSize: 24, fontWeight: "700", padding: 16, paddingBottom: 8, color: colors.text },

    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      elevation: 1,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
    clearButton: { paddingHorizontal: 6, paddingVertical: 4 },
    clearButtonText: { color: colors.subtext, fontSize: 14, fontWeight: "700" },

    chipRow: { flexGrow: 0, marginBottom: 4 },
    chipRowContent: { paddingHorizontal: 16, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, marginRight: 8 },
    chipActive: { backgroundColor: colors.primary },
    chipText: { color: colors.subtext, fontWeight: "600" },
    chipTextActive: { color: "#fff" },
    listContent: { padding: 16, paddingTop: 8 },
    card: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 12, marginBottom: 12, padding: 10, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3 },
    cardUnavailable: { opacity: 0.5 },
    imageBox: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", marginRight: 12 },
    imageEmoji: { fontSize: 30 },
    cardBody: { flex: 1 },
    cardTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    itemName: { fontSize: 16, fontWeight: "700", marginRight: 8, color: colors.text },
    specialBadge: { backgroundColor: "#f1c40f", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    specialBadgeText: { fontSize: 10, fontWeight: "700", color: "#5a4600" },
    itemDescription: { color: colors.subtext, fontSize: 13, marginTop: 2, marginBottom: 8 },
    cardFooterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    itemPrice: { fontSize: 16, fontWeight: "700", color: colors.primary },
    addButton: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addButtonDisabled: { backgroundColor: "#bbb" },
    addButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },

    scrollTopButton: {
      position: "absolute",
      right: 16,
      bottom: 20,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    scrollTopText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  });
}