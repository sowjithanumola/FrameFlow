import React from 'react';
import { X, ShieldCheck, CheckCircle2, Globe } from 'lucide-react';

interface LegalModalsProps {
  isOpen: boolean;
  activeTab: 'privacy' | 'checklist';
  onClose: () => void;
  onTabChange: (tab: 'privacy' | 'checklist') => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header & Tabs */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-medium">
            <button
              onClick={() => onTabChange('privacy')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-zinc-800 text-sky-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => onTabChange('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Launch & Production</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-zinc-100">
                Privacy Policy for FrameFlow
              </h2>
              <p className="text-zinc-400">
                Last updated: November 2026
              </p>

              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-1">
                  1. Zero Cloud Transmission
                </h3>
                <p>
                  FrameFlow operates entirely on client-side web technologies (HTML5 Canvas, Web Workers, and local memory buffers). Your original images, animated crops, custom motion parameters, and generated GIF files never leave your web browser. We do not transmit or upload any imagery to external cloud servers, remote databases, or third-party APIs.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-1">
                  2. Zero Draft Tracking and Clean Session Policy
                </h3>
                <p>
                  FrameFlow does not persist project drafts, image copies, or recent history in your browser storage. All frames and motion transformations reside strictly in volatile browser RAM during your active session and are cleanly released upon reset or browser closure.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-1">
                  3. Cookies and Analytics
                </h3>
                <p>
                  FrameFlow does not use tracking cookies, advertising identifiers, fingerprinting scripts, or third-party surveillance tags.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-200 mb-1">
                  4. User Media Ownership
                </h3>
                <p>
                  You retain full, unrestricted rights to all images imported and animated GIFs generated with FrameFlow. FrameFlow claims zero rights or licenses over user works.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-zinc-100">
                Production Launch Status
              </h2>
              <p className="text-zinc-400">
                Production readiness and verification checklist items:
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-200">1. Custom Domain Connected</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">
                      Production ready routing enabled for custom domain deployment on Vercel, Netlify, or Cloud Run.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-200">2. Favicon Added</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">
                      Custom modern SVG filmstrip favicon configured in application head entry point.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-200">3. "Made with AI" Tag Removed</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">
                      Zero promotional watermarks, vendor branding badges, or AI tags present in the user interface.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-200">4. Privacy Policy Page Active</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">
                      Dedicated privacy terms detailing 100% client-side execution, zero data collection, and clean session policy.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
