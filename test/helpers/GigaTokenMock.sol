pragma solidity ^0.4.11;


import '../../contracts/GigaToken.sol';

// mock class using StandardToken
contract GigaTokenMock is GigaToken {

  function GigaTokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
