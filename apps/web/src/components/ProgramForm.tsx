import { useState } from "react";
import { createProgram, updateProgram } from "../lib/api";
import type { Program } from "../lib/api";
import SkillTagInput from "./SkillTagInput";

interface ProgramFormProps {
  existing?: Program;
  onSuccess: (program: Program) => void;
  onCancel: () => void;
}

export default function ProgramForm({ existing, onSuccess, onCancel }: ProgramFormProps) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [duration, setDuration] = useState(existing?.duration?.toString() ?? "60");
  const [sessionCount, setSessionCount] = useState(existing?.sessionCount?.toString() ?? "1");
  const [price, setPrice] = useState(existing ? parseFloat(existing.price).toString() : "0");
  const [maxParticipants, setMaxParticipants] = useState(existing?.maxParticipants?.toString() ?? "1");
  const [topics, setTopics] = useState<string[]>(existing?.topics ?? []);
  const [isPublished, setIsPublished] = useState(existing?.isPublished ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const data = {
      title,
      description: description || undefined,
      duration: parseInt(duration, 10),
      sessionCount: parseInt(sessionCount, 10),
      price: parseFloat(price),
      maxParticipants: parseInt(maxParticipants, 10),
      topics,
      isPublished,
    };

    if (!data.title || data.title.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }
    if (!data.duration || data.duration < 15) {
      setError("Duration must be at least 15 minutes");
      return;
    }
    if (isNaN(data.price) || data.price < 0) {
      setError("Price must be 0 or greater");
      return;
    }

    setIsSubmitting(true);
    try {
      let result: Program;
      if (existing) {
        const res = await updateProgram(existing.id, data);
        result = res.program;
      } else {
        const res = await createProgram(data);
        result = res.program;
      }
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save program");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="wf-label">
          Program Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g., Full-Stack Development Bootcamp"
          className="wf-input"
        />
      </div>

      <div>
        <label htmlFor="description" className="wf-label">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What will mentees learn? What's included?"
          className="wf-textarea"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration" className="wf-label">
            Session Duration (min) *
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="wf-select"
          >
            {[15, 30, 45, 60, 90, 120].map((d) => (
              <option key={d} value={d}>{d} minutes</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sessionCount" className="wf-label">
            Number of Sessions *
          </label>
          <input
            id="sessionCount"
            type="number"
            min="1"
            max="100"
            value={sessionCount}
            onChange={(e) => setSessionCount(e.target.value)}
            className="wf-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="wf-label">
            Price (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-3 wf-text">$</span>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="wf-input pl-4"
            />
          </div>
          <p className="wf-help-text">Set to 0 for free programs</p>
        </div>

        <div>
          <label htmlFor="maxParticipants" className="wf-label">
            Max Participants
          </label>
          <input
            id="maxParticipants"
            type="number"
            min="1"
            max="50"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            className="wf-input"
          />
        </div>
      </div>

      <SkillTagInput
        label="Topics"
        tags={topics}
        onChange={setTopics}
        maxTags={10}
        placeholder="e.g., React, Career, System Design"
      />

      <div className="flex items-center gap-3">
        <input
          id="isPublished"
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="w-3 h-3 accent-ink"
        />
        <label htmlFor="isPublished" className="wf-text text-ink-2">
          Publish this program (visible to mentees)
        </label>
      </div>

      {error && <p className="wf-error-text">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="wf-btn wf-btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="wf-btn wf-btn-primary flex-1"
        >
          {isSubmitting ? "Saving..." : existing ? "Update Program" : "Create Program"}
        </button>
      </div>
    </form>
  );
}
