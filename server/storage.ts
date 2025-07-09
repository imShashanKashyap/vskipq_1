import { 
  restaurants, type Restaurant, type InsertRestaurant,
  tables, type Table, type InsertTable,
  menuItems, type MenuItem, type InsertMenuItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  users, type User, type InsertUser,
  chefPerformance, type ChefPerformance, type InsertChefPerformance
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, asc, desc, inArray, and, sql, gte, or } from "drizzle-orm";
import createMemoryStore from "memorystore";
import { Pool } from "@neondatabase/serverless";
import pgSession from "connect-pg-simple";

// Storage interface
export interface IStorage {
  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  
  // Tables
  getTables(restaurantId?: number): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  getTableByNumber(tableNumber: number, restaurantId: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  
  // Menu Items
  getMenuItems(restaurantId?: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  
  // Orders
  getOrders(restaurantId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  resetOrders(): Promise<void>; // Add reset orders method
  getOrdersWithAnalytics(restaurantId?: number, startDate?: Date): Promise<Order[]>; // Add analytics
  
  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRestaurant(restaurantId: number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chef Performance
  getChefPerformance(userId: number): Promise<ChefPerformance | undefined>;
  getChefPerformanceByRestaurant(restaurantId: number): Promise<ChefPerformance[]>;
  createChefPerformance(performance: InsertChefPerformance): Promise<ChefPerformance>;
  updateChefPerformance(userId: number, data: Partial<InsertChefPerformance>): Promise<ChefPerformance | undefined>;
  updateChefStats(userId: number, orderCompletionTime: number): Promise<ChefPerformance | undefined>;
  getLeaderboard(restaurantId?: number, limit?: number): Promise<ChefPerformance[]>;
  
  // Session store
  sessionStore: session.Store;
}

// Memory Storage Implementation
// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = pgSession(session);
    
    if (!process.env.DATABASE_URL) {
      throw new Error("Cannot initialize DatabaseStorage without DATABASE_URL");
    }
    
    try {
      this.sessionStore = new PostgresSessionStore({
        pool: new Pool({ connectionString: process.env.DATABASE_URL }),
        createTableIfMissing: true
      });
      
      // Initialize database with sample data if empty
      this.initializeDataIfNeeded();
    } catch (error) {
      console.error("Error initializing DatabaseStorage:", error);
      throw new Error("Failed to initialize database connection");
    }
  }
  
  private async cleanupMenuItems() {
    try {
      console.log("Checking and cleaning up menu items...");
      
      // Get all restaurants
      const existingRestaurants = await this.getRestaurants();
      
      if (existingRestaurants.length < 4) {
        console.log("Not enough restaurants to process menu items");
        return;
      }
      
      // Find the four restaurants by name
      const italianRestaurant = existingRestaurants.find(r => r.name === "Italian Delight");
      const indianRestaurant = existingRestaurants.find(r => r.name === "Spice Garden");
      const mexicanRestaurant = existingRestaurants.find(r => r.name === "Taco Fiesta");
      const japaneseRestaurant = existingRestaurants.find(r => r.name === "Sushi Master");
      
      if (!italianRestaurant || !indianRestaurant || !mexicanRestaurant || !japaneseRestaurant) {
        console.log("Not all required restaurants found, skipping menu item cleanup");
        return;
      }
      
      // Remove duplicate menu items for each restaurant
      for (const restaurant of existingRestaurants) {
        const menuItems = await this.getMenuItems(restaurant.id);
        console.log(`Restaurant ${restaurant.id} (${restaurant.name}) has ${menuItems.length} menu items`);
        
        // Identify unique items by name
        const uniqueItems = new Map<string, MenuItem>();
        const itemsToDelete: MenuItem[] = [];
        
        for (const item of menuItems) {
          if (!uniqueItems.has(item.name)) {
            uniqueItems.set(item.name, item);
          } else {
            itemsToDelete.push(item);
          }
        }
        
        // Delete duplicate items for this restaurant
        for (const item of itemsToDelete) {
          try {
            console.log(`Deleting duplicate menu item ${item.id} (${item.name}) from restaurant ${restaurant.id}`);
            await db.execute(
              sql`DELETE FROM menu_items WHERE id = ${item.id}`
            );
          } catch (error) {
            console.error(`Failed to delete menu item ${item.id}:`, error);
          }
        }
        
        console.log(`Kept ${uniqueItems.size} unique menu items, deleted ${itemsToDelete.length} duplicates for restaurant ${restaurant.id}`);
      }
      
      // Check for and create missing menu items for Mexican restaurant
      if (mexicanRestaurant) {
        const mexicanItems = await this.getMenuItems(mexicanRestaurant.id);
        
        if (mexicanItems.length === 0) {
          console.log("Creating menu items for Mexican restaurant");
          
          const mexicanFoodItems = [
            {
              restaurantId: mexicanRestaurant.id,
              name: "Beef Tacos",
              description: "Three soft corn tortillas filled with seasoned beef, lettuce, cheese, and salsa",
              price: 1299,
              category: "Main Course",
              image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            },
            {
              restaurantId: mexicanRestaurant.id,
              name: "Chicken Quesadilla",
              description: "Grilled flour tortilla filled with chicken, cheese, and peppers",
              price: 1099,
              category: "Starters",
              image: "https://images.unsplash.com/photo-1618040996337-56904b7be24b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            },
            {
              restaurantId: mexicanRestaurant.id,
              name: "Guacamole & Chips",
              description: "Fresh avocado dip with lime, cilantro, and crispy corn tortilla chips",
              price: 899,
              category: "Appetizers",
              image: "https://images.unsplash.com/photo-1584583570840-0a3d89695484?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            },
            {
              restaurantId: mexicanRestaurant.id,
              name: "Churros",
              description: "Fried dough pastry coated in cinnamon sugar with chocolate dipping sauce",
              price: 699,
              category: "Dessert",
              image: "https://images.unsplash.com/photo-1624371388513-b5d7f3f436e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            }
          ];
          
          for (const item of mexicanFoodItems) {
            await this.createMenuItem(item);
          }
          
          console.log("Created 4 menu items for Mexican restaurant");
        }
      }
      
      // Check for and create missing menu items for Japanese restaurant
      if (japaneseRestaurant) {
        const japaneseItems = await this.getMenuItems(japaneseRestaurant.id);
        
        if (japaneseItems.length === 0) {
          console.log("Creating menu items for Japanese restaurant");
          
          const japaneseFoodItems = [
            {
              restaurantId: japaneseRestaurant.id,
              name: "Salmon Nigiri Sushi",
              description: "Fresh salmon slices over vinegared rice, served in pairs",
              price: 1499,
              category: "Sushi",
              image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            },
            {
              restaurantId: japaneseRestaurant.id,
              name: "California Roll",
              description: "Sushi roll with crab, avocado, and cucumber",
              price: 1299,
              category: "Maki",
              image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            },
            {
              restaurantId: japaneseRestaurant.id,
              name: "Miso Soup",
              description: "Traditional Japanese soup with tofu, seaweed, and green onion",
              price: 499,
              category: "Soup",
              image: "https://images.unsplash.com/photo-1631709497139-2e4363b92304?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            },
            {
              restaurantId: japaneseRestaurant.id,
              name: "Green Tea Ice Cream",
              description: "Creamy matcha-flavored ice cream",
              price: 599,
              category: "Dessert",
              image: "https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
              active: true
            }
          ];
          
          for (const item of japaneseFoodItems) {
            await this.createMenuItem(item);
          }
          
          console.log("Created 4 menu items for Japanese restaurant");
        }
      }
      
      console.log("Menu item cleanup and creation complete");
    } catch (error) {
      console.error("Error cleaning up menu items:", error);
    }
  }

  private async initializeDataIfNeeded() {
    try {
      // Always clean up any old or duplicate data first
      await this.cleanupOldRestaurants();
      
      // Also clean up and add menu items as needed
      await this.cleanupMenuItems();

      // Get all existing restaurants and users after cleanup
      const restaurants = await this.getRestaurants();
      const allUsers = await db.select().from(users);
      
      // Check if chef users exist
      const hasItalianChef = allUsers.some(u => u.username === 'italian_chef');
      const hasIndianChef = allUsers.some(u => u.username === 'indian_chef');
      const hasMexicanChef = allUsers.some(u => u.username === 'mexican_chef');
      const hasJapaneseChef = allUsers.some(u => u.username === 'japanese_chef');
      
      console.log(`Current users: ${allUsers.length}, Need chef initialization: Italian:${!hasItalianChef}, Indian:${!hasIndianChef}, Mexican:${!hasMexicanChef}, Japanese:${!hasJapaneseChef}`);
      
      // Define the required restaurant names
      const requiredRestaurants = [
        "Italian Delight",
        "Spice Garden",
        "Taco Fiesta",
        "Sushi Master"
      ];
      
      // Check if we have all required restaurants
      const missingRestaurants = requiredRestaurants.filter(
        name => !restaurants.some(r => r.name === name)
      );
      
      // Initialize if missing restaurants or chef accounts
      if (missingRestaurants.length > 0 || !hasItalianChef || !hasIndianChef || !hasMexicanChef || !hasJapaneseChef) {
        console.log("Initializing database with sample data...");
        console.log(`Missing restaurants: ${missingRestaurants.join(', ')}`);
        
        // Get or create restaurants
        let restaurant1 = restaurants.find(r => r.name === "Italian Delight");
        let restaurant2 = restaurants.find(r => r.name === "Spice Garden"); 
        let restaurant3 = restaurants.find(r => r.name === "Taco Fiesta");
        let restaurant4 = restaurants.find(r => r.name === "Sushi Master");
        
        // Create any missing restaurants
        if (!restaurant1) {
          restaurant1 = await this.createRestaurant({
            name: "Italian Delight",
            address: "123 Main Street, Cityville",
            phone: "+15551234567",
            active: true
          });
          console.log(`Created restaurant: ${restaurant1.name} with ID ${restaurant1.id}`);
        }
        
        if (!restaurant2) {
          restaurant2 = await this.createRestaurant({
            name: "Spice Garden",
            address: "456 Oak Avenue, Townsville",
            phone: "+15559876543",
            active: true
          });
          console.log(`Created restaurant: ${restaurant2.name} with ID ${restaurant2.id}`);
        }
        
        if (!restaurant3) {
          restaurant3 = await this.createRestaurant({
            name: "Taco Fiesta",
            address: "789 Pine Road, Villagetown",
            phone: "+15554567890",
            active: true
          });
          console.log(`Created restaurant: ${restaurant3.name} with ID ${restaurant3.id}`);
        }
        
        if (!restaurant4) {
          restaurant4 = await this.createRestaurant({
            name: "Sushi Master",
            address: "321 Cherry Lane, Downtown",
            phone: "+15552345678",
            active: true
          });
          console.log(`Created restaurant: ${restaurant4.name} with ID ${restaurant4.id}`);
        }
        
        // Create sample tables for each restaurant
        const allRestaurants = [restaurant1, restaurant2, restaurant3, restaurant4];
        
        // Create 10 tables for each restaurant
        for (const restaurant of allRestaurants) {
          console.log(`Creating tables for restaurant ${restaurant.name} (ID: ${restaurant.id})`);
          for (let i = 1; i <= 10; i++) {
            // Check if table already exists
            const existingTable = await this.getTableByNumber(i, restaurant.id);
            if (!existingTable) {
              await this.createTable({ 
                restaurantId: restaurant.id, 
                tableNumber: i, 
                active: true 
              });
            }
          }
        }
        
        // Create sample menu items for Italian restaurant
        const italianMenuItems: InsertMenuItem[] = [
          {
            restaurantId: restaurant1.id,
            name: "Classic Margherita Pizza",
            description: "Fresh mozzarella, tomato sauce, and basil on thin crust",
            price: 1299, // $12.99
            category: "Pizza",
            image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant1.id,
            name: "Truffle Mushroom Pasta",
            description: "Fettuccine with wild mushrooms in a creamy truffle sauce",
            price: 1699, // $16.99
            category: "Pasta",
            image: "https://images.unsplash.com/photo-1555072956-7758afb20e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant1.id,
            name: "Tiramisu",
            description: "Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream",
            price: 899, // $8.99
            category: "Dessert",
            image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant1.id,
            name: "Caprese Salad",
            description: "Fresh tomatoes, mozzarella, and basil drizzled with balsamic glaze",
            price: 1099, // $10.99
            category: "Salad",
            image: "https://images.unsplash.com/photo-1572552635104-daf938e3c61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          }
        ];
        
        // Create sample menu items for Indian restaurant
        const indianMenuItems: InsertMenuItem[] = [
          {
            restaurantId: restaurant2.id,
            name: "Chicken Tikka Masala",
            description: "Grilled chicken in a creamy tomato sauce with aromatic spices",
            price: 1599, // $15.99
            category: "Main Course",
            image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant2.id,
            name: "Vegetable Biryani",
            description: "Fragrant basmati rice cooked with mixed vegetables and spices",
            price: 1399, // $13.99
            category: "Rice",
            image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant2.id,
            name: "Garlic Naan",
            description: "Soft flatbread topped with garlic and butter",
            price: 399, // $3.99
            category: "Bread",
            image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant2.id,
            name: "Gulab Jamun",
            description: "Sweet milk solids balls soaked in rose and cardamom syrup",
            price: 599, // $5.99
            category: "Dessert",
            image: "https://images.unsplash.com/photo-1602080858428-57174f9431cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          }
        ];
        
        // Use restaurant IDs from our created/found restaurant objects
        console.log("Creating menu items for all restaurants");
        
        // Create sample menu items for Mexican restaurant
        const mexicanMenuItems: InsertMenuItem[] = [
          {
            restaurantId: restaurant3.id,
            name: "Beef Tacos",
            description: "Three soft corn tortillas with seasoned beef, onions, cilantro, and lime",
            price: 1199, // $11.99
            category: "Tacos",
            image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant3.id,
            name: "Chicken Quesadilla",
            description: "Grilled flour tortilla filled with seasoned chicken, melted cheese, and peppers",
            price: 1299, // $12.99
            category: "Quesadillas",
            image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant3.id,
            name: "Guacamole & Chips",
            description: "Fresh avocado mashed with tomatoes, onions, lime, and cilantro, served with tortilla chips",
            price: 899, // $8.99
            category: "Appetizers",
            image: "https://images.unsplash.com/photo-1600566136442-3b0a5a2909c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant3.id,
            name: "Churros with Chocolate",
            description: "Crispy fried pastry dusted with cinnamon sugar and served with warm chocolate dip",
            price: 699, // $6.99
            category: "Dessert",
            image: "https://images.unsplash.com/photo-1624371414361-e670edf4998c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          }
        ];
        
        // Create sample menu items for Japanese restaurant
        const japaneseMenuItems: InsertMenuItem[] = [
          {
            restaurantId: restaurant4.id,
            name: "Salmon Nigiri (2 pcs)",
            description: "Fresh salmon slices on seasoned rice",
            price: 799, // $7.99
            category: "Sushi",
            image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant4.id,
            name: "Chicken Teriyaki Bowl",
            description: "Grilled chicken glazed with teriyaki sauce served over steamed rice with vegetables",
            price: 1499, // $14.99
            category: "Rice Bowls",
            image: "https://images.unsplash.com/photo-1617817786038-e41f372b6b4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant4.id,
            name: "Vegetable Tempura",
            description: "Assorted vegetables fried in a light, crispy batter",
            price: 999, // $9.99
            category: "Appetizers",
            image: "https://images.unsplash.com/photo-1615557960916-c616f8851f8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          },
          {
            restaurantId: restaurant4.id,
            name: "Mochi Ice Cream (3 pcs)",
            description: "Traditional Japanese rice cake filled with ice cream in assorted flavors",
            price: 699, // $6.99
            category: "Dessert",
            image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
            active: true
          }
        ];
        
        // Add all menu items
        for (const item of italianMenuItems) {
          await this.createMenuItem(item);
        }
        
        for (const item of indianMenuItems) {
          await this.createMenuItem(item);
        }
        
        for (const item of mexicanMenuItems) {
          await this.createMenuItem(item);
        }
        
        for (const item of japaneseMenuItems) {
          await this.createMenuItem(item);
        }
        
        // Create chef users for each restaurant if they don't exist
        if (!hasItalianChef) {
          await this.createUser({
            username: "italian_chef",
            password: "pizza123", 
            role: "chef",
            restaurantId: restaurant1.id
          });
        }
        
        if (!hasIndianChef) {
          await this.createUser({
            username: "indian_chef",
            password: "curry123", 
            role: "chef",
            restaurantId: restaurant2.id
          });
        }
        
        if (!hasMexicanChef) {
          await this.createUser({
            username: "mexican_chef",
            password: "taco123", 
            role: "chef",
            restaurantId: restaurant3.id
          });
        }
        
        if (!hasJapaneseChef) {
          await this.createUser({
            username: "japanese_chef",
            password: "sushi123", 
            role: "chef",
            restaurantId: restaurant4.id
          });
        }
        
        // Create admin user who can manage all restaurants
        const hasAdmin = allUsers.some(u => u.username === 'admin');
        if (!hasAdmin) {
          await this.createUser({
            username: "admin",
            password: "admin123", // In real app this would be hashed
            role: "admin",
            restaurantId: null
          });
        }
        
        console.log("Sample data initialization complete.");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
  
  // Restaurant CRUD
  // Helper method to cleanup duplicate restaurants
  async cleanupOldRestaurants(): Promise<void> {
    try {
      // Get all current restaurants
      const existingRestaurants = await this.getRestaurants();
      
      // Delete Default Restaurant and duplicates
      console.log("Cleaning up old or duplicate restaurants...");
      
      // Keep track of unique restaurant names to identify duplicates
      const uniqueNames = new Set<string>();
      const restaurantsToKeep: Restaurant[] = [];
      const restaurantsToDelete: Restaurant[] = [];
      
      // First, identify which restaurants to keep and which to delete
      for (const restaurant of existingRestaurants) {
        // Default restaurant should always be deleted
        if (restaurant.name === "Default Restaurant") {
          restaurantsToDelete.push(restaurant);
          continue;
        }
        
        // For other restaurants, keep the first occurrence and mark others as duplicates
        if (!uniqueNames.has(restaurant.name)) {
          uniqueNames.add(restaurant.name);
          restaurantsToKeep.push(restaurant);
        } else {
          restaurantsToDelete.push(restaurant);
        }
      }
      
      // Before deleting, check for users referencing these restaurants and update them
      for (const restaurant of restaurantsToDelete) {
        // Find any users referencing this restaurant
        const usersWithRestaurant = await db.select().from(users).where(eq(users.restaurantId, restaurant.id));
        
        if (usersWithRestaurant.length > 0) {
          console.log(`Found ${usersWithRestaurant.length} users referencing restaurant ID ${restaurant.id} "${restaurant.name}"`);
          
          // Update users to reference a restaurant that we're keeping
          const keepRestaurantId = restaurantsToKeep.length > 0 ? restaurantsToKeep[0].id : null;
          
          if (keepRestaurantId) {
            console.log(`Updating users to reference restaurant ID ${keepRestaurantId} instead`);
            await db.update(users)
              .set({ restaurantId: keepRestaurantId })
              .where(eq(users.restaurantId, restaurant.id));
          } else {
            console.log(`Setting restaurantId to null for users with restaurant ID ${restaurant.id}`);
            await db.update(users)
              .set({ restaurantId: null })
              .where(eq(users.restaurantId, restaurant.id));
          }
        }
      }
      
      // Now delete the restaurants marked for deletion
      for (const restaurant of restaurantsToDelete) {
        console.log(`Deleting restaurant "${restaurant.name}" with ID ${restaurant.id}`);
        
        // Delete associated data first
        const restaurantTables = await this.getTables(restaurant.id);
        for (const table of restaurantTables) {
          // Delete any orders for this table
          const tableOrders = await db.select().from(orders).where(eq(orders.tableId, table.id));
          for (const order of tableOrders) {
            // Delete order items first
            await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
          }
          // Now delete the orders
          await db.delete(orders).where(eq(orders.tableId, table.id));
        }
        
        // Delete menu items
        await db.delete(menuItems).where(eq(menuItems.restaurantId, restaurant.id));
        
        // Delete tables
        await db.delete(tables).where(eq(tables.restaurantId, restaurant.id));
        
        // Finally delete the restaurant
        await db.delete(restaurants).where(eq(restaurants.id, restaurant.id));
      }
      
      console.log(`Kept ${restaurantsToKeep.length} unique restaurants, deleted ${restaurantsToDelete.length} duplicates`);
      console.log("Cleanup complete");
    } catch (error) {
      console.error("Error cleaning up restaurants:", error);
    }
  }
  
  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants);
  }
  
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const results = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return results[0];
  }
  
  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const results = await db.insert(restaurants).values(insertRestaurant).returning();
    return results[0];
  }
  
  // Tables CRUD
  async getTables(restaurantId?: number): Promise<Table[]> {
    if (restaurantId) {
      return await db.select().from(tables).where(eq(tables.restaurantId, restaurantId));
    }
    return await db.select().from(tables);
  }
  
  async getTable(id: number): Promise<Table | undefined> {
    const results = await db.select().from(tables).where(eq(tables.id, id));
    return results[0];
  }
  
  async getTableByNumber(tableNumber: number, restaurantId: number): Promise<Table | undefined> {
    const results = await db.select().from(tables)
      .where(and(
        eq(tables.tableNumber, tableNumber),
        eq(tables.restaurantId, restaurantId)
      ));
    return results[0];
  }
  
  async createTable(insertTable: InsertTable): Promise<Table> {
    const results = await db.insert(tables).values(insertTable).returning();
    return results[0];
  }
  
  // Menu Items CRUD
  async getMenuItems(restaurantId?: number): Promise<MenuItem[]> {
    if (restaurantId) {
      return await db.select().from(menuItems)
        .where(and(
          eq(menuItems.restaurantId, restaurantId),
          eq(menuItems.active, true)
        ));
    }
    return await db.select().from(menuItems).where(eq(menuItems.active, true));
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const results = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return results[0];
  }
  
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const results = await db.insert(menuItems).values(insertMenuItem).returning();
    return results[0];
  }
  
  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const results = await db.update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning();
    return results[0];
  }
  
  // Orders CRUD
  async getOrders(restaurantId?: number): Promise<Order[]> {
    try {
      if (restaurantId) {
        // Get tables for this restaurant
        const restaurantTables = await this.getTables(restaurantId);
        const tableIds = restaurantTables.map(table => table.id);
        
        if (tableIds.length === 0) {
          console.log(`No tables found for restaurant ${restaurantId}`);
          return [];
        }
        
        console.log(`Getting orders for restaurant ${restaurantId}, table IDs: ${tableIds.join(', ')}`);
        
        // First, try to get orders directly by restaurant ID
        const directResult = await db.select({
          id: orders.id,
          tableId: orders.tableId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          timestamp: orders.timestamp,
          totalAmount: orders.totalAmount,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantOrderNumber: orders.restaurantOrderNumber
        })
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId))
        .orderBy(desc(orders.timestamp));
        
        // Also get orders via tables for backward compatibility
        const tableResult = await db.select({
          id: orders.id,
          tableId: orders.tableId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          timestamp: orders.timestamp,
          totalAmount: orders.totalAmount,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantOrderNumber: orders.restaurantOrderNumber
        })
        .from(orders)
        .where(inArray(orders.tableId, tableIds))
        .orderBy(desc(orders.timestamp));
        
        // Combine results, removing duplicates
        const result = [...directResult];
        for (const order of tableResult) {
          if (!result.some(o => o.id === order.id)) {
            result.push(order);
          }
        }
        
        console.log(`Found ${result.length} orders for restaurant ${restaurantId}`);
        return result;
      }
      
      // Select specific columns to avoid issues with schema changes
      return await db.select({
        id: orders.id,
        tableId: orders.tableId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        notes: orders.notes,
        timestamp: orders.timestamp,
        totalAmount: orders.totalAmount,
        userId: orders.userId,
        restaurantId: orders.restaurantId,
        restaurantOrderNumber: orders.restaurantOrderNumber
      })
      .from(orders)
      .orderBy(desc(orders.timestamp));
    } catch (error) {
      console.error("Error in getOrders:", error);
      // Return empty array in case of error to avoid breaking application
      return [];
    }
  }
  
  /**
   * Get orders with additional filtering for analytics purposes
   * 
   * @param restaurantId - Optional restaurant ID to filter orders
   * @param startDate - Optional start date to filter orders (for time-based analytics)
   * @returns Promise<Order[]> - List of filtered orders
   */
  async getOrdersWithAnalytics(restaurantId?: number, startDate?: Date): Promise<Order[]> {
    try {
      // If restaurant ID is provided, get orders for that restaurant
      if (restaurantId) {
        const tableIds = await db
          .select({ id: tables.id })
          .from(tables)
          .where(eq(tables.restaurantId, restaurantId))
          .then(results => results.map(r => r.id));
        
        // Get orders directly associated with the restaurant
        let directQuery = db.select({
          id: orders.id,
          tableId: orders.tableId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          timestamp: orders.timestamp,
          totalAmount: orders.totalAmount,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantOrderNumber: orders.restaurantOrderNumber
        })
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId));
        
        // Apply date filter if provided
        if (startDate) {
          const dateFilter = sql`${orders.timestamp} >= ${startDate}`;
          directQuery = db.select({
            id: orders.id,
            tableId: orders.tableId,
            customerName: orders.customerName,
            customerPhone: orders.customerPhone,
            status: orders.status,
            paymentMethod: orders.paymentMethod,
            notes: orders.notes,
            timestamp: orders.timestamp,
            totalAmount: orders.totalAmount,
            userId: orders.userId,
            restaurantId: orders.restaurantId,
            restaurantOrderNumber: orders.restaurantOrderNumber
          })
          .from(orders)
          .where(sql`${orders.restaurantId} = ${restaurantId} AND ${dateFilter}`);
        }
        
        const directResult = await directQuery.orderBy(desc(orders.timestamp));
        
        // Also get orders via tables for backward compatibility
        let tableQuery = db.select({
          id: orders.id,
          tableId: orders.tableId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          timestamp: orders.timestamp,
          totalAmount: orders.totalAmount,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantOrderNumber: orders.restaurantOrderNumber
        })
        .from(orders)
        .where(inArray(orders.tableId, tableIds));
        
        // Apply date filter if provided
        if (startDate) {
          const dateFilter = sql`${orders.timestamp} >= ${startDate}`;
          tableQuery = db.select({
            id: orders.id,
            tableId: orders.tableId,
            customerName: orders.customerName,
            customerPhone: orders.customerPhone,
            status: orders.status,
            paymentMethod: orders.paymentMethod,
            notes: orders.notes,
            timestamp: orders.timestamp,
            totalAmount: orders.totalAmount,
            userId: orders.userId,
            restaurantId: orders.restaurantId,
            restaurantOrderNumber: orders.restaurantOrderNumber
          })
          .from(orders)
          .where(sql`${orders.tableId} IN (${sql.join(tableIds, sql`, `)}) AND ${dateFilter}`);
        }
        
        const tableResult = await tableQuery.orderBy(desc(orders.timestamp));
        
        // Combine results, removing duplicates
        const result = [...directResult];
        for (const order of tableResult) {
          if (!result.some(o => o.id === order.id)) {
            result.push(order);
          }
        }
        
        console.log(`Found ${result.length} orders for analytics (restaurant ${restaurantId}, date filter: ${startDate?.toISOString() || 'none'})`);
        return result;
      }
      
      // If no restaurant ID is provided, get all orders with date filter
      let query = db.select({
        id: orders.id,
        tableId: orders.tableId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        notes: orders.notes,
        timestamp: orders.timestamp,
        totalAmount: orders.totalAmount,
        userId: orders.userId,
        restaurantId: orders.restaurantId,
        restaurantOrderNumber: orders.restaurantOrderNumber
      })
      .from(orders);
      
      // Apply date filter if provided
      if (startDate) {
        const dateFilter = sql`${orders.timestamp} >= ${startDate}`;
        query = db.select({
          id: orders.id,
          tableId: orders.tableId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          timestamp: orders.timestamp, 
          totalAmount: orders.totalAmount,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantOrderNumber: orders.restaurantOrderNumber
        })
        .from(orders)
        .where(dateFilter);
      }
      
      return await query.orderBy(desc(orders.timestamp));
    } catch (error) {
      console.error("Error in getOrdersWithAnalytics:", error);
      return [];
    }
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      // Select specific columns to avoid issues with schema changes
      const results = await db.select({
        id: orders.id,
        tableId: orders.tableId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        notes: orders.notes,
        timestamp: orders.timestamp,
        totalAmount: orders.totalAmount,
        userId: orders.userId,
        restaurantId: orders.restaurantId,
        restaurantOrderNumber: orders.restaurantOrderNumber
      })
      .from(orders)
      .where(eq(orders.id, id));
      
      return results[0];
    } catch (error) {
      console.error("Error in getOrder:", error);
      return undefined;
    }
  }
  
  async getNextRestaurantOrderNumber(restaurantId: number | null): Promise<number> {
    if (!restaurantId) return 1; // Default to start with 1 if no restaurant ID
    
    try {
      // Find the highest restaurant-specific order number
      const result = await db.select({
        maxOrderNumber: sql`COALESCE(MAX(${orders.restaurantOrderNumber}), 0)`
      })
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId));
      
      // If no orders exist yet or maxOrderNumber is null, start with 1
      const maxOrderNumber = Number(result[0]?.maxOrderNumber || 0);
      return maxOrderNumber + 1;
    } catch (error) {
      console.error("Error getting next restaurant order number:", error);
      return 1; // Default to 1 in case of error
    }
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    try {
      const now = new Date();
      
      // Ensure we have a valid restaurant ID - with enhanced validation
      if (!insertOrder.restaurantId) {
        // Check if we can get restaurant ID from table ID
        if (insertOrder.tableId) {
          try {
            const table = await this.getTable(insertOrder.tableId);
            if (table && table.restaurantId) {
              insertOrder.restaurantId = table.restaurantId;
              console.log(`Retrieved restaurant ID ${table.restaurantId} from table ${insertOrder.tableId}`);
            }
          } catch (tableError) {
            console.error("Error getting restaurant ID from table:", tableError);
          }
        }
        
        // Still no restaurant ID? This is a hard requirement
        if (!insertOrder.restaurantId) {
          throw new Error("Restaurant ID is required to create an order");
        }
      }
      
      // Validate restaurant exists before proceeding
      if (insertOrder.restaurantId) {
        const restaurant = await this.getRestaurant(insertOrder.restaurantId);
        if (!restaurant) {
          throw new Error(`Restaurant with ID ${insertOrder.restaurantId} does not exist`);
        }
      }
      
      // Calculate restaurant-specific order number - with retry logic
      let restaurantOrderNumber = 0;
      let retries = 0;
      
      while (restaurantOrderNumber === 0 && retries < 3) {
        try {
          restaurantOrderNumber = await this.getNextRestaurantOrderNumber(insertOrder.restaurantId);
          retries++;
        } catch (error) {
          console.error(`Error getting restaurant order number (attempt ${retries}/3):`, error);
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 200));
          
          if (retries >= 3) {
            // Default to a timestamp-based number if all retries fail
            restaurantOrderNumber = Math.floor(Date.now() / 1000) % 1000000;
            console.log(`Using fallback order number: ${restaurantOrderNumber}`);
          }
        }
      }
      
