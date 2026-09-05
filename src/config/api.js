// The single source of truth for the backend base URL.
//
// FIX: this used to be a `const API = "https://emovra.onrender.com/api"`
// literal copy-pasted into 25 different files, with exactly ONE of them
// (MindGuardApp.jsx) reading import.meta.env.VITE_API_URL. So the env var
// looked like a supported way to point the app at a different backend, but
// setting it only moved a single component - every other feature kept
// talking to production. That is the worst of both worlds: a local or
// staging build would half-connect to the live database, writing real
// students' check-ins into it from a dev machine, and the failure is
// invisible because most of the app still "works".
//
// One definition, honoured everywhere. Set VITE_API_URL at build time to
// point the whole app somewhere else; leave it unset for production.
export const API_BASE = import.meta.env.VITE_API_URL || "https://emovra.onrender.com/api";

export default API_BASE;
