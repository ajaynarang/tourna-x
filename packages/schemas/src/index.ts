import { z } from "zod";
import { ObjectId } from "mongodb";

// MongoDB ObjectId validation
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// Base schemas for MongoDB collections
export const userSchema = z.object({
  _id: objectIdSchema.optional(),
  username: z.string().min(3).max(50).optional(), // For admin users
  password: z.string().min(6).optional(), // For admin users only
  roles: z.array(z.enum(["admin", "player"])).default(["player"]), // Support multiple roles
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(15), // Required for all users
  email: z.string().email().optional(), // Optional for players, required for admin
  society: z.string().max(100).optional(), // Society/Apartment name
  block: z.string().max(50).optional(), // Block/Tower name
  flatNumber: z.string().max(20).optional(), // Flat number
  age: z.number().min(1).max(100).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  createdAt: z.date().default(() => new Date()),
});

export const tournamentSchema = z.object({
  _id: objectIdSchema.optional(),
  name: z.string().min(1).max(200),
  sport: z.enum(["badminton", "tennis"]),
  categories: z.array(z.enum(["singles", "doubles", "mixed"])), // Multiple categories allowed
  ageGroups: z.array(z.string()).optional(), // e.g., ["U-18", "U-25", "Open"]
  gender: z.array(z.enum(["men", "women", "mixed"])).optional(), // Per category
  format: z.enum(["knockout", "round_robin"]),
  startDate: z.date(),
  endDate: z.date(),
  registrationDeadline: z.date().optional(),
  venue: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  courts: z.number().min(1).max(20).default(1), // Number of courts available
  entryFee: z.number().min(0).default(0),
  maxParticipants: z.number().min(2).max(1000).default(64),
  participantCount: z.number().min(0).default(0), // Current participant count
  rules: z.string().optional(),
  prizes: z.object({
    winner: z.object({
      type: z.enum(["money", "trophy", "medal", "certificate", "voucher", "merchandise", "other"]).default("money"),
      value: z.number().min(0).default(0), // Amount for money, quantity for others
      description: z.string().optional(), // e.g., "Gold Trophy", "₹5000 Cash Prize", "Certificate of Excellence"
      currency: z.string().default("INR"), // For money prizes
    }).default({ type: "money", value: 0, currency: "INR" }),
    runnerUp: z.object({
      type: z.enum(["money", "trophy", "medal", "certificate", "voucher", "merchandise", "other"]).default("money"),
      value: z.number().min(0).default(0),
      description: z.string().optional(),
      currency: z.string().default("INR"),
    }).default({ type: "money", value: 0, currency: "INR" }),
    semiFinalist: z.object({
      type: z.enum(["money", "trophy", "medal", "certificate", "voucher", "merchandise", "other"]).default("money"),
      value: z.number().min(0).default(0),
      description: z.string().optional(),
      currency: z.string().default("INR"),
    }).default({ type: "money", value: 0, currency: "INR" }),
  }).default({
    winner: { type: "money", value: 0, currency: "INR" },
    runnerUp: { type: "money", value: 0, currency: "INR" },
    semiFinalist: { type: "money", value: 0, currency: "INR" },
  }),
  tournamentType: z.enum(["society_only", "open"]).default("open"),
  allowedSociety: z.string().optional(), // Required if tournamentType is "society_only"
  status: z.enum(["draft", "published", "registration_open", "ongoing", "completed", "cancelled"]).default("draft"),
  isPublished: z.boolean().default(false),
  createdBy: objectIdSchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const participantSchema = z.object({
  _id: objectIdSchema.optional(),
  tournamentId: objectIdSchema,
  userId: objectIdSchema, // Reference to user
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  age: z.number().min(1).max(100),
  gender: z.enum(["male", "female", "other"]).optional(),
  society: z.string().max(100).optional(),
  block: z.string().max(50).optional(),
  flatNumber: z.string().max(20).optional(),
  category: z.enum(["singles", "doubles", "mixed"]),
  ageGroup: z.string().optional(), // "Open", "U-18", etc.
  partnerId: objectIdSchema.optional(), // For doubles/mixed
  partnerName: z.string().max(100).optional(),
  partnerPhone: z.string().max(15).optional(),
  partnerAge: z.number().min(1).max(100).optional(),
  partnerGender: z.enum(["male", "female", "other"]).optional(),
  paymentStatus: z.enum(["pending", "paid"]).default("pending"),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  isApproved: z.boolean().default(false), // Admin approval
  approvedAt: z.date().optional(),
  approvedBy: objectIdSchema.optional(),
  rejectionReason: z.string().optional(),
  isEligible: z.boolean().default(true), // Society eligibility check
  registeredAt: z.date().default(() => new Date()),
});

export const matchSchema = z.object({
  _id: objectIdSchema.optional(),
  tournamentId: objectIdSchema,
  category: z.enum(["singles", "doubles", "mixed"]),
  ageGroup: z.string().optional(),
  round: z.string().min(1), // "Quarter Final", "Semi Final", "Final"
  roundNumber: z.number().min(1),
  matchNumber: z.number().min(1),
  player1Id: objectIdSchema.optional(),
  player2Id: objectIdSchema.optional(),
  player1Name: z.string().optional(),
  player2Name: z.string().optional(),
  player1Score: z.array(z.number()).default([]), // Game scores [21, 19, 21]
  player2Score: z.array(z.number()).default([]), // Game scores [19, 21, 19]
  winnerId: objectIdSchema.optional(),
  winnerName: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "walkover", "cancelled"]).default("scheduled"),
  court: z.string().optional(),
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(), // "10:00 AM"
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().optional(), // Minutes
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// New schema for OTP verification
export const otpSchema = z.object({
  _id: objectIdSchema.optional(),
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
  expiresAt: z.date(),
  isUsed: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Additional schemas for tournament management
export const pairingSchema = z.object({
  _id: objectIdSchema.optional(),
  tournamentId: objectIdSchema,
  player1Id: objectIdSchema,
  player2Id: objectIdSchema.optional(),
  player1Name: z.string(),
  player2Name: z.string(),
  player2Phone: z.string().optional(),
  player2Email: z.string().optional(),
  category: z.enum(["doubles", "mixed"]),
  invitationStatus: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  createdAt: z.date().default(() => new Date()),
});

export const notificationSchema = z.object({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  type: z.enum(["registration_approved", "registration_rejected", "match_scheduled", "match_starting", "match_result", "tournament_update"]),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  tournamentId: objectIdSchema.optional(),
  matchId: objectIdSchema.optional(),
  createdAt: z.date().default(() => new Date()),
});

export const sessionSchema = z.object({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  sessionToken: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
});

// Referee role schema
export const refereeSchema = z.object({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  tournamentId: objectIdSchema,
  court: z.string(),
  isActive: z.boolean().default(true),
  assignedAt: z.date().default(() => new Date()),
});

// Player statistics schema
export const playerStatsSchema = z.object({
  _id: objectIdSchema.optional(),
  playerId: objectIdSchema,
  totalTournaments: z.number().default(0),
  totalMatches: z.number().default(0),
  wins: z.number().default(0),
  losses: z.number().default(0),
  winRate: z.number().default(0), // Percentage
  titles: z.number().default(0), // 1st place finishes
  runnerUps: z.number().default(0), // 2nd place finishes
  currentStreak: z.number().default(0), // Current win streak
  longestStreak: z.number().default(0),
  favoriteCategory: z.string().optional(),
  totalPoints: z.number().default(0), // Cumulative points scored
  averageMatchDuration: z.number().default(0),
  societyRanking: z.number().optional(),
  overallRanking: z.number().optional(),
  recentForm: z.array(z.string()).default([]), // ["W", "W", "L", "W", "W"]
  updatedAt: z.date().default(() => new Date()),
});

export const whatsappGroupSchema = z.object({
  _id: objectIdSchema.optional(),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  location: z.string().min(1).max(100),
  sport: z.string().min(1).max(50),
  memberCount: z.number().min(0).default(0),
  inviteLink: z.string().url().optional(),
  contactPerson: z.string().max(100).optional(),
  contactPhone: z.string().max(15).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
});

// Insert schemas (without _id and createdAt)
export const insertUserSchema = userSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertTournamentSchema = tournamentSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertParticipantSchema = participantSchema.omit({
  _id: true,
  registeredAt: true,
});

export const insertMatchSchema = matchSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertPairingSchema = pairingSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertNotificationSchema = notificationSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertSessionSchema = sessionSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertRefereeSchema = refereeSchema.omit({
  _id: true,
  assignedAt: true,
});

export const insertPlayerStatsSchema = playerStatsSchema.omit({
  _id: true,
  updatedAt: true,
});

export const insertOtpSchema = otpSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertWhatsappGroupSchema = whatsappGroupSchema.omit({
  _id: true,
  createdAt: true,
});

// Type definitions
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tournament = z.infer<typeof tournamentSchema>;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type Participant = z.infer<typeof participantSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Match = z.infer<typeof matchSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Pairing = z.infer<typeof pairingSchema>;
export type InsertPairing = z.infer<typeof insertPairingSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Referee = z.infer<typeof refereeSchema>;
export type InsertReferee = z.infer<typeof insertRefereeSchema>;

export type PlayerStats = z.infer<typeof playerStatsSchema>;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;

export type WhatsappGroup = z.infer<typeof whatsappGroupSchema>;
export type InsertWhatsappGroup = z.infer<typeof insertWhatsappGroupSchema>;

export type Otp = z.infer<typeof otpSchema>;
export type InsertOtp = z.infer<typeof insertOtpSchema>;

// Collection names
export const COLLECTIONS = {
  USERS: "users",
  TOURNAMENTS: "tournaments", 
  PARTICIPANTS: "participants",
  MATCHES: "matches",
  PAIRINGS: "pairings",
  NOTIFICATIONS: "notifications",
  SESSIONS: "sessions",
  REFEREES: "referees",
  PLAYER_STATS: "player_stats",
  WHATSAPP_GROUPS: "whatsapp_groups",
  OTPS: "otps",
} as const;

// MongoDB indexes for better performance
export const INDEXES = {
  USERS: [
    { username: 1 }, // unique index
    { phone: 1 }, // unique index
    { email: 1 }, // unique index
  ],
  TOURNAMENTS: [
    { createdBy: 1 },
    { status: 1 },
    { sport: 1 },
    { createdAt: -1 },
    { startDate: 1 },
  ],
  PARTICIPANTS: [
    { tournamentId: 1 },
    { userId: 1 },
    { registeredAt: -1 },
    { isApproved: 1 },
    { paymentStatus: 1 },
  ],
  MATCHES: [
    { tournamentId: 1 },
    { category: 1 },
    { roundNumber: 1 },
    { status: 1 },
    { createdAt: -1 },
    { scheduledDate: 1 },
  ],
  PAIRINGS: [
    { tournamentId: 1 },
    { player1Id: 1 },
    { invitationStatus: 1 },
  ],
  NOTIFICATIONS: [
    { userId: 1 },
    { isRead: 1 },
    { createdAt: -1 },
  ],
  SESSIONS: [
    { userId: 1 },
    { sessionToken: 1 }, // unique index
    { expiresAt: 1 },
  ],
  REFEREES: [
    { tournamentId: 1 },
    { court: 1 },
    { isActive: 1 },
  ],
  PLAYER_STATS: [
    { playerId: 1 }, // unique index
    { overallRanking: 1 },
    { societyRanking: 1 },
  ],
  WHATSAPP_GROUPS: [
    { sport: 1 },
    { location: 1 },
    { isActive: 1 },
    { memberCount: -1 },
  ],
  OTPS: [
    { phone: 1 },
    { expiresAt: 1 },
    { createdAt: -1 },
  ],
} as const;

// Export UI types
export * from './ui';