'use client'
import mapboxgl, { GeoJSONSource, Map, Marker } from 'mapbox-gl'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { MAPBOX_ACCESS_TOKEN } from './constants'

const center = new mapboxgl.LngLat(-73.98039, 40.67569)
const zoom = 11

export type MapContextType = {
	map: Map | null
	reset: () => void
	setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>
}

export const SOURCE_NAME = 'bus-data'

const MapContext = createContext<MapContextType | null>(null)

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

export const MapProvider = ({ children }: any) => {
	const mapRef = useRef<Map | null>(null)
	const [_markers, setMarkers] = useState<Marker[]>([])

	useEffect(() => {
		if (!mapRef.current) {
			mapRef.current = new mapboxgl.Map({
				container: 'map',
				style: 'mapbox://styles/mapbox/streets-v12',
				center: [-73.98039, 40.6756],
				zoom: 11,
				maxBounds: [
					[-74.255641, 40.496006],
					[-73.700272, 40.917577],
				],
			})

			mapRef.current!.on('load', () => {
				mapRef.current!.addSource('bus-data', {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] },
				})

				mapRef.current!.addLayer({
					id: 'bus',
					source: SOURCE_NAME,
					type: 'line',
					paint: {
						'line-color': ['concat', '#', ['get', 'color']],
						'line-opacity': 0.7,
						'line-width': 4,
					},
				})
			})
		}

		if (!!mapRef.current) {
			return () => mapRef.current!.remove()
		}
	}, [])

	function reset() {
		setMarkers((activeMarkers) => {
			activeMarkers.forEach((active) => active.remove())

			return []
		})

		if (!!mapRef.current) {
			mapRef.current.flyTo({ center, zoom })
			const source = mapRef.current.getSource(SOURCE_NAME) as GeoJSONSource

			source.setData({ type: 'FeatureCollection', features: [] })
		}
	}

	return (
		<MapContext.Provider
			value={{
				map: mapRef.current,
				reset,
				setMarkers,
			}}
		>
			{children}
		</MapContext.Provider>
	)
}

export const useMap = () => useContext(MapContext)
