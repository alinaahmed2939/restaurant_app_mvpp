# Restaurant App MVP

React Native + Expo | CS375 Mobile Application Development | Fall 2026

A frontend-only restaurant application built for MAD Assignment 1. It supports two roles — Customer and Restaurant Manager — using entirely mock/local data. There is no backend, database, or payment integration; everything runs on-device.

## About

Customers can browse a categorized menu, search and filter items, manage a cart with promo codes, reserve a table, place an order, and track its status in real time. Managers can view and update orders, accept or decline reservations, and manage menu items, with changes reflected instantly for customers.

## Customer Features

- Signup and login with role-based routing
- Categorized menu with Daily Special badges and availability status
- Debounced search, category filters, and sorting by price or name
- Cart management with quantities, special instructions, and promo codes
- Order summary showing subtotal, tax, service charge, and total
- Table reservation with live time-slot and seat availability checks
- Real-time order status tracking
- Light/dark theme toggle and profile screen

## Manager Features

- Manager-only dashboard
- View and update the status of incoming orders
- Accept or decline table reservations
- Add, edit, and toggle availability of menu items, reflected live
