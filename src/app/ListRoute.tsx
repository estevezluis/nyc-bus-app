import { Route } from './type'
import ListStops from './ListStops'
import { useEffect } from 'react'

type Props = {
	route: Route
}

export default function ListRoute({ route }: Props) {
	useEffect(() => {}, [route])

	return (
		<div className="rounded shadow mt-2 bg-white w-full p-2 max-h-[75vh] overflow-auto">
			<h3 className="py-1 text-ellipsis">{route.shortName} {route.longName}</h3>
			<div className="h-1 w-full" style={{
				backgroundColor: `#${route.color ?? '000'}`
			}}></div>
			<p className="pt-1 text-sm text-slate-600">{route.description}</p>

			<div className="py-2">
				{route.directions.map(({ directionId, destination }) => {
					return (
						<div key={directionId} className="accordion-iten">
							<div className="text-ellipsis font-semibold">{destination}</div>
							<div className="text-ellipsis">
								<ListStops routeId={route.id} directionId={directionId} />
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}