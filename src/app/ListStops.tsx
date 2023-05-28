'use client'
import mapboxgl, { Marker } from 'mapbox-gl'
import { MapContextType, useMap } from './MapContext'
import { Stop, StopMonitor } from './type'
import { useEffect, useState, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { groupBy } from 'lodash'
import PopUp from './PopUp'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type Props = {
	routeId: string
	directionId: string
}

export default function ListStops({ routeId, directionId }: Props) {
	const { map } = useMap() as MapContextType
	const [stops, setStops] = useState<Stop[]>([])
	const markerRef = useRef<Marker | null>(null)

	useEffect(() => {
		const params = new URLSearchParams({
			routeId,
			directionId,
		})

		const url = `/api/stops-on-route-for-direction?${params.toString()}`

		fetch(url)
			.then((response) => response.json())
			.then((response: { stops: Stop[] }) => {
				setStops(() => response.stops)
			})

		return () => {
			if (!!markerRef.current) {
				markerRef.current!.remove()
			}
		}
	}, [map, routeId, directionId])

	async function getStopData(stopId: string): Promise<{ siri: StopMonitor }> {
		const urlSearchParams = new URLSearchParams({ stopId })

		const url = `/api/stop-for-id?${urlSearchParams.toString()}`

		const response = await fetch(url)
		const responseData = await response.json()

		return responseData
	}

	function onClick(stop: Stop) {
		map?.flyTo({
			center: [stop.longitude, stop.latitude],
			zoom: 15,
		})

		const markerElement = document.createElement('div')

		markerElement.setAttribute(
			'class',
			'cursor-pointer rounded-full h-2 w-2 bg-green-600'
		)

		if (markerRef.current) markerRef.current.remove()

		getStopData(stop.id).then(({ siri }) => {
			const grouped = groupBy(
				siri.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit,
				(item) => item.MonitoredVehicleJourney.LineRef
			)

			const mark = new mapboxgl.Marker(markerElement)
				.setLngLat([stop.longitude, stop.latitude])
				.addTo(map as mapboxgl.Map)

			const popup = new mapboxgl.Popup({ maxWidth: '400px' }).setHTML(
				renderToString(
					<PopUp
						imageSrc={'signpost.png'}
						title={stop.name}
						type={`Stopcode ${stop.id.split('_')[1]}`}
						prompt="Buses en-route:"
					>
						<div>
							{Object.keys(grouped).map((routeId) => {
								const routeData = grouped[routeId]

								const { PublishedLineName, DestinationName } =
									routeData[0].MonitoredVehicleJourney
								return (
									<div key={routeId}>
										<div className="font-semibold">
											{PublishedLineName} {DestinationName}
										</div>
										<ul>
											{routeData
												.slice(0, 3)
												.map(({ MonitoredVehicleJourney }) => {
													return (
														<li key={MonitoredVehicleJourney.JourneyPatternRef}>
															{dayjs(
																MonitoredVehicleJourney.MonitoredCall
																	.AimedDepartureTime
															).fromNow()}
															,&nbsp;
															{
																MonitoredVehicleJourney.MonitoredCall.Extensions
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

			mark.setPopup(popup)

			markerRef.current = mark
		})
	}

	return (
		<ul>
			{stops.map((stop) => {
				return (
					<li
						key={stop.id}
						onClick={(e) => onClick(stop)}
						className="cursor-pointer hover:bg-stone-100"
					>
						<span className="pl-2.5">{stop.name}</span>
					</li>
				)
			})}
		</ul>
	)
}
