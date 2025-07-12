export async function minimizeWindow() {
  await window.yumu.minimize()
}

export async function maximizeWindow() {
  await window.yumu.maximize()
}

export async function closeWindow() {
  await window.yumu.toggleDiscordPresence(false)
  await window.yumu.close()
}
