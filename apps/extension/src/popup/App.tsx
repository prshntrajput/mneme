'use client';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sendMessage } from '@/lib/messaging';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
type CleanStep = 'idle' | 'previewing' | 'confirming' | 'cleaning' | 'done';

interface SearchResult {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  category: string | null;
}

interface AppState {
  auth: AuthState;
  email: string | null;
  saving: boolean;
  cleanStep: CleanStep;
  tabCount: number;
  message: string | null;
  query: string;
  searchResults: SearchResult[];
  searching: boolean;
}

const DASHBOARD_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000';

function App() {
  const [state, setState] = useState<AppState>({
    auth: 'loading',
    email: null,
    saving: false,
    cleanStep: 'idle',
    tabCount: 0,
    message: null,
    query: '',
    searchResults: [],
    searching: false,
  });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void sendMessage({ type: 'GET_AUTH_STATUS' }).then((res) => {
      if (res.type === 'AUTH_STATUS') {
        setState((s) => ({
          ...s,
          auth: res.payload.authenticated ? 'authenticated' : 'unauthenticated',
          ...(res.payload.email ? { email: res.payload.email } : {}),
        }));
      }
    });
  }, []);

  async function handleLogin() {
    setState((s) => ({ ...s, message: 'Opening Google sign-in…' }));
    const loginRes = await sendMessage({ type: 'LOGIN' });
    if (loginRes.type === 'ERROR') {
      setState((s) => ({ ...s, message: `Sign-in failed: ${loginRes.payload.message}` }));
      return;
    }
    const res = await sendMessage({ type: 'GET_AUTH_STATUS' });
    if (res.type === 'AUTH_STATUS') {
      setState((s) => ({
        ...s,
        message: null,
        auth: res.payload.authenticated ? 'authenticated' : 'unauthenticated',
        ...(res.payload.email ? { email: res.payload.email } : {}),
      }));
    }
  }

  async function handleLogout() {
    await sendMessage({ type: 'LOGOUT' });
    setState((s) => ({ ...s, auth: 'unauthenticated', email: null }));
  }

  async function handleSaveTab() {
    setState((s) => ({ ...s, saving: true, message: null }));
    const res = await sendMessage({ type: 'SAVE_CURRENT_TAB' });
    setState((s) => ({
      ...s,
      saving: false,
      message: res.type === 'OK' ? 'Tab saved!' : 'Save failed.',
    }));
  }

  async function handleCleanMyTabs() {
    setState((s) => ({ ...s, cleanStep: 'previewing', message: null }));
    const res = await sendMessage({ type: 'CLEAN_MY_TABS' });
    if (res.type === 'CLEAN_MY_TABS_PREVIEW') {
      setState((s) => ({ ...s, cleanStep: 'confirming', tabCount: res.payload.tabCount }));
    } else {
      setState((s) => ({ ...s, cleanStep: 'idle', message: 'Something went wrong.' }));
    }
  }

  async function handleConfirmClean() {
    setState((s) => ({ ...s, cleanStep: 'cleaning' }));
    const res = await sendMessage({ type: 'CLEAN_MY_TABS_CONFIRMED' });
    setState((s) => ({
      ...s,
      cleanStep: 'done',
      message: res.type === 'OK' ? `${s.tabCount} tabs saved & closed!` : 'Something went wrong.',
    }));
    setTimeout(() => setState((s) => ({ ...s, cleanStep: 'idle', message: null })), 3000);
  }

  function handleQueryChange(q: string) {
    setState((s) => ({ ...s, query: q }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setState((s) => ({ ...s, searchResults: [], searching: false }));
      return;
    }
    searchTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, searching: true }));
      void sendMessage({ type: 'SEARCH', payload: { q } }).then((res) => {
        if (res.type === 'SEARCH_RESULTS') {
          setState((s) => ({
            ...s,
            searching: false,
            searchResults: res.payload.results as SearchResult[],
          }));
        }
      });
    }, 350);
  }

  if (state.auth === 'loading') {
    return <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>Loading…</div>;
  }

  if (state.auth === 'unauthenticated') {
    return (
      <div
        style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 260 }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Mneme</h1>
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Sign in to start saving your tabs.</p>
        <button onClick={() => void handleLogin()} style={btnStyle('#111')}>
          {state.message === 'Opening Google sign-in…' ? 'Opening…' : 'Sign in with Google'}
        </button>
        {state.message && state.message !== 'Opening Google sign-in…' && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{state.message}</p>
        )}
      </div>
    );
  }

  const isConfirming = state.cleanStep === 'confirming';
  const isCleaning = state.cleanStep === 'cleaning' || state.cleanStep === 'previewing';

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Mneme</h1>
        <button
          onClick={() => void handleLogout()}
          style={{
            fontSize: 11,
            color: '#888',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {state.email ?? 'Sign out'} ·&nbsp;out
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search your tabs…"
          value={state.query}
          onChange={(e) => handleQueryChange(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {/* Search results */}
      {state.query && (
        <div
          style={{
            maxHeight: 220,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {state.searching && (
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '8px 0' }}>
              Searching…
            </p>
          )}
          {!state.searching && state.searchResults.length === 0 && (
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: '8px 0' }}>
              No results
            </p>
          )}
          {state.searchResults.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '6px 8px',
                borderRadius: 6,
                textDecoration: 'none',
                background: '#f9fafb',
                border: '1px solid #f3f4f6',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#111',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {r.title ?? r.url}
              </p>
              {r.summary && (
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    color: '#666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.summary}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Confirm Clean My Tabs modal */}
      {isConfirming && (
        <div
          style={{
            background: '#fef9c3',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            Save & close {state.tabCount} tab{state.tabCount !== 1 ? 's' : ''}?
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
            They'll be saved to your library and you can restore the session anytime.
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => void handleConfirmClean()}
              style={{ ...btnStyle('#2563eb'), flex: 1, padding: '8px 10px' }}
            >
              Yes, clean!
            </button>
            <button
              onClick={() => setState((s) => ({ ...s, cleanStep: 'idle' }))}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isConfirming && (
        <>
          <button
            onClick={() => void handleCleanMyTabs()}
            disabled={isCleaning}
            style={btnStyle('#2563eb')}
          >
            {state.cleanStep === 'previewing'
              ? 'Counting tabs…'
              : state.cleanStep === 'cleaning'
                ? 'Saving & closing…'
                : state.cleanStep === 'done'
                  ? 'Done!'
                  : '🧹 Clean My Tabs'}
          </button>

          <button
            onClick={() => void handleSaveTab()}
            disabled={state.saving}
            style={btnStyle('#111')}
          >
            {state.saving ? 'Saving…' : 'Save current tab'}
          </button>
        </>
      )}

      <a
        href={DASHBOARD_URL + '/library'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, color: '#2563eb', textAlign: 'center', textDecoration: 'none' }}
      >
        Open dashboard →
      </a>

      {state.message && (
        <p style={{ fontSize: 12, color: '#666', textAlign: 'center', margin: 0 }}>
          {state.message}
        </p>
      )}
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  };
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
