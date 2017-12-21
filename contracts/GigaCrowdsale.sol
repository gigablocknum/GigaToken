pragma solidity ^0.4.18;

import './GigaToken.sol';


import 'zeppelin-solidity/contracts/ownership/Contactable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract GigaCrowdsale is  Contactable {
  using SafeMath for uint256;

  // The token being sold
  GigaToken public token;

  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  address public wallet;

  // how many token units a buyer gets per wei
  uint256 public rate;

  // amount of raised money in wei
  uint256 public weiRaised;
  uint256 public tokensPurchased;


  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  //event DebugOut(string msg);
  
  event SetRate(uint256 oldRate, uint256 newRate);
  event SetEndTime(uint256 oldEndTime, uint256 newEndTime);

  function GigaCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet,string _contactInformation) public {
    require(_startTime >= now);
    require(_endTime >= _startTime);
    require(_rate > 0);
    require(_wallet != 0x0);
    
    contactInformation = _contactInformation;
    token = createTokenContract();
    token.setContactInformation(_contactInformation);
    startTime = _startTime;
    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
    
   
  }

  // creates the token to be sold.
  function createTokenContract() internal returns (GigaToken) {
    return new GigaToken();
  }


  // fallback function can be used to buy tokens
  function () public payable {
    buyTokens(msg.sender);
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != 0x0);
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);
    
    // update state
    weiRaised = weiRaised.add(weiAmount);
    tokensPurchased = tokensPurchased.add(tokens);

    token.transfer(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  function transferTokens (address _beneficiary, uint256 _tokens) onlyOwner external {
      token.transfer(_beneficiary, _tokens);
  }

  function transferTokenContractOwnership(address _newOwner) onlyOwner external {
     token.transferOwnership(_newOwner);
  }

  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  // @return true if the transaction can buy tokens
  function validPurchase() internal constant returns (bool) {
    bool withinPeriod = now >= startTime && now <= endTime;
    bool nonZeroPurchase = msg.value != 0;
    return withinPeriod && nonZeroPurchase;
  }

  // @return true if crowdsale event has ended
  function hasEnded() public constant returns (bool) {
    return now > endTime;
  }

  function  setEndTime(uint256 _endTime) external onlyOwner {
    require(_endTime >= startTime);
    SetEndTime(endTime, _endTime);
    endTime = _endTime;

  }

  function setRate(uint256 _rate) external onlyOwner {
    require(_rate > 0);
    SetRate(rate, _rate);
    rate = _rate;

  }

  function increaseSupply(uint256 _increaseByAmount) external onlyOwner {
    require(_increaseByAmount > 0);
      
    token.increaseSupply(_increaseByAmount);
   
  }

  function setTokenContactInformation(string _info) external onlyOwner {
    token.setContactInformation(_info);
  }
  
}
