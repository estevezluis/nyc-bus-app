import { useEffect, useState } from "react"

type Stop = {
	id: string,
	latitude: number,
	longitude: number,
	name: string,
	stopDirection: string,
}

type Props = {
    routeId: string,
    directionId: string,
}

export default function ListStops({ routeId, directionId }: Props) {
    const [ stops, setStops ] = useState<Stop[] | null>(null)

    useEffect(() => {
		const params = new URLSearchParams({
			routeId, directionId
		})

		const url = `/api/stops-on-route-for-direction?${params.toString()}`

        fetch(url).then((response) => response.json()).then((response: { stops: Stop[] }) => {
            setStops(() => response.stops)
        })
    }, [])

    return (
        <ul>
            {!!stops && stops.map((stop) => {
                return (
                    <li key={stop.id} className="cursor-pointer hover:bg-stone-100">
                        <span className="pl-2.5">{stop.name}</span>
                    </li>
                )
            })}
        </ul>
    )
}