const Web3 = require('web3')

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const compiledContract = require('../build/contracts/DEVToken') // Contract abi goes here
const contract = new web3.eth.Contract(compiledContract.abi)

// Need to unlock owner account first in testrpc or ganache

// Get average gas price 
web3.eth.getGasPrice()
  .then((averageGasPrice) => {
    console.log(`Average gas price: ${averageGasPrice}`)
    console.log(`Average gas price [ETH]: ${web3.utils.fromWei(averageGasPrice)}`)

    return {
      averageGasPrice
    }
  })
  .then((opts) => {
    // Estimate gas of contract
    return contract.deploy({
      from: process.env.OWNER,
      data: compiledContract.bytecode
    })
      .estimateGas()
      .then((estimatedGas) => {
        console.log(`Estimated gas: ${estimatedGas}`)
        return {
          ...opts,
          estimatedGas
        }
      })
  })
  .then((opts) => {
    // Get account for testing from testprc
    return web3.eth.getAccounts()
      .then((accounts) => {

        return {
          ...opts,
          accounts
        }
      })
  })
  .then((opts) => {
    return contract.deploy({
      data: compiledContract.bytecode
    }).send({
      from: process.env.OWNER,
      gasPrice: opts.averageGasPrice,
      gas: opts.estimatedGas
    }).then((instance) => {
      console.log(`Contract mined at ${instance.options.address}`)
      return {
        ...opts,
        devTokenInstance: instance,
        address: instance.options.address
      }
    })
  })
  .then((opts) => {
    // Estimate mint function
    // address _to come from testrpc
    contract.options.address = opts.address

    contract.methods['mint(address,uint256)'](opts.accounts[1], 100)
      .estimateGas({ from: process.env.OWNER })
      .then((gasAmount) => {
        console.log(`Estimated gas for mint method: ${gasAmount}`)
      })

    return opts
  })
  .then((opts) => {
    // Maxmimum length than can handle array of address and amount is 200
    contract.methods['mintToken(address[],uint256[])'](opts.accounts.slice(2), Array.from(new Array(opts.accounts.length - 2), (val, index) => index + 1))
      .estimateGas({ from: process.env.OWNER })
      .then((gasAmount) => {
        console.log(`Estimated gas for mintToken method: ${gasAmount}`)
      })
  })
  .catch(console.error)
