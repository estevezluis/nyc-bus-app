import { Route, Stop, StopMonitor } from './type'
import mapboxgl, { Marker } from 'mapbox-gl'
import { MapContextType, useMap } from './MapContext'
import { useEffect, useState, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { groupBy } from 'lodash'
import PopUp from './PopUp'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type Props = {
	route: Route
}

type StopsForDirection = {
	directionId: string
	destination: string
	stops: Stop[]
}

export default function ListRoute({ route }: Props) {
	const { map } = useMap() as MapContextType
	const markerRef = useRef<Marker | null>(null)
	const [stops, setStops] = useState<StopsForDirection[] | null>(null)

	useEffect(() => {
		const getStopsForDirections: Promise<StopsForDirection>[] =
			route.directions.map(async ({ directionId, destination }) => {
				const params = new URLSearchParams({
					routeId: route.id,
					directionId,
				})

				const url = `/api/stops-on-route-for-direction?${params.toString()}`

				return fetch(url)
					.then((response) => response.json())
					.then((response: { stops: Stop[] }) => {
						return { directionId, destination, stops: response.stops }
					})
			})

		Promise.allSettled(getStopsForDirections).then((results) => {
			const stopsForDirections: StopsForDirection[] = results.reduce(
				(acc: StopsForDirection[], result) => {
					if (result.status === 'fulfilled') {
						acc.push(result.value)
					}
					return acc
				},
				[]
			)
			setStops(stopsForDirections)
		})

		return () => {
			if (!!markerRef.current) markerRef.current.remove()
		}
	}, [route])

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

		if (!!markerRef.current) markerRef.current.remove()

		getStopData(stop.id).then(({ siri }) => {
			const grouped = groupBy(
				siri.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit,
				(item) => item.MonitoredVehicleJourney.LineRef
			)

			let groupKeys = Object.keys(grouped)

			const routeIndex = groupKeys.findIndex((key) => key === route.id)

			if (routeIndex > -1) {
				const removed = groupKeys.splice(routeIndex, 1)[0]

				groupKeys.unshift(removed)
			}

			const mark = new mapboxgl.Marker(markerElement)
				.setLngLat([stop.longitude, stop.latitude])
				.addTo(map as mapboxgl.Map)

			const popup = new mapboxgl.Popup({
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

			mark.togglePopup()

			markerRef.current = mark
		})
	}

	return (
		<div className="rounded shadow mt-2 bg-slate-100 text-neutral-800 dark:bg-neutral-800 dark:text-slate-300 w-full p-2 max-h-[75vh] overflow-auto">
			<h3 className="py-1 text-ellipsis">
				{route.shortName} {route.longName}
			</h3>
			<div
				className="h-1 w-full"
				style={{
					backgroundColor: `#${route.color ?? '000'}`,
				}}
			></div>
			<p className="pt-1 text-sm text-slate-600 dark:text-slate-400">
				{route.description}
			</p>

			<div className="py-2">
				{!!stops &&
					stops.map(({ directionId, destination, stops }) => {
						return (
							<div key={directionId} className="accordion-iten">
								<div className="text-ellipsis font-semibold">{destination}</div>
								<div className="text-ellipsis">
									<ul>
										{stops.map((stop) => {
											return (
												<li
													key={stop.id}
													onClick={(_e) => onClick(stop)}
													className="cursor-pointer hover:bg-stone-100 dark:hover:bg-neutral-700"
												>
													<span className="pl-2.5">{stop.name}</span>
												</li>
											)
										})}
									</ul>
								</div>
							</div>
						)
					})}
			</div>
		</div>
	)
}
