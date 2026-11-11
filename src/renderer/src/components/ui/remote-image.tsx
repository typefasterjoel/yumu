import { useRemoteImage } from "@renderer/hooks/use-remote-image"
import type { ComponentProps } from "react"

/** An `<img>` for YouTube Music artwork; see `useRemoteImage` for why it isn't loaded directly. */
function RemoteImage({ src, alt = "", ...props }: ComponentProps<"img"> & { src: string }) {
  const loaded = useRemoteImage(src)
  // Keeps the box in the layout while the image loads, so the page doesn't jump.
  if (!loaded) return <div className={props.className} aria-hidden />
  return <img src={loaded} alt={alt} {...props} />
}

export default RemoteImage
