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
    const amountOwner = new BigNumber(400000000 * 10 ** 18)
    const amount = new BigNumber(500 * 10 ** 18) // 500 DEV
    const amountFee = new BigNumber(10 * 10 ** 18); // 10 DEV
    const amountMint = new BigNumber(1000 * 10 ** 18) // 1000 DEV
    const totalAmount = amount.add(amountFee)

    const owner = accounts[0]
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

    it("can withdraw by owner", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      const release = await escrow.release(tradeHash, { from: sender })
      const before = await devToken.balanceOf(owner)
      const balanceOwner = amountOwner.minus(amountMint.add(amountMint))
      before.should.be.bignumber.equal(balanceOwner)
      const wd = await escrow.withdrawOwner().should.be.fulfilled
      wd.logs[0].event.should.be.equal('Withdraw')
      wd.logs[0].args._amount.should.be.bignumber.equal(amountFee.add(amountFee))
      const after = await devToken.balanceOf(owner)
      after.should.be.bignumber.equal(balanceOwner.add(amountFee.add(amountFee)))
    })

    it("can not withdraw by another account", async function () {
      // request
      await devToken.approve(escrow.address, totalAmount, { from: sender })
      const hash = await escrow.request(oneDayLaterTimeUnix, 123456, "some data", amount, { from: sender }).should.be.fulfilled
      const tradeHash = hash.logs[0].args._tradeHash
      // commit
      await devToken.approve(escrow.address, amountFee, { from: receiver })
      await escrow.commit(tradeHash, { from: receiver }).should.be.fulfilled
      const release = await escrow.release(tradeHash, { from: sender })
      const wd = await escrow.withdrawOwner({ from: sender }).should.be.rejected
    })

  })
})

