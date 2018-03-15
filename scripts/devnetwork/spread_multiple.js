const { web3, contract } = require('./initial')

// TODO create script for generate address and valueInWei
const addresses = ['0x068428a03a0551e3c02ea8441f8eda4715655257', '0x41b3d1c3200b795d13026f22a6d8380f419f44b9']
const valueInWei = [web3.utils.toWei(web3.utils.toBN('250')), web3.utils.toWei(web3.utils.toBN('250'))]

async function spreadTokenMultiple(addresses = [], valueInWei = []) {
  const gasPrice = await web3.eth.getGasPrice()
  const accounts = await web3.eth.getAccounts()
  try {
    const estimateGas = await contract.methods['spreadTokenAddresses(address[],uint256[])']
      (addresses, valueInWei)
      .estimateGas({ from: accounts[0] })

    console.log(`Estimate gas for spreadTokenAddresses this round is ${estimateGas}`)

    const resultTx = await contract.methods['spreadTokenAddresses(address[],uint256[])']
      (addresses, valueInWei)
      .send({ from: accounts[0], gas: estimateGas + 21000, gasPrice: gasPrice })

    console.log('Successful to spread token to many addresses...')
    console.log(resultTx)
  } catch (e) {
    console.error('Failed to spread token')
    console.error(e)
  }
}

spreadTokenMultiple(addresses, valueInWei)
