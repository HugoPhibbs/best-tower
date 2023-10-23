# Best Tower

![Node Build](https://github.com/HugoPhibbs/best-tower/actions/workflows/node.js.yml/badge.svg)

*By Hugo Phibbs* 

Finds the tower with the highest average RSSI value (Return Strength Signal Indication) for a given farm.

## Usage
* First make sure that you have Node and NPM installed.
* Then run the below to install necessary dependencies
```shell
npm install
```
* You can run with:
```shell
npm run start <farm-id>
# For example 'npm run start farm_1' finds the best tower for a farm of id 'farm_1'
```
* Results will then be printed out

### Tests
* To run the tests run:
```shell
npm test
```