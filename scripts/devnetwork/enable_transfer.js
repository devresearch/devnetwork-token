// Copyright (c) 2018 Devnetwork
// license that can be found in the LICENSE file.

const { web3, contract } = require('./initial')

async function enableTransfer() {
  const accounts = await web3.eth.getAccounts()
  try {
    const estimateGas = await contract.methods['enableTransfer()']()
      .estimateGas({ from: accounts[0] })

    console.log(`Estimate gas for enableTransfer is ${estimateGas}`)

    const resultTx = await contract.methods['enableTransfer()']()
      .send({ from: accounts[0], gas: estimateGas + 21000, gasPrice: gasPrice })

    console.log('Successful to enableTransfer...')
    console.log(resultTx)
  } catch (e) {
    console.error('Failed to enableTransfer')
    console.error(e)
  }
}

enableTransfer()