      // Log the restaurant order number calculation
      console.log(`Generated restaurant order number: ${restaurantOrderNumber} for restaurant ID: ${insertOrder.restaurantId}`);
      
      // Make sure we have all required fields and default values
      let orderData = { 
        tableId: insertOrder.tableId,
        customerName: insertOrder.customerName || "Guest User",
        customerPhone: insertOrder.customerPhone || "+11234567890",
        status: "pending",
        totalAmount: insertOrder.totalAmount || 0,
        paymentMethod: insertOrder.paymentMethod || "cash",
        notes: insertOrder.notes || null,
        timestamp: now,
        userId: null, // Start with null for reliability
        restaurantId: insertOrder.restaurantId,
        restaurantOrderNumber: restaurantOrderNumber
      };
      
      // Only try to use userId if explicitly provided and after null assignment above
      if (insertOrder.userId !== undefined && insertOrder.userId !== null) {
        try {
          const user = await this.getUser(insertOrder.userId);
          if (user) {
            // Type-safe assignment
            orderData = { ...orderData, userId: insertOrder.userId };
          } else {
            console.log(`User with ID ${insertOrder.userId} not found, keeping userId as null`);
          }
        } catch (err) {
          console.log(`Error verifying user ID ${insertOrder.userId}, keeping userId as null:`, err);
        }
      }
      
