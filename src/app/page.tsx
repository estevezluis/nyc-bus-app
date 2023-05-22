'use client'
import { Route, SearchResult, VehicleMonitor, OnwardCall } from './type'

import Search from './Search'
import ListRoute from './ListRoute'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { lineString, bbox } from '@turf/turf'
import { decodePolyline } from './Utils'

import { useState, useEffect } from 'react'
import { renderToString } from 'react-dom/server'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { MAPBOX_ACCESS_TOKEN, API_ENDPOINT } from './constants'

export default function Home() {
	const [map, setMap] = useState<null | mapboxgl.Map>(null)
	const [markers, setMarkers] = useState<mapboxgl.Marker[]>([])
	const [selected, setSelected] = useState<SearchResult | null>(null)

	useEffect(() => {
		dayjs.extend(relativeTime)
		mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

		const map = new mapboxgl.Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [-73.98039, 40.67569],
			zoom: 11
		})

		setMap(() => map)

		map.on('load', () => {
			map.addSource('bus-data', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			})

			map.addLayer({
				id: 'bus',
				source: 'bus-data',
				type: 'line',
				paint: {
					'line-color': [
						'concat',
						'#',
						['get', 'color']
					],
					'line-opacity': 0.7,
					'line-width': 4
				}
			})
		})

	}, [])

	function resetMap() {
		setSelected(() => null)
		setMarkers((markersToRemove) => {
			if (!markersToRemove.length) return markersToRemove

			for (let i = 0; i < markersToRemove.length; i++) {
				markersToRemove[i].remove()
			}

			return []
		})

		const source = map?.getSource('bus-data') as any

		console.log(source)

		source.setData({ type: 'FeatureCollection', features: [] })
	}

	async function getActiveVehicle(routeId: string) {
		const params = new URLSearchParams({ 'LineRef': routeId })

		const url = `/api/vehicle-monitoring?${params.toString()}`

		const response = await fetch(url)
		const responseData = await response.json()

		return responseData
	}

	async function getVehicleData(vehicleRef: string) {
		const params = new URLSearchParams({ 'VehicleRef': vehicleRef })

		const url = `/api/vehicle-monitoring?${params.toString()}`

		const response = await fetch(url)
		const responseData = await response.json()

		return responseData
	}

	function popUp({ VehicleRef, PublishedLineName, DestinationName, OnwardCalls }: any) {
		return renderToString(
			<div>
				<div className="header vehicle">
					<p className="title">
						{PublishedLineName} {DestinationName}
					</p>
					<p>
						<span className="type">
							Vehicle #{VehicleRef.split('_')[1]}
						</span>
					</p>
				</div>
				<div>
					<p>Next Stops:</p>
					<ul>
						{
							OnwardCalls.OnwardCall.map((onwardCall: OnwardCall) => {
								return (
									<li key={onwardCall.StopPointRef}>
										<span className="font-semibold">{onwardCall.StopPointName}</span>
										&nbsp;{dayjs(onwardCall.ExpectedArrivalTime).fromNow()},&nbsp;{onwardCall.Extensions.Distances.PresentableDistance}
									</li>
								)
							})
						}
					</ul>
				</div>
			</div>
		)
	}

	function showLiveVehicles(routeId: string) {
		getActiveVehicle(routeId).then((resData: VehicleMonitor) => {
			resData.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity.forEach((activity) => {
				const {
					VehicleLocation, Bearing, DestinationName, PublishedLineName, VehicleRef, OnwardCalls
				} = activity.MonitoredVehicleJourney

				const rotation = Math.floor(Bearing / 5) * 5

				const markerElement = document.createElement('div')

				const imageElement = document.createElement('img')

				imageElement.setAttribute('width', '45')
				imageElement.setAttribute('height', '45')
				imageElement.setAttribute('src', `${API_ENDPOINT}/img/vehicle/vehicle-${rotation}.png`)

				markerElement.appendChild(imageElement)

				const mark = new mapboxgl.Marker(markerElement).setLngLat(
					[VehicleLocation.Longitude, VehicleLocation.Latitude]
				).addTo(map as mapboxgl.Map)

				setMarkers((markers) => [...markers, mark])

				mark.getElement().addEventListener('click', async (event: MouseEvent) => {
					event.preventDefault()

					const vehicleData: VehicleMonitor = await getVehicleData(VehicleRef)

					const { OnwardCalls } = vehicleData.Siri.ServiceDelivery
						.VehicleMonitoringDelivery[0].VehicleActivity[0]
						.MonitoredVehicleJourney

					const currentPopUp = mark.getPopup() ?? new mapboxgl.Popup({ maxWidth: '100%'})

					currentPopUp.setHTML(
						popUp({ DestinationName, PublishedLineName, VehicleRef, OnwardCalls })
					)

					mark.setPopup(currentPopUp)
					mark.togglePopup()
				})
			})
		})
	}

	function onSelection(selected: SearchResult) {
		setSelected(() => selected)

		if (selected.resultType === 'RouteResult') {
			const route = selected.matches[0] as Route

			const features = route.directions.flatMap((direction) => {
				return direction.polylines.flatMap((encodedPolyline: string) => {
					const points = decodePolyline(encodedPolyline)

					return lineString(points, { color: route.color })
				})
			})

			const featureCollection = { type: 'FeatureCollection', features: features }

			const [ west, south, east, north ] = bbox(featureCollection)

			map?.fitBounds([
				[west, south], [east, north]
			], { padding: { top: 5, bottom: 5, right: 5, left: 450 } })

			const source = map?.getSource('bus-data') as any

			console.log(source)

			source.setData(featureCollection)

			showLiveVehicles(route.id)
		}
	}

	return (
		<>
			<div className="absolute z-10 w-1/3 max-w-xs min-w-xs ml-2 mt-2">
				<div className="relative">
					<Search onReset={resetMap} onSelection={onSelection} />
					{!!selected && selected.empty === false
						&& selected.resultType === 'RouteResult' &&
						<ListRoute route={selected.matches[0] as Route}></ListRoute>
					}
				</div>
			</div>
			<div id="map"></div>
		</>
	)
}
