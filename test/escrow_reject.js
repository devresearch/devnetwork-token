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

    it("can reject after request", async function () {
      // approve from token
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      const reject = await escrow.reject(tradeHash, { from: sender }).should.be.fulfilled
      reject.logs[0].event.should.be.equal('Reject')
      reject.logs[0].args._tradeHash.should.be.equal(tradeHash)

      const senderBalance = await devToken.balanceOf(sender)
      senderBalance.should.be.bignumber.equal(amountMint)
    })

    it("can reject after offer", async function () {
      // approve from token
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      const reject = await escrow.reject(tradeHash, { from: sender }).should.be.fulfilled
      reject.logs[0].event.should.be.equal('Reject')
      reject.logs[0].args._tradeHash.should.be.equal(tradeHash)

      const senderBalance = await devToken.balanceOf(sender)
      senderBalance.should.be.bignumber.equal(amountMint)
    })

    it("can not reject by another account", async function () {
      // approve from token
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      const reject = await escrow.reject(tradeHash, { from: receiver }).should.be.rejected
    })

    it('can not reject after offer expired', async function () {
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      increaseTimeTo(oneYearLaterTimeUnix)
      const reject = await escrow.reject(tradeHash, { from: sender }).should.be.rejected
    })

  })
})