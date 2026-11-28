import { Capacitor } from '@capacitor/core';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_GRADE } from './grades.js';

// The same family account as MathPop and PitchPop: one Supabase project,
// one email and password for all three apps. WordPop's players live in
// their own table, wordpop_profiles (supabase/wordpop_profiles.sql), each
// with the grade they play at and their progress.
// Publishable (client-side) key - safe to ship in the browser. Row-level
// security limits each family account to its own rows.
const SUPABASE_URL = 'https://wtjhceycjiowvdpfwkjj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hcaechWMVkIchjiS_BGQjg_E8N1XHA1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  // A separate saved sign-in from MathPop's (they share a website), so
  // signing out of one app doesn't sign you out of the other.
  auth: { storageKey: 'wordpop-auth-v1' },
});

const ACCOUNT_KEY = 'wordpop-account-user-v1';
const PENDING_KEY = 'wordpop-pending-cloud-v1';
const TABLE = 'wordpop_profiles';

export function isOffline(err) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (!err) return false;
  return (
    err.name === 'AuthRetryableFetchError' ||
    err.status === 0 ||
    err instanceof TypeError ||
    /failed to fetch|network|load failed|internet/i.test(err.message || '')
  );
}

const OFFLINE_MESSAGE = 'You’re offline. Connect to the internet and try again.';

function rememberUser(user) {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ id: user.id, email: user.email, created_at: user.created_at }));
  } catch {
    /* private mode */
  }
}

function forgetUser() {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* private mode */
  }
}

export function rememberedAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCOUNT_KEY));
    return saved?.id ? saved : null;
  } catch {
    return null;
  }
}

async function sessionUser() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user || rememberedAccount();
  } catch {
    return rememberedAccount();
  }
}

// The signed-in user, checked with the server when online; offline, the
// account last used on this device.
export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (data?.user) {
      rememberUser(data.user);
      return data.user;
    }
    return error && isOffline(error) ? rememberedAccount() : null;
  } catch (err) {
    return isOffline(err) ? rememberedAccount() : null;
  }
}

// Where links in sign-up and reset-password emails lead: back here. In
// the iPhone app the page's own address (capacitor://localhost) can't be
// opened from an email, so the link goes to the website; once the email is
// confirmed there, the family signs in in the app with their password.
// (The Supabase project's Redirect URLs list needs
// https://marikalam.github.io/apps/wordpop/** for this to work.)
const WEB_APP_URL = 'https://marikalam.github.io/apps/wordpop/';
function emailLinkUrl() {
  return Capacitor.isNativePlatform() ? WEB_APP_URL : `${window.location.origin}${import.meta.env.BASE_URL}`;
}

function friendlyError(error) {
  return isOffline(error) ? new Error(OFFLINE_MESSAGE) : error;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password }).catch((err) => ({ error: err }));
  if (error) throw friendlyError(error);
  rememberUser(data.user);
  return data.user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth
    .signUp({ email, password, options: { emailRedirectTo: emailLinkUrl(), data: { app: 'wordpop' } } })
    .catch((err) => ({ error: err }));
  if (error) throw friendlyError(error);
  if (data.session) rememberUser(data.user);
  // With email confirmation on, there's no session until the email link
  // is opened.
  return data.session ? data.user : null;
}

export async function signOut() {
  forgetUser();
  try {
    localStorage.removeItem('wordpop-auth-v1');
  } catch {
    /* private mode */
  }
  supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth
    .resetPasswordForEmail(email, { redirectTo: emailLinkUrl() })
    .catch((err) => ({ error: err }));
  if (error) throw friendlyError(error);
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword }).catch((err) => ({ error: err }));
  if (error) throw friendlyError(error);
}

// Deletes the whole family account (it's shared with MathPop and
// PitchPop, which the confirmation says). Uses the same database function
// those apps use; WordPop's players go with the account (on delete
// cascade).
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_my_account').catch((err) => ({ error: err }));
  if (error) throw friendlyError(error);
  forgetUser();
  await supabase.auth.signOut({ scope: 'local' });
}

export function onAuthEvent(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => subscription.unsubscribe();
}

// Changes made offline wait here until the account can be reached:
// { upserts: { id: player }, deletes: [id] }.
function loadPending() {
  try {
    const saved = JSON.parse(localStorage.getItem(PENDING_KEY));
    return { upserts: saved?.upserts || {}, deletes: saved?.deletes || [] };
  } catch {
    return { upserts: {}, deletes: [] };
  }
}

function savePending(pending) {
  try {
    if (!Object.keys(pending.upserts).length && !pending.deletes.length) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* private mode */
  }
}

// false only when the account couldn't be reached (try again later).
async function upsertProfile(user, profile) {
  try {
    const { error } = await supabase.from(TABLE).upsert(
      {
        owner_id: user.id,
        profile_key: profile.id,
        name: profile.name,
        grade: profile.grade,
        progress: profile.progress || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'owner_id,profile_key' },
    );
    if (error) {
      if (isOffline(error)) return false;
      console.error('Could not save WordPop player', error);
    }
    return true;
  } catch (err) {
    if (isOffline(err)) return false;
    console.error('Could not reach WordPop storage', err);
    return true;
  }
}

async function removeProfile(user, profileId) {
  try {
    const { error } = await supabase.from(TABLE).delete().eq('owner_id', user.id).eq('profile_key', profileId);
    if (error) {
      if (isOffline(error)) return false;
      console.error('Could not delete WordPop player', error);
    }
    return true;
  } catch (err) {
    if (isOffline(err)) return false;
    return true;
  }
}

export async function flushPendingCloud() {
  const pending = loadPending();
  if (!Object.keys(pending.upserts).length && !pending.deletes.length) return true;
  const user = await sessionUser();
  if (!user) return false;
  for (const id of Object.keys(pending.upserts)) {
    if (await upsertProfile(user, pending.upserts[id])) delete pending.upserts[id];
  }
  const still = [];
  for (const id of pending.deletes) if (!(await removeProfile(user, id))) still.push(id);
  pending.deletes = still;
  savePending(pending);
  return !Object.keys(pending.upserts).length && !pending.deletes.length;
}

// The family's players, or null when signed out or unreachable (callers
// then keep the players cached on this device).
export async function loadCloudProfiles() {
  if (!(await sessionUser())) return null;
  if (!(await flushPendingCloud())) return null;
  try {
    const { data, error } = await supabase.from(TABLE).select('profile_key, name, grade, progress').order('created_at');
    if (error) {
      if (!isOffline(error)) console.error('Could not load WordPop players', error);
      return null;
    }
    return data
      .filter((row) => row.profile_key && row.name)
      .map((row) => ({ id: row.profile_key, name: row.name, grade: row.grade || DEFAULT_GRADE, progress: row.progress || {} }));
  } catch (err) {
    if (!isOffline(err)) console.error('Could not reach WordPop storage', err);
    return null;
  }
}

export async function saveCloudProfile(profile) {
  const user = await sessionUser();
  if (!user) return;
  const done = await upsertProfile(user, profile);
  const pending = loadPending();
  if (done) delete pending.upserts[profile.id];
  else {
    pending.upserts[profile.id] = profile;
    pending.deletes = pending.deletes.filter((id) => id !== profile.id);
  }
  savePending(pending);
}

export async function deleteCloudProfile(profileId) {
  const user = await sessionUser();
  if (!user) return;
  const done = await removeProfile(user, profileId);
  const pending = loadPending();
  delete pending.upserts[profileId];
  if (!done && !pending.deletes.includes(profileId)) pending.deletes.push(profileId);
  savePending(pending);
}
