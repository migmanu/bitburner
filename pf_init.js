/** @param {NS} ns **/

/*
Welcome to my PirateFarmer script! Read the instructions for better results. 

SUMMARY:
This script is intended to be run from your home server. It will copy pf_breacher.js to 
all passed servers and farm a target server. Initially it will only work on user bought servers. 
It will do this trying to make as efficient use of available RAM as possible.

REQUIRED FILES:
PirateFarmer uses the following associated files (load order is important): 
- pf_breacher.js
- pf_grower.js
- pf_hacker.js 

Used files are stored in filesToUse variable.
IMPORTANT: If any file name is changed, this script must be updated accordingly.

SCRIPT STRUCTURE:
The script works with a global while loop that calls nested loops as needed. The structure of the script is:

- argument passed on script call: target server
- general variables
- server list builder
- script paster
- global while loop
	- sec breacher
		- security while loop
			- server while loop
				- if statement for one or less servers needed
				- if statement for more than one server needed
				- if statement to catch errors
	- grower
		- grower_while_loop
			- if one or less servers needed
			- more than one server needed


TODO: 
	[] add kill scripts on servers to avoid bugs?
	[x] move sec variables into global while loop
	[] change sec while to if codnitional?
	[] eliminate repetition in sec if statements
	[] create function to evaluate conditions and execute scripts for all three steps
	[] rewrite sec breacher to simplify it

 */
