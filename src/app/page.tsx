'use client'
import MapControl from './MapControl'
import { MapProvider } from './MapContext'

export default function Home() {
	return (
		<MapProvider>
			<MapControl />
			<div id="map"></div>
		</MapProvider>
	)
}
