/** @param {NS} ns **/

/*
Welcome to my pirate farmer script. Instructions in paragraph. This script is intended to be run 
from your home server. It will copy pf_breacher.js to all your bought servers and farm a target 
server. It will do this trying to make as efficient use of available RAM as possible.

It will use the following associated files: pf_breacher.js, pf_grower.js, pf_hacker,js 
IMPORTANT: If any file name is changed, this script must be updated accodingly.

The script works with a global while loop that calls nested loops as needed. The structure of the script is:

- argument passed on script call
- general variables
- server list builder
- script paster
- sec variables
- grow variables
- global while loop
	- sec breacher
		- security while loop
			- server while loop
				- if statement for one or less servers needed
				- if statement for more than one server needed
				- if statement to catch errors
	- grower


TODO: 
	- add kill scripts on servers to avoid bugs?
	- move sec variables into global while loop
	- change sec while to if codnitional?

 */
export async function main(ns) {

	// args
	var target = ns.args[0];

	// general variables
	var hostServer = ns.getHostname();
	var filesToCopy = ["pf_breacher.js"]
	var purchasedServersArray = ns.getPurchasedServers();

	
	// SERVER LIST BUILDER //

	// creates array with elements arrays formated: [serverName, serverRAM]
    // input: purchasedServersArray
	// creates totalServerRAM with sum of array's servers RAM
	var builtServersArray = [];
	var totalServersRAM = 0;
	for (const srv of purchasedServersArray) {
		var serverInfo = [];
		var serverFreeRam = Math.floor(ns.getServerMaxRam(srv) - ns.getServerUsedRam(srv));
		serverInfo.push(srv);
		serverInfo.push(serverFreeRam);
		totalServersRAM = totalServersRAM + serverFreeRam;
		builtServersArray.push(serverInfo);
	}



	// SCRIPT PASTER //

	for (const srv of builtServersArray) {
		await ns.scp(filesToCopy, srv[0]);
	}

	
	// SEC BREACHER VARIABLES //

	
	
	

	// while loop for all scripts	
	while (true) {
		ns.print("global while init");

		// 								SEC BREACHER 										//
		//----------------------------------------------------------------------------------//
		var secLevel = ns.getServerSecurityLevel(target);
		
		// max sec level until which weaken() is called. Default is server min sec level
		var secLevelThreshold = ns.getServerMinSecurityLevel(target); 

		// calculate repetitions needed given server's total RAM
		var secScriptRamUsage = ns.getScriptRam("pf_breacher.js");
		var secScriptTime = ns.getWeakenTime(target);
		var secScriptImpact = ns.weakenAnalyze(1) // impact of weaken using only one thread
		var secImpactNeeded = (secLevel - secLevelThreshold);
		var secRepetitionsNeeded = Math.ceil(secImpactNeeded / secScriptImpact);

		var offTime = [secScriptTime]; // time for sleep method in milliseconds
		
		var secRepetitionsMade = 0; // updated on every exec() call with amount + 1 * threads

		// copy server array
		// servers with no spare RAM after exec() call are taken out and servers with spare RAM are updated
		var serversArray = builtServersArray.filter(() => true);

	
		// stop loop when all servers busy
		var availableServers = serversArray.length; // number of servers before serversArray is mutated
		var usedSecServers = 0;

		// while loop only if there are more repetitions needed AND servers available
		while (secRepetitionsMade < secRepetitionsNeeded && usedSecServers < availableServers) {
			
			var secRepetitionDifference = Math.floor(secRepetitionsNeeded - secRepetitionsMade);
			
			// server while loop
			// for each server in list
			// while secRepetitionDifference is larger than 0 to avoid pointless calling
			var s = 0
			while (s < availableServers && secRepetitionDifference > 0) {
				ns.print(
					`
					server while init S: ${s};
					sec array: ${serversArray};
					length: ${serversArray.length};
					reps needed: ${secRepetitionsNeeded};
					rep diff: ${secRepetitionDifference}
					sec script time: ${secScriptTime};
					impact needed: ${secImpactNeeded};
					`
				)
				// divide available server RAM by script requirement
				var serverMaxRepetitions = Math.floor(serversArray[0][1] / secScriptRamUsage);

				// one or less servers needed
				// rep diff must be larger than 0 to avoid invalid thread call
				// AND rep diff must be equal or smaller to srv max reps to justify only one srv called
				if (secRepetitionDifference > 0 && secRepetitionDifference <= serverMaxRepetitions) {
					ns.print(`one or less servers needed`)
					ns.print(
						`
						rep diff: ${secRepetitionDifference};
						srv max reps: ${serverMaxRepetitions}
						`
						)
					

					// execute breacher
					ns.exec("pf_breacher.js", serversArray[0][0], secRepetitionDifference, target, secLevelThreshold);

					// update secRepetitionsMade
					secRepetitionsMade = secRepetitionsNeeded;
					
					// update repetition difference
					secRepetitionDifference = 0;

					

					
					// add server element to end of serverArray only if server has RAM unused
					if (serverMaxRepetitions < secRepetitionsNeeded) {
						var serverFreeRam = Math.floor(ns.getServerMaxRam(serversArray[0]) - ns.getServerUsedRam(serversArray[0]));;
						ns.print(`${serversArray[0]} has ${serverFreeRam} available RAM`);
						var serverElement = [];
						serverElement.push(serversArray[0][0]);
						serverElement.push(serverFreeRam);
						serversArray.push(serverElement);
					}

					// remove first server element element from serverArray
					serversArray.shift();
					
					// add time to offTime
					offTime.push(secScriptTime)

					// add to used sec severs
					usedSecServers++;

					
					// more than one server needed
					// srv max reps must be larger than 1 for valid thread call
				} else if (serverMaxRepetitions >= 1) {
					ns.print(`more than one server needed`);

					// update repetition difference
					secRepetitionDifference = secRepetitionDifference - serverMaxRepetitions;
					
					// add to repetitions made
					secRepetitionsMade = secRepetitionsMade + serverMaxRepetitions;
					ns.print(`REPS MADE: ${secRepetitionsMade}`)
					
					// add time to offTime
					offTime.push(secScriptTime)
										
					// add to use sec severs
					usedSecServers++;

					// execute breacher
					ns.exec("pf_breacher.js", serversArray[0][0], serverMaxRepetitions, target, secLevelThreshold);
					
					// remove server element element from serverArray
					serversArray.shift();

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

		
		// GROWER //

		var serverMoney = ns.getServerMoneyAvailable(target);
		var serverMaxMoney = ns.getServerMaxMoney(target);

		// calculate repetitions needed given available RAM

		// get multiplier for growthAnalyze
		var differenceToMaxMoney = serverMaxMoney - serverMoney;
		

		var growScriptRAMusage = ns.getScriptRam("SCRIPT");
		var growScriptTime = ns.getGrowTime(target);
		//var growImpact = ns.growthAnalyze(1);


		ns.print(`serversArray after sec loop: ${serversArray}`)
		// use sleep method to await until all scripts ran
		if (offTime.length === 0) {
			ns.print(`sec while loop exited without adding to offTime`)
			ns.exit()
		}
		await ns.sleep(offTime[0])

		
	}
}
