pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Contactable.sol';
import "zeppelin-solidity/contracts/token/StandardToken.sol";

/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
// 
contract GigaToken is StandardToken, Contactable {

  string public constant name = "Giga";
  string public constant symbol = "GIGA";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 10000000 * (10 ** uint256(decimals)); 
 
  event IncreaseSupply(uint256 increaseByAmount, uint256 oldAmount, uint256 newAmount);  
  

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function GigaToken() public {
   // * (10 ** uint256(decimals));  
 
    totalSupply = INITIAL_SUPPLY; 
    balances[msg.sender] = INITIAL_SUPPLY; 
  }

  function increaseSupply(uint256 _increaseByAmount) external onlyOwner {
    require(_increaseByAmount > 0);
    uint256 oldSupply = totalSupply;
    totalSupply = totalSupply.add(_increaseByAmount);
    balances[owner] = balances[owner].add(_increaseByAmount);
    IncreaseSupply(_increaseByAmount, oldSupply, totalSupply);

  }

}
