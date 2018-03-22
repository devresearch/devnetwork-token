const EscrowToken = artifacts.require('EscrowToken')
const DEVToken = artifacts.require('DEVToken')
import latestTime from './helpers/latestTime'
import { increaseTimeTo, duration } from './helpers/increaseTime'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('EscrowToken', function (accounts) {
  describe('Escrow request', function () {

    let escrow
    let devToken

    const amount = new BigNumber(500 * 10 ** 18) // 500 DEV
    const amountFee = new BigNumber(10 * 10 ** 18); // 10 DEV
    const amountMint = new BigNumber(1000 * 10 ** 18) // 1000 DEV
    const totalAmount = amount.add(amountFee)

    const sender = accounts[1]
    const receiver = accounts[2]

    const nowTimeUnix = latestTime()
    const oneDayBeforeTimeUnix = nowTimeUnix + duration.days(-1)
    const oneDayLaterTimeUnix = nowTimeUnix + duration.days(1)
    const oneYearLaterTimeUnix = nowTimeUnix + duration.years(1)

    beforeEach(async function () {
      escrow = await EscrowToken.new()
      devToken = await DEVToken.new()
      await devToken.enableTransfer()
      escrow.setFee(amountFee)
      escrow.setTokenInterface(devToken.address)
      await devToken.spreadToken(sender, amountMint)
    })

    it("request expire one day before should be reject", async function () {
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      await escrow.request(oneDayBeforeTimeUnix, 123456, "some data", amount, { from: sender }).should.be.rejected
    })

    it("request expire one day later should be fulfill", async function () {
      // approve from token
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const forTransfer = await devToken.allowance(sender, escrow.address)
      forTransfer.should.be.bignumber.equal(totalAmount)

      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      hash.logs[0].event.should.be.equal('Created')
      hash.logs[1].event.should.be.equal('Request')
      const escrowData = await escrow.escrows(hash.logs[0].args._tradeHash)
      escrowData[0].should.be.equal(sender)
      escrowData[2].should.be.bignumber.equal(amount)
      escrowData[5].should.be.bignumber.equal(amountFee)

      const after = await devToken.balanceOf(escrow.address)
      after.should.be.bignumber.equal(totalAmount)
    })

  })
})