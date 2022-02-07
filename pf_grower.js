/** @param {NS} ns **/

// executes ns.grow() on target sever one time
export async function main(ns) {
	var target = ns.args[0];
	await ns.grow(target);
}