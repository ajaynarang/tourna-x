import { z } from "zod";
export declare const objectIdSchema: z.ZodString;
export declare const userSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    username: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        admin: "admin";
        player: "player";
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const tournamentSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    sport: z.ZodEnum<{
        badminton: "badminton";
        tennis: "tennis";
    }>;
    category: z.ZodEnum<{
        singles: "singles";
        doubles: "doubles";
        mixed_doubles: "mixed_doubles";
    }>;
    format: z.ZodEnum<{
        knockout: "knockout";
        round_robin: "round_robin";
        swiss: "swiss";
    }>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    location: z.ZodString;
    entryFee: z.ZodDefault<z.ZodNumber>;
    maxParticipants: z.ZodDefault<z.ZodNumber>;
    rules: z.ZodOptional<z.ZodString>;
    prizeWinner: z.ZodDefault<z.ZodNumber>;
    prizeRunnerUp: z.ZodDefault<z.ZodNumber>;
    prizeSemiFinalist: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        registration_open: "registration_open";
        active: "active";
        completed: "completed";
        cancelled: "cancelled";
    }>>;
    createdBy: z.ZodString;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const participantSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    tournamentId: z.ZodString;
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    age: z.ZodNumber;
    partnerName: z.ZodOptional<z.ZodString>;
    partnerPhone: z.ZodOptional<z.ZodString>;
    skillLevel: z.ZodDefault<z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
        professional: "professional";
    }>>;
    society: z.ZodOptional<z.ZodString>;
    apartmentNumber: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    medicalConditions: z.ZodOptional<z.ZodString>;
    registrationStatus: z.ZodDefault<z.ZodEnum<{
        registered: "registered";
        paid: "paid";
        eliminated: "eliminated";
        withdrawn: "withdrawn";
    }>>;
    registeredAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const matchSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    tournamentId: z.ZodString;
    round: z.ZodString;
    roundNumber: z.ZodNumber;
    matchNumber: z.ZodNumber;
    player1Id: z.ZodOptional<z.ZodString>;
    player2Id: z.ZodOptional<z.ZodString>;
    player1Score: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    player2Score: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    winnerId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        completed: "completed";
        cancelled: "cancelled";
        scheduled: "scheduled";
        in_progress: "in_progress";
    }>>;
    court: z.ZodOptional<z.ZodString>;
    scheduledTime: z.ZodOptional<z.ZodDate>;
    startTime: z.ZodOptional<z.ZodDate>;
    endTime: z.ZodOptional<z.ZodDate>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const whatsappGroupSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    location: z.ZodString;
    sport: z.ZodString;
    memberCount: z.ZodDefault<z.ZodNumber>;
    inviteLink: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const insertUserSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        admin: "admin";
        player: "player";
    }>>;
}, z.core.$strip>;
export declare const insertTournamentSchema: z.ZodObject<{
    format: z.ZodEnum<{
        knockout: "knockout";
        round_robin: "round_robin";
        swiss: "swiss";
    }>;
    createdBy: z.ZodString;
    name: z.ZodString;
    sport: z.ZodEnum<{
        badminton: "badminton";
        tennis: "tennis";
    }>;
    category: z.ZodEnum<{
        singles: "singles";
        doubles: "doubles";
        mixed_doubles: "mixed_doubles";
    }>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    location: z.ZodString;
    entryFee: z.ZodDefault<z.ZodNumber>;
    maxParticipants: z.ZodDefault<z.ZodNumber>;
    rules: z.ZodOptional<z.ZodString>;
    prizeWinner: z.ZodDefault<z.ZodNumber>;
    prizeRunnerUp: z.ZodDefault<z.ZodNumber>;
    prizeSemiFinalist: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        registration_open: "registration_open";
        active: "active";
        completed: "completed";
        cancelled: "cancelled";
    }>>;
}, z.core.$strip>;
export declare const insertParticipantSchema: z.ZodObject<{
    name: z.ZodString;
    tournamentId: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    age: z.ZodNumber;
    partnerName: z.ZodOptional<z.ZodString>;
    partnerPhone: z.ZodOptional<z.ZodString>;
    skillLevel: z.ZodDefault<z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
        professional: "professional";
    }>>;
    society: z.ZodOptional<z.ZodString>;
    apartmentNumber: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    medicalConditions: z.ZodOptional<z.ZodString>;
    registrationStatus: z.ZodDefault<z.ZodEnum<{
        registered: "registered";
        paid: "paid";
        eliminated: "eliminated";
        withdrawn: "withdrawn";
    }>>;
}, z.core.$strip>;
export declare const insertMatchSchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<{
        completed: "completed";
        cancelled: "cancelled";
        scheduled: "scheduled";
        in_progress: "in_progress";
    }>>;
    tournamentId: z.ZodString;
    round: z.ZodString;
    roundNumber: z.ZodNumber;
    matchNumber: z.ZodNumber;
    player1Id: z.ZodOptional<z.ZodString>;
    player2Id: z.ZodOptional<z.ZodString>;
    player1Score: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    player2Score: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    winnerId: z.ZodOptional<z.ZodString>;
    court: z.ZodOptional<z.ZodString>;
    scheduledTime: z.ZodOptional<z.ZodDate>;
    startTime: z.ZodOptional<z.ZodDate>;
    endTime: z.ZodOptional<z.ZodDate>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const insertWhatsappGroupSchema: z.ZodObject<{
    name: z.ZodString;
    sport: z.ZodString;
    location: z.ZodString;
    description: z.ZodString;
    memberCount: z.ZodDefault<z.ZodNumber>;
    inviteLink: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
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
export declare const COLLECTIONS: {
    readonly USERS: "users";
    readonly TOURNAMENTS: "tournaments";
    readonly PARTICIPANTS: "participants";
    readonly MATCHES: "matches";
    readonly WHATSAPP_GROUPS: "whatsapp_groups";
};
export declare const INDEXES: {
    readonly USERS: readonly [{
        readonly username: 1;
    }];
    readonly TOURNAMENTS: readonly [{
        readonly createdBy: 1;
    }, {
        readonly status: 1;
    }, {
        readonly sport: 1;
    }, {
        readonly createdAt: -1;
    }];
    readonly PARTICIPANTS: readonly [{
        readonly tournamentId: 1;
    }, {
        readonly registeredAt: -1;
    }];
    readonly MATCHES: readonly [{
        readonly tournamentId: 1;
    }, {
        readonly roundNumber: 1;
    }, {
        readonly status: 1;
    }, {
        readonly createdAt: -1;
    }];
    readonly WHATSAPP_GROUPS: readonly [{
        readonly sport: 1;
    }, {
        readonly location: 1;
    }, {
        readonly isActive: 1;
    }, {
        readonly memberCount: -1;
    }];
};
//# sourceMappingURL=index.d.ts.map