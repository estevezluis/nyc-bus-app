'use client'
import mapboxgl, { Map, Marker } from 'mapbox-gl'
import { createContext, useContext, useEffect, useState } from 'react'
import { MAPBOX_ACCESS_TOKEN } from './constants'

const center = new mapboxgl.LngLat(-73.98039, 40.67569)
const zoom = 11

export type MapContextType = {
	map: Map | null
	reset: () => void
	addedMarkers: (markers: Marker[]) => void
}

const MapContext = createContext<MapContextType | null>(null)

export const MapProvider = ({ children }: any) => {
	const [map, setMap] = useState<Map | null>(null)
	const [_markers, setMarkers] = useState<Marker[]>([])

	useEffect(() => {
		mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

		const map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [-73.98039, 40.6756],
			zoom: 11,
			maxBounds: [
				[-74.255641, 40.496006],
				[-73.700272, 40.917577],
			],
		})

		map.on('load', () => {
			map.addSource('bus-data', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] },
			})

			map.addLayer({
				id: 'bus',
				source: 'bus-data',
				type: 'line',
				paint: {
					'line-color': ['concat', '#', ['get', 'color']],
					'line-opacity': 0.7,
					'line-width': 4,
				},
			})
		})

		setMap(() => map)

		return () => map.remove()
	}, [])

	function reset() {
		setMarkers((activeMarkers) => {
			activeMarkers.forEach((active) => active.remove())

			return []
		})

		map?.flyTo({ center, zoom })
	}

	function addedMarkers(markers: Marker[]) {
		setMarkers((prevMarkers) => prevMarkers.concat(markers))
	}

	return (
		<MapContext.Provider
			value={{
				map,
				reset,
				addedMarkers,
			}}
		>
			{children}
		</MapContext.Provider>
	)
}

export const useMap = () => useContext(MapContext)
