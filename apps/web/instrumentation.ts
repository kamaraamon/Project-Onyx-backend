export async function register(): Promise<void> {
  const { boot } = await import('@onyx/config');
  boot();
}
