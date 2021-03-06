/** @param {NS} ns **/

// reduces sec level until given threshold or minimum level
export async function main(ns) {
	var target = ns.args[0];
	var secThresh = ns.args[1]
	while (true) {
		if (ns.getServerSecurityLevel(target) > secThresh) {
			await ns.weaken(target);
		} else {
			console.log('sec level lower than 50% of max');
			ns.exit()
		}
	}
}
