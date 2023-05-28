type Props = {
	title: string
	type: string
	prompt: string
	children: any
}
export default function PopUp({ title, type, prompt, children }: Props) {
	return (
		<div>
			<div>
				<p className="font-semibold">{title}</p>
				<p>
					<span>{type}</span>
				</p>
			</div>
			<div>
				<p>{prompt}</p>
				<div>{children}</div>
			</div>
		</div>
	)
}
