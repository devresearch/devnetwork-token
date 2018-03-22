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

    let nowTimeUnix = latestTime()
    let oneDayLaterTimeUnix = nowTimeUnix + duration.days(1)
    let oneYearLaterTimeUnix = nowTimeUnix + duration.years(1)

    beforeEach(async function () {
      nowTimeUnix = latestTime()
      oneDayLaterTimeUnix = nowTimeUnix + duration.days(1)
      oneYearLaterTimeUnix = nowTimeUnix + duration.years(1)
      escrow = await EscrowToken.new()
      devToken = await DEVToken.new()
      await devToken.enableTransfer()
      escrow.setFee(amountFee)
      escrow.setTokenInterface(devToken.address)
      await devToken.spreadToken(sender, amountMint)
    })

    it("can refund after request expire", async function () {
      // approve from token
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      increaseTimeTo(oneYearLaterTimeUnix)
      const refund = await escrow.refund(tradeHash, { from: sender }).should.be.fulfilled
      refund.logs[0].event.should.be.equal('Refund')
      refund.logs[0].args._tradeHash.should.be.equal(tradeHash)

      const senderBalance = await devToken.balanceOf(sender)
      senderBalance.should.be.bignumber.equal(amountMint)
    })

    it("can refund after offer expire", async function () {
      // approve from token
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      increaseTimeTo(oneYearLaterTimeUnix)
      const refund = await escrow.refund(tradeHash, { from: sender }).should.be.fulfilled
      refund.logs[0].event.should.be.equal('Refund')
      refund.logs[0].args._tradeHash.should.be.equal(tradeHash)

      const senderBalance = await devToken.balanceOf(sender)
      senderBalance.should.be.bignumber.equal(amountMint)
    })

    it("can not refund by another account", async function () {
      // approve from token
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      increaseTimeTo(oneYearLaterTimeUnix)
      const refund = await escrow.refund(tradeHash, { from: receiver }).should.be.rejected
    })

    it('can not refund before expire', async function () {
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      const refund = await escrow.refund(tradeHash, { from: sender }).should.be.rejected
    })

  })
})