import { existsSync, unlinkSync } from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../src/lib/db/schema/index";
import { user } from "../src/lib/db/schema/auth";
import { shoppingList, shoppingItem } from "../src/modules/shopping/schema";
import { chore, choreCompletion } from "../src/modules/chores/schema";
import { bulletinPost, bulletinAck } from "../src/modules/bulletin/schema";
import { wishlistItem } from "../src/modules/wishlist/schema";

const DB_PATH = process.env.DATABASE_PATH ?? "./data/data.db";

const id = () => crypto.randomUUID();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  // --- Wipe old DB files ---
  for (const ext of ["", "-shm", "-wal"]) {
    const p = DB_PATH + ext;
    if (existsSync(p)) {
      unlinkSync(p);
      console.log(`Deleted ${p}`);
    }
  }

  // --- Open fresh DB and run migrations ---
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.\n");

  // ========== USERS ==========
  const tariqId = id();
  const sarahId = id();
  const marcusId = id();
  const priyaId = id();
  const jakeId = id();

  await db.insert(user).values([
    { id: tariqId, name: "Tariq",  email: "tariq@haven.local",  emailVerified: false, role: "admin", pinHash: null },
    { id: sarahId, name: "Sarah",  email: "sarah@haven.local",  emailVerified: false, role: "user",  pinHash: null },
    { id: marcusId, name: "Marcus", email: "marcus@haven.local", emailVerified: false, role: "user",  pinHash: null },
    { id: priyaId, name: "Priya",  email: "priya@haven.local",  emailVerified: false, role: "user",  pinHash: null },
    { id: jakeId,  name: "Jake",   email: "jake@haven.local",   emailVerified: false, role: "user",  pinHash: null },
  ]);
  console.log("Users seeded.");

  // ========== SHOPPING LISTS & ITEMS ==========

  // List 1: Weekly Groceries (shared, Tariq)
  const groceriesId = id();
  await db.insert(shoppingList).values({ id: groceriesId, name: "Weekly Groceries", createdBy: tariqId, ownerId: tariqId, visibility: "shared" });
  await db.insert(shoppingItem).values([
    { id: id(), listId: groceriesId, name: "Milk",            quantity: "2 gallons",  checked: false, addedBy: tariqId  },
    { id: id(), listId: groceriesId, name: "Eggs",            quantity: "1 dozen",    checked: true,  addedBy: tariqId  },
    { id: id(), listId: groceriesId, name: "Bread",           quantity: "1 loaf",     checked: true,  addedBy: sarahId  },
    { id: id(), listId: groceriesId, name: "Chicken breasts", quantity: "2 lbs",      checked: false, addedBy: tariqId  },
    { id: id(), listId: groceriesId, name: "Baby spinach",    quantity: null,         checked: false, addedBy: priyaId  },
    { id: id(), listId: groceriesId, name: "Shredded cheese", quantity: "2 bags",     checked: false, addedBy: marcusId },
    { id: id(), listId: groceriesId, name: "Orange juice",    quantity: "64oz",       checked: true,  addedBy: sarahId  },
    { id: id(), listId: groceriesId, name: "Greek yogurt",    quantity: "4 pack",     checked: false, addedBy: priyaId  },
    { id: id(), listId: groceriesId, name: "Pasta",           quantity: "2 boxes",    checked: false, addedBy: jakeId   },
    { id: id(), listId: groceriesId, name: "Tomato sauce",    quantity: "2 jars",     checked: true,  addedBy: jakeId   },
  ]);

  // List 2: Hardware Store (shared, Marcus)
  const hardwareId = id();
  await db.insert(shoppingList).values({ id: hardwareId, name: "Hardware Store", createdBy: marcusId, ownerId: marcusId, visibility: "shared" });
  await db.insert(shoppingItem).values([
    { id: id(), listId: hardwareId, name: "LED light bulbs", quantity: "4-pack",       checked: false, addedBy: marcusId },
    { id: id(), listId: hardwareId, name: "WD-40",           quantity: null,           checked: true,  addedBy: marcusId },
    { id: id(), listId: hardwareId, name: "Duct tape",       quantity: null,           checked: false, addedBy: tariqId  },
    { id: id(), listId: hardwareId, name: "Paint brushes",   quantity: "assorted set", checked: false, addedBy: marcusId },
    { id: id(), listId: hardwareId, name: "AA batteries",    quantity: "16 pack",      checked: false, addedBy: jakeId   },
  ]);

  // List 3: Party Supplies (shared, Sarah)
  const partyId = id();
  await db.insert(shoppingList).values({ id: partyId, name: "Party Supplies", createdBy: sarahId, ownerId: sarahId, visibility: "shared" });
  await db.insert(shoppingItem).values([
    { id: id(), listId: partyId, name: "Paper plates",         quantity: "50 ct",   checked: true,  addedBy: sarahId  },
    { id: id(), listId: partyId, name: "Solo cups",            quantity: "30 ct",   checked: true,  addedBy: sarahId  },
    { id: id(), listId: partyId, name: "Napkins",              quantity: null,      checked: false, addedBy: sarahId  },
    { id: id(), listId: partyId, name: "Balloons",             quantity: "20 pack", checked: false, addedBy: priyaId  },
    { id: id(), listId: partyId, name: "Chips & dip",          quantity: null,      checked: false, addedBy: marcusId },
    { id: id(), listId: partyId, name: "Ice",                  quantity: "2 bags",  checked: false, addedBy: tariqId  },
    { id: id(), listId: partyId, name: "Paper towels",         quantity: "2 rolls", checked: true,  addedBy: sarahId  },
  ]);

  // List 4: Pharmacy Run (private, Priya)
  const pharmacyId = id();
  await db.insert(shoppingList).values({ id: pharmacyId, name: "Pharmacy Run", createdBy: priyaId, ownerId: priyaId, visibility: "private" });
  await db.insert(shoppingItem).values([
    { id: id(), listId: pharmacyId, name: "Vitamin D3",     quantity: "90 ct", checked: false, addedBy: priyaId },
    { id: id(), listId: pharmacyId, name: "Advil",          quantity: null,    checked: false, addedBy: priyaId },
    { id: id(), listId: pharmacyId, name: "SPF 50 sunscreen", quantity: null,  checked: true,  addedBy: priyaId },
  ]);

  // List 5: Errands (private, Jake)
  const errandsId = id();
  await db.insert(shoppingList).values({ id: errandsId, name: "Errands", createdBy: jakeId, ownerId: jakeId, visibility: "private" });
  await db.insert(shoppingItem).values([
    { id: id(), listId: errandsId, name: "Dog food (large breed)", quantity: "30lb bag", checked: false, addedBy: jakeId },
    { id: id(), listId: errandsId, name: "Dental chews",           quantity: null,       checked: true,  addedBy: jakeId },
    { id: id(), listId: errandsId, name: "Dog shampoo",            quantity: null,       checked: false, addedBy: jakeId },
  ]);

  // List 6: Pantry Restock (shared, Tariq — mostly checked off)
  const pantryId = id();
  await db.insert(shoppingList).values({ id: pantryId, name: "Pantry Restock", createdBy: tariqId, ownerId: tariqId, visibility: "shared" });
  await db.insert(shoppingItem).values([
    { id: id(), listId: pantryId, name: "Rice",         quantity: "5lb bag", checked: true,  addedBy: tariqId  },
    { id: id(), listId: pantryId, name: "Olive oil",    quantity: null,      checked: true,  addedBy: tariqId  },
    { id: id(), listId: pantryId, name: "Soy sauce",    quantity: null,      checked: true,  addedBy: marcusId },
    { id: id(), listId: pantryId, name: "Salt & pepper",quantity: null,      checked: false, addedBy: sarahId  },
    { id: id(), listId: pantryId, name: "Coffee beans", quantity: "1lb",     checked: false, addedBy: tariqId  },
  ]);

  console.log("Shopping lists & items seeded.");

  // ========== CHORES ==========

  const dishesId   = id();
  const trashId    = id();
  const vacuumId   = id();
  const bathroomId = id();
  const lawnId     = id();
  const kitchenId  = id();
  const plantsId   = id();
  const laundryId  = id();
  const fridgeId   = id();
  const hvacId     = id();
  const faucetId   = id();

  await db.insert(chore).values([
    {
      id: dishesId,
      title: "Do the dishes",
      description: "Wash and dry all dishes in the sink.",
      assignedToUserId: sarahId,
      recurrence: "daily",
      dueDate: new Date(),
      points: 5,
      createdBy: tariqId,
    },
    {
      id: trashId,
      title: "Take out trash",
      description: "Bring all bins to the curb by 7am Thursday.",
      assignedToUserId: marcusId,
      recurrence: "weekly",
      dueDate: daysAgo(1),
      points: 5,
      createdBy: tariqId,
    },
    {
      id: vacuumId,
      title: "Vacuum living room",
      description: null,
      assignedToUserId: jakeId,
      recurrence: "weekly",
      dueDate: daysFromNow(3),
      points: 10,
      createdBy: tariqId,
    },
    {
      id: bathroomId,
      title: "Clean bathroom",
      description: "Scrub toilet, sink, and wipe down mirror.",
      assignedToUserId: priyaId,
      recurrence: "weekly",
      dueDate: daysFromNow(5),
      points: 15,
      createdBy: tariqId,
    },
    {
      id: lawnId,
      title: "Mow the lawn",
      description: null,
      assignedToUserId: null,
      recurrence: "monthly",
      dueDate: daysFromNow(10),
      points: 20,
      createdBy: tariqId,
    },
    {
      id: kitchenId,
      title: "Wipe down kitchen counters",
      description: "Clean stovetop, counters, and microwave.",
      assignedToUserId: tariqId,
      recurrence: "daily",
      dueDate: new Date(),
      points: 3,
      createdBy: tariqId,
    },
    {
      id: plantsId,
      title: "Water the plants",
      description: null,
      assignedToUserId: null,
      recurrence: "weekly",
      dueDate: daysFromNow(1),
      points: 3,
      createdBy: sarahId,
    },
    {
      id: laundryId,
      title: "Do laundry",
      description: "Wash, dry, and fold shared bathroom towels.",
      assignedToUserId: priyaId,
      recurrence: "weekly",
      dueDate: daysFromNow(2),
      points: 10,
      createdBy: sarahId,
    },
    {
      id: fridgeId,
      title: "Clean out the fridge",
      description: "Throw out expired food, wipe shelves.",
      assignedToUserId: marcusId,
      recurrence: "monthly",
      dueDate: daysFromNow(20),
      points: 15,
      createdBy: tariqId,
    },
    {
      id: hvacId,
      title: "Replace HVAC filter",
      description: "16x25x1 MERV-8 filter, box in utility closet.",
      assignedToUserId: null,
      recurrence: "monthly",
      dueDate: daysFromNow(14),
      points: 10,
      createdBy: tariqId,
    },
    {
      id: faucetId,
      title: "Fix leaking kitchen faucet",
      description: "Handle is dripping — replace washer or call plumber.",
      assignedToUserId: null,
      recurrence: "none",
      dueDate: null,
      points: 25,
      createdBy: tariqId,
    },
  ]);

  // ========== CHORE COMPLETIONS ==========

  await db.insert(choreCompletion).values([
    // dishes: completed daily by multiple people
    { id: id(), choreId: dishesId, userId: sarahId,  completedAt: daysAgo(1) },
    { id: id(), choreId: dishesId, userId: sarahId,  completedAt: daysAgo(2) },
    { id: id(), choreId: dishesId, userId: jakeId,   completedAt: daysAgo(3) },
    { id: id(), choreId: dishesId, userId: sarahId,  completedAt: daysAgo(4) },
    { id: id(), choreId: dishesId, userId: marcusId, completedAt: daysAgo(5) },
    { id: id(), choreId: dishesId, userId: sarahId,  completedAt: daysAgo(6) },

    // trash: Marcus weekly, Tariq before that
    { id: id(), choreId: trashId, userId: marcusId, completedAt: daysAgo(7)  },
    { id: id(), choreId: trashId, userId: marcusId, completedAt: daysAgo(14) },
    { id: id(), choreId: trashId, userId: tariqId,  completedAt: daysAgo(21) },

    // vacuum: Jake
    { id: id(), choreId: vacuumId, userId: jakeId, completedAt: daysAgo(7)  },
    { id: id(), choreId: vacuumId, userId: jakeId, completedAt: daysAgo(14) },

    // bathroom: Priya
    { id: id(), choreId: bathroomId, userId: priyaId, completedAt: daysAgo(9)  },
    { id: id(), choreId: bathroomId, userId: priyaId, completedAt: daysAgo(16) },

    // kitchen counters: Tariq and Sarah
    { id: id(), choreId: kitchenId, userId: tariqId, completedAt: daysAgo(1) },
    { id: id(), choreId: kitchenId, userId: tariqId, completedAt: daysAgo(2) },
    { id: id(), choreId: kitchenId, userId: sarahId, completedAt: daysAgo(3) },

    // laundry: Priya and Sarah
    { id: id(), choreId: laundryId, userId: priyaId, completedAt: daysAgo(7)  },
    { id: id(), choreId: laundryId, userId: sarahId, completedAt: daysAgo(14) },

    // plants: Priya
    { id: id(), choreId: plantsId, userId: priyaId, completedAt: daysAgo(5) },

    // lawn: Marcus last month
    { id: id(), choreId: lawnId, userId: marcusId, completedAt: daysAgo(25) },
  ]);

  console.log("Chores seeded.");

  // ========== BULLETIN POSTS ==========

  const rulesPostId     = id();
  const rentPostId      = id();
  const gameNightPostId = id();
  const couchPostId     = id();
  const wifiPostId      = id();
  const welcomePostId   = id();
  const acPostId        = id();
  const bbqPostId       = id();

  await db.insert(bulletinPost).values([
    {
      id: rulesPostId,
      title: "House Rules & Guidelines",
      body: "Hey everyone! Here are the house rules to keep things running smoothly:\n\n• Quiet hours: 11pm–8am weekdays, midnight–9am weekends\n• Clean up after yourself in the kitchen within 24 hours\n• No overnight guests without 24hr notice\n• Shared spaces get cleaned weekly per the chore schedule\n• Label your food in the fridge",
      category: "announcement",
      priority: "urgent",
      pinned: true,
      expiresAt: null,
      ownerId: tariqId,
      visibility: "shared",
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    },
    {
      id: rentPostId,
      title: "Rent Due July 1st — Don't Forget!",
      body: "Reminder: rent is due on the 1st. Venmo me @tariq before midnight or message me if there are issues. Late fees kick in after the 5th per our lease.\n\nMonthly breakdown:\n- Tariq: $800\n- Sarah: $750\n- Marcus: $750\n- Priya: $750\n- Jake: $700",
      category: "reminder",
      priority: "important",
      pinned: true,
      expiresAt: daysFromNow(15),
      ownerId: tariqId,
      visibility: "shared",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      id: gameNightPostId,
      title: "Game Night Friday 7pm!",
      body: "Hosting game night this Friday at 7pm in the living room. We'll have Catan, Ticket to Ride, and Codenames. Bring snacks! All are welcome — feel free to invite one friend.",
      category: "event",
      priority: "normal",
      pinned: false,
      expiresAt: daysFromNow(4),
      ownerId: sarahId,
      visibility: "shared",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      id: couchPostId,
      title: "IKEA Couch for Sale — $60 OBO",
      body: "Moving out my old IKEA KIVIK 2-seater — gray fabric, good condition, minor wear on the armrest. Perfect for a studio. $60 or best offer. Need it gone by end of month. DM me or knock!",
      category: "forsale",
      priority: "normal",
      pinned: false,
      expiresAt: daysFromNow(14),
      ownerId: marcusId,
      visibility: "shared",
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: wifiPostId,
      title: "WiFi Password Changed",
      body: "Changed the WiFi password after a security checkup.\n\nNetwork: HavenHouse_5G\nPassword: SunsetMaple2024!\n\nReconnect all your devices.",
      category: "general",
      priority: "important",
      pinned: false,
      expiresAt: null,
      ownerId: tariqId,
      visibility: "shared",
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      id: welcomePostId,
      title: "Welcome Jake to the House!",
      body: "Give a warm welcome to Jake, our newest housemate! He moved into the back room this weekend and is a CS grad student. Be sure to say hi if you haven't already!",
      category: "announcement",
      priority: "normal",
      pinned: false,
      expiresAt: null,
      ownerId: tariqId,
      visibility: "shared",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
    {
      id: acPostId,
      title: "AC Making Weird Noise — Maintenance?",
      body: "The hallway AC unit has been rattling for two days, especially when it first kicks on. Could be the fan blade or a loose panel. Should we call building maintenance before summer heat peaks?",
      category: "reminder",
      priority: "important",
      pinned: false,
      expiresAt: null,
      ownerId: priyaId,
      visibility: "shared",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: bbqPostId,
      title: "Summer BBQ Planning — Backyard Weekend",
      body: "Thinking we should do a proper house BBQ before summer ends. I can handle the grill if we split food costs. Burgers, hot dogs, corn, maybe skewers? Last weekend of July? Who's in and any dietary restrictions?",
      category: "event",
      priority: "normal",
      pinned: false,
      expiresAt: daysFromNow(45),
      ownerId: jakeId,
      visibility: "shared",
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
  ]);

  // ========== BULLETIN ACKS ==========

  await db.insert(bulletinAck).values([
    // House rules: Tariq, Sarah, Marcus acked
    { postId: rulesPostId, userId: tariqId,  createdAt: daysAgo(30) },
    { postId: rulesPostId, userId: sarahId,  createdAt: daysAgo(29) },
    { postId: rulesPostId, userId: marcusId, createdAt: daysAgo(28) },

    // Rent: everyone except Jake
    { postId: rentPostId, userId: tariqId,  createdAt: daysAgo(5) },
    { postId: rentPostId, userId: sarahId,  createdAt: daysAgo(4) },
    { postId: rentPostId, userId: marcusId, createdAt: daysAgo(4) },
    { postId: rentPostId, userId: priyaId,  createdAt: daysAgo(3) },

    // Game night: Sarah, Jake, Marcus
    { postId: gameNightPostId, userId: sarahId,  createdAt: daysAgo(2) },
    { postId: gameNightPostId, userId: jakeId,   createdAt: daysAgo(1) },
    { postId: gameNightPostId, userId: marcusId, createdAt: daysAgo(1) },

    // WiFi: everyone
    { postId: wifiPostId, userId: tariqId,  createdAt: daysAgo(10) },
    { postId: wifiPostId, userId: sarahId,  createdAt: daysAgo(9)  },
    { postId: wifiPostId, userId: marcusId, createdAt: daysAgo(9)  },
    { postId: wifiPostId, userId: priyaId,  createdAt: daysAgo(8)  },
    { postId: wifiPostId, userId: jakeId,   createdAt: daysAgo(9)  },

    // Welcome Jake: Tariq, Sarah, Priya, Marcus
    { postId: welcomePostId, userId: tariqId,  createdAt: daysAgo(20) },
    { postId: welcomePostId, userId: sarahId,  createdAt: daysAgo(19) },
    { postId: welcomePostId, userId: priyaId,  createdAt: daysAgo(18) },
    { postId: welcomePostId, userId: marcusId, createdAt: daysAgo(18) },

    // BBQ: Priya and Marcus
    { postId: bbqPostId, userId: priyaId,  createdAt: daysAgo(3) },
    { postId: bbqPostId, userId: marcusId, createdAt: daysAgo(3) },
  ]);

  console.log("Bulletin posts & acks seeded.");

  // ========== WISHLISTS ==========

  await db.insert(wishlistItem).values([
    // --- Tariq ---
    { id: id(), userId: tariqId, name: "Sony WH-1000XM5 Headphones", description: "Black colourway preferred. Need them for focus work at home.", url: "https://www.amazon.com/dp/B09XS7JWHH", price: "~$280", priority: "high" },
    { id: id(), userId: tariqId, name: "Standing Desk Mat", description: "Anti-fatigue, at least 20x36in, preferably with a bevelled edge.", url: null, price: "~$50", priority: "medium" },
    { id: id(), userId: tariqId, name: "The Pragmatic Programmer (20th Ed.)", description: null, url: "https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/", price: "~$50", priority: "low" },
    { id: id(), userId: tariqId, name: "Ember Mug 2 (14oz)", description: "Keeps coffee at the right temperature — tired of reheating.", url: null, price: "~$100", priority: "medium" },

    // --- Sarah ---
    { id: id(), userId: sarahId, name: "Dyson Airwrap (Long Barrel Kit)", description: "The fuchsia/nickel colour if still available.", url: "https://www.dyson.com/hair-care/stylers/airwrap", price: "~$600", priority: "high" },
    { id: id(), userId: sarahId, name: "Kindle Paperwhite (Signature Edition)", description: "Love reading before bed — the warm light is a must.", url: null, price: "~$190", priority: "high" },
    { id: id(), userId: sarahId, name: "LANEIGE Lip Sleeping Mask (Berry)", description: "I go through these so fast, always a good gift.", url: null, price: "~$24", priority: "low" },
    { id: id(), userId: sarahId, name: "Cozy Earth Bamboo Throw Blanket", description: "Queen size, any neutral colour.", url: null, price: "~$80", priority: "medium" },
    { id: id(), userId: sarahId, name: "Aesop Resurrection Hand Balm", description: null, url: null, price: "~$35", priority: "low" },

    // --- Marcus ---
    { id: id(), userId: marcusId, name: "Milwaukee M18 Cordless Drill (2-Tool Combo)", description: "The hammer drill + impact driver kit. Already have one M18 battery.", url: "https://www.amazon.com/dp/B07FKJHFQM", price: "~$200", priority: "high" },
    { id: id(), userId: marcusId, name: "Hiking Boots — Salomon X Ultra 4", description: "Size 11 wide. Waterproof version (GTX).", url: null, price: "~$165", priority: "high" },
    { id: id(), userId: marcusId, name: "Traeger Pro 575 Pellet Grill", description: "Long-term wishlist item. Any colour.", url: "https://www.traeger.com/grills/pro/575", price: "~$800", priority: "low" },
    { id: id(), userId: marcusId, name: "Osprey Farpoint 40 Backpack", description: "For travelling — the 40L size fits carry-on. Tungsten Grey if possible.", url: null, price: "~$160", priority: "medium" },

    // --- Priya ---
    { id: id(), userId: priyaId, name: "Yoga Block Set + Strap", description: "Cork blocks preferred over foam. 2 blocks + strap.", url: null, price: "~$30", priority: "low" },
    { id: id(), userId: priyaId, name: "Supergoop Unseen Sunscreen SPF 40", description: "The full-size 1.7oz. Wears well under makeup.", url: null, price: "~$38", priority: "medium" },
    { id: id(), userId: priyaId, name: "Atomic Habits by James Clear", description: "Have been meaning to read this forever.", url: null, price: "~$18", priority: "low" },
    { id: id(), userId: priyaId, name: "Oura Ring Gen 3 (Horizon)", description: "Size 8. Silver finish. Want to track sleep quality.", url: "https://ouraring.com/product/rings/heritage", price: "~$350", priority: "high" },
    { id: id(), userId: priyaId, name: "Vitamix 5200 Blender", description: "For smoothies and soups. The classic series, not the smart one.", url: null, price: "~$450", priority: "medium" },

    // --- Jake ---
    { id: id(), userId: jakeId, name: "Keychron K2 Mechanical Keyboard (Hot-Swap)", description: "Brown switches. Wireless. The aluminium frame version if possible.", url: "https://www.keychron.com/products/keychron-k2-hot-swappable-wireless-mechanical-keyboard", price: "~$90", priority: "high" },
    { id: id(), userId: jakeId, name: "27-inch 4K Monitor (Dell U2723D or similar)", description: "Need a second monitor for my desk setup. IPS panel preferred.", url: null, price: "~$450", priority: "high" },
    { id: id(), userId: jakeId, name: "AeroPress Coffee Maker", description: "Love the idea of making great coffee fast without a full setup.", url: null, price: "~$35", priority: "medium" },
    { id: id(), userId: jakeId, name: "Zelda: Tears of the Kingdom", description: null, url: null, price: "~$60", priority: "low" },
  ]);

  console.log("Wishlists seeded.");

  sqlite.close();
  console.log("\nDone! Database seeded with:");
  console.log("  5 users (1 admin + 4 members, no PINs)");
  console.log("  6 shopping lists, 35 items");
  console.log("  11 chores, 19 completions");
  console.log("  8 bulletin posts, 22 acks");
  console.log("  23 wishlist items across 5 members");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
