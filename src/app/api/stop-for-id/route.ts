import { NextRequest, NextResponse } from 'next/server'

import { API_ENDPOINT, API_KEY } from '@/app/constants'

export async function GET(req: NextRequest) {
	const { searchParams } = req.nextUrl
	const stopId = searchParams.get('stopId')
	if (!stopId) {
		return NextResponse.json({})
	}

	const params = new URLSearchParams()

	params.append('stopId', stopId as string)

	const urlWithParam = `${API_ENDPOINT}/api/stop-for-id?${params.toString()}`

	const apiRes = await fetch(urlWithParam)

	const apiResData = await apiRes.json()

	return NextResponse.json(apiResData)
}
