const Web3 = require('web3')
const HDWalletProvider = require("truffle-hdwallet-provider")

let web3

const infuraToken = process.env.INFURA_TOKEN
const mnemonic = process.env.MNEMONIC
const network = process.env.NETWORK

if (network == 'ropsten') {
  web3 = new Web3(new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraToken}`))
} else if (network == 'live') {
  web3 = new Web3(new HDWalletProvider(mnemonic, `https://mainnet.infura.io/${infuraToken}`))
} else {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
}

// read from config
const config = require('./config.js')
const networkConfig = config.networks[network]

const compiledContract = require('../../build/contracts/DEVToken') // Contract abi goes here
const contract = new web3.eth.Contract(compiledContract.abi, network ? networkConfig.contractAddress : undefined)

module.exports = {
  web3,
  contract,
  compiledContract
}