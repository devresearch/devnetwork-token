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
  describe('Escrow cancel', function () {

    let escrow
    let devToken

    const amount = new BigNumber(500 * 10 ** 18) // 500 DEV
    const amountFee = new BigNumber(10 * 10 ** 18); // 10 DEV
    const amountMint = new BigNumber(1000 * 10 ** 18) // 1000 DEV
    const totalAmount = amount.add(amountFee)

    const sender = accounts[1]
    const receiver = accounts[2]

    const nowTimeUnix = latestTime()
    const oneDayLaterTimeUnix = nowTimeUnix + duration.days(1)

    beforeEach(async function () {
      escrow = await EscrowToken.new()
      devToken = await DEVToken.new()
      await devToken.enableTransfer()
      escrow.setFee(amountFee)
      escrow.setTokenInterface(devToken.address)
      await devToken.spreadToken(sender, amountMint)
      await devToken.spreadToken(receiver, amountMint)
    })

    it('can cancel after commit by acceptor', async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      const cancel = await escrow.cancel(tradeHash, { from: receiver }).should.be.fulfilled
      cancel.logs[0].event.should.be.equal('Cancel')
      cancel.logs[0].args._amount.should.be.bignumber.equal(amount)
      cancel.logs[0].args._tradeHash.should.be.equal(tradeHash)
      const senderBalance = await devToken.balanceOf(sender)
      senderBalance.should.be.bignumber.equal(amountMint)
      const receiverBalance = await devToken.balanceOf(receiver)
      receiverBalance.should.be.bignumber.equal(amountMint)
    })

    it("can not cancel by sender(creator)", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      await escrow.cancel(tradeHash, { from: sender }).should.be.rejected
    })

    it("escrow status should be canceled (3) after cancel", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      await escrow.cancel(tradeHash, { from: receiver }).should.be.fulfilled
      const es = await escrow.escrows(tradeHash)
      es[7].should.be.bignumber.equal(new BigNumber(3))
    })

  })
})

