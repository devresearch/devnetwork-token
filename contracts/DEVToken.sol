pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract DEVToken is MintableToken {
  using SafeMath for uint256;

  string public name = "DEVToken";
  string public symbol = "DEV";
  uint8  public decimals = 18;

  bool   public transferEnabled = false; // indicates that tokens can transfer or not

  // Modifiers
  modifier onlyWhenTransferEnabled() {
      require(transferEnabled);
      _;
  }

  /**
   * @dev Mint tokens in bulk
   */
  function mintMany(address[] _to, uint256[] _amount)
    onlyOwner canMint public returns (bool) 
  {
      for (uint i = 0; i < _to.length; i++) {
        mint(_to[i], _amount[i]);
      }
      return true;
  }

  /**
   * @dev Override mint, cannot mint token for the owner of contract
   */
  function mint(address _to, uint256 _amount) 
    onlyOwner canMint public returns (bool) 
  {
    return super.mint(_to, _amount);
  }

  /**
   * @dev enable transfer, after it is not possible to disable
   */
  function enableTransfer() external onlyOwner {
      transferEnabled = true;
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transfer(address _to, uint256 _value) 
    public onlyWhenTransferEnabled returns (bool) 
  {
      return super.transfer(_to, _value);
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transferFrom(address _from, address _to, uint256 _value) 
    public onlyWhenTransferEnabled returns (bool) 
  {
      return super.transferFrom(_from, _to, _value);
  } 
}
