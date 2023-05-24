'use client'
import MapOverlay from "./MapControl"
import { MapProvider } from "./MapContext"

export default function Home() {
	return (
		<MapProvider>
			<MapOverlay />
			<div id="map"></div>
		</MapProvider>
	)
}
