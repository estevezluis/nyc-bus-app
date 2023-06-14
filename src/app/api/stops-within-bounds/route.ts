import { NextRequest, NextResponse } from 'next/server'

import { API_ENDPOINT, API_KEY } from '@/app/constants'

export async function GET(req: NextRequest) {
	if (!req.nextUrl.searchParams.has('bounds')) {
		return NextResponse.json({})
	}

	const bounds = req.nextUrl.searchParams.get('bounds') as string

	const params = new URLSearchParams()
	params.append('key', API_KEY)
	params.append('version', '2')

	params.append('bounds', bounds)

	const urlWithParam = `${API_ENDPOINT}/api/stops-within-bounds?${params.toString()}`

	const apiRes = await fetch(urlWithParam)

	const apiResData = await apiRes.json()

	return NextResponse.json(apiResData)
}
