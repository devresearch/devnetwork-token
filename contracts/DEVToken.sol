pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";

contract DEVToken is StandardToken, BurnableToken, Ownable, ReentrancyGuard {
  using SafeMath for uint256;

  // Constants
  string public  name = "DEVToken";
  string public  symbol = "DEV";
  uint8  public  decimals = 18;
  uint256 public constant INITIAL_SUPPLY          =  400000000 * (10 ** uint256(decimals));
  uint256 public constant CONTRIBUTE_ALLOCATE     =  240000000 * (10 ** uint256(decimals));
  uint256 public constant BOUNTY_ALLOCATE         =  80000000 * (10 ** uint256(decimals));
  uint256 public constant FOUNDATION_ALLOCATE     =  80000000 * (10 ** uint256(decimals));

  bool    public transferEnabled = false; // indicates that tokens can transfer or not
  uint256 public transferTimeLockedStart;
  uint256 public transferTimeLockedEnd;
  
  uint256 public raisedContributeAllocate;
  uint256 public raisedBountyAllocate;
  address public foundation;

  // Enum
  enum Category {CONTRIBUTE, BOUNTY}

  // Modifiers
  modifier validDestination(address _to) {
    require(_to != address(0x0));
    require(_to != address(this));
    require(_to != owner);
    _;
  }

  function DEVToken(address _foundation, 
    uint256 _transferTimeLockedStart, 
    uint256 _transferTimeLockedEnd) public 
  {
    totalSupply_ = INITIAL_SUPPLY;

    // mint token
    balances[msg.sender] = INITIAL_SUPPLY;
    Transfer(address(0x0), msg.sender, INITIAL_SUPPLY);

    foundation = _foundation;
    transferTimeLockedStart = _transferTimeLockedStart;
    transferTimeLockedEnd = _transferTimeLockedEnd;
  }

  function spreadTokenAddresses(address[] _to, uint256[] _valueInWei, uint8 category) 
    public onlyOwner 
  {
    for (uint256 i = 0 ; i < _to.length ; i++) {
      spreadToken(_to[i], _valueInWei[i], category);
    }
  }

  function spreadToken(address _to, uint256 _valueInWei, uint8 category) 
    public onlyOwner validDestination(_to) 
  {
    if (category == uint8(Category.CONTRIBUTE)) {
      raisedContributeAllocate = raisedContributeAllocate.add(_valueInWei);
      require(CONTRIBUTE_ALLOCATE >= raisedContributeAllocate);
      require(raisedContributeAllocate >= _valueInWei);
    } else if (category == uint8(Category.BOUNTY)) {
      raisedBountyAllocate = raisedBountyAllocate.add(_valueInWei);
      require(BOUNTY_ALLOCATE >= raisedBountyAllocate);
      require(raisedBountyAllocate >= _valueInWei);
    } else {
      revert();
    }

    balances[_to] = balances[_to].add(_valueInWei);
    balances[msg.sender] = balances[msg.sender].sub(_valueInWei);
    Transfer(msg.sender, _to, _valueInWei);
  }

  function foundationAllocated() external onlyOwner {
    require(balances[foundation] < FOUNDATION_ALLOCATE);

    balances[foundation] = FOUNDATION_ALLOCATE;
    balances[msg.sender] = balances[msg.sender].sub(FOUNDATION_ALLOCATE);
    Transfer(msg.sender, foundation, FOUNDATION_ALLOCATE);
  }

  function enableTransfer() external onlyOwner {
    transferEnabled = true;
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transfer(address _to, uint256 _value) 
    public validDestination(_to) returns (bool) 
  {
    require(transferEnabled);
    if (msg.sender == foundation) { 
      require(now >= transferTimeLockedEnd); 
    }
    return super.transfer(_to, _value);
  }

  /**
   * @dev Overrides ERC20 transfer function with modifier that prevents the
   * ability to transfer tokens until after transfers have been enabled.
   */
  function transferFrom(address _from, address _to, uint256 _value) 
    public validDestination(_to) returns (bool) 
  {
    require(transferEnabled);
    if (_from == foundation) {
      require(now >= transferTimeLockedEnd);
    }
    return super.transferFrom(_from, _to, _value);
  } 

  /**
    * Overrides the burn function so that it cannot be called until after
    * transfers have been enabled.
    *
    * @param _value    The amount of dev tokens in wei
    */
  function burn(uint256 _value) public onlyOwner {
    require(transferEnabled || msg.sender == owner);
    super.burn(_value);
  }
}
