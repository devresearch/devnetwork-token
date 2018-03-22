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
  describe('Escrow release', function () {

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

    it("can release after commited", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      const release = await escrow.release(tradeHash, { from: sender })
      release.logs[0].event.should.be.equal('Release')
      release.logs[0].args._tradeHash.should.be.equal(tradeHash)
      release.logs[0].args._amount.should.be.bignumber.equal(amount)
    })

    it("can not release by not equal sender(creator)", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      await escrow.release(tradeHash, { from: receiver }).should.be.rejected
    })

    it("escrow status should be finished (2) after release", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      await escrow.release(tradeHash, { from: sender }).should.be.fulfilled
      const es = await escrow.escrows(tradeHash)
      es[7].should.be.bignumber.equal(new BigNumber(2))
    })

  })
})

