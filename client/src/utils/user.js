// Utility to get current user from localStorage
export function getCurrentUser() {
  try {
    const user = localStorage.getItem("user");
    if (!user) return null;
    return JSON.parse(user);
  } catch {
    return null;
  }
}
