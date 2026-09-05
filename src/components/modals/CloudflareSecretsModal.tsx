import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Terminal, 
  Cpu,
  ArrowRight
} from 'lucide-react';
import { SquareStatusResponse } from '../../services/squareService';

interface CloudflareSecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
  squareStatus: SquareStatusResponse | null;
}

export const CloudflareSecretsModal: React.FC<CloudflareSecretsModalProps> = ({
  isOpen,
  onClose,
  squareStatus
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const variables = [
    {
      name: 'SQUARE_ACCESS_TOKEN',
      desc: 'Your Square Production Personal Access Token (starts with EAAA...) for backend Cloudflare Pages Functions.',
      exampleValue: 'EAAA...'
    },
    {
      name: 'SQUARE_ENVIRONMENT',
      desc: 'Set to "production" so Square connects to https://connect.squareup.com rather than sandbox.',
      exampleValue: 'production'
    },
    {
      name: 'VITE_SQUARE_ACCESS_TOKEN',
      desc: 'Passed during Vite build in Cloudflare so client-side components have access if needed.',
      exampleValue: 'EAAA...'
    },
    {
      name: 'VITE_SQUARE_ENVIRONMENT',
      desc: 'Frontend environment indicator for Vite build.',
      exampleValue: 'production'
    },
    {
      name: 'SQUARE_DEFAULT_LOCATION_ID',
      desc: 'Your Square Merchant Location ID (e.g. LOC_SPEER_DENVER or your real Square location ID).',
      exampleValue: 'LOC_SPEER_DENVER'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Cloudflare Build & Secrets Configuration
              </h2>
              <p className="text-xs text-zinc-400">
                Passing Square Production Credentials to Cloudflare Pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          {/* Current Status Box */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${squareStatus?.hasToken ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <div>
                <p className="font-semibold text-zinc-100 text-xs">
                  Active Runtime Mode: <span className="text-emerald-400 font-mono uppercase">{squareStatus?.environment || 'production'}</span>
                </p>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Endpoint: {squareStatus?.baseUrl || 'https://connect.squareup.com'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                {squareStatus?.hasToken ? 'Live Token Configured' : 'No Token in Local Session'}
              </span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/50 flex gap-3 text-xs leading-relaxed text-blue-200">
            <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-100 mb-1">
                Why didn't secrets transfer to Cloudflare automatically?
              </p>
              <p className="text-blue-300/90">
                Secrets entered in Google AI Studio are isolated within your private Google Cloud Run sandbox container for security. They are never pushed to external Git repositories or third-party hosting platforms like Cloudflare Pages.
              </p>
            </div>
          </div>

          {/* Cloudflare Pages Functions Feature */}
          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200">
            <div className="flex items-center gap-2 font-semibold text-emerald-100 mb-1">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Cloudflare Pages Edge Functions Enabled</span>
            </div>
            <p className="text-emerald-300/80 leading-relaxed">
              We have added <code className="bg-emerald-950/80 px-1 py-0.5 rounded text-emerald-300 font-mono">functions/api/[[path]].ts</code> to this project. Cloudflare Pages automatically detects this folder and runs all Square invoice endpoints directly on Cloudflare's serverless edge network using your Cloudflare environment secrets!
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              <span>Required Setup in Cloudflare Pages Dashboard</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-medium text-zinc-200">Navigate to Environment Variables</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Open <strong className="text-zinc-300">Cloudflare Dashboard</strong> &rarr; <strong className="text-zinc-300">Workers &amp; Pages</strong> &rarr; Select your project &rarr; <strong className="text-zinc-300">Settings</strong> &rarr; <strong className="text-zinc-300">Environment variables</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-medium text-zinc-200">Add Variables under Production &amp; Preview</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Click <strong className="text-zinc-300">Add variable</strong> and add the values below. You can mark <code className="text-zinc-300 font-mono">SQUARE_ACCESS_TOKEN</code> as an Encrypted Secret.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-medium text-zinc-200">Redeploy in Cloudflare</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Go to the <strong className="text-zinc-300">Deployments</strong> tab in Cloudflare Pages and click <strong className="text-zinc-300">Retry deployment</strong> on your latest commit, or push a new commit to trigger the build with the new secrets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyable Variables List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Environment Variable Reference</span>
              <span className="text-[10px] text-zinc-500 font-normal">Click to copy variable name</span>
            </h4>

            <div className="space-y-2">
              {variables.map(v => (
                <div key={v.name} className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-orange-300">{v.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Value: {v.exampleValue}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">{v.desc}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(v.name, v.name)}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1 shrink-0 text-[10px]"
                    title="Copy variable name"
                  >
                    {copiedKey === v.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Square Developer Portal Link */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Need your Square Production Access Token?</span>
            </div>
            <a
              href="https://developer.squareup.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-semibold"
            >
              <span>Square Developer Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
