/** @param {NS} ns **/

/*
Welcome to my pirate farmer script. Instructions in paragraph. This script is intended to be run from your home server. It will copya pf_breacher.js to all your bought servers and farm a target server until sec threshold determined by user is reached. It will do this trying to make as efficient use of available RAM as possible.

IMPORTANT: If breacher file name is changed, this script must be updated accodingly.

TODO: add kill scripts on servers to avoid bugs?

 */
export async function main(ns) {

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
	var selectedServerArray = [];
	var totalServersRAM = 0;
	for (const srv of purchasedServersArray) {
		var serverInfo = [];
		var serverFreeRam = Math.floor(ns.getServerMaxRam(srv) - ns.getServerUsedRam(srv));
		serverInfo.push(srv);
		serverInfo.push(serverFreeRam);
		totalServersRAM = totalServersRAM + serverFreeRam;
		selectedServerArray.push(serverInfo);
	}



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
	var secScriptImpact = ns.weakenAnalyze(1) // impact of weaken using only one thread
	var secImpactNeeded = (secLevel - secLevelThreshold);
	var secRepetitionsNeeded = Math.ceil(secImpactNeeded / secScriptImpact);

	// while loop for all scripts	
	while (true) {
		ns.print("global while init");
		ns.print(`sec reps needed: ${secRepetitionsNeeded}`)
		var secRepetitionsMade = 0;
		var offTime = [secScriptTime];

		// SEC BREACHER

		// copy server array
		var secServerArray = selectedServerArray.filter(() => true);
		// create array for grower
		var groServerArray = []
		ns.print(`sec srv array: ${secServerArray}`)
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
			
			// 
			var secRepetitionDifference = Math.floor(secRepetitionsNeeded - secRepetitionsMade);
			
			// server while loop
			// for each server in list
			// while secRepetitionDifference is larger than 0 to avoid pointless calling
			var s = 0
			while (s < secServerArray.length && secRepetitionDifference > 0) {
				ns.print(
					`
					server while init S: ${s};
					sec array: ${secServerArray};
					first element: ${secServerArray[0]};
					this element: ${secServerArray[s]};
					length: ${secServerArray.length};
					reps needed: ${secRepetitionsNeeded};
					rep diff: ${secRepetitionDifference}
					sec script RAM: ${secScriptRamUsage};
					sec script time: ${secScriptTime};
					sec script impact: ${secScriptImpact};
					impact needed: ${secImpactNeeded};
					total RAM: ${totalServersRAM};
					`
				)
				// divide available server RAM by script requirement
				var serverMaxRepetitions = Math.floor(secServerArray[s][1] / secScriptRamUsage);

				// one or less servers needed
				// rep diff must be larger than 0 to avoid invalid thread call
				// AND rep diff must be eqaual or smaller to srv max reps to justify oly one srv called
				if (secRepetitionDifference > 0 && secRepetitionDifference <= serverMaxRepetitions) {
					ns.print(`one or less servers needed`)
					ns.print(
						`
						rep diff: ${secRepetitionDifference};
						srv max reps: ${serverMaxRepetitions}
						`
						)

					// update repetition difference
					secRepetitionDifference = 0;

					// add to repetitions made
					secRepetitionsMade = secRepetitionDifference;

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
					ns.exec("pf_breacher.js", secServerArray[s][0], secRepetitionDifference, target, secLevelThreshold);

					// more than one server needed
					// srv max reps must be larger than 1 for valid thread call
				} else if (serverMaxRepetitions >= 1) {
					ns.print(`more than one server needed`);

					// update repetition difference
					secRepetitionDifference = secRepetitionDifference - serverMaxRepetitions;
					// add to repetitions made
					secRepetitionsMade = secRepetitionsMade + serverMaxRepetitions;
					ns.print(`REPS MADE: ${secRepetitionsMade}`)
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
						Rep diff: ${secRepetitionDifference}:
						srv max reps: ${serverMaxRepetitions};
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
		await ns.sleep(Math.ceil(offTime[0]))
	}
}
