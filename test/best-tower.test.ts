const {getFarmTowers, findBestTower} = require("../src/best-tower")

const nock = require("nock")

describe("Test getting farm towers", () => {
    test("Test normally", async () => {
        nock("https://api.onizmx.com")
            .get("/lambda/tower_stream")
            .reply(200, [
                "https://api/test_data_1.csv",
                "https://api/test_data_2.csv",
                "https://api/test_data_3.csv"
            ], {
                "Content-Type": "application/json"
            })

        nock("https://api").get("/test_data_1.csv").replyWithFile(200, __dirname + '/data/test_data_1.csv')
        nock("https://api").get("/test_data_2.csv").replyWithFile(200, __dirname + '/data/test_data_2.csv')
        nock("https://api").get("/test_data_3.csv").replyWithFile(200, __dirname + '/data/test_data_3.csv')

        const result = await getFarmTowers("f1")

        expect(result).toStrictEqual([
            { towerId: 't1', rssi: '10' },
            { towerId: 't1', rssi: '14' },
            { towerId: 't1', rssi: '16' },
            { towerId: 't6', rssi: '20' },
            { towerId: 't6', rssi: '30' },
            { towerId: 't1', rssi: '4' },
            { towerId: 't1', rssi: '6' }
        ])
    })

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

    test("Test with empty input", () => {
        const result = findBestTower([])
        expect(result.towerId).toBe(undefined)
        expect(result.averageRssi).toBe(Number.NEGATIVE_INFINITY)
    })
})