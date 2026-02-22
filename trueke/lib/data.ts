// Static mock data for Trueke marketplace

export type ItemCondition = "like-new" | "good" | "fair" | "worn" | "bad"
export type ItemType = "physical" | "digital" | "service"
export type ItemState = "draft" | "active" | "contested" | "archived"
export type OfferState = "open" | "accepted" | "rejected" | "expired" | "cancelled"

export interface User {
  id: string
  name: string
  avatar: string
  location: string
  rating: number
  bio: string
  joinedDate: string
  totalTrades: number
  role?: "user" | "admin"
}

export interface Item {
  id: string
  title: string
  description: string
  condition: ItemCondition
  category: string
  type: ItemType
  state: ItemState
  images: string[]
  owner: User
  createdAt: string
  metadata?: Record<string, string>
}

export interface Exchange {
  id: string
  type: "direct" | "group" | "auction"
  status: OfferState
  initiator: User
  participants: User[]
  itemsOffered: Item[]
  itemsRequested: Item[]
  createdAt: string
  message?: string
}

export interface Auction {
  id: string
  item: Item
  seller: User
  startTime: string
  endTime: string
  bids: AuctionBid[]
  status: "upcoming" | "active" | "selecting" | "closed"
}

export interface AuctionBid {
  id: string
  bidder: User
  type: "monetary" | "item"
  amount?: number
  itemOffered?: Item
  createdAt: string
}

