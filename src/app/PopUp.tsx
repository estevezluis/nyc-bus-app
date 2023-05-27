import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { OnwardCall } from './type'

dayjs.extend(relativeTime)

type Props = {
	VehicleRef: string
	PublishedLineName: string
	DestinationName: string
	OnwardCalls: { OnwardCall: OnwardCall[] }
}
export default function PopUp({
	VehicleRef,
	PublishedLineName,
	DestinationName,
	OnwardCalls,
}: Props) {
	return (
		<div>
			<div className="header vehicle">
				<p className="title">
					{PublishedLineName} {DestinationName}
				</p>
				<p>
					<span className="type">Vehicle #{VehicleRef.split('_')[1]}</span>
				</p>
			</div>
			<div>
				<p>Next Stops:</p>
				<ul>
					{OnwardCalls.OnwardCall.map((onwardCall: OnwardCall) => {
						return (
							<li key={onwardCall.StopPointRef}>
								<span className="font-semibold">
									{onwardCall.StopPointName}
								</span>
								&nbsp;{dayjs(onwardCall.ExpectedArrivalTime).fromNow()},&nbsp;
								{onwardCall.Extensions.Distances.PresentableDistance}
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}
