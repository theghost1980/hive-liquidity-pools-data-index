export function generateChallenge(username: string) {
  return `${username}:${Date.now()}:${Math.random().toString(36).substring(2)}`;
}
