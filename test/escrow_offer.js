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
  describe('Escrow offer', function () {

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

    it("set expire one day before should be reject", async function () {
      await devToken.approve(escrow.address, amountFee, { from: sender })
      await escrow.offer(oneDayBeforeTimeUnix, 123456, "some data", { from: sender }).should.be.rejected
    })

    it('set expire on day later should be fulfill', async function () {
      // approve from token
      await devToken.approve(escrow.address, amountFee, { from: sender })
      const hash = await escrow.offer(oneDayLaterTimeUnix, 123456, "some data", { from: sender }).should.be.fulfilled
      hash.logs[0].event.should.be.equal('Created')
      hash.logs[1].event.should.be.equal('Offer')
      const escrowData = await escrow.escrows(hash.logs[0].args._tradeHash)
      escrowData[1].should.be.equal(sender)
      escrowData[6].should.be.bignumber.equal(amountFee)

      const after = await devToken.balanceOf(escrow.address)
      after.should.be.bignumber.equal(amountFee)
    })

  })
})