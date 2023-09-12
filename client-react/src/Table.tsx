import "./Table.scss";
import {Entry} from "../../api-express-drizzle/src/db/types";


export type TableProps = {
	entries: Entry[];
	onHeaderClicked: () => void;
	onBodyRowClicked: (entryId: number) => void;
	selectedId: number;
};


export default function Table({entries, onHeaderClicked, onBodyRowClicked, selectedId}: TableProps) {
	return (
		<table>
			<thead onClick={onHeaderClicked}>
				<tr>
					<th>Id</th>
					<th>Description</th>
					<th>Number</th>
					<th>Last modif</th>
				</tr>
			</thead>
			<tbody>
				{entries.map(e => (
					<tr key={e.id} onClick={() => onBodyRowClicked(e.id)} className={e.id === selectedId ? "selected" : undefined}>
						<td>{e.id}</td>
						<td>{e.description}</td>
						<td>{e.number}</td>
						<td>{e.lastModif}</td>
					</tr>)
				)}
			</tbody>
		</table>
	);
}

