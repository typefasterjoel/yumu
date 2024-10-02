export async function minimizeWindow() {
  await window.yumuWindow.minimize();
}
export async function maximizeWindow() {
  await window.yumuWindow.maximize();
}
export async function closeWindow() {
  window.yumuWindow.toggleDiscordRichPresence(false);
  await window.yumuWindow.close();
}
