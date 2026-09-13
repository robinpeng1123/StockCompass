/** The one account allowed to add/remove news signals — everyone else can see the resulting effect but not edit it. */
export const ADMIN_EMAIL = "robinpeng1123@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
