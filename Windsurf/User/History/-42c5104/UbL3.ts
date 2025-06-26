import axios from "axios";

interface Workplace {
	id: string;
	name: string;
}

interface Shift {
	id: string;
	workerId: string | null;
	workplaceId: string;
}

async function fetchTopWorkplaces(): Promise<void> {
	try {
		const workplacesRes = await axios.get("http://localhost:3000/workplaces");
		const shiftsRes = await axios.get("http://localhost:3000/shifts");

		// Extract the actual arrays from nested "data" fields
		const workplaces: Workplace[] = workplacesRes.data.data;
		const shifts: Shift[] = shiftsRes.data.data;

		console.log("Workplaces API response:", JSON.stringify(workplacesRes.data, null, 2));
		console.log("Shifts API response:", JSON.stringify(shiftsRes.data, null, 2));

		if (!Array.isArray(shifts)) {
			throw new Error(
				`Unexpected shift response: ${JSON.stringify(shiftsRes.data)}`,
			);
		}

		// Count claimed shifts per workplace
		const shiftCounts: Record<string, number> = {};

		for (const shift of shifts) {
			if (shift.workerId) {
				shiftCounts[shift.workplaceId] =
					(shiftCounts[shift.workplaceId] || 0) + 1;
			}
		}

		// Combine and sort
		const topWorkplaces = workplaces
			.map((wp) => ({
				name: wp.name,
				shifts: shiftCounts[wp.id] || 0,
			}))
			.sort((a, b) => b.shifts - a.shifts)
			.slice(0, 3); // top 3

		// Output as JSON
		console.log(JSON.stringify(topWorkplaces, null, 2));
	} catch (error) {
		console.error("Failed to fetch top workplaces:", error);
		process.exit(1);
	}
}

fetchTopWorkplaces();
