import type { TrackArtist } from "@ipc/youtube/parse-browse"
import { Link } from "@tanstack/react-router"
import { Fragment } from "react"

/** Artist names separated by commas, each one a link to their page when they have one. */
function ArtistLinks({ artists, className }: { artists: TrackArtist[]; className?: string }) {
  return artists.map((artist, i) => (
    <Fragment key={`${i}:${artist.name}`}>
      {i > 0 && ", "}
      {artist.browseId ? (
        <Link to="/artist/$browseId" params={{ browseId: artist.browseId }} className={className}>
          {artist.name}
        </Link>
      ) : (
        artist.name
      )}
    </Fragment>
  ))
}

export default ArtistLinks
