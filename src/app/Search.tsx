'use client'
import { useState, useEffect, useRef } from 'react'
import { debounce } from 'lodash'

import { AutoComplete, SearchResult } from './type'

type Props = {
	onSelection: (selected: SearchResult | null) => void
}

export default function Search({ onSelection }: Props) {
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [suggestions, setSuggestions] = useState<AutoComplete[]>([])
	const [fetching, setFetching] = useState<boolean>(false)
	const [selected, setSelected] = useState<boolean>(false)

	const fetchSuggestions = useRef(
		debounce((nextValue: string) => {
			if (nextValue === '') {
				setSuggestions(() => [])
				return
			}

			const params = new URLSearchParams({ term: nextValue })

			fetch(`/api/autocomplete?${params.toString()}`)
				.then((response) => response.json())
				.then((response: AutoComplete[]) => {
					setSuggestions(() => {
						return response
					})
					setFetching(() => false)
				})
		}, 1000)
	).current

	useEffect(() => {}, [onSelection, searchTerm, suggestions, selected])

	function onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value.toUpperCase()

		setSearchTerm(() => value)
		setFetching(() => true)
		fetchSuggestions(value)
	}

	function resetBtnClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		e.preventDefault()
		setSearchTerm(() => '')
		setSelected(() => false)
		onSelection(null)
		setSuggestions(() => [])
	}

	function suggestionClick(suggestionValue: string) {
		const URL = `/api/search?q=${suggestionValue}`

		fetch(URL)
			.then((response) => response.json())
			.then((response: { searchResults: SearchResult }) => {
				if (response.searchResults.empty === false) {
					setSuggestions(() => [])
					setSelected(true)
					onSelection(response.searchResults)
				}
			})
	}

	return (
		<div data-page="search" className="w-full h-9 relative shadow rounded">
			<label className="absolute bg-sky-600 w-10 h-9 text-center leading-10">
				<span
					className="inline-block w-full h-full bg-center bg-no-repeat"
					style={{
						backgroundImage:
							'url(data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNDU4LjA4OCAyMzQuNDEyLTQ3LjUtNDcuNWExNy4wNjggMTcuMDY4IDAgMCAwLTEyLjA4OC01LjAxSDI3My4wOThWNDdhMTcuMDk4IDE3LjA5OCAwIDEgMC0zNC4xOTYgMHYyMC45MDJIMTEzLjVhMTcuMDY4IDE3LjA2OCAwIDAgMC0xMi4wODggNS4wMWwtNDcuNSA0Ny41YTE3LjA5IDE3LjA5IDAgMCAwIDAgMjQuMTc3bDQ3LjUgNDcuNWExNy4wNjggMTcuMDY4IDAgMCAwIDEyLjA4OCA1LjAxaDEyNS40MDJ2MjUwLjgwM0gxODBhMTcuMDk4IDE3LjA5OCAwIDAgMCAwIDM0LjE5NmgxNTJhMTcuMDk4IDE3LjA5OCAwIDAgMCAwLTM0LjE5NmgtNTguOTAyVjMxMS4wOThIMzk4LjVhMTcuMDY4IDE3LjA2OCAwIDAgMCAxMi4wODgtNS4wMWw0Ny41LTQ3LjVhMTcuMDkgMTcuMDkgMCAwIDAgMC0yNC4xNzZaIiBmaWxsPSIjZmZmZmZmIiBjbGFzcz0iZmlsbC0wMDAwMDAiPjwvcGF0aD48L3N2Zz4=)',
					}}
				></span>
			</label>
			<div className="ml-10 h-9 text-ellipsis text-sm text-slate-600">
				<input
					onChange={onChange}
					className="h-full w-full py-2.5 pl-2.5 pr-10 outline-none"
					placeholder="Search by Route"
					type="text"
					name="search"
					id="search"
					value={searchTerm}
				/>
				<div className="bg-white text-slate-600">
					<ul>
						{suggestions.map(({ label, value }) => {
							return (
								<li
									key={value}
									onClick={(_e) => suggestionClick(value)}
									className="cursor-pointer border-b border-solid hover:bg-stone-100"
								>
									<span>{label}</span>
								</li>
							)
						})}
					</ul>
				</div>
				<div className="absolute h-full top-0 right-2 z-20">
					{!!fetching && (
						<span
							style={{
								display: 'block',
								width: '25px',
								height: '25px',
								backgroundRepeat: 'no-repeat',
								backgroundPosition: 'center',
								backgroundImage:
									'url(data:image/svg+xml;base64,PHN2ZyB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjAgMjAiPjxwYXRoIGQ9Im0xMCAyIDAgMy4zYzIuNiAwIDQuNyAyLjEgNC43IDQuN2wzLjMgMGMwLTQuNC0zLjYtOC04LTh6IiBmaWxsPSIjMDAwIi8+PHBhdGggZD0iTTEwIDJDNi44IDIgMy43IDQuMSAyLjYgNy4xIDEuNCAxMCAyLjEgMTMuNiA0LjUgMTUuOGMyLjQgMi40IDYuNCAyLjkgOS40IDEuMiAyLjUtMS40IDQuMi00LjIgNC4yLTctMS4xIDAtMi4yIDAtMy4zIDAgMC4xIDIuMi0xLjcgNC4zLTMuOCA0LjZDOC43IDE1IDYuNCAxMy44IDUuNyAxMS43IDQuOCA5LjcgNS42IDcuMSA3LjYgNiA4LjMgNS42IDkuMSA1LjMgMTAgNS4zYzAtMS4xIDAtMi4yIDAtMy4zeiIgc3R5bGU9ImZpbGw6IzAwMDtvcGFjaXR5OjAuMiIvPjwvc3ZnPg==)',
								animation: 'rotate 400ms linear infinite',
							}}
						></span>
					)}
					{!!selected && (
						<button
							onClick={resetBtnClick}
							style={{
								width: '25px',
								height: '25px',
								backgroundRepeat: 'no-repeat',
								backgroundPosition: 'center',
								backgroundImage:
									'url(data:image/svg+xml;base64,PHN2ZyB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIiBoZWlnaHQ9IjIwIiB3aWR0aD0iMjAiPg0KICA8cGF0aCBkPSJtNSA1IDAgMS41IDMuNSAzLjUtMy41IDMuNSAwIDEuNSAxLjUgMCAzLjUtMy41IDMuNSAzLjUgMS41IDAgMC0xLjUtMy41LTMuNSAzLjUtMy41IDAtMS41LTEuNSAwLTMuNSAzLjUtMy41LTMuNS0xLjUgMHoiIGZpbGw9IiMwMDAiLz4NCjwvc3ZnPg==)',
							}}
						></button>
					)}
				</div>
			</div>
		</div>
	)
}
