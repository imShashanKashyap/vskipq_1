import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  // Setup express session
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'restaurant-ordering-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: storage.sessionStore
  };
  
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Use simple local strategy with direct password comparison
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt - Username: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`Login failed - User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Simply compare the password directly since we're using plain-text for demo purposes
        const isPasswordValid = user.password === password;
        console.log(`Login attempt - Username: ${username}, Password: ${password}, User password: ${user.password}, Match: ${isPasswordValid}`);
        console.log(`User role: ${user.role}, Restaurant ID: ${user.restaurantId}`);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if the user is a chef
        if (user.role === 'chef') {
          console.log(`Chef ${username} logging in for restaurant ${user.restaurantId}`);
        }
        
        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialize user error:", error);
      done(error);
    }
  });
  
  // Authentication routes
  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    // Authentication successful
    if (req.user) {
      console.log(`User ${req.user.username} (${req.user.id}) logged in successfully`);
      res.json(req.user);
    } else {
      // This should not happen due to passport middleware, but just in case
      res.status(401).json({ message: 'Authentication failed' });
    }
  });
  
  app.post('/api/logout', (req, res) => {
    if (req.isAuthenticated()) {
      const username = (req.user as Express.User).username;
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: 'Error during logout' });
        }
        console.log(`User ${username} logged out`);
        res.json({ message: 'Logged out successfully' });
      });
    } else {
      res.json({ message: 'No user to log out' });
    }
  });
  
  app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
}