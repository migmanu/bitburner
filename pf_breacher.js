/** @param {NS} ns **/

// executes ns.weaken() one time on passed server
export async function main(ns) {
	var target = ns.args[0];
	await ns.weaken(target);
}
