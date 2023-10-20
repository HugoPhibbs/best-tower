const {getFarmTowers, findBestTower} = require("./best-tower")

describe("Test getting farm towers", () => {

})

describe("Test finding the best tower", () => {
    test("Test normally", () => {
        const testTowers = [
            {towerId: 1, rssi: 1},
            {towerId: 2, rssi: 3},
            {towerId: 2, rssi: 5},
            {towerId: 2, rssi: 10},
            {towerId: 1, rssi: 5},
            {towerId: 3, rssi: -3},
            {towerId: 3, rssi: 2},
            {towerId: 3, rssi: -8},
        ]

        const result = findBestTower(testTowers)
        expect(result.towerId).toBe(2)
        expect(result.averageRssi).toBe(6)
    })

    describe("Test with empty input", () => {
    })
})