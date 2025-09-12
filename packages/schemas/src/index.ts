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
  format: z.enum(["knockout", "round_robin"]),
  startDate: z.date(),
  endDate: z.date(),
  venue: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  entryFee: z.number().min(0).default(0),
  maxParticipants: z.number().min(2).max(1000).default(64),
  rules: z.string().optional(),
  prizes: z.object({
    winner: z.number().min(0).default(0),
    runnerUp: z.number().min(0).default(0),
    semiFinalist: z.number().min(0).default(0),
  }).default({ winner: 0, runnerUp: 0, semiFinalist: 0 }),
  tournamentType: z.enum(["society_only", "open"]).default("open"),
  allowedSociety: z.string().optional(), // Required if tournamentType is "society_only"
  status: z.enum(["draft", "published", "registration_open", "ongoing", "completed", "cancelled"]).default("draft"),
  isPublished: z.boolean().default(false),
  createdBy: objectIdSchema,
  createdAt: z.date().default(() => new Date()),
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
  partnerId: objectIdSchema.optional(), // For doubles/mixed
  partnerName: z.string().max(100).optional(),
  partnerPhone: z.string().max(15).optional(),
  paymentStatus: z.enum(["pending", "paid"]).default("pending"),
  isApproved: z.boolean().default(false), // Admin approval
  isEligible: z.boolean().default(true), // Society eligibility check
  registeredAt: z.date().default(() => new Date()),
});

export const matchSchema = z.object({
  _id: objectIdSchema.optional(),
  tournamentId: objectIdSchema,
  round: z.string().min(1),
  roundNumber: z.number().min(1),
  matchNumber: z.number().min(1),
  player1Id: objectIdSchema.optional(),
  player2Id: objectIdSchema.optional(),
  player1Name: z.string().optional(),
  player2Name: z.string().optional(),
  player1Score: z.array(z.number()).default([]), // Game scores [21, 19, 21]
  player2Score: z.array(z.number()).default([]), // Game scores [19, 21, 19]
  winnerId: objectIdSchema.optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  court: z.string().optional(),
  scheduledTime: z.date().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
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

export const insertWhatsappGroupSchema = whatsappGroupSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertOtpSchema = otpSchema.omit({
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
  WHATSAPP_GROUPS: "whatsapp_groups",
  OTPS: "otps",
} as const;

// MongoDB indexes for better performance
export const INDEXES = {
  USERS: [
    { username: 1 }, // unique index
  ],
  TOURNAMENTS: [
    { createdBy: 1 },
    { status: 1 },
    { sport: 1 },
    { createdAt: -1 },
  ],
  PARTICIPANTS: [
    { tournamentId: 1 },
    { registeredAt: -1 },
  ],
  MATCHES: [
    { tournamentId: 1 },
    { roundNumber: 1 },
    { status: 1 },
    { createdAt: -1 },
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