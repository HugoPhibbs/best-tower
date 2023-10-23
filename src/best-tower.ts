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
 * Does this by querying an endpoint containing a data stream of CSV files. Each CSV file contains data for a specific time frame
 * farms, towers and their respective rssi values
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
                console.log(
                    `Received a 403 Forbidden error for the API link '${link}', skipping to the next link...`
                )
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
 * @return the best tower, format {towerId: string, averageRssi: number}. If the length of farmTowers is zero, it returns {towerId: undefined, averageRssi: Number.NEGATIVE_INFINITY}
 */
function findBestTower(farmTowers) {
    if (farmTowers.length == 0) {
        return {towerId: undefined, averageRssi: Number.NEGATIVE_INFINITY}
    }

    let averageRssiValues: { [key: string]: { average: number, count: number } } = {}
    let maxAverage = Number.NEGATIVE_INFINITY
    let bestTowerId: string

    for (let tower of farmTowers) {
        const thisTowerId = tower.towerId
        let newAverage;

        if (thisTowerId in averageRssiValues) {
            const count = averageRssiValues[thisTowerId].count
            const currAverage = averageRssiValues[thisTowerId].average
            newAverage = (count / (count + 1)) * currAverage + tower.rssi / (count + 1) // Find the new average incrementally, no need to store total sum
            averageRssiValues[thisTowerId].count += 1
            averageRssiValues[thisTowerId].average = newAverage
        } else {
            newAverage = tower.rssi
            averageRssiValues[thisTowerId] = {average: newAverage, count: 1}
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
    console.log("Starting the program...\n")
    const farmId = getFarmIdArg()
    const farmTowers = await getFarmTowers(farmId)
    const bestTower = findBestTower(farmTowers)
    console.log(`\nTower with max average RSSI is: ${bestTower.towerId}, with an average of: ${bestTower.averageRssi}`)
}

module.exports = {
    getFarmTowers,
    findBestTower,
    main
}