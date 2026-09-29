import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white active:scale-95 transition-all cursor-pointer"
        title="Install as Progressive Web App"
      >
        <Download className="w-3.5 h-3.5 stroke-[2]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-guide-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white active:scale-95 transition-all cursor-pointer"
          title="Install on iPhone / iPad"
        >
          <Share className="w-3.5 h-3.5 stroke-[2]" />
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-[28px] bg-[#16161A] border border-white/10 p-6 text-white shadow-2xl">
              <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-2 mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5A10]/15 flex items-center justify-center text-[#FF5A10]">
                    <Share className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Add to Home Screen</h3>
                    <p className="text-xs text-[#8E8E93]">Install for offline collection access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Tap the <strong>Share</strong> button in Safari’s navigation bar.</span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04]">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Tap <strong>Add</strong> in the top-right corner to install Groove.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-full bg-[#FF5A10] hover:bg-[#FF6F28] font-semibold text-xs text-white transition active:scale-98 shadow-sm shadow-[#FF5A10]/30 cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
