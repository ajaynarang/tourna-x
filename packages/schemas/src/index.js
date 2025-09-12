"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDEXES = exports.COLLECTIONS = exports.insertWhatsappGroupSchema = exports.insertMatchSchema = exports.insertParticipantSchema = exports.insertTournamentSchema = exports.insertUserSchema = exports.whatsappGroupSchema = exports.matchSchema = exports.participantSchema = exports.tournamentSchema = exports.userSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
// MongoDB ObjectId validation
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
// Base schemas for MongoDB collections
exports.userSchema = zod_1.z.object({
    _id: exports.objectIdSchema.optional(),
    username: zod_1.z.string().min(3).max(50),
    password: zod_1.z.string().min(6), // TODO: Hash passwords before storage using bcrypt/argon2
    role: zod_1.z.enum(["admin", "player"]).default("player"),
    createdAt: zod_1.z.date().default(() => new Date()),
});
exports.tournamentSchema = zod_1.z.object({
    _id: exports.objectIdSchema.optional(),
    name: zod_1.z.string().min(1).max(200),
    sport: zod_1.z.enum(["badminton", "tennis"]),
    category: zod_1.z.enum(["singles", "doubles", "mixed_doubles"]),
    format: zod_1.z.enum(["knockout", "round_robin", "swiss"]),
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    location: zod_1.z.string().min(1).max(200),
    entryFee: zod_1.z.number().min(0).default(0),
    maxParticipants: zod_1.z.number().min(2).max(1000).default(64),
    rules: zod_1.z.string().optional(),
    prizeWinner: zod_1.z.number().min(0).default(0),
    prizeRunnerUp: zod_1.z.number().min(0).default(0),
    prizeSemiFinalist: zod_1.z.number().min(0).default(0),
    status: zod_1.z.enum(["draft", "registration_open", "active", "completed", "cancelled"]).default("draft"),
    createdBy: exports.objectIdSchema,
    createdAt: zod_1.z.date().default(() => new Date()),
});
exports.participantSchema = zod_1.z.object({
    _id: exports.objectIdSchema.optional(),
    tournamentId: exports.objectIdSchema,
    name: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().min(10).max(15),
    email: zod_1.z.string().email().optional(),
    age: zod_1.z.number().min(1).max(100),
    partnerName: zod_1.z.string().max(100).optional(),
    partnerPhone: zod_1.z.string().max(15).optional(),
    skillLevel: zod_1.z.enum(["beginner", "intermediate", "advanced", "professional"]).default("intermediate"),
    society: zod_1.z.string().max(100).optional(),
    apartmentNumber: zod_1.z.string().max(20).optional(),
    emergencyContact: zod_1.z.string().max(100).optional(),
    medicalConditions: zod_1.z.string().max(500).optional(),
    registrationStatus: zod_1.z.enum(["registered", "paid", "eliminated", "withdrawn"]).default("registered"),
    registeredAt: zod_1.z.date().default(() => new Date()),
});
exports.matchSchema = zod_1.z.object({
    _id: exports.objectIdSchema.optional(),
    tournamentId: exports.objectIdSchema,
    round: zod_1.z.string().min(1),
    roundNumber: zod_1.z.number().min(1),
    matchNumber: zod_1.z.number().min(1),
    player1Id: exports.objectIdSchema.optional(),
    player2Id: exports.objectIdSchema.optional(),
    player1Score: zod_1.z.array(zod_1.z.number()).default([]),
    player2Score: zod_1.z.array(zod_1.z.number()).default([]),
    winnerId: exports.objectIdSchema.optional(),
    status: zod_1.z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
    court: zod_1.z.string().optional(),
    scheduledTime: zod_1.z.date().optional(),
    startTime: zod_1.z.date().optional(),
    endTime: zod_1.z.date().optional(),
    notes: zod_1.z.string().optional(),
    createdAt: zod_1.z.date().default(() => new Date()),
});
exports.whatsappGroupSchema = zod_1.z.object({
    _id: exports.objectIdSchema.optional(),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(500),
    location: zod_1.z.string().min(1).max(100),
    sport: zod_1.z.string().min(1).max(50),
    memberCount: zod_1.z.number().min(0).default(0),
    inviteLink: zod_1.z.string().url().optional(),
    contactPerson: zod_1.z.string().max(100).optional(),
    contactPhone: zod_1.z.string().max(15).optional(),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date().default(() => new Date()),
});
// Insert schemas (without _id and createdAt)
exports.insertUserSchema = exports.userSchema.omit({
    _id: true,
    createdAt: true,
});
exports.insertTournamentSchema = exports.tournamentSchema.omit({
    _id: true,
    createdAt: true,
});
exports.insertParticipantSchema = exports.participantSchema.omit({
    _id: true,
    registeredAt: true,
});
exports.insertMatchSchema = exports.matchSchema.omit({
    _id: true,
    createdAt: true,
});
exports.insertWhatsappGroupSchema = exports.whatsappGroupSchema.omit({
    _id: true,
    createdAt: true,
});
// Collection names
exports.COLLECTIONS = {
    USERS: "users",
    TOURNAMENTS: "tournaments",
    PARTICIPANTS: "participants",
    MATCHES: "matches",
    WHATSAPP_GROUPS: "whatsapp_groups",
};
// MongoDB indexes for better performance
exports.INDEXES = {
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
};
