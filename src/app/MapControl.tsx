'use client'
import { Route, SearchResult, VehicleMonitor, OnwardCall } from './type'

import Search from './Search'
import ListRoute from './ListRoute'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl, { GeoJSONSource } from 'mapbox-gl'
import { lineString, bbox } from '@turf/turf'
import { decodePolyline } from './Utils'

import { useState, useEffect } from 'react'
import { renderToString } from 'react-dom/server'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { API_ENDPOINT } from './constants'

import { MapContextType, useMap } from './MapContext'

dayjs.extend(relativeTime)

export default function MapOverlay() {
    const { map, reset, addedMarkers } = useMap() as MapContextType
	const [ selected, setSelected ] = useState<SearchResult | null>(null)

	useEffect(() => {}, [map])

	function resetMap(): void {
		setSelected(() => null)

		reset()

		const source = map?.getSource('bus-data') as GeoJSONSource

		source.setData({ type: 'FeatureCollection', features: [] })
	}

	async function getVehicleData(params: { LineRef?: string, VehicleRef?: string }): Promise<VehicleMonitor> {
		const urlSearchParams = new URLSearchParams(params)

		const url = `/api/vehicle-monitoring?${urlSearchParams.toString()}`

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
		const allMarkers: mapboxgl.Marker[] = []

		getVehicleData({ LineRef: routeId }).then((resData: VehicleMonitor) => {
			resData.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity.forEach((activity) => {
				const {
					VehicleLocation, Bearing, DestinationName, PublishedLineName, VehicleRef
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

				allMarkers.push(mark)

				mark.getElement().addEventListener('click', async (event: MouseEvent) => {
					event.preventDefault()

					const vehicleData: VehicleMonitor = await getVehicleData({ VehicleRef })

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
			addedMarkers(allMarkers)
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

			const featureCollection: GeoJSON.FeatureCollection = {
				type: 'FeatureCollection', features: features
			}

			const [ west, south, east, north ] = bbox(featureCollection)

			map?.fitBounds([
				[west, south], [east, north]
			], { padding: { top: 5, bottom: 5, right: 5, left: 450 } })

			const source = map?.getSource('bus-data') as GeoJSONSource

			source.setData(featureCollection)

			showLiveVehicles(route.id)
		}
	}

    return (
		<div className="absolute z-10 w-1/3 max-w-xs min-w-xs ml-2 mt-2">
			<div className="relative">
				<Search onReset={resetMap} onSelection={onSelection} />
				{!!selected && selected.empty === false
					&& selected.resultType === 'RouteResult' &&
					<ListRoute route={selected.matches[0] as Route}></ListRoute>
				}
			</div>
		</div>
    )
}
