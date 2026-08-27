export function isPublicStaticBuild() {
  return (
    process.env.GITHUB_PAGES === "true" ||
    process.env.NEXT_PUBLIC_HIDE_ADMIN === "true"
  );
}

export function isLocalCmsMode() {
  return !isPublicStaticBuild();
}

export function isAdminVisible() {
  return isLocalCmsMode();
}