export async function main(ns) {

	// args
	var target = ns.args[0];

	// general variables
	var filesToUse = ['pf_breacher.js', 'pf_grower.js', 'hacker.js']
	var purchasedServersArray = ns.getPurchasedServers();


	// while loop for all scripts	
	while (true) {
		ns.print("global while init");


		// SERVER LIST BUILDER //
		// creates array of server element arrays formated: [serverName, serverRAM]
 	 	// input: purchasedServersArray
		// TODO: add servers only if available ram equal or higher than lower ram needed for any script
		var serversArray = [];
		for (const srv of purchasedServersArray) {
			let serverInfo = [];
			let serverFreeRam = Math.floor(ns.getServerMaxRam(srv) - ns.getServerUsedRam(srv));
			serverInfo.push(srv);
			serverInfo.push(serverFreeRam);
			serverFreeRam > 1 ? serversArray.push(serverInfo) : ns.print('server has no free RAM');
			ns.scp(filesToUse, serverInfo[0]);
		}

		// list of script exec times. Higher is chosen at end of loop for sleep() method. 
		var offTime = []; // time for sleep method in milliseconds


		// 								SEC BREACHER 										//
		//----------------------------------------------------------------------------------//
		var secLevel = ns.getServerSecurityLevel(target);
		
		// max sec level until which weaken() is called. Default is server min sec level
		var secLevelThreshold = ns.getServerMinSecurityLevel(target); 

		// calculate repetitions needed given server's total RAM
		var secScriptRamUsage = ns.getScriptRam("pf_breacher.js");
		var secScriptImpact = ns.weakenAnalyze(1) // impact of weaken using only one thread
		var secImpactNeeded = (secLevel - secLevelThreshold);
		var secRepetitionsNeeded = Math.ceil(secImpactNeeded / secScriptImpact);

		
		var secRepetitionsMade = 0; // updated on every exec() call with amount + 1 * threads

		// stop loop when all servers busy
		var availableServers = serversArray.length; // number of servers before serversArray is mutated
		var usedSecServers = 0; // TODO: try to eliminate need for this variable

		// while loop only if there are more repetitions needed AND servers available
		while (secRepetitionsMade < secRepetitionsNeeded && usedSecServers < availableServers) {
		
			// add sec script time to offTime
			offTime.push(Math.ceil(ns.getWeakenTime(target)));

			var secRepetitionDifference = Math.floor(secRepetitionsNeeded - secRepetitionsMade);
			
			// server while loop
			// for each server in list
			// while secRepetitionDifference is larger than 0 to avoid pointless calling
			var s = 0
			while (s < availableServers && secRepetitionDifference > 0) {
				// divide available server RAM by script requirement
				var serverMaxRepetitions = Math.floor(serversArray[0][1] / secScriptRamUsage);

				// one or less servers needed
				// rep diff must be larger than 0 to avoid invalid thread call
				// AND rep diff must be equal or smaller to srv max reps to justify only one srv called
				if (secRepetitionDifference > 0 && secRepetitionDifference <= serverMaxRepetitions) {
					// execute breacher
					ns.exec(filesToUse[0], serversArray[0][0], secRepetitionDifference, target, secLevelThreshold);

					// update secRepetitionsMade
					secRepetitionsMade = secRepetitionsNeeded;
					
					// update repetition difference
					secRepetitionDifference = 0;
					
					// add server element to end of serverArray only if server has RAM unused
					if (serverMaxRepetitions < secRepetitionsNeeded) {
						let secServerFreeRam = serversArray[0][1];
						let serverElement = [];
						serverElement.push(serversArray[0][0]);
						serverElement.push(secServerFreeRam);
						serversArray.push(serverElement);
					}

					// remove first server element element from serverArray
					serversArray.shift();
					
					// add to used sec severs
					usedSecServers++;

					
					// more than one server needed
					// srv max reps must be larger than 1 for valid thread call
				} else if (serverMaxRepetitions >= 1) {

					// update repetition difference
					secRepetitionDifference = secRepetitionDifference - serverMaxRepetitions;
					
					// add to repetitions made
					secRepetitionsMade = secRepetitionsMade + serverMaxRepetitions;
					
					// add to use sec severs
					usedSecServers++;

					// execute breacher
					ns.exec(filesToUse[0], serversArray[0][0], serverMaxRepetitions, target, secLevelThreshold);
					
					// remove server element element from serverArray
					serversArray.shift();

				} else {
					// TODO: try to eliminate need for this else statement
					usedSecServers++;
					secRepetitionsMade = secRepetitionsMade + 100;
				}
				s++
			}
		}

		
		// 								GROWER		 										//
		//----------------------------------------------------------------------------------//

		var serverMoney = ns.getServerMoneyAvailable(target);
		var serverMaxMoney = ns.getServerMaxMoney(target);

		// calculate repetitions needed given available RAM
		// get param for ns.growthAnalize() like: serverMoney * x = serverMaxMoney
		var multiplierToMaxMoney = serverMaxMoney / serverMoney;
		var growRepetitionsNeeded = Math.floor(ns.growthAnalyze(target, multiplierToMaxMoney));


		var growScriptRAMusage = ns.getScriptRam(filesToUse[1]);

		// execute grower when serverMoney < serverMaxMoney
		if (multiplierToMaxMoney >= 1) {
			ns.print('grow if statement init');
			ns.print(`grow reps needed: ${growRepetitionsNeeded}`);
			

			// add grow() time to offTime
			ns.print(`grow exec time is  ${ns.getGrowTime(target)}`)
			offTime.push(Math.ceil(ns.getGrowTime(target)));

			// grow server while loop only if there are still elements in serversArray and reps needed
			grower_while_loop:
			while (serversArray.length > 0 & growRepetitionsNeeded > 0) {
				
				// extract first server element and get max reps
				let firstServer = serversArray.shift();
				let growServerRAM = firstServer[1];
				let growServerMaxRepetitions = Math.floor(growServerRAM / growScriptRAMusage);
				ns.print(`first server max reps: ${growServerMaxRepetitions}`);

				// one or less severs needed
				if (growServerMaxRepetitions >= growRepetitionsNeeded) {
					ns.print('one or less grow servers needed')
					ns.print(`repetitions needed: ${growRepetitionsNeeded}`)
					// execute grower on host server
					ns.exec(filesToUse[1], firstServer[0], growRepetitionsNeeded, target);

					// update growRepetitionsNeeded to avoid endless loop
					growRepetitionsNeeded = 0;

					// apend updated used server to serversArray if RAM unused
					if (growServerMaxRepetitions > growRepetitionsNeeded) {
							let growServerFreeRam = serversArray[0][1];
							let serverElement = [];
							serverElement.push(serversArray[0][0]);
							serverElement.push(growServerFreeRam);
							serversArray.push(serverElement);
					}
					
				}

				// more than one server needed
				if (growServerMaxRepetitions < growRepetitionsNeeded) {
					ns.print('more than one grow server needed')
					ns.print(`repetitions needed: ${growRepetitionsNeeded}`)
					// execute grower on host server
					ns.exec(filesToUse[1], firstServer[0], growServerMaxRepetitions, target);

					// update growRepetitionsNeeded to avoid enldess loopp
					growRepetitionsNeeded = growRepetitionsNeeded - growServerMaxRepetitions;
					ns.print(`repetitions needed after exec: ${growRepetitionsNeeded}`)

				}
			}
			

			
		}

		// use sleep method to await until all scripts ran
		// select longest exec time from used scripts and sleep
		await ns.sleep(100);

		
	}
}
