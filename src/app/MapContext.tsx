'use client'
import mapboxgl, { GeoJSONSource, Map, Marker } from 'mapbox-gl'
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { MAPBOX_ACCESS_TOKEN } from './constants'
import useMediaQuery from './useMediaQuery'

export type MapContextType = {
	map: Map | null
	reset: () => void
	setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>
}

const center = new mapboxgl.LngLat(-73.98039, 40.67569)
const zoom = 11
export const SOURCE_NAME = 'bus-data'
const LAYER: mapboxgl.AnyLayer = {
	id: 'bus',
	source: SOURCE_NAME,
	type: 'line',
	paint: {
		'line-color': ['concat', '#', ['get', 'color']],
		'line-opacity': 0.7,
		'line-width': 4,
	},
}

const MapContext = createContext<MapContextType | null>(null)

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
	const prefersDarkScheme = useMediaQuery()
	const mapRef = useRef<Map | null>(null)
	const [_markers, setMarkers] = useState<Marker[]>([])

	useEffect(() => {
		if (!mapRef.current) {
			mapRef.current = new mapboxgl.Map({
				container: 'map',
				style: prefersDarkScheme
					? 'mapbox://styles/estevezluis1/cli971xa305bd01qnda6b9v2w'
					: 'mapbox://styles/estevezluis1/cli95doh505g901p84ucsdw0e',
				center: [-73.98039, 40.6756],
				zoom: 11,
				maxBounds: [
					[-74.255641, 40.496006],
					[-73.700272, 40.917577],
				],
			})
			const onLoad = () => {
				mapRef.current!.addSource(SOURCE_NAME, {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] },
				})
				mapRef.current!.addLayer(LAYER)
				mapRef.current!.off('load', onLoad)
			}
			mapRef.current.once('load', onLoad)
		} else {
			const sourceData = mapRef.current.querySourceFeatures(SOURCE_NAME)
			const reloadSourceLayer = () => {
				const tempSource = mapRef.current?.getSource(SOURCE_NAME)
				if (!!tempSource) {
					;(tempSource as GeoJSONSource).setData({
						type: 'FeatureCollection',
						features: [],
					})
				} else {
					mapRef.current!.addSource(SOURCE_NAME, {
						type: 'geojson',
						data: { type: 'FeatureCollection', features: sourceData ?? [] },
					})
					mapRef.current!.addLayer(LAYER)
				}
				mapRef.current!.off('style.load', reloadSourceLayer)
			}

			mapRef.current.once('style.load', reloadSourceLayer)
			mapRef.current.setStyle(
				prefersDarkScheme
					? 'mapbox://styles/estevezluis1/cli971xa305bd01qnda6b9v2w'
					: 'mapbox://styles/estevezluis1/cli95doh505g901p84ucsdw0e'
			)
		}
	}, [prefersDarkScheme])

	function reset() {
		setMarkers((activeMarkers) => {
			activeMarkers.forEach((active) => active.remove())

			return []
		})

		if (!!mapRef.current) {
			mapRef.current.flyTo({ center, zoom })
			const source = mapRef.current.getSource(SOURCE_NAME) as GeoJSONSource

			source.setData({
				type: 'FeatureCollection',
				features: [],
			})
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
