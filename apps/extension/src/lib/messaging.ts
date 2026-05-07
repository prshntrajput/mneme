// Message types between popup ↔ background service worker

export type Message =
  | { type: 'SAVE_CURRENT_TAB' }
  | { type: 'CLEAN_MY_TABS' }
  | { type: 'CLEAN_MY_TABS_CONFIRMED' }
  | { type: 'GET_AUTH_STATUS' }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'SEARCH'; payload: { q: string } }
  | { type: 'RESTORE_SESSION'; payload: { tabs: Array<{ url: string }> } };

export type MessageResponse =
  | { type: 'AUTH_STATUS'; payload: { authenticated: boolean; email?: string } }
  | { type: 'TAB_SAVED'; payload: { tabId: string } }
  | { type: 'CLEAN_MY_TABS_PREVIEW'; payload: { tabCount: number } }
  | { type: 'SEARCH_RESULTS'; payload: { results: unknown[] } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'OK' };

export function sendMessage(message: Message): Promise<MessageResponse> {
  return chrome.runtime.sendMessage(message) as Promise<MessageResponse>;
}
