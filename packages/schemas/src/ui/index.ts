import { z } from "zod";
import { 
  userSchema, 
  tournamentSchema, 
  participantSchema, 
  matchSchema,
  pairingSchema,
  notificationSchema,
  playerStatsSchema
} from "../index";

// UI-specific form schemas
export const userFormSchema = userSchema.pick({
  name: true,
  phone: true,
  email: true,
  society: true,
  block: true,
  flatNumber: true,
  age: true,
  gender: true,
});

export const tournamentFormSchema = tournamentSchema.pick({
  name: true,
  sport: true,
  venue: true,
  location: true,
  startDate: true,
  endDate: true,
  categories: true,
  ageGroups: true,
  gender: true,
  format: true,
  entryFee: true,
  maxParticipants: true,
  registrationDeadline: true,
  courts: true,
  rules: true,
  prizes: true,
  tournamentType: true,
  allowedSociety: true,
});

export const participantFormSchema = participantSchema.pick({
  name: true,
  phone: true,
  email: true,
  age: true,
  gender: true,
  society: true,
  block: true,
  flatNumber: true,
  category: true,
  ageGroup: true,
  partnerName: true,
  partnerPhone: true,
  partnerAge: true,
  partnerGender: true,
  paymentMethod: true,
  transactionId: true,
});

export const matchFormSchema = matchSchema.pick({
  category: true,
  ageGroup: true,
  round: true,
  roundNumber: true,
  matchNumber: true,
  player1Id: true,
  player2Id: true,
  player1Name: true,
  player2Name: true,
  court: true,
  scheduledDate: true,
  scheduledTime: true,
  notes: true,
});

export const pairingFormSchema = pairingSchema.pick({
  player1Name: true,
  player2Name: true,
  player2Phone: true,
  player2Email: true,
  category: true,
});

export const notificationFormSchema = notificationSchema.pick({
  type: true,
  title: true,
  message: true,
  tournamentId: true,
  matchId: true,
});

// UI-specific display schemas (for cards, lists, etc.)
export const tournamentCardSchema = tournamentSchema.pick({
  _id: true,
  name: true,
  sport: true,
  venue: true,
  location: true,
  startDate: true,
  endDate: true,
  categories: true,
  format: true,
  entryFee: true,
  maxParticipants: true,
  participantCount: true,
  status: true,
  isPublished: true,
  createdAt: true,
});

export const participantCardSchema = participantSchema.pick({
  _id: true,
  name: true,
  phone: true,
  age: true,
  gender: true,
  society: true,
  category: true,
  ageGroup: true,
  partnerName: true,
  paymentStatus: true,
  isApproved: true,
  rejectionReason: true,
  registeredAt: true,
});

export const matchCardSchema = matchSchema.pick({
  _id: true,
  category: true,
  ageGroup: true,
  round: true,
  roundNumber: true,
  matchNumber: true,
  player1Name: true,
  player2Name: true,
  player1Score: true,
  player2Score: true,
  winnerName: true,
  status: true,
  court: true,
  scheduledDate: true,
  scheduledTime: true,
  startTime: true,
  endTime: true,
});

export const playerStatsCardSchema = playerStatsSchema.pick({
  totalTournaments: true,
  totalMatches: true,
  wins: true,
  losses: true,
  winRate: true,
  titles: true,
  runnerUps: true,
  currentStreak: true,
  longestStreak: true,
  favoriteCategory: true,
  societyRanking: true,
  overallRanking: true,
  recentForm: true,
});

// Dashboard-specific schemas
export const dashboardStatsSchema = z.object({
  totalTournaments: z.number(),
  activeTournaments: z.number(),
  totalParticipants: z.number(),
  totalRevenue: z.number(),
  pendingApprovals: z.number(),
  upcomingMatches: z.number(),
  completedMatches: z.number(),
});

export const recentActivitySchema = z.object({
  tournaments: z.array(tournamentCardSchema),
  participants: z.array(participantCardSchema),
  matches: z.array(matchCardSchema),
  notifications: z.array(notificationSchema),
});

// Search and filter schemas
export const tournamentFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "draft", "published", "registration_open", "ongoing", "completed", "cancelled"]).default("all"),
  sport: z.enum(["all", "badminton", "tennis"]).default("all"),
  category: z.enum(["all", "singles", "doubles", "mixed"]).default("all"),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
});

export const participantFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
  category: z.enum(["all", "singles", "doubles", "mixed"]).default("all"),
  paymentStatus: z.enum(["all", "pending", "paid"]).default("all"),
  ageGroup: z.string().optional(),
});

export const matchFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "scheduled", "in_progress", "completed", "walkover", "cancelled"]).default("all"),
  category: z.enum(["all", "singles", "doubles", "mixed"]).default("all"),
  round: z.string().optional(),
  court: z.string().optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
});

// Inferred TypeScript types
export type UserForm = z.infer<typeof userFormSchema>;
export type TournamentForm = z.infer<typeof tournamentFormSchema>;
export type ParticipantForm = z.infer<typeof participantFormSchema>;
export type MatchForm = z.infer<typeof matchFormSchema>;
export type PairingForm = z.infer<typeof pairingFormSchema>;
export type NotificationForm = z.infer<typeof notificationFormSchema>;

export type TournamentCard = z.infer<typeof tournamentCardSchema>;
export type ParticipantCard = z.infer<typeof participantCardSchema>;
export type MatchCard = z.infer<typeof matchCardSchema>;
export type PlayerStatsCard = z.infer<typeof playerStatsCardSchema>;

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type RecentActivity = z.infer<typeof recentActivitySchema>;

export type TournamentFilters = z.infer<typeof tournamentFiltersSchema>;
export type ParticipantFilters = z.infer<typeof participantFiltersSchema>;
export type MatchFilters = z.infer<typeof matchFiltersSchema>;