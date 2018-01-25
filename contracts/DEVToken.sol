pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract DEVToken is PausableToken, MintableToken {
  string public name = "DEVToken";
  string public symbol = "DEV";
  uint8 public decimals = 18;
}