export interface Message {
  id: string
  sender: User
  content: string
  timestamp: string
  isStructuredOffer?: boolean
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

export interface Notification {
  id: string
  type: "offer" | "auction" | "message" | "meeting"
  title: string
  description: string
  time: string
  read: boolean
}

// Mock Users
export const users: User[] = [
  {
    id: "u1",
    name: "Maria Garcia",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Maria",
    location: "Mexico City, MX",
    rating: 4.8,
    bio: "Avid reader and collector of vintage electronics.",
    joinedDate: "2024-03-15",
    totalTrades: 47,
  },
  {
    id: "u2",
    name: "Carlos Rivera",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Carlos",
    location: "Bogota, CO",
    rating: 4.5,
    bio: "Music lover, trades vinyl records and instruments.",
    joinedDate: "2024-06-20",
    totalTrades: 32,
  },
  {
    id: "u3",
    name: "Ana Torres",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ana",
    location: "Buenos Aires, AR",
    rating: 4.9,
    bio: "Handcraft artisan specializing in leather goods.",
    joinedDate: "2023-11-01",
    totalTrades: 85,
  },
  {
    id: "u4",
    name: "Diego Morales",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Diego",
    location: "Lima, PE",
    rating: 4.2,
    bio: "Tech enthusiast, always looking for the latest gadgets.",
    joinedDate: "2025-01-10",
    totalTrades: 15,
  },
  {
    id: "u5",
    name: "Lucia Fernandez",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lucia",
    location: "Santiago, CL",
    rating: 4.7,
    bio: "Photographer and camera equipment trader.",
    joinedDate: "2024-08-05",
    totalTrades: 28,
  },
]

export const currentUser = users[0]

export const adminUser: User = {
  id: "admin1",
  name: "Admin User",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Admin",
  location: "System",
  rating: 5.0,
  bio: "Platform administrator",
  joinedDate: "2023-01-01",
  totalTrades: 0,
  role: "admin",
}

// Mock Items
export const items: Item[] = [
  {
    id: "i1",
    title: "Vintage Canon AE-1 Camera",
    description: "Classic 35mm film camera in excellent working condition. Includes 50mm f/1.8 lens and leather carrying case.",
    condition: "good",
    category: "Electronics",
    type: "physical",
    state: "active",
    images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop"],
    owner: users[4],
    createdAt: "2025-12-10",
    metadata: { "Brand": "Canon", "Year": "1978", "Film Type": "35mm" },
  },
  {
    id: "i2",
    title: "Handmade Leather Messenger Bag",
    description: "Artisan-crafted genuine leather messenger bag. Perfect for laptops up to 15 inches.",
    condition: "like-new",
    category: "Fashion",
    type: "physical",
    state: "active",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop"],
    owner: users[2],
    createdAt: "2025-12-15",
    metadata: { "Material": "Full Grain Leather", "Size": "15 inch" },
  },
  {
    id: "i3",
    title: "Mechanical Keyboard - Cherry MX Blue",
    description: "Custom-built mechanical keyboard with Cherry MX Blue switches, PBT keycaps, and RGB backlighting.",
    condition: "like-new",
    category: "Electronics",
    type: "physical",
    state: "active",
    images: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop"],
    owner: users[3],
    createdAt: "2025-12-20",
    metadata: { "Switch": "Cherry MX Blue", "Layout": "TKL" },
  },
  {
    id: "i4",
    title: "Web Development Course",
    description: "Complete full-stack web development course with React, Node.js, and PostgreSQL. 40+ hours of content.",
    condition: "like-new",
    category: "Education",
    type: "digital",
    state: "active",
    images: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"],
    owner: users[0],
    createdAt: "2025-12-22",
    metadata: { "Duration": "40+ hours", "Level": "Beginner to Advanced" },
  },
  {
    id: "i5",
    title: "Vinyl Record Collection - Jazz Classics",
    description: "Set of 12 classic jazz vinyl records including Miles Davis, John Coltrane, and Thelonious Monk.",
    condition: "good",
    category: "Music",
    type: "physical",
    state: "active",
    images: ["https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=400&h=300&fit=crop"],
    owner: users[1],
    createdAt: "2025-12-25",
    metadata: { "Genre": "Jazz", "Count": "12 records" },
  },
  {
    id: "i6",
    title: "Logo Design Service",
    description: "Professional logo design with 3 concepts and unlimited revisions. Delivered in all standard formats.",
    condition: "like-new",
    category: "Services",
    type: "service",
    state: "active",
    images: ["https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop"],
    owner: users[2],
    createdAt: "2026-01-02",
    metadata: { "Delivery": "5 business days", "Revisions": "Unlimited" },
  },
  {
    id: "i7",
    title: "Mountain Bike - Trek Marlin 7",
    description: "Lightweight trail bike, great for beginners and intermediate riders. Recently serviced.",
    condition: "fair",
    category: "Sports",
    type: "physical",
    state: "active",
    images: ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400&h=300&fit=crop"],
    owner: users[3],
    createdAt: "2026-01-05",
    metadata: { "Frame Size": "M", "Wheel Size": "29 inch" },
  },
  {
    id: "i8",
    title: "Espresso Machine - Breville Barista",
    description: "Semi-automatic espresso machine with built-in grinder. Makes cafe-quality espresso at home.",
    condition: "good",
    category: "Home",
    type: "physical",
    state: "active",
    images: ["https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=300&fit=crop"],
    owner: users[4],
    createdAt: "2026-01-10",
    metadata: { "Brand": "Breville", "Type": "Semi-Automatic" },
  },
]

// Mock Exchanges
export const exchanges: Exchange[] = [
  {
    id: "e1",
    type: "direct",
    status: "open",
    initiator: users[1],
    participants: [users[1], users[0]],
    itemsOffered: [items[4]],
    itemsRequested: [items[3]],
    createdAt: "2026-01-15",
    message: "Hey Maria! I'd love to trade my jazz vinyl collection for your web dev course. Let me know!",
  },
  {
    id: "e2",
    type: "direct",
    status: "accepted",
    initiator: users[3],
    participants: [users[3], users[2]],
    itemsOffered: [items[2]],
    itemsRequested: [items[1]],
    createdAt: "2026-01-12",
    message: "That leather bag looks amazing. Would you accept my mechanical keyboard?",
  },
  {
    id: "e3",
    type: "group",
    status: "open",
    initiator: users[2],
    participants: [users[2], users[4], users[0]],
    itemsOffered: [items[5]],
    itemsRequested: [items[0], items[3]],
    createdAt: "2026-01-18",
    message: "Group exchange proposal: My design service for the camera and web course.",
  },
  {
    id: "e4",
    type: "direct",
    status: "rejected",
    initiator: users[4],
    participants: [users[4], users[1]],
    itemsOffered: [items[7]],
    itemsRequested: [items[4]],
    createdAt: "2026-01-08",
  },
  {
    id: "e5",
    type: "direct",
    status: "expired",
    initiator: users[0],
    participants: [users[0], users[3]],
    itemsOffered: [items[3]],
    itemsRequested: [items[6]],
    createdAt: "2025-12-28",
  },
]

// Mock Auctions
export const auctions: Auction[] = [
  {
    id: "a1",
    item: items[0],
    seller: users[4],
    startTime: "2026-02-10T10:00:00Z",
    endTime: "2026-02-17T22:00:00Z",
    status: "active",
    bids: [
      { id: "b1", bidder: users[0], type: "monetary", amount: 120, createdAt: "2026-02-11T14:00:00Z" },
      { id: "b2", bidder: users[1], type: "monetary", amount: 150, createdAt: "2026-02-12T09:00:00Z" },
      { id: "b3", bidder: users[3], type: "item", itemOffered: items[2], createdAt: "2026-02-13T16:00:00Z" },
    ],
  },
  {
    id: "a2",
    item: items[6],
    seller: users[3],
    startTime: "2026-02-15T08:00:00Z",
    endTime: "2026-02-22T20:00:00Z",
    status: "active",
    bids: [
      { id: "b4", bidder: users[2], type: "monetary", amount: 200, createdAt: "2026-02-15T12:00:00Z" },
    ],
  },
  {
    id: "a3",
    item: items[7],
    seller: users[4],
    startTime: "2026-02-20T10:00:00Z",
    endTime: "2026-02-27T22:00:00Z",
    status: "upcoming",
    bids: [],
  },
]

// Mock Conversations
export const conversations: Conversation[] = [
  {
    id: "c1",
    participants: [users[0], users[1]],
    lastMessage: "Sounds great! When can we meet to exchange?",
    lastMessageTime: "2026-02-16T18:30:00Z",
    unreadCount: 2,
    messages: [
      { id: "m1", sender: users[1], content: "Hey Maria! I'm interested in your web dev course.", timestamp: "2026-02-16T17:00:00Z" },
      { id: "m2", sender: users[0], content: "Hi Carlos! Sure, what would you like to offer?", timestamp: "2026-02-16T17:15:00Z" },
      { id: "m3", sender: users[1], content: "How about my jazz vinyl collection? It's in great shape.", timestamp: "2026-02-16T17:30:00Z" },
      { id: "m4", sender: users[0], content: "That sounds interesting! Let me think about it.", timestamp: "2026-02-16T18:00:00Z" },
      { id: "m5", sender: users[1], content: "Sounds great! When can we meet to exchange?", timestamp: "2026-02-16T18:30:00Z" },
    ],
  },
  {
    id: "c2",
    participants: [users[0], users[2]],
    lastMessage: "I just sent you the group exchange proposal!",
    lastMessageTime: "2026-02-15T14:20:00Z",
    unreadCount: 1,
    messages: [
      { id: "m6", sender: users[2], content: "Hi Maria! I have a proposal for a group exchange.", timestamp: "2026-02-15T14:00:00Z" },
      { id: "m7", sender: users[0], content: "Tell me more!", timestamp: "2026-02-15T14:10:00Z" },
      { id: "m8", sender: users[2], content: "I just sent you the group exchange proposal!", timestamp: "2026-02-15T14:20:00Z" },
    ],
  },
  {
    id: "c3",
    participants: [users[0], users[3]],
    lastMessage: "No worries, maybe next time!",
    lastMessageTime: "2026-02-14T10:00:00Z",
    unreadCount: 0,
    messages: [
      { id: "m9", sender: users[3], content: "Hey, sorry I missed the deadline on the exchange.", timestamp: "2026-02-14T09:45:00Z" },
      { id: "m10", sender: users[0], content: "No worries, maybe next time!", timestamp: "2026-02-14T10:00:00Z" },
    ],
  },
]

// Mock Notifications
export const notifications: Notification[] = [
  { id: "n1", type: "offer", title: "New Trade Offer", description: "Carlos Rivera wants to trade vinyl records for your web course.", time: "2 hours ago", read: false },
  { id: "n2", type: "auction", title: "Outbid on Canon AE-1", description: "Someone placed a higher bid on the vintage camera.", time: "4 hours ago", read: false },
  { id: "n3", type: "message", title: "New Message", description: "Ana Torres sent you a message about a group exchange.", time: "1 day ago", read: true },
  { id: "n4", type: "meeting", title: "Meeting Scheduled", description: "Your exchange meeting with Diego is tomorrow at 3 PM.", time: "1 day ago", read: true },
  { id: "n5", type: "offer", title: "Offer Accepted", description: "Your trade with Ana Torres has been accepted!", time: "3 days ago", read: true },
]

// Categories for filtering
export const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Music",
  "Education",
  "Services",
  "Sports",
  "Home",
  "Books",
  "Art",
]

