import { captureError } from "./sentry";

const API_BASE = "/api";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data: T & { error?: string };
  try {
    data = await res.json();
  } catch {
    const err = new ApiError("Something went wrong", res.status);
    if (res.status >= 500) {
      captureError(err, { path, method: options?.method ?? "GET" });
    }
    throw err;
  }

  if (!res.ok) {
    const err = new ApiError(data.error ?? "Something went wrong", res.status);
    // Only capture server errors (5xx) to Sentry, not client errors (4xx)
    if (res.status >= 500) {
      captureError(err, { path, method: options?.method ?? "GET" });
    }
    throw err;
  }

  return data;
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  let data: T & { error?: string };
  try {
    data = await res.json();
  } catch {
    const err = new ApiError("Something went wrong", res.status);
    if (res.status >= 500) {
      captureError(err, { path, method: "POST" });
    }
    throw err;
  }

  if (!res.ok) {
    const err = new ApiError(data.error ?? "Something went wrong", res.status);
    if (res.status >= 500) {
      captureError(err, { path, method: "POST" });
    }
    throw err;
  }

  return data;
}

export type Role = "MENTEE" | "MENTOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt?: string;
}

export interface MentorProfile {
  id: string;
  userId: string;
  headline: string | null;
  expertise: string[];
  hourlyRate: number | null;
  yearsExperience: number | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillEntry {
  skill: string;
  level: "none" | "beginner" | "intermediate" | "advanced" | "expert";
}

export interface MenteeProfile {
  id: string;
  userId: string;
  goals: string | null;
  interests: string[];
  currentRole: string | null;
  targetRole: string | null;
  skills: SkillEntry[] | null;
  targetIndustry: string | null;
  currentBlocker: string | null;
  learningStyle: "structured" | "exploratory" | "project-based" | null;
  createdAt: string;
  updatedAt: string;
}

export interface FullUserProfile extends AuthUser {
  bio: string | null;
  timezone: string | null;
  mentorProfile: MentorProfile | null;
  menteeProfile: MenteeProfile | null;
}

export interface PublicProfile {
  id: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  mentorProfile: {
    headline: string | null;
    expertise: string[];
    yearsExperience: number | null;
    isApproved: boolean;
  } | null;
}

// Auth endpoints
export function register(email: string, password: string, recaptchaToken?: string) {
  return request<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, ...(recaptchaToken && { recaptchaToken }) }),
  });
}

export function login(email: string, password: string, recaptchaToken?: string) {
  return request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, ...(recaptchaToken && { recaptchaToken }) }),
  });
}

export function logout() {
  return request<{ message: string }>("/auth/logout", { method: "POST" });
}

export function getMe() {
  return request<{ user: AuthUser }>("/auth/me");
}

export function resendVerificationEmail() {
  return request<{ message: string }>("/auth/resend-verification", { method: "POST" });
}

