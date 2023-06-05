type Props = {
	title: string
	type: string
	prompt: string
	imageSrc: string
	children: any
}
export default function PopUp({
	title,
	type,
	prompt,
	imageSrc,
	children,
}: Props) {
	return (
		<div className="max-w-[400px] overflow-x-auto">
			<div className="flex flex-row mr-2.5">
				<div
					style={{
						width: '50px',
						height: '50px',
						marginRight: '5px',
						backgroundColor: 'black',
						backgroundPosition: 'center',
						backgroundSize: 'auto',
						backgroundImage: `url(${imageSrc})`,
					}}
				></div>
				<div>
					<p className="font-semibold">{title}</p>
					<p>
						<span>{type}</span>
					</p>
				</div>
			</div>
			<div>
				<p>{prompt}</p>
				<div className="max-h-[200px] overflow-y-auto">{children}</div>
			</div>
		</div>
	)
}
