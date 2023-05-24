export type AutoComplete = {
	label: string,
	value: string,
}

export type SearchResult = {
	empty: boolean,
	matches: [Stop] | [Route] | [Geocode],
	resultType: 'RouteResult' | 'StopResult' | 'GeocodeResult',
}

type RouteDirection = {
	destination: string,
	directionId: string,
	hasUpcomingScheduledService: boolean,
	polylines: string[]
}

export type Route = {
	id: string,
	color: string,
	shortName: string,
	longName: string,
	description: string,
	directions: RouteDirection[] | [RouteDirection] | [RouteDirection, RouteDirection],
}


export type Geocode = {
	formattedAddress: string,
	latitude: number,
	longitude: number,
	nearbyRoutes?: Route[],
	neighborhood: string,
}


export type Stop = {
	name: string,
	id: string,
	latitude: number,
	longitude: number,
	stopDirection?: string,
	routesAvailable?: Route[]
}

type SituationElement = {
	Severity: string,
	Summary: string,
	Description: string,
	CreationTime: string,
	SituationNumber: string,
	PublicationWindow: {
		StartTime: string,
		EndTime: string,
	},
	Affects: {
		AffectedVehicleJourneys: {
			LineRef: string,
			DirectionRef: string,
		}[]
	}
}

type VehicleActivity = {
	RecordedAtTime: string,
	MonitoredVehicleJourney: {
		LineRef: string,
		DirectionId: string,
		JourneyPatternRef: string,
		PublishedLineName: string,
		OperatorRef: string,
		OriginRef: string,
		DestinationName: string,
		OriginAimedDepartureTime: string,
		Monitored: boolean,
		VehicleLocation: {
			Longitude: number,
			Latitude: number,
		},
		Bearing: number,
		ProgressRate: string,
		ProgressStatus: string,
		BlockRef: string,
		VehicleRef: string,
		MonitoredCall: MonitoredCall,
		OnwardCalls: {
			OnwardCall: OnwardCall[]
		}
	}
}

type MonitoredCall = Call & {
	AimedDepartureTime: string,
	VisitNumber: number
}

export type OnwardCall = Call & {
	ExpectedArrivalTime: string
}

type Call = {
	AimedArrivalTime: string,
	StopPointRef: string,
	StopPointName: string,
	Extensions: Extensions
}

type Extensions = {
	Distances: {
		PresentableDistance: string,
		DistanceFromCall: number,
		StopsFromCall: number,
		CallDistanceAlongRoute: number
	}
}

type VehicleMonitoringDelivery = {
	VehicleActivity: VehicleActivity[],
	ResponseTimestamp: string,
	ValidUntil: string,

}
type SituationExchangeDelivery = {
	PtSituationElement: SituationElement[]
}
export type VehicleMonitor = {
	Siri: {
		ServiceDelivery: {
			ResponseTimestamp: string,
			VehicleMonitoringDelivery: VehicleMonitoringDelivery[],
			SituationExchangeDelivery: []
		}
	}
}