export function verifyEmail(token: string) {
  return request<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function requestReset(email: string) {
  return request<{ message: string }>("/auth/request-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

// User profile endpoints
export function getMyProfile() {
  return request<{ user: FullUserProfile }>("/users/me/profile");
}

export function updateMyProfile(data: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  timezone?: string;
}) {
  return request<{ user: AuthUser }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  return requestFormData<{ user: { id: string; avatarUrl: string }; message: string }>(
    "/users/me/avatar",
    formData
  );
}

export function getPublicProfile(userId: string) {
  return request<{ user: PublicProfile }>(`/users/${userId}`);
}

// Mentor profile endpoints
export function createMentorProfile(data: {
  headline: string;
  expertise: string[];
  hourlyRate?: number;
  yearsExperience?: number;
}) {
  return request<{ mentorProfile: MentorProfile; message: string }>("/mentor/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMentorProfile(data: {
  headline?: string;
  expertise?: string[];
  hourlyRate?: number | null;
  yearsExperience?: number | null;
}) {
  return request<{ mentorProfile: MentorProfile }>("/mentor/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getMyMentorProfile() {
  return request<{ mentorProfile: MentorProfile & { user: AuthUser } }>("/mentor/profile");
}

// Mentee profile endpoints
export interface MenteeProfileInput {
  goals?: string | null;
  interests?: string[];
  currentRole?: string | null;
  targetRole?: string | null;
  skills?: SkillEntry[] | null;
  targetIndustry?: string | null;
  currentBlocker?: string | null;
  learningStyle?: "structured" | "exploratory" | "project-based" | null;
}

export function createMenteeProfile(data: MenteeProfileInput) {
  return request<{ menteeProfile: MenteeProfile }>("/mentee/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMenteeProfile(data: MenteeProfileInput) {
  return request<{ menteeProfile: MenteeProfile }>("/mentee/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getMyMenteeProfile() {
  return request<{ menteeProfile: MenteeProfile & { user: AuthUser } }>("/mentee/profile");
}

// ==================== Sprint 2: Mentor Directory & Programs ====================

// Types
export interface MentorListItem {
  id: string;
  headline: string | null;
  expertise: string[];
  hourlyRate: string | null;
  yearsExperience: number | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  programCount: number;
}

export interface MentorDetail {
  id: string;
  headline: string | null;
  expertise: string[];
  hourlyRate: string | null;
  yearsExperience: number | null;
  isApproved: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: string;
  };
  programs: Program[];
  availability: Availability[];
}

export interface Program {
  id: string;
  mentorId: string;
  title: string;
  description: string | null;
  duration: number;
  sessionCount: number;
  price: string;
  maxParticipants: number;
  topics: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    id: string;
    headline: string | null;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  };
}

export interface Availability {
  id: string;
  mentorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Mentor Directory endpoints
export interface ListMentorsParams {
  page?: number;
  limit?: number;
  search?: string;
  expertise?: string;
  minRate?: number;
  maxRate?: number;
  minExperience?: number;
}

export function listMentors(params: ListMentorsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.expertise) searchParams.set("expertise", params.expertise);
  if (params.minRate) searchParams.set("minRate", params.minRate.toString());
  if (params.maxRate) searchParams.set("maxRate", params.maxRate.toString());
  if (params.minExperience) searchParams.set("minExperience", params.minExperience.toString());

  const query = searchParams.toString();
  return request<{ mentors: MentorListItem[]; pagination: Pagination }>(
    `/mentors${query ? `?${query}` : ""}`
  );
}

export function getMentor(mentorId: string) {
  return request<{ mentor: MentorDetail }>(`/mentors/${mentorId}`);
}

export function getMentorAvailability(mentorId: string) {
  return request<{ availability: Availability[] }>(`/mentors/${mentorId}/availability`);
}

// Program endpoints
export interface ListProgramsParams {
  page?: number;
  limit?: number;
  search?: string;
  topic?: string;
  minPrice?: number;
  maxPrice?: number;
  mentorId?: string;
}

export function listPrograms(params: ListProgramsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.topic) searchParams.set("topic", params.topic);
  if (params.minPrice) searchParams.set("minPrice", params.minPrice.toString());
  if (params.maxPrice) searchParams.set("maxPrice", params.maxPrice.toString());
  if (params.mentorId) searchParams.set("mentorId", params.mentorId);

  const query = searchParams.toString();
  return request<{ programs: Program[]; pagination: Pagination }>(
    `/programs${query ? `?${query}` : ""}`
  );
}

export function getProgram(programId: string) {
  return request<{ program: Program }>(`/programs/${programId}`);
}

export function getMyPrograms() {
  return request<{ programs: Program[] }>("/programs/my");
}

export function createProgram(data: {
  title: string;
  description?: string;
  duration: number;
  sessionCount?: number;
  price: number;
  maxParticipants?: number;
  topics?: string[];
  isPublished?: boolean;
}) {
  return request<{ program: Program }>("/programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProgram(
  programId: string,
  data: {
    title?: string;
    description?: string | null;
    duration?: number;
    sessionCount?: number;
    price?: number;
    maxParticipants?: number;
    topics?: string[];
    isPublished?: boolean;
  }
) {
  return request<{ program: Program }>(`/programs/${programId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProgram(programId: string) {
  return request<{ message: string }>(`/programs/${programId}`, {
    method: "DELETE",
  });
}

// Availability endpoints
export function getMyAvailability() {
  return request<{ availability: Availability[] }>("/availability");
}

export function addAvailability(data: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone?: string;
}) {
  return request<{ availability: Availability }>("/availability", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function setAvailabilityBulk(data: {
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  timezone?: string;
}) {
  return request<{ availability: Availability[]; message: string }>("/availability/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteAvailability(slotId: string) {
  return request<{ message: string }>(`/availability/${slotId}`, {
    method: "DELETE",
  });
}

// ==================== Sprint 3: Booking & Sessions ====================

export type BookingStatus = "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface BookingSession {
  id: string;
  scheduledAt: string;
  duration: number;
  status: SessionStatus;
  meetingUrl: string | null;
  mentorNotes: string | null;
  menteeFeedback: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  programId: string;
  menteeId: string;
  mentorId: string;
  status: BookingStatus;
  totalPrice: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  program: {
    id: string;
    title: string;
    duration: number;
    sessionCount: number;
    topics: string[];
    description?: string | null;
    price?: string;
  };
  mentor: {
    id: string;
    headline: string | null;
    user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  };
  mentee: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    email?: string;
  };
  sessions: BookingSession[];
}

export interface SessionDetail {
  id: string;
  bookingId: string;
  scheduledAt: string;
  duration: number;
  status: SessionStatus;
  meetingUrl: string | null;
  mentorNotes: string | null;
  menteeFeedback: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    status: BookingStatus;
    program: { id: string; title: string; duration: number; sessionCount: number };
    mentor: {
      id: string;
      headline: string | null;
      user: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
    };
    mentee: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
  };
}

// Booking endpoints
export function createBooking(data: { programId: string; note?: string }) {
  return request<{ booking: Booking }>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listMyBookings() {
  return request<{ bookings: Booking[] }>("/bookings");
}

export function getBooking(bookingId: string) {
  return request<{ booking: Booking }>(`/bookings/${bookingId}`);
}

export function confirmBooking(bookingId: string) {
  return request<{ booking: Booking }>(`/bookings/${bookingId}/confirm`, { method: "PATCH" });
}

export function cancelBooking(bookingId: string) {
  return request<{ booking: Booking }>(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
}

export function scheduleSession(bookingId: string, data: { scheduledAt: string; meetingUrl?: string }) {
  return request<{ session: BookingSession }>(`/bookings/${bookingId}/sessions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Session endpoints
export function listMySessions() {
  return request<{ sessions: SessionDetail[] }>("/sessions");
}

export function getSession(sessionId: string) {
  return request<{ session: SessionDetail }>(`/sessions/${sessionId}`);
}

export function completeSession(sessionId: string, data: {
  mentorNotes?: string;
  menteeFeedback?: string;
  rating?: number;
}) {
  return request<{ session: BookingSession }>(`/sessions/${sessionId}/complete`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function cancelSession(sessionId: string) {
  return request<{ session: BookingSession }>(`/sessions/${sessionId}/cancel`, { method: "PATCH" });
}

// ==================== Sprint 4: Messaging & Reviews ====================

export interface ConversationParticipant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: ConversationParticipant;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  participant1: ConversationParticipant;
  participant2: ConversationParticipant;
  other: ConversationParticipant;
  messages: Pick<ChatMessage, "id" | "content" | "senderId" | "isRead" | "createdAt">[];
  unreadCount: number;
}

export interface Review {
  id: string;
  mentorId: string;
  menteeId: string;
  bookingId: string;
  rating: number;
  title: string | null;
  content: string;
  response: string | null;
  createdAt: string;
  updatedAt: string;
  mentee: ConversationParticipant;
}

// Conversation endpoints
export function listConversations() {
  return request<{ conversations: Conversation[] }>("/conversations");
}

export function startConversation(recipientId: string) {
  return request<{ conversation: Conversation & { messages: ChatMessage[] } }>("/conversations", {
    method: "POST",
    body: JSON.stringify({ recipientId }),
  });
}

export function getMessages(conversationId: string, page = 1) {
  return request<{ messages: ChatMessage[]; pagination: Pagination }>(
    `/conversations/${conversationId}/messages?page=${page}`
  );
}

export function sendMessage(conversationId: string, content: string) {
  return request<{ message: ChatMessage }>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// Review endpoints
export function getMentorReviews(mentorId: string, page = 1) {
  return request<{
    reviews: Review[];
    averageRating: number | null;
    totalReviews: number;
    pagination: Pagination;
  }>(`/reviews/mentor/${mentorId}?page=${page}`);
}

export function createReview(data: {
  bookingId: string;
  rating: number;
  title?: string;
  content: string;
}) {
  return request<{ review: Review }>("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function respondToReview(reviewId: string, response: string) {
  return request<{ review: Review }>(`/reviews/${reviewId}/response`, {
    method: "PATCH",
    body: JSON.stringify({ response }),
  });
}

// ─── Sprint 5: Goals, Resources & Files ───────────────────────────────────────

export type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
export type FileType = "DOCUMENT" | "VIDEO" | "LINK" | "IMAGE" | "OTHER";

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface GoalBooking {
  id: string;
  program: { id: string; title: string };
}

export interface Goal {
  id: string;
  menteeId: string;
  bookingId: string | null;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: GoalStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
  booking: GoalBooking | null;
}

export interface ResourceUploader {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface Resource {
  id: string;
  uploaderId: string;
  programId: string | null;
  bookingId: string | null;
  title: string;
  filePath: string | null;
  fileSize: number | null;
  mimeType: string | null;
  fileType: FileType;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  uploader: ResourceUploader;
}

// Goal endpoints
export function listGoals(status?: GoalStatus) {
  const qs = status ? `?status=${status}` : "";
  return request<{ goals: Goal[] }>(`/goals${qs}`);
}

export function createGoal(data: { title: string; description?: string; targetDate?: string; bookingId?: string }) {
  return request<{ goal: Goal }>("/goals", { method: "POST", body: JSON.stringify(data) });
}

export function getGoal(id: string) {
  return request<{ goal: Goal }>(`/goals/${id}`);
}

export function updateGoal(id: string, data: { title?: string; description?: string; targetDate?: string | null; status?: GoalStatus; progress?: number }) {
  return request<{ goal: Goal }>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteGoal(id: string) {
  return request<{ message: string }>(`/goals/${id}`, { method: "DELETE" });
}

export function addMilestone(goalId: string, title: string) {
  return request<{ milestone: Milestone }>(`/goals/${goalId}/milestones`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function toggleMilestone(goalId: string, milestoneId: string) {
  return request<{ milestone: Milestone; progress: number }>(`/goals/${goalId}/milestones/${milestoneId}`, {
    method: "PATCH",
  });
}

// Resource endpoints
export function listResources() {
  return request<{ resources: Resource[] }>("/resources");
}

export function getResource(id: string) {
  return request<{ resource: Resource }>(`/resources/${id}`);
}

export function uploadResourceFile(formData: FormData) {
  return fetch("/api/resources", {
    method: "POST",
    credentials: "include",
    body: formData,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    return data as { resource: Resource };
  });
}

export function deleteResource(id: string) {
  return request<{ message: string }>(`/resources/${id}`, { method: "DELETE" });
}

// ─── Sprint 6: Admin Panel & Payments ─────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  totalPrograms: number;
  totalBookings: number;
  activeBookings: number;
  totalSessions: number;
  activeSessions: number;
  pendingMentors: number;
  pendingReports: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isVerified: boolean;
  isBanned: boolean;
  suspendedUntil: string | null;
  createdAt: string;
  avatarUrl: string | null;
  mentorProfile: { id: string; isApproved: boolean; headline: string | null } | null;
}

export interface PendingMentor {
  id: string;
  userId: string;
  headline: string | null;
  expertise: string[];
  hourlyRate: string | null;
  yearsExperience: number | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null };
}

export interface AdminProgram {
  id: string;
  title: string;
  isPublished: boolean;
  price: string;
  sessionCount: number;
  createdAt: string;
  mentor: { id: string; user: { firstName: string | null; lastName: string | null; email: string } };
  _count: { bookings: number };
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  bookingId: string;
  amount: string;
  status: PaymentStatus;
  stripePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    totalPrice: string;
    program: { id?: string; title: string };
    mentee?: { id: string; firstName: string | null; lastName: string | null; email: string };
    mentor?: { user: { firstName: string | null; lastName: string | null } };
  };
}

// Admin endpoints
export function getAdminStats() {
  return request<{ stats: AdminStats }>("/admin/stats");
}

export function listAdminUsers(params?: { page?: number; search?: string; role?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.search) qs.set("search", params.search);
  if (params?.role) qs.set("role", params.role);
  const q = qs.toString();
  return request<{ users: AdminUser[]; pagination: Pagination }>(`/admin/users${q ? `?${q}` : ""}`);
}

export function updateAdminUser(id: string, data: { role?: Role; isVerified?: boolean }) {
  return request<{ user: AdminUser }>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function listPendingMentors() {
  return request<{ mentors: PendingMentor[] }>("/admin/mentors/pending");
}

export function approveMentor(id: string) {
  return request<{ mentor: PendingMentor }>(`/admin/mentors/${id}/approve`, { method: "PATCH" });
}

export function rejectMentor(id: string) {
  return request<{ message: string }>(`/admin/mentors/${id}`, { method: "DELETE" });
}

export function listAllMentors(filter?: "pending" | "approved") {
  const q = filter ? `?filter=${filter}` : "";
  return request<{ mentors: PendingMentor[] }>(`/admin/mentors${q}`);
}

export function listAdminPrograms(params?: { page?: number; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return request<{ programs: AdminProgram[]; pagination: Pagination }>(`/admin/programs${q ? `?${q}` : ""}`);
}

export function toggleProgramPublished(id: string, isPublished: boolean) {
  return request<{ program: AdminProgram }>(`/admin/programs/${id}`, { method: "PATCH", body: JSON.stringify({ isPublished }) });
}

export function deleteAdminProgram(id: string) {
  return request<{ message: string }>(`/admin/programs/${id}`, { method: "DELETE" });
}

// Payment endpoints
export function listMyPayments() {
  return request<{ payments: Payment[] }>("/payments");
}

export function listMentorPayments(page = 1) {
  return request<{ payments: Payment[]; totalEarnings: number; pagination: Pagination }>(`/payments/mentor?page=${page}`);
}

export function recordPayment(data: { bookingId: string; stripePaymentId?: string }) {
  return request<{ payment: Payment }>("/payments", { method: "POST", body: JSON.stringify(data) });
}

export function listAdminPayments(page = 1) {
  return request<{ payments: Payment[]; totalRevenue: number; pagination: Pagination }>(`/payments/admin?page=${page}`);
}

export function updatePaymentStatus(id: string, status: PaymentStatus) {
  return request<{ payment: Payment }>(`/payments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function initiateCheckout(bookingId: string) {
  return request<{ payment: Payment; checkoutSession: { id: string; url: string } }>("/payments/checkout", {
    method: "POST",
    body: JSON.stringify({ bookingId }),
  });
}

export function confirmPayment(paymentId: string) {
  return request<{ payment: Payment }>(`/payments/${paymentId}/confirm`, { method: "POST" });
}

// Report types and endpoints
export type ReportReason =
  | "HARASSMENT"
  | "SPAM"
  | "INAPPROPRIATE_CONTENT"
  | "FAKE_PROFILE"
  | "OTHER";

export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  messageId?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; email: string; firstName: string | null; lastName: string | null };
  reported?: { id: string; email: string; firstName: string | null; lastName: string | null };
  message?: { id: string; content: string; createdAt?: string };
}

export function fileReport(data: { reportedId: string; messageId?: string; reason: ReportReason; description?: string }) {
  return request<{ report: Report }>("/reports", { method: "POST", body: JSON.stringify(data) });
}

export function listAdminReports(params?: { page?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  return request<{ reports: Report[]; pagination: Pagination }>(`/admin/reports${q ? `?${q}` : ""}`);
}

export function updateAdminReport(id: string, data: { status?: ReportStatus; adminNotes?: string }) {
  return request<{ report: Report }>(`/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function banUser(userId: string, isBanned: boolean) {
  return request<{ user: AdminUser }>(`/admin/users/${userId}/ban`, { method: "PATCH", body: JSON.stringify({ isBanned }) });
}

export function suspendUser(userId: string, suspendedUntil: string | null) {
  return request<{ user: AdminUser }>(`/admin/users/${userId}/suspend`, { method: "PATCH", body: JSON.stringify({ suspendedUntil }) });
}

export function createAdminAccount(data: { email: string; password: string; firstName: string; lastName: string }) {
  return request<{ user: AuthUser }>("/admin/users/create", { method: "POST", body: JSON.stringify(data) });
}

// ---------------------------------------------------------------------------
// AI endpoints (Sprint 13)
// ---------------------------------------------------------------------------

export interface AiMentorRecommendation {
  mentorId: string;
  score: number;
  reason: string;
}

export interface AiCompatibilityScore {
  score: number;
  breakdown: {
    expertiseOverlap: number;
    goalAlignment: number;
    timezoneMatch: boolean;
  };
  explanation: string;
}

export interface AiProfileQuality {
  score: number;
  suggestions: string[];
}

export function getMentorRecommendations() {
  return request<{ recommendations: AiMentorRecommendation[]; profileInsufficient: boolean }>("/ai/mentor-recommendations");
}

export function getCompatibilityScore(mentorId: string) {
  return request<AiCompatibilityScore>(`/ai/compatibility/${mentorId}`);
}

export function getGoalMentors(goalId: string) {
  return request<{ mentors: AiMentorRecommendation[] }>(`/ai/goal-mentors/${goalId}`);
}

export function getProfileQuality() {
  return request<AiProfileQuality>("/ai/profile-quality");
}

// ---------------------------------------------------------------------------
// AI endpoints (Sprint 14 — Session Intelligence)
// ---------------------------------------------------------------------------

export interface AiAgendaItem {
  item: string;
  rationale: string;
  estimatedMinutes: number;
}

export interface AiSessionSummary {
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  followUpQuestions: string[];
}

export function getSessionAgenda(sessionId: string) {
  return request<{ agenda: AiAgendaItem[] }>(`/ai/sessions/${sessionId}/agenda`);
}

export function generateSessionSummary(sessionId: string, data: { mentorNotes?: string; menteeFeedback?: string }) {
  return request<{ summary: AiSessionSummary }>(`/ai/sessions/${sessionId}/summary`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function extractActionItems(sessionId: string) {
  return request<{ created: number; milestones: unknown[]; note?: string }>(`/ai/sessions/${sessionId}/action-items`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// AI endpoints (Sprint 15 — Goal Intelligence)
// ---------------------------------------------------------------------------

export interface AiMilestone {
  title: string;
  description?: string;
  order: number;
  suggestedWeeks: number;
}

export interface AiLearningStage {
  stage: string;
  focus: string;
  resourceTypes: string[];
  estimatedDuration: string;
}

export interface AiPrediction {
  likelihood: number;
  predictedDate: string | null;
  trajectory: "completed" | "on-track" | "at-risk" | "off-track";
  progress: number;
  completedSessions: number;
}

export interface AiResource {
  topic: string;
  resourceType: string;
  searchQuery: string;
  rationale: string;
}

export interface AiInsights {
  highlights: string[];
  stalledAreas: string[];
  recommendations: string[];
  sessionFrequency: string;
}

export function generateMicroMilestones(data: { title: string; description?: string }) {
  return request<{ milestones: AiMilestone[] }>("/ai/goals/micro-milestones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getLearningPath(goalId: string) {
  return request<{ path: AiLearningStage[] }>(`/ai/goals/${goalId}/learning-path`);
}

export function getGoalPrediction(goalId: string) {
  return request<AiPrediction>(`/ai/goals/${goalId}/prediction`);
}

export function getGoalResources(goalId: string) {
  return request<{ resources: AiResource[] }>(`/ai/goals/${goalId}/resources`);
}

export function getProgressInsights() {
  return request<{ insights: AiInsights; cached: boolean }>("/ai/insights");
}
