import { NextRequest, NextResponse } from "next/server";

import { API_ENDPOINT, API_KEY } from "@/app/constants";

export async function GET(req: NextRequest) {
    if (!req.nextUrl.searchParams.has('q')) {
        return NextResponse.json({
            searchResults: {
                empty: true
            }
        })
    }

    const params = new URLSearchParams()

    params.append('q', req.nextUrl.searchParams.get('q') as string)
    params.append('includePolylines', 'true')
    params.append('key', API_KEY)

    const URL = `${API_ENDPOINT}/api/search?${params.toString()}`

    const proxyResponse = await fetch(URL)
    const responseData = await proxyResponse.json()

    return NextResponse.json(responseData)
}