      console.log(`Creating order with data: ${JSON.stringify({
        tableId: orderData.tableId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        restaurantId: orderData.restaurantId,
        restaurantOrderNumber: orderData.restaurantOrderNumber,
        paymentMethod: orderData.paymentMethod
      })}`);
      
      // Use a retry mechanism for the database insertion itself
      let insertAttempts = 0;
      const MAX_INSERT_ATTEMPTS = 3;
      
      while (insertAttempts < MAX_INSERT_ATTEMPTS) {
        try {
          insertAttempts++;
          console.log(`Database insertion attempt ${insertAttempts}/${MAX_INSERT_ATTEMPTS}`);
          
          const results = await db.insert(orders).values(orderData).returning({
            id: orders.id,
            tableId: orders.tableId,
            customerName: orders.customerName,
            customerPhone: orders.customerPhone,
            status: orders.status,
            totalAmount: orders.totalAmount,
            paymentMethod: orders.paymentMethod,
            notes: orders.notes,
            timestamp: orders.timestamp,
            userId: orders.userId,
            restaurantId: orders.restaurantId,
            restaurantOrderNumber: orders.restaurantOrderNumber
          });
          
          if (!results || results.length === 0) {
            throw new Error("Database returned empty results after insertion");
          }
          
          console.log(`Successfully created order ${results[0].id} with restaurant order #${results[0].restaurantOrderNumber}`);
          return results[0];
        } catch (insertError: any) {
          console.error(`Error inserting order into database (attempt ${insertAttempts}/${MAX_INSERT_ATTEMPTS}):`, insertError);
          
          if (insertAttempts >= MAX_INSERT_ATTEMPTS) {
            throw insertError;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, insertAttempts * 300));
        }
      }
      
      // This code should not be reached due to the throw in the loop, but TypeScript doesn't know that
      throw new Error("Failed to insert order after maximum retry attempts");
    } catch (err: any) {
      console.error("Error in createOrder:", err);
      throw err;
    }
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    try {
      const results = await db.update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning({
          id: orders.id,
          tableId: orders.tableId,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          timestamp: orders.timestamp,
          totalAmount: orders.totalAmount,
          userId: orders.userId,
          restaurantId: orders.restaurantId,
          restaurantOrderNumber: orders.restaurantOrderNumber
        });
      
      return results[0];
    } catch (err: any) {
      console.error("Error in updateOrderStatus:", err);
      return undefined;
    }
  }
  
  // Order Items CRUD
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const results = await db.insert(orderItems).values(insertOrderItem).returning();
    return results[0];
  }
  
  /**
   * Resets all orders and order items in the database
   * Resetting ensures that each restaurant's order numbering starts from 1
   * 
   * Two counters are maintained:
   * 1. Overall order ID (auto-increment primary key)
   * 2. Restaurant-specific order number (restaurantOrderNumber) - resets to 1
   * 
   * @returns Promise<void>
   */
  async resetOrders(): Promise<void> {
    try {
      console.log("Resetting all orders...");
      
      // First delete all order items (due to foreign key constraints)
      const deletedOrderItems = await db.delete(orderItems).returning();
      console.log(`Deleted ${deletedOrderItems.length} order items`);
      
      // Then delete all orders
      const deletedOrders = await db.delete(orders).returning({ id: orders.id });
      console.log(`Deleted ${deletedOrders.length} orders`);
      
      // Reset sequence value for the orders table if necessary
      try {
        // Note: This is PostgreSQL specific syntax
        await db.execute(sql`ALTER SEQUENCE orders_id_seq RESTART WITH 1`);
        console.log("Reset order ID sequence to start from 1");
      } catch (seqError) {
        console.warn("Could not reset sequence, but orders were still deleted:", seqError);
      }
      
      console.log("All orders have been reset successfully");
    } catch (error) {
      console.error("Error resetting orders:", error);
      throw error;
    }
  }
  
  // Users CRUD
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async getUsersByRestaurant(restaurantId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.restaurantId, restaurantId));
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }
  
  // Chef Performance methods
  async getChefPerformance(userId: number): Promise<ChefPerformance | undefined> {
    const [performance] = await db
      .select()
      .from(chefPerformance)
      .where(eq(chefPerformance.userId, userId));
      
    return performance;
  }
  
  async getChefPerformanceByRestaurant(restaurantId: number): Promise<ChefPerformance[]> {
    return await db
      .select()
      .from(chefPerformance)
      .where(eq(chefPerformance.restaurantId, restaurantId));
  }
  
  async createChefPerformance(performance: InsertChefPerformance): Promise<ChefPerformance> {
    const [result] = await db
      .insert(chefPerformance)
      .values(performance)
      .returning();
      
    return result;
  }
  
  async updateChefPerformance(userId: number, data: Partial<InsertChefPerformance>): Promise<ChefPerformance | undefined> {
    const [updated] = await db
      .update(chefPerformance)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(chefPerformance.userId, userId))
      .returning();
      
    return updated;
  }
  
  async updateChefStats(userId: number, orderCompletionTime: number): Promise<ChefPerformance | undefined> {
    // Get current performance data
    let chef = await this.getChefPerformance(userId);
    
    if (!chef) {
      // Get chef information to find restaurant ID
      const user = await this.getUser(userId);
      if (!user || !user.restaurantId) {
        console.error(`Cannot update chef stats: User ${userId} not found or has no restaurant ID`);
        return undefined;
      }
      
      // Create new performance record if it doesn't exist
      chef = await this.createChefPerformance({
        userId,
        restaurantId: user.restaurantId,
        ordersCompleted: 0,
        averageOrderTime: 0,
        dailyStreak: 1,
        points: 0,
        level: 1,
        achievements: []
      });
    }
    
    // Calculate new average completion time
    const totalTime = chef.averageOrderTime * chef.ordersCompleted + orderCompletionTime;
    const newOrderCount = chef.ordersCompleted + 1;
    const newAverageTime = Math.round(totalTime / newOrderCount);
    
    // Check if this is a new fastest time
    const newFastestTime = chef.fastestOrderTime 
      ? Math.min(chef.fastestOrderTime, orderCompletionTime)
      : orderCompletionTime;
    
    // Check if streak should be incremented (based on if chef worked today already)
    const today = new Date();
    const lastSession = chef.lastSessionDate ? new Date(chef.lastSessionDate) : new Date(0);
    
    // Streak logic: increment if first order of the day, reset if more than a day gap
    let newStreak = chef.dailyStreak;
    if (lastSession.toDateString() !== today.toDateString()) {
      // Check if last session was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastSession.toDateString() === yesterday.toDateString()) {
        // Continuous streak
        newStreak += 1;
      } else if (today.getTime() - lastSession.getTime() > 86400000) {
        // Reset streak if more than a day has passed
        newStreak = 1;
      }
    }
    
    // Calculate points earned for this order
    // Base points: 10 per order
    // Speed bonus: Up to 20 points for fast completion
    // Streak bonus: 5 points per day of streak up to 25
    const basePoints = 10;
    const speedBonus = Math.max(0, 20 - Math.floor(orderCompletionTime / 30)); // Faster = more points
    const streakBonus = Math.min(25, newStreak * 5);
    const pointsEarned = basePoints + speedBonus + streakBonus;
    
    // Check for level up (100 points per level)
    const newTotalPoints = chef.points + pointsEarned;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    
    // Check for achievements
    const achievements = [...(chef.achievements || [])];
    
    // First order achievement
    if (newOrderCount === 1 && !achievements.includes('first_order')) {
      achievements.push('first_order');
    }
    
    // 10 orders achievement
    if (newOrderCount === 10 && !achievements.includes('ten_orders')) {
      achievements.push('ten_orders');
    }
    
    // 50 orders achievement
    if (newOrderCount === 50 && !achievements.includes('fifty_orders')) {
      achievements.push('fifty_orders');
    }
    
    // 3-day streak achievement
    if (newStreak === 3 && !achievements.includes('three_day_streak')) {
      achievements.push('three_day_streak');
    }
    
    // 7-day streak achievement
    if (newStreak === 7 && !achievements.includes('seven_day_streak')) {
      achievements.push('seven_day_streak');
    }
    
    // Speed demon achievement (complete order in under 2 minutes)
    if (orderCompletionTime < 120 && !achievements.includes('speed_demon')) {
      achievements.push('speed_demon');
    }
    
    // Update the chef performance record
    return await this.updateChefPerformance(userId, {
      ordersCompleted: newOrderCount,
      averageOrderTime: newAverageTime,
      fastestOrderTime: newFastestTime,
      lastSessionDate: new Date(),
      dailyStreak: newStreak,
      points: newTotalPoints,
      level: newLevel,
      achievements
    });
  }
  
  async getLeaderboard(restaurantId?: number, limit: number = 10): Promise<ChefPerformance[]> {
    let query = db
      .select()
      .from(chefPerformance)
      .orderBy(desc(chefPerformance.points))
      .limit(limit);
      
    if (restaurantId) {
      query = query.where(eq(chefPerformance.restaurantId, restaurantId));
    }
    
    return await query;
  }
}

