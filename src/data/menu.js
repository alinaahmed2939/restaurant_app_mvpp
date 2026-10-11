// src/data/menu.js

export const categories = [
  { id: "starters", name: "Starters" },
  { id: "mains", name: "Mains" },
  { id: "desserts", name: "Desserts" },
  { id: "drinks", name: "Drinks" },
];

export const menuItems = [
  { id: "m1", name: "Chicken Samosas", description: "Crispy pastry filled with spiced chicken mince.", price: 5.5, category: "starters", image: "🥟", isSpecial: true, isAvailable: true },
  { id: "m2", name: "Loaded Nachos", description: "Tortilla chips with cheese, jalapenos, and salsa.", price: 6.0, category: "starters", image: "🌮", isSpecial: false, isAvailable: true },
  { id: "m3", name: "Garlic Bread", description: "Toasted baguette with garlic butter and herbs.", price: 4.0, category: "starters", image: "🍞", isSpecial: false, isAvailable: true },
  { id: "m4", name: "Soup of the Day", description: "Chef's daily selection, served with croutons.", price: 4.5, category: "starters", image: "🍲", isSpecial: false, isAvailable: false },
  { id: "m5", name: "Grilled Chicken Steak", description: "Char-grilled chicken breast with peri-peri glaze.", price: 12.5, category: "mains", image: "🍗", isSpecial: true, isAvailable: true },
  { id: "m6", name: "Beef Burger", description: "Smash patty, cheddar, lettuce, house sauce.", price: 10.0, category: "mains", image: "🍔", isSpecial: false, isAvailable: true },
  { id: "m7", name: "Margherita Pizza", description: "Classic tomato, mozzarella, and fresh basil.", price: 11.0, category: "mains", image: "🍕", isSpecial: false, isAvailable: true },
  { id: "m8", name: "Chicken Alfredo Pasta", description: "Creamy alfredo sauce with grilled chicken strips.", price: 11.5, category: "mains", image: "🍝", isSpecial: false, isAvailable: true },
  { id: "m9", name: "Vegetable Biryani", description: "Fragrant basmati rice with mixed vegetables and spices.", price: 9.5, category: "mains", image: "🍛", isSpecial: false, isAvailable: false },
  { id: "m10", name: "Fish and Chips", description: "Beer-battered fish fillet with crispy fries.", price: 12.0, category: "mains", image: "🐟", isSpecial: false, isAvailable: true },
  { id: "m11", name: "Chocolate Lava Cake", description: "Warm chocolate cake with a molten center.", price: 6.5, category: "desserts", image: "🍫", isSpecial: true, isAvailable: true },
  { id: "m12", name: "New York Cheesecake", description: "Classic baked cheesecake with berry compote.", price: 6.0, category: "desserts", image: "🍰", isSpecial: false, isAvailable: true },
  { id: "m13", name: "Ice Cream Sundae", description: "Three scoops with chocolate sauce and nuts.", price: 5.0, category: "desserts", image: "🍨", isSpecial: false, isAvailable: true },
  { id: "m14", name: "Fresh Lemonade", description: "Chilled, made fresh with mint leaves.", price: 3.0, category: "drinks", image: "🍋", isSpecial: false, isAvailable: true },
  { id: "m15", name: "Iced Coffee", description: "Cold brew coffee over ice with milk.", price: 3.5, category: "drinks", image: "🧊", isSpecial: false, isAvailable: true },
  { id: "m16", name: "Mango Smoothie", description: "Blended mango, yogurt, and a hint of honey.", price: 4.0, category: "drinks", image: "🥭", isSpecial: true, isAvailable: true },
];

export function fetchMenuItems() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(menuItems);
    }, 1500);
  });
}