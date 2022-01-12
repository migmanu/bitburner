/** @param {NS} ns **/

/* 
script meant to kill all scripts running in player bought servers.
Use with caution.
 */

export async function main(ns) {
	var question = await ns.prompt(
		"WARNING: this will kill all running scripts in all player bought servers. Continue?"
		)
	if (question === true) {
		var serverList = ns.getPurchasedServers();
		ns.print(serverList);
		for (const srv of serverList) {
			ns.print(`attemprting to kill scripts in ${srv} `)
			ns.killall(srv);
		}
	} else {
		ns.print(`question is: ${question} `)
	}
}
