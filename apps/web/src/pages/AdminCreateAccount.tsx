import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { createAdminAccount } from "../lib/api";

export default function AdminCreateAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await createAdminAccount(formData);
      setSuccess(`Admin account created for ${result.user.email}`);
      setFormData({ email: "", password: "", firstName: "", lastName: "" });
      setTimeout(() => navigate("/admin/users"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <h1 className="wf-h1">Create Admin Account</h1>
        <p className="wf-text-sm mt-1" style={{ color: "var(--color-ink-3)" }}>
          Add a new administrator to the platform
        </p>
      </div>

      <div className="wf-card max-w-md">
        {success ? (
          <div className="py-6 text-center">
            <Check size={48} className="mx-auto mb-3 text-green-600" />
            <p className="wf-text font-semibold">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block wf-text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                disabled={loading}
                className="wf-input-box w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block wf-text-sm font-semibold mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  disabled={loading}
                  className="wf-input-box w-full"
                />
              </div>
              <div>
                <label className="block wf-text-sm font-semibold mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  disabled={loading}
                  className="wf-input-box w-full"
                />
              </div>
            </div>

            <div>
              <label className="block wf-text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 6 characters"
                disabled={loading}
                className="wf-input-box w-full"
              />
              <p className="wf-text-xs mt-1" style={{ color: "var(--color-ink-3)" }}>
                Minimum 6 characters
              </p>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 wf-text-sm">{error}</div>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                disabled={loading}
                className="flex-1 wf-btn wf-btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 wf-btn wf-btn-primary">
                {loading ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Permissions Info */}
      <div className="wf-card mt-6 bg-blue-50" style={{ borderColor: "var(--color-border)" }}>
        <h3 className="wf-text-sm font-semibold mb-3">Admin Permissions</h3>
        <ul className="space-y-2 wf-text-sm" style={{ color: "var(--color-ink-3)" }}>
          <li>✓ Manage users (view, ban, suspend)</li>
          <li>✓ Review and moderate reports</li>
          <li>✓ Approve mentor applications</li>
          <li>✓ View all payments and revenue</li>
          <li>✓ Manage programs</li>
          <li>✓ Create additional admin accounts</li>
        </ul>
      </div>
    </div>
  );
}