// Stats for dashboard
export const dashboardStats = {
  activeListings: 4,
  pendingOffers: 3,
  completedTrades: 47,
  averageRating: 4.8,
}

// Report types and interfaces
export type ReportReason =
  | "misleading-description"
  | "failed-trade"
  | "inappropriate-messages"
  | "fake-item"
  | "harassment"
  | "scam"
  | "spam"
  | "other"

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed"

export interface Report {
  id: string
  reporter: User
  reported: User
  reason: ReportReason
  reasonText: string
  description: string
  status: ReportStatus
  date: string
  relatedItem?: Item
  relatedExchange?: Exchange
  evidence?: string[]
  adminNotes?: string
  resolvedBy?: string
  resolvedDate?: string
}

// Mock Reports for Admin
export const reports: Report[] = [
  {
    id: "r1",
    reporter: users[0],
    reported: users[3],
    reason: "misleading-description",
    reasonText: "Misleading item description",
    description: "The keyboard advertised as 'like new' had multiple broken switches and keycaps missing. Photos didn't match the actual condition.",
    status: "pending",
    date: "2026-02-20",
    relatedItem: items[2],
    relatedExchange: exchanges[1],
    evidence: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop"],
  },
  {
    id: "r2",
    reporter: users[1],
    reported: users[4],
    reason: "failed-trade",
    reasonText: "Failed to complete agreed trade",
    description: "User agreed to exchange but never showed up to the meeting location. Stopped responding to messages after confirmation.",
    status: "reviewing",
    date: "2026-02-19",
    relatedExchange: exchanges[3],
    adminNotes: "Investigating user's trade history. Found 2 similar complaints in the past month.",
  },
  {
    id: "r3",
    reporter: users[2],
    reported: users[1],
    reason: "inappropriate-messages",
    reasonText: "Inappropriate messages",
    description: "User sent multiple harassing messages after I declined their trade offer. Messages were rude and unprofessional.",
    status: "resolved",
    date: "2026-02-15",
    evidence: ["screenshot1.jpg", "screenshot2.jpg"],
    resolvedBy: "Admin",
    resolvedDate: "2026-02-17",
    adminNotes: "User warned. Pattern of behavior noted. Next violation will result in temporary suspension.",
  },
  {
    id: "r4",
    reporter: users[4],
    reported: users[3],
    reason: "scam",
    reasonText: "Suspected scam attempt",
    description: "User requested payment upfront outside of platform before exchange. Pressured me to complete trade immediately.",
    status: "reviewing",
    date: "2026-02-18",
    relatedItem: items[6],
    adminNotes: "High priority. User account flagged. Checking for other similar reports.",
  },
  {
    id: "r5",
    reporter: users[3],
    reported: users[2],
    reason: "fake-item",
    reasonText: "Item is counterfeit",
    description: "The 'handmade leather bag' is clearly a mass-produced counterfeit. Not artisan-crafted as advertised.",
    status: "pending",
    date: "2026-02-21",
    relatedItem: items[1],
  },
  {
    id: "r6",
    reporter: users[0],
    reported: users[4],
    reason: "harassment",
    reasonText: "User harassment",
    description: "User has been repeatedly messaging me despite being blocked. Creating new accounts to continue contact.",
    status: "pending",
    date: "2026-02-21",
    evidence: ["screenshot3.jpg", "screenshot4.jpg", "screenshot5.jpg"],
  },
  {
    id: "r7",
    reporter: users[1],
    reported: users[3],
    reason: "spam",
    reasonText: "Spam listings",
    description: "User posted 15+ duplicate listings for the same item with slightly different descriptions to flood the marketplace.",
    status: "dismissed",
    date: "2026-02-12",
    resolvedBy: "Admin",
    resolvedDate: "2026-02-13",
    adminNotes: "Investigated. User was unaware of policy. Duplicates removed. User educated on guidelines.",
  },
]
