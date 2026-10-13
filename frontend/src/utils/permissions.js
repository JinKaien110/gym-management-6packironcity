const adminRoutePermissions = {
  "/admin": "admin.dashboard.view",
  "/admin/dashboard": "admin.dashboard.view",
  "/admin/clients": "admin.clients.view",
  "/admin/membership-requests": "admin.membership-requests.view",
  "/admin/memberships": "admin.memberships.view",
  "/admin/payments": "admin.payments.view",
  "/admin/classes": "admin.classes.view",
  "/admin/schedules": "admin.schedules.view",
  "/admin/trainers": "admin.trainers.view",
  "/admin/pricing": "admin.pricing.view",
  "/admin/plans": "admin.plans.view",
  "/admin/bookings": "admin.bookings.view",
  "/admin/discounts": "admin.discounts.view",
  "/admin/analytics": "admin.analytics.view",
  "/admin/ai-recommendations": "admin.ai-recommendations.view",
  "/admin/membership-config": "admin.membership-config.view",
  "/admin/activity-logs": "admin.activity-logs.view"
};

const rolePermissions = {
  admin: ["*"],
  staff: [
    "admin.clients.view",
    "admin.payments.view",
    "admin.classes.view",
    "admin.schedules.view",
    "admin.trainers.view",
    "admin.bookings.view"
  ]
};

const normalizeRole = (user) =>
  typeof user?.role === "string" ? user.role.trim().toLowerCase() : "";

export const isOwner = (user) => normalizeRole(user) === "admin";

export const hasAdminPermission = (user, permission) => {
  if (isOwner(user)) return true;
  if (normalizeRole(user) !== "staff") return false;

  return rolePermissions.staff.includes(permission);
};

export const canAccessAdminRoute = (user, pathname) => {
  if (isOwner(user)) return true;
  if (normalizeRole(user) !== "staff" || typeof pathname !== "string") return false;

  const normalizedPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const matchingRoute = Object.keys(adminRoutePermissions)
    .sort((a, b) => b.length - a.length)
    .find((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`));

  return matchingRoute
    ? hasAdminPermission(user, adminRoutePermissions[matchingRoute])
    : false;
};

export const getAdminAccessRedirect = (user) => {
  switch (normalizeRole(user)) {
    case "staff":
      return "/admin/clients";
    case "trainer":
      return "/trainer/dashboard";
    case "client":
      return "/client/dashboard";
    default:
      return "/";
  }
};
