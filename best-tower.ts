import {AxiosResponse} from "axios";

const axios = require("axios")
const csvToJson = require("csvtojson")

/**
 * Gets the farm id from the arguments passed to the script
 *
 * @returns The farm id
 */
function getFarmIdArg() {
    const args = process.argv.slice(2)
    return args[0]
}

/**
 * Gets the list of towers for a particular farm
 *
 * @param farmId ID of a particular farm
 * @returns List of towers for a particular farm. Format of each object is {towerId: string, rssi: number}
 */
async function getFarmTowers(farmId) {
    const linksResponse = await axios({url: "https://api.onizmx.com/lambda/tower_stream", method: "GET"});

    const links = linksResponse.data

    const allFarmTowers = []

    // @ts-ignore
    for (let link of links) {
        try {
            const towerStreamCsvResponse: AxiosResponse = await axios({url: link, method: "GET"})
            const csv = towerStreamCsvResponse.data
            const farmStreamJson = await csvToJson().fromString(csv)

            const farmTowersWithFarmId = farmStreamJson.filter((tower) => tower.farmId === farmId)

            const farmTowers = farmTowersWithFarmId.map((tower) => {
                return {towerId: tower.towerId, rssi: tower.rssi}
            })

            allFarmTowers.push(...farmTowers)
        } catch (error) {
            const errorResponse = error.response
            if (errorResponse && errorResponse.status === 403) {
                console.log("Forbidden 403")
            } else {
                console.log(error)
            }
        }
    }

    return allFarmTowers
}

/**
 * Finds the best tower from a list of towers, according to the best average RSSI (Received Signal Strength Indication)
 *
 * @param farmTowers list of towers, format {towerId: string, rssi: number}
 * @return the best tower, format {towerId: string, averageRssi: number}
 */
function findBestTower(farmTowers) {
    let averageRssiValues: { [key: string]: { average: number, count: number } } = {}
    let maxAverage = Number.NEGATIVE_INFINITY
    let bestTowerId: string

    for (let tower of farmTowers) {
        const thisTowerId = tower.towerId
        let newAverage;

        if (thisTowerId in averageRssiValues) {
            const count = averageRssiValues.towerId.count
            const currAverage = averageRssiValues.towerId.average
            newAverage = currAverage + (count / (count + 1)) * currAverage + tower.rssi / (count + 1)
            averageRssiValues.towerId.count += 1
            averageRssiValues.towerId.average = newAverage
        } else {
            newAverage = tower.rssi
            averageRssiValues.towerId = {average: newAverage, count: 1}
        }

        if (newAverage > maxAverage) {
            maxAverage = newAverage
            bestTowerId = thisTowerId
        }
    }

    return {towerId: bestTowerId, averageRssi: maxAverage}
}

/**
 * Main function for the best tower program
 *
 * Coordinates the other functions together to parse input from a user,get raw data from the API end points and then find the best tower for a given farm
 */
async function main() {
    const farmId = getFarmIdArg()
    const farmTowers = await getFarmTowers(farmId)
    const bestTower = findBestTower(farmTowers)
    console.log(`Tower with max average RSSI is: ${bestTower.towerId}, with an average of: ${bestTower.averageRssi}`)
}


main().then(() => console.log("Done!"))