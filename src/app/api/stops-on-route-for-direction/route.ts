import { NextRequest, NextResponse } from 'next/server'

import { API_ENDPOINT, API_KEY } from '@/app/constants'

export async function GET(req: NextRequest) {
	if (
		!req.nextUrl.searchParams.has('routeId') ||
		!req.nextUrl.searchParams.has('directionId')
	) {
		return NextResponse.json({})
	}

	const routeId = req.nextUrl.searchParams.get('routeId') as string
	const directionId = req.nextUrl.searchParams.get('directionId') as string

	const params = new URLSearchParams()
	params.append('key', API_KEY)
	params.append('version', '2')

	params.append('routeId', routeId)
	params.append('directionId', directionId)

	const urlWithParam = `${API_ENDPOINT}/api/stops-on-route-for-direction?${params.toString()}`

	const apiRes = await fetch(urlWithParam)

	const apiResData = await apiRes.json()

	return NextResponse.json(apiResData)
}
