/** @param {NS} ns **/

/*
Welcome to my pirate farmer script. Instructions in paragraph. This script is intended to be run from your home server. It will copya pf_breacher.js to all your bought servers and farm a target server until sec threshold determined by user is reached. It will do this trying to make as efficient use of available RAM as possible.


 */
export async function main(ns) {
	ns.print(
		`
		pB_init.ns init with args: 
		target=${ns.args[0]}, 
		`
	)

	// args
	var target = ns.args[0];

	// general variables
	var hostServer = ns.getHostname();
	var filesToCopy = ["pf_breacher.js"]
	var purchasedServersArray = ns.getPurchasedServers();

	// money variables
	var money = ns.getServerMoneyAvailable(target);
	var maxMoney = ns.getServerMaxMoney(target);


	// SERVER LIST BUILDER

	// creates array with elements arrays formated: [serverName, serverRAM]
    // input: purchasedServersArray
	// creates totalServerRAM with sum of array's servers RAM
	ns.print(`Purch srv array : ${purchasedServersArray} `);
	var selectedServerArray = [];
	var totalServersRAM = 0;
	for (const srv of purchasedServersArray) {
		var serverInfo = [];
		var serverFreeRam = ns.getServerMaxRam(srv) - ns.getServerUsedRam(srv);
		serverInfo.push(srv);
		serverInfo.push(serverFreeRam);
		totalServersRAM = totalServersRAM + serverFreeRam;
		selectedServerArray.push(serverInfo);
	}

	ns.print(`selected srv array: ${selectedServerArray} `);


	// SCRIPT PASTER
	for (const srv of selectedServerArray) {
		await ns.scp(filesToCopy, srv[0]);
	}

	// SEC BREACHER
	var secLevel = ns.getServerSecurityLevel(target);
	var secLevelThreshold = ns.getServerMinSecurityLevel(target)

	// calculate repetitions needed given server's total RAM
	var secScriptRamUsage = ns.getScriptRam("pf_breacher.js");
	var secScriptTime = ns.getWeakenTime(target);
	var secScriptThreads = Math.floor(totalServersRAM / secScriptRamUsage);
	var expectedWeakenImpact = ns.weakenAnalyze(secScriptThreads);
	var totalExpectedWeakenImpact = secScriptThreads * expectedWeakenImpact;
	var secImpactNeeded = (secLevel - secLevelThreshold);
	var secRepetitionsNeeded = 25 //Math.floor((secLevel - secLevelThreshold) / totalExpectedWeakenImpact);

	ns.print(
		`
		sec script RAM: ${secScriptRamUsage};
		sec script time: ${secScriptTime};
		sec script thrs: ${secScriptThreads};
		sec script impact: ${expectedWeakenImpact};
		impact needed: ${secImpactNeeded};
		total weaken impact: ${totalExpectedWeakenImpact};
		total RAM: ${totalServersRAM};
		repetitions: ${secRepetitionsNeeded}
		`
	)
	// while loop for all scripts	
	while (true) {
		ns.print("global while init")
		var secRepetitionsMade = 0;
		var offTime = [];

		// SEC BREACHER

		// copy server array
		ns.print(` original array ${selectedServerArray} `)
		var secServerArray = selectedServerArray.filter(() => true);
		ns.print(` sec array: ${secServerArray} `)
		// create array for grower
		var groServerArray = []
		ns.print(`gro array ${groServerArray} `)

		// stop loop when all servers busy
		var availableServers = selectedServerArray.length;
		var usedSecServers = 0;
		ns.print(`av servers: ${availableServers} `);

		// while loop only if there are more repetitions needed AND servers available
		while (secRepetitionsMade < secRepetitionsNeeded && usedSecServers < availableServers) {
			ns.print(
				`
				sec while init;
				sec reps made ${secRepetitionsMade};
				av srv: ${availableServers};
				used srv: ${usedSecServers}
				`
			)

			// for each server in list
			var s = 0
			while (s < secServerArray.length) {
				ns.print(
					`
					server while init S: ${s};
					length: ${secServerArray.length};
					rep diff: ${secRepetitionsNeeded - secRepetitionsMade}
					`
				)
				// divide available server RAM by script requirement
				var serverMaxRepetitions = Math.floor(secServerArray[0][1] / secScriptRamUsage);
				var repetitionsDifference = Math.floor(secRepetitionsNeeded - secRepetitionsMade);

				// one or less servers needed
				if (repetitionsDifference > 0 && repetitionsDifference <= serverMaxRepetitions) {
					ns.print(`one or less servers needed`)
					ns.print(
						`
						rep diff: ${repetitionsDifference};
						srv max reps: ${serverMaxRepetitions}
						`
						)
					// add to repetitions made
					secRepetitionsMade = secRepetitionsMade + repetitionsDifference;

					// add server to groServerArray
					var serverArray = [];
					serverArray.push(secServerArray[s][0]);
					serverArray.push(secServerArray[s][1]);
					groServerArray.push(serverArray);

					// add time to offTime
					offTime.push(secScriptTime)

					// add to used sec severs
					usedSecServers++;

					// execute breacher
					ns.exec("pf_breacher.js", secServerArray[s][0], repetitionsDifference, target, secLevelThreshold);

					// more than one server needed
				} else if (repetitionsDifference > secRepetitionsMade) {
					ns.print(`more than one server needed`);
					// add to repetitions made
					secRepetitionsMade = secRepetitionsMade + serverMaxRepetitions;

					// add tim to offTime
					offTime.push(secScriptTime)

					// add to use sec severs
					usedSecServers++;

					// execute breacher
					ns.exec("pf_breacher.js", secServerArray[s][0], serverMaxRepetitions, target, secLevelThreshold);

				} else {
					ns.print(
						`
						ERROR: script failed both if statements;
						Reps made: ${secRepetitionsMade};
						reps needed: ${secRepetitionsNeeded};
						Rep diff: ${repetitionsDifference}:
						Used sec srv: ${usedSecServers}
						`
					);
					// add tim to offTime
					offTime.push(secScriptTime)
					usedSecServers++;
					secRepetitionsMade = secRepetitionsMade + 100;
				}
				s++
			}
		}

		if (offTime.length === 0) {
			ns.print(`sec while loop exited without adding to offTime`)
			ns.exit()
		}
		ns.print(`off time is ${offTime} `)
		await ns.sleep(offTime[0])
	}
}
