import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const GigaCrowdsale = artifacts.require('GigaCrowdsale')
const GigaToken = artifacts.require('GigaToken')

contract('GigaCrowdsale', function ([_, investor, wallet, purchaser, accounts]) {

  const rate = new BigNumber(1000)
  const value = ether(2)
  const contactInfo = "Change Me";
  const expectedTokenAmount = rate.mul(value)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)


    this.crowdsale = await GigaCrowdsale.new(this.startTime, this.endTime, rate, wallet,contactInfo)

    this.token = GigaToken.at(await this.crowdsale.token())
  })

  it('should be token owner', async function () {
    const owner = await this.token.owner()
    owner.should.equal(this.crowdsale.address)
  })

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasEnded()
    ended.should.equal(false)
    await increaseTimeTo(this.afterEndTime)
    ended = await this.crowdsale.hasEnded()
    ended.should.equal(true)
  })

  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMThrow)
    })

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.send(value).should.be.fulfilled
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.fulfilled
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.rejectedWith(EVMThrow)
    })

  })

  describe('high-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.sendTransaction({value: value, from: investor})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(investor)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

 

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({value: value, from: investor})
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet)
      await this.crowdsale.sendTransaction({value, from: investor})
      const post = web3.eth.getBalance(wallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })

  })

  describe('low-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.buyTokens(investor, {value: value, from: purchaser})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.purchaser.should.equal(purchaser)
      event.args.beneficiary.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should increase total Purchased', async function () {
      await this.crowdsale.buyTokens(investor, {value, from: purchaser})
      const totalPurchased = await this.crowdsale.tokensPurchased()
      totalPurchased.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should assign tokens to beneficiary', async function () {
      await this.crowdsale.buyTokens(investor, {value, from: purchaser})
      const balance = await this.token.balanceOf(investor)
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(wallet)
      await this.crowdsale.buyTokens(investor, {value, from: purchaser})
      const post = web3.eth.getBalance(wallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })

  })

 describe('Crowdsale Admin Functions', function () {
    it('should increase totalSupply', async function () {
     
      const increaseBy = new BigNumber(250000)
      const initialSupply = await this.token.totalSupply()
     
      const newSupply = initialSupply.add(increaseBy)
      await this.crowdsale.increaseSupply(increaseBy)
      const totalSupply = await this.token.totalSupply()
      totalSupply.should.be.bignumber.equal(newSupply) 
    })

    it('should set rate', async function () {
      
       const rateToSet = 45;
       await this.crowdsale.setRate(rateToSet)
       const currentRate = await this.crowdsale.rate()
       currentRate.should.be.bignumber.equal(rateToSet) 
     })

     it('should set end date', async function () {
       const endDateToSet = latestTime() + duration.weeks(32);
       await this.crowdsale.setEndTime(endDateToSet)
       const currentEndate = await this.crowdsale.endTime()
       currentEndate.should.be.bignumber.equal(endDateToSet) 
     })

     it('should set Contact Information', async function () {
      const contactInfoToSet = "Go away";
      await this.crowdsale.setContactInformation(contactInfoToSet)
      const currentContactInfo = await this.crowdsale.contactInformation();
      currentContactInfo.should.equal(contactInfoToSet) 
    })

    it('should set Token Contact Information', async function () {
      const contactInfoToSet = "Why me";
      await this.crowdsale.setTokenContactInformation(contactInfoToSet)
      const currentContactInfo = await this.token.contactInformation();
      currentContactInfo.should.equal(contactInfoToSet) 
    })

    it('should have an owner', async function() {
      let owner = await this.crowdsale.owner();
      assert.isTrue(owner !== 0);
    });

    it('should return correct balances after transfer', async function() {
      
      var account1 = web3.eth.accounts[1];

      let balance1= await this.token.balanceOf(account1);
      assert.equal(balance1,0);

      await this.crowdsale.transferTokens(account1, 100);
      let balance2= await this.token.balanceOf(account1);
      assert.equal(balance2, 100);
     
     
    });

    it('should transfer token onwnership', async function() {
      var account3 = web3.eth.accounts[3];
      let owner = await this.crowdsale.owner();
      let tokenOwner = await this.token.owner();
      await this.crowdsale.transferTokenContractOwnership(account3);
      let newTokenOwner = await this.token.owner();
      assert.isTrue(newTokenOwner != tokenOwner)
      assert.equal(newTokenOwner, account3)
    });

    it('should transfer crowdsale onwnership', async function() {
      var account3 = web3.eth.accounts[3];
      let owner = await this.crowdsale.owner();
      
      await this.crowdsale.transferOwnership(account3);
      let newOwner = await this.crowdsale.owner();
      assert.isTrue(newOwner != owner)
      assert.equal(newOwner, account3)
    });
  })
  



})
