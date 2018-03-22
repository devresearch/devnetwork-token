const EscrowToken = artifacts.require('EscrowToken')
const DEVToken = artifacts.require('DEVToken')

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('EscrowToken', function (accounts) {
  describe('Escrow config', function () {

    let escrow
    let devToken
    const amountFee = new BigNumber(10 * 10 ** 18); // 10 DEV

    beforeEach(async function () {
      escrow = await EscrowToken.new()
      devToken = await DEVToken.new()
      escrow.setFee(amountFee)
      escrow.setTokenInterface(devToken.address)
    })

    it('contract interface should be DEVToken', async function () {
      const contractAddress = await escrow.getTokenAddress()
      contractAddress.should.equal(devToken.address)
    })

    it('fee escrow should be equal amountFee', async function () {
      const fee = await escrow.getFee()
      fee.should.be.bignumber.equal(amountFee)
    })

  })
})