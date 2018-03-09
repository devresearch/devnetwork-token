const Web3 = require('web3')

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const compiledContract = require('../build/contracts/DEVToken') // Contract abi goes here
const contract = new web3.eth.Contract(compiledContract.abi)

const now = new Date()
const nowTimeUnix = Math.floor(now.getTime() / 1000)
const oneYearLaterTimeUnix = Math.floor(
  new Date(new Date().setFullYear(now.getFullYear() + 1)).getTime() / 1000
)

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
    // Get account for testing from testprc
    return web3.eth.getAccounts()
      .then((accounts) => {

        return {
          ...opts,
          owner: accounts[0],
          foundation: accounts[1],
          restContributor: accounts.slice(2)
        }
      })

  })
  .then((opts) => {
    // Estimate gas of contract
    return contract.deploy({
      data: compiledContract.bytecode,
      arguments: [opts.foundation, nowTimeUnix, oneYearLaterTimeUnix]
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
    return contract.deploy({
      data: compiledContract.bytecode,
      arguments: [opts.foundation, nowTimeUnix, oneYearLaterTimeUnix]
    }).send({
      from: opts.owner,
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
    // Estimate spreadForContributor function
    // address _to come from testrpc
    contract.options.address = opts.address

    contract.methods['spreadToken(address,uint256,uint8)'](opts.restContributor[0], web3.utils.toBN('1e21'), 1)
      .estimateGas({ from: opts.owner })
      .then((gasAmount) => {
        console.log(`Estimated gas for spreadToken method: ${gasAmount}`)
      })

    return opts
  })
  .then((opts) => {
    // Maxmimum length than can handle array of address and amount is approximately 180
    contract.methods['spreadTokenAddresses(address[],uint256[],uint8)']
      (opts.restContributor, Array.from(new Array(opts.restContributor.length), (val, index) => web3.utils.toBN('1e22')), 1)
      .estimateGas({ from: opts.owner })
      .then((gasAmount) => {
        console.log(`Estimated gas for spreadTokenAddresses method: ${gasAmount}`)
      })

    return opts
  })
  .then((opts) => {
    contract.methods.enableTransfer().send({ from: opts.owner }).
      then(() => {

        // Estimate gas for transfer function
        contract.methods['transfer(address,uint256)']
          (opts.restContributor[0], web3.utils.toBN('1e25'))
          .estimateGas({ from: opts.owner })
          .then((gasAmount) => {
            console.log(`Estimated gas for transfer method: ${gasAmount}`)
          })
      })
  })
  .catch(console.error)