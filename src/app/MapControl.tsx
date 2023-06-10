'use client'

import { API_ENDPOINT } from './constants'
import { Route, SearchResult, Stop, StopMonitor, VehicleMonitor } from './type'

import Search from './Search'
import ListRoute from './ListRoute'
import PopUp from './PopUp'

import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl, { GeoJSONSource, LngLatBounds, Marker } from 'mapbox-gl'
import { lineString, bbox } from '@turf/turf'
import { decodePolyline } from './Utils'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

import { useState, useEffect, useRef } from 'react'
import { renderToString } from 'react-dom/server'

import { MapContextType, useMap } from './MapContext'
import { debounce, groupBy } from 'lodash'

const SIXTY_SECONDS = 60 * 1000

export default function MapControl() {
	const { map, reset, setMarkers } = useMap() as MapContextType
	const [selected, setSelected] = useState<SearchResult | null>(null)
	const stopMarkersRef = useRef<Marker[]>([])

	async function getStopData(stopId: string): Promise<{ siri: StopMonitor }> {
		const urlSearchParams = new URLSearchParams({ stopId })

		const url = `/api/stop-for-id?${urlSearchParams.toString()}`

		const response = await fetch(url)
		const responseData = await response.json()

		return responseData
	}

	useEffect(() => {
		const fetchStopsByBounds = debounce((bounds: LngLatBounds) => {
			const north = bounds.getNorth()
			const south = bounds.getSouth()
			const west = bounds.getWest()
			const east = bounds.getEast()

			fetch(`/api/stops-within-bounds?bounds=${south},${west},${north},${east}`)
				.then((response) => response.json())
				.then((response: { stops: Stop[] }) => {
					if (!!map) {
						for (const stop of response.stops) {
							const markerElement = document.createElement('div')

							markerElement.setAttribute(
								'class',
								'cursor-pointer rounded-full h-2 w-2 bg-green-600'
							)
							const stopMarker = new mapboxgl.Marker(markerElement)
								.setLngLat([stop.longitude, stop.latitude])
								.addTo(map as mapboxgl.Map)

							stopMarkersRef.current.push(stopMarker)

							stopMarker.getElement().addEventListener('click', () => {
								getStopData(stop.id).then(({ siri }) => {
									const grouped = groupBy(
										siri.Siri.ServiceDelivery.StopMonitoringDelivery[0]
											.MonitoredStopVisit,
										(item) => item.MonitoredVehicleJourney.LineRef
									)

									let groupKeys = Object.keys(grouped)

									const currentPopUp =
										stopMarker.getPopup() ??
										new mapboxgl.Popup({
											maxWidth: '400px',
											className: 'text-neutral-800 dark:text-slate-300',
										}).setHTML(
											renderToString(
												<PopUp
													imageSrc={'signpost.png'}
													title={stop.name}
													type={`Stopcode ${stop.id.split('_')[1]}`}
													prompt="Buses en-route:"
												>
													<div>
														{groupKeys.map((groupKey) => {
															const routeData = grouped[groupKey]

															const { PublishedLineName, DestinationName } =
																routeData[0].MonitoredVehicleJourney
															return (
																<div key={groupKey}>
																	<div className="font-semibold">
																		{PublishedLineName} {DestinationName}
																	</div>
																	<ul>
																		{routeData
																			.slice(0, 3)
																			.map(({ MonitoredVehicleJourney }) => {
																				return (
																					<li
																						key={
																							MonitoredVehicleJourney.JourneyPatternRef
																						}
																					>
																						{dayjs(
																							MonitoredVehicleJourney
																								.MonitoredCall
																								.AimedDepartureTime
																						).fromNow()}
																						,&nbsp;
																						{
																							MonitoredVehicleJourney
																								.MonitoredCall.Extensions
																								.Distances.PresentableDistance
																						}
																					</li>
																				)
																			})}
																	</ul>
																</div>
															)
														})}
													</div>
												</PopUp>
											)
										)
									stopMarker.setPopup(currentPopUp)

									stopMarker.togglePopup()
								})
							})
						}
					}
				})
		}, 0)
		function onMove() {
			for (const stopMarker of stopMarkersRef.current) {
				stopMarker.remove()
			}
			if (!selected && !!map && map.getZoom() >= 14.5) {
				fetchStopsByBounds(map.getBounds())
			}
		}

		map?.on('moveend', onMove)
		function showLiveVehicles(routeId: string) {
			const allMarkers: mapboxgl.Marker[] = []

			const [operatorRef, lineRef] = routeId.split('_')

			getVehicleData({ LineRef: lineRef, OperatorRef: operatorRef }).then(
				(resData: VehicleMonitor) => {
					resData.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity.forEach(
						(activity) => {
							const {
								VehicleLocation,
								Bearing,
								DestinationName,
								PublishedLineName,
								VehicleRef,
							} = activity.MonitoredVehicleJourney

							const rotation = Math.floor(Bearing / 5) * 5

							const markerElement = document.createElement('div')

							markerElement.setAttribute('class', 'cursor-pointer')

							const imageElement = document.createElement('img')

							imageElement.setAttribute('width', '45')
							imageElement.setAttribute('height', '45')
							imageElement.setAttribute(
								'src',
								`${API_ENDPOINT}/img/vehicle/vehicle-${rotation}.png`
							)

							markerElement.appendChild(imageElement)

							const mark = new mapboxgl.Marker(markerElement)
								.setLngLat([
									VehicleLocation.Longitude,
									VehicleLocation.Latitude,
								])
								.addTo(map as mapboxgl.Map)

							allMarkers.push(mark)

							mark
								.getElement()
								.addEventListener('click', async (event: MouseEvent) => {
									event.preventDefault()

									const vehicleData: VehicleMonitor = await getVehicleData({
										OperatorRef: operatorRef,
										VehicleRef,
									})

									const { OnwardCalls } =
										vehicleData.Siri.ServiceDelivery
											.VehicleMonitoringDelivery[0].VehicleActivity[0]
											.MonitoredVehicleJourney

									const currentPopUp =
										mark.getPopup() ??
										new mapboxgl.Popup({
											maxWidth: '400px',
											className: 'text-neutral-800 dark:text-slate-300',
										})

									currentPopUp.setHTML(
										renderToString(
											<PopUp
												imageSrc={'bus.png'}
												title={`${PublishedLineName} ${DestinationName}`}
												type={`Vehicle # ${VehicleRef.split('_')[1]}`}
												prompt="Next stops"
											>
												<ul className="dark:bg-neutral-800 bg-slate-100">
													{OnwardCalls.OnwardCall.map((onwardCall) => {
														return (
															<li key={onwardCall.StopPointRef}>
																<span className="font-semibold">
																	{onwardCall.StopPointName}
																</span>
																&nbsp;
																{dayjs(
																	onwardCall.ExpectedArrivalTime
																).fromNow()}
																,&nbsp;
																{
																	onwardCall.Extensions.Distances
																		.PresentableDistance
																}
															</li>
														)
													})}
												</ul>
											</PopUp>
										)
									)

									mark.setPopup(currentPopUp)
									mark.togglePopup()
								})
						}
					)
					setMarkers((prevMarkers) => prevMarkers.concat(allMarkers))
				}
			)
		}

		if (!!selected && selected.resultType === 'RouteResult') {
			const route = selected.matches[0] as Route

			const features = route.directions.flatMap((direction) => {
				return direction.polylines.flatMap((encodedPolyline: string) => {
					const points = decodePolyline(encodedPolyline)

					return lineString(points, { color: route.color })
				})
			})

			const featureCollection: GeoJSON.FeatureCollection = {
				type: 'FeatureCollection',
				features: features,
			}

			const [west, south, east, north] = bbox(featureCollection)

			map?.fitBounds(
				[
					[west, south],
					[east, north],
				],
				{ padding: { top: 5, bottom: 5, right: 5, left: 450 } }
			)

			if (!!map) {
				const source = map.getSource('bus-data') as GeoJSONSource
				source?.setData(featureCollection)
			}

			showLiveVehicles(route.id)
			const intervalId = setInterval(() => {
				setMarkers((activeMarkers) => {
					for (const activeMarker of activeMarkers) {
						activeMarker.remove()
					}

					return []
				})
				showLiveVehicles(route.id)
			}, SIXTY_SECONDS)
			return () => {
				clearInterval(intervalId)

				map?.off('moveend', onMove)
			}
		} else {
			return () => {
				map?.off('moveend', onMove)

				if (!!stopMarkersRef.current?.length) {
					for (const stopMarker of stopMarkersRef.current) {
						stopMarker.remove()
					}
				}
			}
		}
	}, [map, setMarkers, selected])

	async function getVehicleData(params: {
		OperatorRef: string
		LineRef?: string
		VehicleRef?: string
	}): Promise<VehicleMonitor> {
		const urlSearchParams = new URLSearchParams(params)

		const url = `/api/vehicle-monitoring?${urlSearchParams.toString()}`

		const response = await fetch(url)
		const responseData = await response.json()

		return responseData
	}

	function onSelection(selected: SearchResult | null) {
		reset()
		setSelected(() => selected)
	}

	return (
		<div className="absolute z-10 w-1/3 max-w-xs min-w-xs ml-2 mt-2">
			<div className="relative">
				<Search onSelection={onSelection} />
				{!!selected &&
					selected.empty === false &&
					selected.resultType === 'RouteResult' && (
						<ListRoute route={selected.matches[0] as Route}></ListRoute>
					)}
			</div>
		</div>
	)
}
