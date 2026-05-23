import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import LoadingState from "./components/LoadingState";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const BecomeMentor = lazy(() => import("./pages/BecomeMentor"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const MentorDirectory = lazy(() => import("./pages/MentorDirectory"));
const MentorDetail = lazy(() => import("./pages/MentorDetail"));
const ProgramList = lazy(() => import("./pages/ProgramList"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const ManagePrograms = lazy(() => import("./pages/ManagePrograms"));
const ManageAvailability = lazy(() => import("./pages/ManageAvailability"));
const BookProgram = lazy(() => import("./pages/BookProgram"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetail = lazy(() => import("./pages/BookingDetail"));
const BookingCancelled = lazy(() => import("./pages/BookingCancelled"));
const SessionDetail = lazy(() => import("./pages/SessionDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const LeaveReview = lazy(() => import("./pages/LeaveReview"));
const Goals = lazy(() => import("./pages/Goals"));
const GoalNew = lazy(() => import("./pages/GoalNew"));
const GoalDetail = lazy(() => import("./pages/GoalDetail"));
const Resources = lazy(() => import("./pages/Resources"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLayout = lazy(() => import("./pages/AdminDashboard").then((module) => ({ default: module.AdminLayout })));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminMentors = lazy(() => import("./pages/AdminMentors"));
const AdminPrograms = lazy(() => import("./pages/AdminPrograms"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminCreateAccount = lazy(() => import("./pages/AdminCreateAccount"));
const PaymentCheckout = lazy(() => import("./pages/PaymentCheckout"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const MentorPayments = lazy(() => import("./pages/MentorPayments"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

function RouteFallback() {
  return <LoadingState title="Loading page" message="Building the next screen..." lines={4} />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState fullScreen title="Checking your session" message="Securing your dashboard access." />;
  if (!user) return <Navigate to="/login" />;
  if (!user.isVerified) return <Navigate to="/verify-email?sent=true" />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState fullScreen title="Checking your session" message="Preparing your sign-in flow." />;
  if (user) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState fullScreen title="Verifying admin access" message="Checking permissions and policy." />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "ADMIN") return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function App() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/mentors" element={<MentorDirectory />} />
          <Route path="/mentors/:id" element={<MentorDetail />} />
          <Route path="/programs" element={<ProgramList />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Guest only */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/become-mentor" element={<ProtectedRoute><BecomeMentor /></ProtectedRoute>} />
          <Route path="/mentor/programs" element={<ProtectedRoute><ManagePrograms /></ProtectedRoute>} />
          <Route path="/mentor/availability" element={<ProtectedRoute><ManageAvailability /></ProtectedRoute>} />
          <Route path="/programs/:id/book" element={<ProtectedRoute><BookProgram /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
          <Route path="/bookings/cancelled" element={<ProtectedRoute><BookingCancelled /></ProtectedRoute>} />
          <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/bookings/:id/review" element={<ProtectedRoute><LeaveReview /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/goals/new" element={<ProtectedRoute><GoalNew /></ProtectedRoute>} />
          <Route path="/goals/:id" element={<ProtectedRoute><GoalDetail /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/checkout/:bookingId" element={<ProtectedRoute><PaymentCheckout /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          <Route path="/mentor/payments" element={<ProtectedRoute><MentorPayments /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/create" element={<AdminCreateAccount />} />
            <Route path="mentors" element={<AdminMentors />} />
            <Route path="programs" element={<AdminPrograms />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </div>
  );
}

export default App;
