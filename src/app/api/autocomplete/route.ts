import { NextRequest, NextResponse } from 'next/server'

import { API_ENDPOINT } from '@/app/constants'
export async function GET(req: NextRequest) {
	if (!req.nextUrl.searchParams.has('term')) {
		return NextResponse.json([])
	}

	const term = req.nextUrl.searchParams.get('term') as string

	const URL = `${API_ENDPOINT}/api/autocomplete?term=${term}`

	const proxyResponse = await fetch(URL)
	const responseData = await proxyResponse.json()

	return NextResponse.json(responseData)
}
