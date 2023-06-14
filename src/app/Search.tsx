'use client'
import { useState, useEffect, useRef } from 'react'
import { debounce } from 'lodash'

import { AutoComplete, SearchResult } from './type'
import useMediaQuery from './useMediaQuery'

type Props = {
	onSelection: (selected: SearchResult | null) => void
}

const examples = ['M31', 'BM4', 'BX9']

export default function Search({ onSelection }: Props) {
	const prefersDarkScheme = useMediaQuery()
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [suggestions, setSuggestions] = useState<AutoComplete[]>([])
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
				})
		}, 1000)
	).current

	useEffect(() => {}, [onSelection, searchTerm, suggestions, selected])

	function onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value.toUpperCase()

		setSearchTerm(() => value)
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
		<div>
			<div
				data-page="search"
				className="w-full h-9 relative shadow bordor rounded flex flex-row items-center justify-center bg-slate-100 text-neutral-800 dark:bg-neutral-800 dark:text-slate-300"
			>
				<div className="ml-2.5 w-full text-sm text-slate-600">
					<input
						onChange={onChange}
						className="h-full w-full outline-none bg-slate-100 text-neutral-800 dark:bg-neutral-800 dark:text-slate-300"
						placeholder="Search by Route"
						type="text"
						name="search"
						id="search"
						value={searchTerm}
						disabled={!!selected}
					/>
				</div>
				<div className="w-8 h-full py-2.5">
					<button
						className={
							selected
								? 'w-full dark:hover:bg-neutral-700 hover:bg-neutral-200'
								: 'hidden'
						}
						onClick={resetBtnClick}
					>
						<svg
							className="w-full"
							height="24"
							viewBox="0 0 48 48"
							width="24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill={prefersDarkScheme ? 'white' : 'black'}
								d="M38 12.83l-2.83-2.83-11.17 11.17-11.17-11.17-2.83 2.83 11.17 11.17-11.17 11.17 2.83 2.83 11.17-11.17 11.17 11.17 2.83-2.83-11.17-11.17z"
							/>
							<path d="M0 0h48v48h-48z" fill="none" />
						</svg>
					</button>
				</div>
			</div>
			{!searchTerm.length && (
				<div className="pb-2.5 w-full h-full shadow bordor rounded items-center justify-center bg-slate-100 text-neutral-800 dark:bg-neutral-800 dark:text-slate-300">
					<p className="ml-2.5">
						<span className="font-semibold">Search Examples:</span>
						<br />
						Route:{' '}
						{examples.map((val, i) => (
							<>
								<button
									key={val}
									type="button"
									onClick={(e) => {
										e.preventDefault()

										setSearchTerm(() => val)
										suggestionClick(val)
									}}
								>
									{val}
								</button>
								{i === examples.length - 1 ? '' : ', '}
							</>
						))}
					</p>
				</div>
			)}
			<div className="absolute w-full bg-slate-100 text-neutral-800 dark:bg-neutral-800 dark:text-slate-300">
				<ul className="ml-2.5">
					{suggestions.slice(0, 5).map(({ label, value }) => {
						return (
							<li
								key={value}
								onClick={(_e) => suggestionClick(value)}
								className="cursor-pointer border-b border-solid border-slate-200 dark:border-neutral-700 cursor-pointer hover:bg-stone-100 dark:hover:bg-neutral-700"
							>
								<span>{label}</span>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}
