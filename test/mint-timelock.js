const DEVToken = artifacts.require('./DEVToken')
const Timelock = artifacts.require('./TokenTimelock')
import latestTime from './helpers/latestTime'
import { increaseTimeTo, duration } from './helpers/increaseTime'

const BigNumber = web3.BigNumber;
const should = require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should()

contract('DEVToken', function (accounts) {
  describe('mintTimelocked', function () {

    const owner = accounts[0]
    let dev
    let releaseTime
    let amount 
    let timelock
    let i = 1
    let receiver

    beforeEach(async function () {
      dev = await DEVToken.deployed()
      releaseTime = latestTime() + duration.years(1);
      receiver = accounts[i]
      
      amount = new BigNumber(1000)
      timelock = await dev.mintTimelocked(receiver, amount, releaseTime, {from : owner})
      i++
    })

    it('cannot be released before time limit', async function () {
      // Get address TokenTimeLock
      const ads = timelock.logs[0].args.to
      const timelockAds = Timelock.at(ads)
      timelockAds.release().should.be.rejectedWith(Error)
    })

    it('cannot be released just before time limit', async function () {
      await increaseTimeTo(releaseTime - duration.seconds(3));
      // Get address TokenTimeLock
      const ads = timelock.logs[0].args.to
      const timelockAds = Timelock.at(ads)
      await timelockAds.release().should.be.rejected
    })

    it('can be released just after limit', async function () {
      await increaseTimeTo(releaseTime + duration.seconds(3));
      // Get address TokenTimeLock
      const ads = timelock.logs[0].args.to
      const timelockAds = Timelock.at(ads)
      // Can release
      await timelockAds.release().should.be.fulfilled
      const balance = await dev.balanceOf(receiver);
      // Get amount
      balance.should.be.bignumber.equal(amount);
    });

    it('can be released just after limit', async function () {
      await increaseTimeTo(releaseTime + duration.years(1));
      // Get address TokenTimeLock
      const ads = timelock.logs[0].args.to
      const timelockAds = Timelock.at(ads)
      // Can release
      await timelockAds.release().should.be.fulfilled
      const balance = await dev.balanceOf(receiver);
      // Get amount
      balance.should.be.bignumber.equal(amount);
    });

    it('cannot be released twice', async function () {
      await increaseTimeTo(releaseTime + duration.years(1));
      // Get address TokenTimeLock
      const ads = timelock.logs[0].args.to
      const timelockAds = Timelock.at(ads)
      // Can release
      await timelockAds.release().should.be.fulfilled
      await timelockAds.release().should.be.rejected
      const balance = await dev.balanceOf(receiver);
      // Get amount
      balance.should.be.bignumber.equal(amount);
    });
    
  })
})
