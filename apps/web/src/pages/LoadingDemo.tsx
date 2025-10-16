/**
 * Loading Components Demo Page
 * Showcases all loading animations in the MentorHub design system
 */

import { useState } from "react";
import {
  Spinner,
  CircularSpinner,
  LoadingDots,
  LoadingBounce,
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonCard,
  SkeletonMentorCard,
  SkeletonTableRow,
  ProgressBar,
  PageLoader,
  InlineLoader,
  LoadingButton,
  LoadingStagger,
} from "../components/LoadingComponents";

export default function LoadingDemo() {
  const [progress, setProgress] = useState(45);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [showPageLoader, setShowPageLoader] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <div className="wf-page">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="wf-page-header">
          <p className="wf-eyebrow mb-2">Design System</p>
          <h1 className="wf-h1 mb-3">Loading Animations</h1>
          <p className="wf-text" style={{ color: "var(--color-ink-2)" }}>
            Warm, trustworthy, and energizing loading states for MentorHub.
          </p>
        </header>

        {/* Spinners */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Spinners</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <Spinner size="xs" />
              <p className="wf-text-xs mt-2">xs</p>
            </div>
            <div className="text-center">
              <Spinner size="sm" />
              <p className="wf-text-xs mt-2">sm</p>
            </div>
            <div className="text-center">
              <Spinner size="md" />
              <p className="wf-text-xs mt-2">md</p>
            </div>
            <div className="text-center">
              <Spinner size="lg" />
              <p className="wf-text-xs mt-2">lg</p>
            </div>
            <div className="text-center">
              <Spinner size="xl" />
              <p className="wf-text-xs mt-2">xl</p>
            </div>
            <div className="text-center">
              <Spinner size="md" color="accent" />
              <p className="wf-text-xs mt-2">accent</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--color-blue)" }}>
              <Spinner size="md" color="white" />
              <p className="wf-text-xs mt-2 text-white">white</p>
            </div>
          </div>
        </section>

        {/* Circular Spinner */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Circular SVG Spinner</h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <CircularSpinner size={20} strokeWidth={2} />
              <p className="wf-text-xs mt-2">20px</p>
            </div>
            <div className="text-center">
              <CircularSpinner size={28} strokeWidth={3} />
              <p className="wf-text-xs mt-2">28px</p>
            </div>
            <div className="text-center">
              <CircularSpinner size={40} strokeWidth={4} />
              <p className="wf-text-xs mt-2">40px</p>
            </div>
          </div>
        </section>

        {/* Loading Dots & Bounce */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Dots & Bounce</h2>
          <div className="flex flex-wrap items-center gap-8">
            <div className="text-center">
              <LoadingDots size="sm" />
              <p className="wf-text-xs mt-2">Dots sm</p>
            </div>
            <div className="text-center">
              <LoadingDots size="md" />
              <p className="wf-text-xs mt-2">Dots md</p>
            </div>
            <div className="text-center">
              <LoadingDots size="lg" />
              <p className="wf-text-xs mt-2">Dots lg</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--color-blue)" }}>
              <LoadingDots color="white" />
              <p className="wf-text-xs mt-2 text-white">white</p>
            </div>
            <div className="text-center">
              <LoadingBounce />
              <p className="wf-text-xs mt-2">Bounce</p>
            </div>
          </div>
        </section>

        {/* Skeleton Primitives */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Skeleton Primitives</h2>
          <div className="space-y-6">
            <div>
              <p className="wf-text-sm mb-2 font-medium">Basic Skeleton</p>
              <Skeleton width="100%" height={16} shimmer />
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Skeleton Title</p>
              <SkeletonTitle width="50%" />
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Skeleton Text (3 lines)</p>
              <SkeletonText lines={3} />
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Skeleton Avatars</p>
              <div className="flex items-center gap-4">
                <SkeletonAvatar size="sm" />
                <SkeletonAvatar size="md" />
                <SkeletonAvatar size="lg" />
              </div>
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Skeleton Button</p>
              <SkeletonButton width="120px" />
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Skeleton Image</p>
              <SkeletonImage className="max-w-xs" />
            </div>
          </div>
        </section>

        {/* Skeleton Compositions */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Skeleton Compositions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="wf-text-sm mb-2 font-medium">Generic Card</p>
              <SkeletonCard />
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Mentor Card</p>
              <SkeletonMentorCard />
            </div>
          </div>
          <div className="mt-6">
            <p className="wf-text-sm mb-2 font-medium">Table Rows</p>
            <div className="wf-card-flush">
              <SkeletonTableRow columns={4} />
              <SkeletonTableRow columns={4} />
              <SkeletonTableRow columns={4} />
            </div>
          </div>
        </section>

        {/* Progress Bars */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Progress Bars</h2>
          <div className="space-y-6">
            <div>
              <p className="wf-text-sm mb-2 font-medium">Determinate ({progress}%)</p>
              <ProgressBar value={progress} />
              <div className="flex gap-2 mt-3">
                <button
                  className="wf-btn wf-btn-secondary text-sm py-1 px-3"
                  onClick={() => setProgress((p) => Math.max(0, p - 10))}
                >
                  -10%
                </button>
                <button
                  className="wf-btn wf-btn-secondary text-sm py-1 px-3"
                  onClick={() => setProgress((p) => Math.min(100, p + 10))}
                >
                  +10%
                </button>
              </div>
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Indeterminate</p>
              <ProgressBar indeterminate />
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Sizes</p>
              <div className="space-y-3">
                <ProgressBar value={60} size="sm" />
                <ProgressBar value={60} size="md" />
                <ProgressBar value={60} size="lg" />
              </div>
            </div>
            <div>
              <p className="wf-text-sm mb-2 font-medium">Variants</p>
              <div className="space-y-3">
                <ProgressBar value={75} variant="default" />
                <ProgressBar value={75} variant="accent" />
                <ProgressBar value={75} variant="success" />
              </div>
            </div>
          </div>
        </section>

        {/* Button Loading States */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Button Loading States</h2>
          <div className="flex flex-wrap gap-4">
            <LoadingButton loading={buttonLoading} onClick={handleButtonClick}>
              {buttonLoading ? "Saving..." : "Click to Load"}
            </LoadingButton>
            <LoadingButton loading variant="secondary">
              Secondary Loading
            </LoadingButton>
            <LoadingButton loading variant="danger">
              Danger Loading
            </LoadingButton>
          </div>
        </section>

        {/* Inline Loader */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Inline Loader</h2>
          <p className="wf-text">
            Your changes are being saved... <InlineLoader text="Saving" />
          </p>
        </section>

        {/* Staggered Animation */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Staggered List Animation</h2>
          <p className="wf-text-sm mb-4" style={{ color: "var(--color-ink-2)" }}>
            Refresh the page to see the staggered entrance animation.
          </p>
          <LoadingStagger className="space-y-2">
            {["First item", "Second item", "Third item", "Fourth item", "Fifth item"].map((item, i) => (
              <div key={i} className="wf-card p-3">
                <p className="wf-text-sm">{item}</p>
              </div>
            ))}
          </LoadingStagger>
        </section>

        {/* Page Loader Demo */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Page Loader</h2>
          <button
            className="wf-btn wf-btn-primary"
            onClick={() => {
              setShowPageLoader(true);
              setTimeout(() => setShowPageLoader(false), 2500);
            }}
          >
            Show Page Loader (2.5s)
          </button>
        </section>

        {/* Usage Examples */}
        <section className="wf-card p-6">
          <h2 className="wf-h3 mb-4">Usage Examples</h2>
          <pre
            className="p-4 rounded-lg text-sm overflow-x-auto"
            style={{ background: "var(--color-bg)", color: "var(--color-ink-2)" }}
          >
{`import {
  Spinner,
  LoadingDots,
  SkeletonText,
  SkeletonMentorCard,
  ProgressBar,
  LoadingButton,
} from '../components/LoadingComponents';

// Spinner with size and color
<Spinner size="lg" color="accent" />

// Loading dots for inline use
<LoadingDots size="sm" />

// Skeleton for text content
<SkeletonText lines={3} shimmer />

// Pre-built mentor card skeleton
<SkeletonMentorCard />

// Progress bar (determinate or indeterminate)
<ProgressBar value={65} variant="success" />
<ProgressBar indeterminate />

// Button with loading state
<LoadingButton loading={isSubmitting}>
  Submit
</LoadingButton>`}
          </pre>
        </section>
      </div>

      {/* Page Loader Overlay */}
      {showPageLoader && <PageLoader message="Loading your workspace..." />}
    </div>
  );
}
