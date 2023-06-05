import { useEffect, useState } from 'react'

export default function useMediaQuery(): boolean {
	const [matches, setMatches] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches)
		}

		mediaQuery.addEventListener('change', handleChange)
		setMatches(mediaQuery.matches)

		return () => {
			mediaQuery.removeEventListener('change', handleChange)
		}
	}, [])

	return matches
}

useMediaQuery
