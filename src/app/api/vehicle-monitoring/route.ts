import { NextRequest, NextResponse } from 'next/server'

import { API_ENDPOINT, API_KEY } from '@/app/constants'

export async function GET(req: NextRequest) {
	const { searchParams } = req.nextUrl
	const lineRef = searchParams.get('LineRef')
	const vehicleRef = searchParams.get('VehicleRef') 
	if (!lineRef && !vehicleRef) {
		return NextResponse.json({})
	}


	const params = new URLSearchParams()
	params.append('key', API_KEY)

	params.append('OperatorRef', 'MTA NYCT')

	if (!!lineRef) {
		const [, routeId] = (lineRef as string).split('_') 
		params.append('LineRef', routeId)
	} else {
		params.append('VehicleRef', vehicleRef as string)
		params.append('MaximumNumberOfCallsOnwards', '3')
		params.append('VehicleMonitoringDetailLevel', 'calls')
	}

	const urlWithParam = `${API_ENDPOINT}/api/siri/vehicle-monitoring.json?${params.toString()}`

	const apiRes = await fetch(urlWithParam)

	const apiResData = await apiRes.json()

	return NextResponse.json(apiResData)
}