export class MemStorage implements IStorage {
  private restaurants: Map<number, Restaurant>;
  private tables: Map<number, Table>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private users: Map<number, User>;
  sessionStore: session.Store;
  
  private restaurantId: number;
  private tableId: number;
  private menuItemId: number;
  private orderId: number;
  private orderItemId: number;
  private userId: number;
  
  constructor() {
    this.restaurants = new Map();
    this.tables = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.users = new Map();
    
    // Initialize session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    this.restaurantId = 1;
    this.tableId = 1;
    this.menuItemId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.userId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  // Restaurant CRUD
  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }
  
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }
  
  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.restaurantId++;
    const restaurant: Restaurant = {
      ...insertRestaurant,
      id,
      active: insertRestaurant.active ?? true
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }
  
  async getUsersByRestaurant(restaurantId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.restaurantId === restaurantId
    );
  }
  
  // Since we're in a synchronous initialization method, we'll use direct creation instead of async methods
  private initializeData() {
    // Create sample restaurants directly
    const restaurant1Id = this.restaurantId++;
    const restaurant2Id = this.restaurantId++;
    
    const restaurant1: Restaurant = {
      id: restaurant1Id,
      name: "Italian Delight",
      address: "123 Main Street, Cityville",
      phone: "+15551234567",
      active: true
    };
    
    const restaurant2: Restaurant = {
      id: restaurant2Id,
      name: "Spice Garden",
      address: "456 Oak Avenue, Townsville",
      phone: "+15559876543",
      active: true
    };
    
    // Add to storage directly
    this.restaurants.set(restaurant1Id, restaurant1);
    this.restaurants.set(restaurant2Id, restaurant2);
    
    // Create sample tables for each restaurant directly
    for (let i = 1; i <= 10; i++) {
      const tableId = this.tableId++;
      const table: Table = {
        id: tableId,
        restaurantId: restaurant1Id,
        tableNumber: i,
        active: true
      };
      this.tables.set(tableId, table);
    }
    
    for (let i = 1; i <= 10; i++) {
      const tableId = this.tableId++;
      const table: Table = {
        id: tableId,
        restaurantId: restaurant2Id,
        tableNumber: i,
        active: true
      };
      this.tables.set(tableId, table);
    }
    
    // Create sample menu items for Italian restaurant
    const italianMenuItems: InsertMenuItem[] = [
      {
        restaurantId: restaurant1.id,
        name: "Classic Margherita Pizza",
        description: "Fresh mozzarella, tomato sauce, and basil on thin crust",
        price: 1299, // $12.99
        category: "Pizza",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      },
      {
        restaurantId: restaurant1.id,
        name: "Truffle Mushroom Pasta",
        description: "Fettuccine with wild mushrooms in a creamy truffle sauce",
        price: 1699, // $16.99
        category: "Pasta",
        image: "https://images.unsplash.com/photo-1555072956-7758afb20e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      },
      {
        restaurantId: restaurant1.id,
        name: "Tiramisu",
        description: "Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream",
        price: 899, // $8.99
        category: "Dessert",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      },
      {
        restaurantId: restaurant1.id,
        name: "Caprese Salad",
        description: "Fresh tomatoes, mozzarella, and basil drizzled with balsamic glaze",
        price: 1099, // $10.99
        category: "Salad",
        image: "https://images.unsplash.com/photo-1572552635104-daf938e3c61e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      }
    ];
    
    // Create sample menu items for Indian restaurant
    const indianMenuItems: InsertMenuItem[] = [
      {
        restaurantId: restaurant2.id,
        name: "Chicken Tikka Masala",
        description: "Grilled chicken in a creamy tomato sauce with aromatic spices",
        price: 1599, // $15.99
        category: "Main Course",
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      },
      {
        restaurantId: restaurant2.id,
        name: "Vegetable Biryani",
        description: "Fragrant basmati rice cooked with mixed vegetables and spices",
        price: 1399, // $13.99
        category: "Rice",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      },
      {
        restaurantId: restaurant2.id,
        name: "Garlic Naan",
        description: "Soft flatbread topped with garlic and butter",
        price: 399, // $3.99
        category: "Bread",
        image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      },
      {
        restaurantId: restaurant2.id,
        name: "Gulab Jamun",
        description: "Sweet milk solids balls soaked in rose and cardamom syrup",
        price: 599, // $5.99
        category: "Dessert",
        image: "https://images.unsplash.com/photo-1602080858428-57174f9431cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        active: true
      }
    ];
    
    // Add all menu items directly
    for (const item of italianMenuItems) {
      const id = this.menuItemId++;
      const menuItem: MenuItem = { 
        ...item, 
        id,
        active: item.active ?? true 
      };
      this.menuItems.set(id, menuItem);
    }
    
    for (const item of indianMenuItems) {
      const id = this.menuItemId++;
      const menuItem: MenuItem = { 
        ...item, 
        id,
        active: item.active ?? true 
      };
      this.menuItems.set(id, menuItem);
    }
    
    // Create chef users for each restaurant directly
    const italianChefId = this.userId++;
    const italianChef: User = {
      id: italianChefId,
      username: "italian_chef",
      password: "pizza123", // In real app this would be hashed
      role: "chef",
      restaurantId: restaurant1Id
    };
    this.users.set(italianChefId, italianChef);
    
    const indianChefId = this.userId++;
    const indianChef: User = {
      id: indianChefId,
      username: "indian_chef",
      password: "curry123", // In real app this would be hashed
      role: "chef",
      restaurantId: restaurant2Id
    };
    this.users.set(indianChefId, indianChef);
    
    // Create admin user who can manage all restaurants
    const adminId = this.userId++;
    const admin: User = {
      id: adminId,
      username: "admin",
      password: "admin123", // In real app this would be hashed
      role: "admin",
      restaurantId: null
    };
    this.users.set(adminId, admin);
  }
  
  // Tables CRUD
  async getTables(restaurantId?: number): Promise<Table[]> {
    if (restaurantId) {
      return Array.from(this.tables.values()).filter(
        table => table.restaurantId === restaurantId
      );
    }
    return Array.from(this.tables.values());
  }
  
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }
  
  async getTableByNumber(tableNumber: number, restaurantId: number): Promise<Table | undefined> {
    return Array.from(this.tables.values()).find(
      (table) => table.tableNumber === tableNumber && table.restaurantId === restaurantId
    );
  }
  
  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = this.tableId++;
    const table: Table = { 
      ...insertTable, 
      id,
      active: insertTable.active ?? true
    };
    this.tables.set(id, table);
    return table;
  }
  
  // Menu Items CRUD
  async getMenuItems(restaurantId?: number): Promise<MenuItem[]> {
    if (restaurantId) {
      return Array.from(this.menuItems.values())
        .filter(item => item.restaurantId === restaurantId && item.active);
    }
    return Array.from(this.menuItems.values())
      .filter(item => item.active);
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }
  
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemId++;
    const menuItem: MenuItem = { 
      ...insertMenuItem, 
      id,
      active: insertMenuItem.active ?? true 
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }
  
  async updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const menuItem = this.menuItems.get(id);
    if (menuItem) {
      const updatedMenuItem = { ...menuItem, ...data };
      this.menuItems.set(id, updatedMenuItem);
      return updatedMenuItem;
    }
    return undefined;
  }
  
  // Orders CRUD
  async getOrders(restaurantId?: number): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    const sortedOrders = orders.sort((a, b) => {
      // Sort by timestamp descending (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    if (restaurantId) {
      // Filter orders by restaurant ID by looking up tables
      const restaurantTables = Array.from(this.tables.values())
        .filter(table => table.restaurantId === restaurantId)
        .map(table => table.id);
      
      return sortedOrders.filter(order => 
        // Include orders that directly reference this restaurant or via tables
        order.restaurantId === restaurantId || 
        restaurantTables.includes(order.tableId)
      );
    }
    
    return sortedOrders;
  }
  
  async getNextRestaurantOrderNumber(restaurantId: number | null): Promise<number> {
    if (!restaurantId) return 1; // Default to start with 1 if no restaurant ID
    
    // Get all orders for this restaurant
    const restaurantOrders = await this.getOrders(restaurantId);
    
    // Find the highest restaurant-specific order number
    let maxOrderNumber = 0;
    for (const order of restaurantOrders) {
      if (order.restaurantOrderNumber && order.restaurantOrderNumber > maxOrderNumber) {
        maxOrderNumber = order.restaurantOrderNumber;
      }
    }
    
    return maxOrderNumber + 1;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    
    // Determine restaurant ID either from direct field or by looking up table
    let restaurantId = insertOrder.restaurantId || null;
    if (!restaurantId && insertOrder.tableId) {
      const table = await this.getTable(insertOrder.tableId);
      if (table) {
        restaurantId = table.restaurantId;
      }
    }
    
    // Validate we have a restaurant ID - this is required
    if (!restaurantId) {
      throw new Error("Restaurant ID is required to create an order");
    }
    
    // Calculate restaurant-specific order number
    const restaurantOrderNumber = await this.getNextRestaurantOrderNumber(restaurantId);
    
    // Each restaurant has its own numbering sequence starting from 1
    const order: Order = { 
      id, // Global unique ID across all restaurants
      tableId: insertOrder.tableId,
      customerName: insertOrder.customerName,
      customerPhone: insertOrder.customerPhone,
      status: "pending",
      totalAmount: insertOrder.totalAmount || 0,
      paymentMethod: insertOrder.paymentMethod || "cash",
      notes: insertOrder.notes || null,
      timestamp: now,
      userId: insertOrder.userId || null,
      restaurantId: restaurantId as number, // Required - links order to specific restaurant (explicit cast)
      restaurantOrderNumber: restaurantOrderNumber // Restaurant-specific ID (e.g. #1 for restaurant A, #1 for restaurant B)
    };
    
    // Store in the global orders map
    this.orders.set(id, order);
    
    // Log the order creation with restaurant information
    console.log(
      `Order ${id} created with restaurant-specific order #${restaurantOrderNumber} for restaurant ${restaurantId}`
    );
    
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      // Make sure the order has all required properties
      if (!order.restaurantId && order.tableId) {
        const table = await this.getTable(order.tableId);
        if (table) {
          order.restaurantId = table.restaurantId;
        }
      }
      
      // If the order doesn't have a restaurant-specific order number, assign one
      if (!order.restaurantOrderNumber && order.restaurantId) {
        order.restaurantOrderNumber = await this.getNextRestaurantOrderNumber(order.restaurantId);
      }
      
      const updatedOrder = { ...order, status };
      this.orders.set(id, updatedOrder);
      return updatedOrder;
    }
    return undefined;
  }
  
  // Order Items CRUD
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }
  
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
  
  async resetOrders(): Promise<void> {
    try {
      console.log("Resetting all orders in memory storage...");
      // Clear order items
      this.orderItems.clear();
      // Clear orders
      this.orders.clear();
      // Reset the IDs
      this.orderId = 1;
      this.orderItemId = 1;
      console.log("All orders have been reset successfully");
    } catch (error) {
      console.error("Error resetting orders:", error);
      throw error;
    }
  }
  
  /**
   * Get orders with additional filtering for analytics purposes
   * 
   * @param restaurantId - Optional restaurant ID to filter orders
   * @param startDate - Optional start date to filter orders (for time-based analytics)
   * @returns Promise<Order[]> - List of filtered orders
   */
  async getOrdersWithAnalytics(restaurantId?: number, startDate?: Date): Promise<Order[]> {
    try {
      // Get all orders
      let ordersArray = Array.from(this.orders.values());
      
      // Filter by restaurant ID if provided
      if (restaurantId) {
        ordersArray = ordersArray.filter(order => {
          // Check direct restaurant ID first
          if (order.restaurantId === restaurantId) {
            return true;
          }
          
          // Check table association
          const table = this.tables.get(order.tableId);
          return table && table.restaurantId === restaurantId;
        });
      }
      
      // Filter by date if provided
      if (startDate) {
        ordersArray = ordersArray.filter(order => {
          const orderDate = order.timestamp instanceof Date 
            ? order.timestamp 
            : new Date(order.timestamp);
          return orderDate >= startDate;
        });
      }
      
      // Sort by timestamp (newest first)
      return ordersArray.sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error("Error in getOrdersWithAnalytics:", error);
      return [];
    }
  }
  
  // Users CRUD
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Ensure restaurantId is never undefined
    const restaurantId = insertUser.restaurantId === undefined ? null : insertUser.restaurantId;
    
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role ?? "chef",
      restaurantId: restaurantId
    };
    this.users.set(id, user);
    return user;
  }
  
  // Chef Performance methods - in-memory implementation
  private chefPerformance = new Map<number, ChefPerformance>();
  private performanceId = 1;
  
  async getChefPerformance(userId: number): Promise<ChefPerformance | undefined> {
    // Find performance by userId
    return Array.from(this.chefPerformance.values()).find(p => p.userId === userId);
  }
  
  async getChefPerformanceByRestaurant(restaurantId: number): Promise<ChefPerformance[]> {
    // Find all performance records for a restaurant
    return Array.from(this.chefPerformance.values()).filter(p => p.restaurantId === restaurantId);
  }
  
  async createChefPerformance(performance: InsertChefPerformance): Promise<ChefPerformance> {
    const id = this.performanceId++;
    const newPerformance: ChefPerformance = {
      id,
      ...performance,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chefPerformance.set(id, newPerformance);
    return newPerformance;
  }
  
  async updateChefPerformance(userId: number, data: Partial<InsertChefPerformance>): Promise<ChefPerformance | undefined> {
    // Find the performance by userId
    const performance = await this.getChefPerformance(userId);
    if (!performance) return undefined;
    
    // Update the performance
    const updated: ChefPerformance = {
      ...performance,
      ...data,
      updatedAt: new Date()
    };
    
    this.chefPerformance.set(performance.id, updated);
    return updated;
  }
  
  async updateChefStats(userId: number, orderCompletionTime: number): Promise<ChefPerformance | undefined> {
    // Get current performance data
    let chef = await this.getChefPerformance(userId);
    
    if (!chef) {
      // Get chef information to find restaurant ID
      const user = await this.getUser(userId);
      if (!user || !user.restaurantId) {
        console.error(`Cannot update chef stats: User ${userId} not found or has no restaurant ID`);
        return undefined;
      }
      
      // Create new performance record if it doesn't exist
      chef = await this.createChefPerformance({
        userId,
        restaurantId: user.restaurantId,
        ordersCompleted: 0,
        averageOrderTime: 0,
        dailyStreak: 1,
        points: 0,
        level: 1,
        achievements: []
      });
    }
    
    // Calculate new average completion time
    const totalTime = chef.averageOrderTime * chef.ordersCompleted + orderCompletionTime;
    const newOrderCount = chef.ordersCompleted + 1;
    const newAverageTime = Math.round(totalTime / newOrderCount);
    
    // Check if this is a new fastest time
    const newFastestTime = chef.fastestOrderTime 
      ? Math.min(chef.fastestOrderTime, orderCompletionTime)
      : orderCompletionTime;
    
    // Check if streak should be incremented (based on if chef worked today already)
    const today = new Date();
    const lastSession = chef.lastSessionDate ? new Date(chef.lastSessionDate) : new Date(0);
    
    // Streak logic: increment if first order of the day, reset if more than a day gap
    let newStreak = chef.dailyStreak;
    if (lastSession.toDateString() !== today.toDateString()) {
      // Check if last session was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastSession.toDateString() === yesterday.toDateString()) {
        // Continuous streak
        newStreak += 1;
      } else if (today.getTime() - lastSession.getTime() > 86400000) {
        // Reset streak if more than a day has passed
        newStreak = 1;
      }
    }
    
    // Calculate points earned for this order
    // Base points: 10 per order
    // Speed bonus: Up to 20 points for fast completion
    // Streak bonus: 5 points per day of streak up to 25
    const basePoints = 10;
    const speedBonus = Math.max(0, 20 - Math.floor(orderCompletionTime / 30)); // Faster = more points
    const streakBonus = Math.min(25, newStreak * 5);
    const pointsEarned = basePoints + speedBonus + streakBonus;
    
    // Check for level up (100 points per level)
    const newTotalPoints = chef.points + pointsEarned;
    const newLevel = Math.floor(newTotalPoints / 100) + 1;
    
    // Check for achievements
    const achievements = [...(chef.achievements || [])];
    
    // First order achievement
    if (newOrderCount === 1 && !achievements.includes('first_order')) {
      achievements.push('first_order');
    }
    
    // 10 orders achievement
    if (newOrderCount === 10 && !achievements.includes('ten_orders')) {
      achievements.push('ten_orders');
    }
    
    // 50 orders achievement
    if (newOrderCount === 50 && !achievements.includes('fifty_orders')) {
      achievements.push('fifty_orders');
    }
    
    // 3-day streak achievement
    if (newStreak === 3 && !achievements.includes('three_day_streak')) {
      achievements.push('three_day_streak');
    }
    
    // 7-day streak achievement
    if (newStreak === 7 && !achievements.includes('seven_day_streak')) {
      achievements.push('seven_day_streak');
    }
    
    // Speed demon achievement (complete order in under 2 minutes)
    if (orderCompletionTime < 120 && !achievements.includes('speed_demon')) {
      achievements.push('speed_demon');
    }
    
    // Update the chef performance record
    return await this.updateChefPerformance(userId, {
      ordersCompleted: newOrderCount,
      averageOrderTime: newAverageTime,
      fastestOrderTime: newFastestTime,
      lastSessionDate: new Date(),
      dailyStreak: newStreak,
      points: newTotalPoints,
      level: newLevel,
      achievements
    });
  }
  
  async getLeaderboard(restaurantId?: number, limit: number = 10): Promise<ChefPerformance[]> {
    // Get all performances and sort by points (descending)
    let performances = Array.from(this.chefPerformance.values());
    
    // Filter by restaurant if specified
    if (restaurantId) {
      performances = performances.filter(p => p.restaurantId === restaurantId);
    }
    
    // Sort by points and limit
    return performances
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }
}

// Use database storage in production
// Determine which storage implementation to use based on database availability
// This ensures the application works in both environments with and without a database
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
