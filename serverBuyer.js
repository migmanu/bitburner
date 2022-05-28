/** @param {NS} ns **/

/* 
This script is used to buy servers.

Arguments:
- desired RAM size
- max amount of money to use. Format: whole number with no commas (ex. 9457000)

The script will calculate how much servers can be bought with specified money
and prompt user for confirmation. If no servers can be bought script quits.
*/

export async function main(ns) {
	ns.print("script init")

    const ramAmount = ns.args[0]
    const maxMoneyToUse = ns.args[1]
    const serverCost = ns.getPurchasedServerCost(ramAmount)
    
    if (serverCost > maxMoneyToUse) {
        ns.print("Not enough money for even 1 server!")
        return
    }

    const serversToBuy = Math.floor(maxMoneyToUse / serverCost)

    if (!await ns.prompt(`With this money you can get ${serversToBuy} servers with ${ramAmount} ram. Confirm purchase?`)) {
        ns.print("Purchase cancelled")
        return
    }

    ns.print("purchase goes on")
    
    //ns.purchaseServer(`${ramAmount}playerSrv`, ramAmount)
    
}
