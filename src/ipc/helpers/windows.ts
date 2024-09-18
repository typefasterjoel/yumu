export async function minimizeWindow() {
  console.log(window.yumuWindow);
  await window.yumuWindow.minimize();
}
export async function maximizeWindow() {
  await window.yumuWindow.maximize();
}
export async function closeWindow() {
  await window.yumuWindow.close();
}
