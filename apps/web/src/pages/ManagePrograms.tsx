import { useState, useEffect } from "react";
import { getMyPrograms, deleteProgram, updateProgram } from "../lib/api";
import type { Program } from "../lib/api";
import ProgramForm from "../components/ProgramForm";
import { useToast } from "../context/ToastContext";

export default function ManagePrograms() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function loadPrograms() {
    try {
      const data = await getMyPrograms();
      setPrograms(data.programs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPrograms();
  }, []);

  function handleFormSuccess(program: Program) {
    const wasEditing = Boolean(editingProgram);
    if (editingProgram) {
      setPrograms((prev) => prev.map((p) => (p.id === program.id ? program : p)));
    } else {
      setPrograms((prev) => [program, ...prev]);
    }
    setShowForm(false);
    setEditingProgram(null);
    toast(wasEditing ? "Program updated" : "Program created", "success");
  }

  function handleEdit(program: Program) {
    setEditingProgram(program);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingProgram(null);
  }

  async function handleTogglePublish(program: Program) {
    try {
      const res = await updateProgram(program.id, { isPublished: !program.isPublished });
      setPrograms((prev) => prev.map((p) => (p.id === program.id ? res.program : p)));
      toast(res.program.isPublished ? "Program published" : "Program moved to draft", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update program", "error");
    }
  }

  async function handleDelete(programId: string) {
    if (deleteConfirmId !== programId) {
      setDeleteConfirmId(programId);
      toast("Press delete again to confirm program removal", "warning");
      setTimeout(() => {
        setDeleteConfirmId((current) => (current === programId ? null : current));
      }, 5000);
      return;
    }

    try {
      await deleteProgram(programId);
      setPrograms((prev) => prev.filter((p) => p.id !== programId));
      setDeleteConfirmId(null);
      toast("Program deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete program", "error");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <div className="wf-page">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="wf-h1">My Programs</h1>
            <p className="wf-text-sm mt-1">Create and manage your mentorship programs</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setEditingProgram(null); setShowForm(true); }}
              className="wf-btn wf-btn-primary"
            >
              + New Program
            </button>
          )}
        </div>

        {/* Inline create/edit form */}
        {showForm && (
          <div className="wf-card mb-6">
            <div className="wf-card-header -mx-5 -mt-5 mb-4 px-5">
              {editingProgram ? "Edit Program" : "Create New Program"}
            </div>
            <ProgramForm
              existing={editingProgram ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Program list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="wf-card space-y-3">
                <div className="h-4 w-1/2" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
                <div className="h-3 w-full" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="wf-text" style={{ color: "var(--color-error)" }}>{error}</p>
        ) : programs.length === 0 && !showForm ? (
          <div className="wf-empty">
            <p className="wf-empty-title">No programs yet</p>
            <p className="wf-empty-text">Create your first mentorship program to get started.</p>
          </div>
        ) : (
          <div className="wf-card-flush">
            <table className="wf-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr key={program.id}>
                    <td>
                      <p className="wf-text font-semibold">{program.title}</p>
                      {program.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {program.topics.map((t) => (
                            <span key={t} className="wf-tag">{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="wf-text-sm">
                        {program.sessionCount} sessions · {program.duration} min · ${parseFloat(program.price)}
                      </span>
                    </td>
                    <td>
                      <span className={`wf-badge ${program.isPublished ? "wf-badge-success" : "wf-badge-neutral"}`}>
                        {program.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePublish(program)}
                          className="wf-btn wf-btn-secondary"
                        >
                          {program.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => handleEdit(program)}
                          className="wf-btn wf-btn-secondary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(program.id)}
                          className="wf-btn wf-btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
