// src/api/client.js
// The ONLY place that knows the server address.

import AsyncStorage from "@react-native-async-storage/async-storage";

// Change this to YOUR laptop's IPv4 address (from ipconfig). Keep :5000
export const BASE_URL = "http://192.168.56.1:5000";

// Sends a request to the server and returns the JSON answer.
// Adds the JSON header and the token (if the user is logged in).
// Throws an Error with the server's message if something goes wrong.
export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = await AsyncStorage.getItem("token");

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error("Cannot reach the server. Check your Wi-Fi and the server IP.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    // some responses have no body
  }

  if (!response.ok) {
    throw new Error((data && data.message) || `Request failed (${response.status})`);
  }
  return data;
}