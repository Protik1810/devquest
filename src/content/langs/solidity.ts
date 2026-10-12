import { lesson, langTrack } from './helpers';

const HEADER = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\n';

export const solidity = langTrack({
  id: 'solidity',
  title: 'Solidity',
  icon: '⛓️',
  color: '#363636',
  lang: 'solidity',
  blurb: 'Write smart contracts for Ethereum and EVM chains: tokens, NFTs, DAOs and DeFi protocols.',
  fields: ['Blockchain', 'Smart contracts', 'Web3'],
  lessons: [
    lesson(
      'sol-basics',
      'Your first contract',
      `
A **smart contract** is a program deployed to a blockchain. Its state is stored on-chain and its functions are called by transactions.

~~~solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;             // state variable (public → auto getter count())

    function increment() public {     // changes state → costs gas
        count += 1;
    }

    function get() public view returns (uint256) {   // view = read-only, free to call off-chain
        return count;
    }
}
~~~

> ⚙️ The desktop app compiles your contract with **solc**. Behaviour is checked by AI tracing (there's no blockchain here). The "expected output" describes what the functions must return.
`,
      {
        prompt: 'Write `contract Greeter` with a public `string greeting` set to `"Hello"` in the constructor, a function `setGreeting(string memory g)` and a view function `greet()` returning the greeting.',
        starter: HEADER + 'contract Greeter {\n    // your code\n    function greet() public view returns (string memory) {\n        return /* your code */;\n    }\n}\n',
        solution: HEADER + 'contract Greeter {\n    string public greeting;\n\n    constructor() {\n        greeting = "Hello";\n    }\n\n    function setGreeting(string memory g) public {\n        greeting = g;\n    }\n\n    function greet() public view returns (string memory) {\n        return greeting;\n    }\n}\n',
        expected: 'greet() returns "Hello" after deployment; after setGreeting("Hi") it returns "Hi".',
        hints: ['string public greeting; then set it inside constructor() { … }', 'Strings in function parameters need a data location: string memory g'],
      },
      [['view function', 'Reads state but does not modify it; calling it off-chain costs no gas.']],
    ),
    lesson(
      'sol-types',
      'Types, mappings & msg.sender',
      `
~~~solidity
uint256 total;                         // unsigned integer (no negatives, no floats!)
address owner;                         // 20-byte account address
bool paused;
mapping(address => uint256) balances;  // key → value store (all keys exist, default 0)

constructor() { owner = msg.sender; }  // msg.sender = who called this function

function deposit() public payable {    // payable = can receive Ether (msg.value)
    balances[msg.sender] += msg.value;
}
~~~

There are **no floating-point numbers** in Solidity. Amounts are integers in the smallest unit (1 ether = 10¹⁸ wei).
`,
      {
        prompt: 'Write `contract Votes` with a `mapping(string => uint256) public votes` and a `mapping(address => bool) hasVoted`. `vote(string memory option)` adds one vote, and each address may vote only once (use `require`).',
        starter: HEADER + 'contract Votes {\n    // mappings\n\n    function vote(string memory option) public {\n        // your code\n        require(/* has not voted */, "already voted");\n    }\n}\n',
        solution: HEADER + 'contract Votes {\n    mapping(string => uint256) public votes;\n    mapping(address => bool) public hasVoted;\n\n    function vote(string memory option) public {\n        require(!hasVoted[msg.sender], "already voted");\n        hasVoted[msg.sender] = true;\n        votes[option] += 1;\n    }\n}\n',
        expected: 'Calling vote("yes") from an address increases votes("yes") by 1; a second vote from the same address reverts with "already voted".',
        hints: ['require(!hasVoted[msg.sender], "already voted");', 'Mark the voter: hasVoted[msg.sender] = true; then votes[option] += 1;'],
      },
      [['msg.sender', 'The address that called the current function (a user or another contract).']],
    ),
    lesson(
      'sol-modifiers',
      'Access control with modifiers',
      `
**Modifiers** wrap functions with reusable checks:

~~~solidity
contract Owned {
    address public owner = msg.sender;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;                       // the function body runs here
    }

    function withdraw() public onlyOwner { /* … */ }
}
~~~

\`require(condition, "message")\` **reverts** the whole transaction if the condition is false: all state changes are undone and the remaining gas is refunded. Access-control bugs are among the most expensive smart contract vulnerabilities, so get this right.
`,
      {
        prompt: 'Write `contract Vault` with an `owner` set at deployment, a `bool public paused`, a modifier `onlyOwner`, and functions `pause()` / `unpause()` that only the owner may call.',
        starter: HEADER + 'contract Vault {\n    address public owner;\n    bool public paused;\n\n    // constructor, modifier and functions\n    function pause() public {\n        paused = /* your code */;\n    }\n}\n',
        solution: HEADER + 'contract Vault {\n    address public owner;\n    bool public paused;\n\n    constructor() {\n        owner = msg.sender;\n    }\n\n    modifier onlyOwner() {\n        require(msg.sender == owner, "not owner");\n        _;\n    }\n\n    function pause() public onlyOwner {\n        paused = true;\n    }\n\n    function unpause() public onlyOwner {\n        paused = false;\n    }\n}\n',
        expected: 'The deployer can call pause() and unpause(), toggling paused; any other address calling them reverts with "not owner".',
        hints: ['constructor() { owner = msg.sender; }', 'modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }'],
      },
      [['Solidity modifier', 'Reusable pre/post-condition wrapper; _; marks where the function body runs.']],
    ),
    lesson(
      'sol-events',
      'Events & structs',
      `
Contracts can't push notifications. Instead they **emit events**, which are stored in transaction logs that frontends and indexers subscribe to:

~~~solidity
struct Task { string title; bool done; }
Task[] public tasks;

event TaskAdded(uint256 indexed id, string title);   // indexed = searchable

function addTask(string memory title) public {
    tasks.push(Task(title, false));
    emit TaskAdded(tasks.length - 1, title);
}
~~~
`,
      {
        prompt: 'Write `contract TodoList` with a `struct Todo { string text; bool done; }`, a public array `todos`, an event `Toggled(uint256 id, bool done)`, `add(string memory text)` and `toggle(uint256 id)` that flips `done` and emits the event (revert with `"bad id"` for invalid ids).',
        starter: HEADER + 'contract TodoList {\n    // struct, array, event\n\n    function toggle(uint256 id) public {\n        require(id < todos.length, "bad id");\n        // your code\n    }\n}\n',
        solution: HEADER + 'contract TodoList {\n    struct Todo {\n        string text;\n        bool done;\n    }\n\n    Todo[] public todos;\n\n    event Toggled(uint256 id, bool done);\n\n    function add(string memory text) public {\n        todos.push(Todo(text, false));\n    }\n\n    function toggle(uint256 id) public {\n        require(id < todos.length, "bad id");\n        todos[id].done = !todos[id].done;\n        emit Toggled(id, todos[id].done);\n    }\n}\n',
        expected: 'add("x") appends a todo; toggle(0) flips its done flag and emits Toggled(0, true); toggle(99) reverts with "bad id".',
        hints: ['Todo[] public todos; event Toggled(uint256 id, bool done);', 'todos[id].done = !todos[id].done; emit Toggled(id, todos[id].done);'],
      },
      [['Solidity event', 'A log entry emitted by a contract; cheap storage that off-chain apps listen to.']],
    ),
    lesson(
      'sol-security',
      'Security: reentrancy & checks-effects-interactions',
      `
The infamous 2016 **DAO hack** drained millions through **reentrancy**: a contract sent Ether *before* updating its balance, and the attacker's contract called back in to withdraw again.

~~~solidity
// ❌ Vulnerable
function withdraw() public {
    uint amount = balances[msg.sender];
    (bool ok, ) = msg.sender.call{value: amount}("");   // attacker re-enters here
    require(ok);
    balances[msg.sender] = 0;                           // too late!
}

// ✅ Checks → Effects → Interactions
function withdraw() public {
    uint amount = balances[msg.sender];
    require(amount > 0, "nothing to withdraw");         // checks
    balances[msg.sender] = 0;                           // effects
    (bool ok, ) = msg.sender.call{value: amount}("");   // interactions
    require(ok, "transfer failed");
}
~~~

Other classics: unchecked access control, integer issues (Solidity 0.8+ reverts on overflow), front-running and oracle manipulation. Audits and tested libraries (OpenZeppelin) are standard practice.
`,
      {
        prompt: 'Complete `contract Bank` with `deposit()` (payable) and a **safe** `withdraw()` following checks-effects-interactions: require a non-zero balance, set it to 0 **before** sending Ether, and require the transfer to succeed.',
        starter: HEADER + 'contract Bank {\n    mapping(address => uint256) public balances;\n\n    function deposit() public payable {\n        balances[msg.sender] += msg.value;\n    }\n\n    function withdraw() public {\n        uint256 amount = balances[msg.sender];\n        (bool ok, ) = msg.sender.call{value: amount}("");\n        require(ok, "transfer failed");\n        balances[msg.sender] = /* your code */;\n    }\n}\n',
        solution: HEADER + 'contract Bank {\n    mapping(address => uint256) public balances;\n\n    function deposit() public payable {\n        balances[msg.sender] += msg.value;\n    }\n\n    function withdraw() public {\n        uint256 amount = balances[msg.sender];\n        require(amount > 0, "nothing to withdraw");\n        balances[msg.sender] = 0;\n        (bool ok, ) = msg.sender.call{value: amount}("");\n        require(ok, "transfer failed");\n    }\n}\n',
        expected: 'withdraw() sends the caller their full balance exactly once: the balance is set to 0 before the external call, so a re-entrant call finds 0 and reverts with "nothing to withdraw".',
        hints: ['Move balances[msg.sender] = 0; above the call.', 'Add require(amount > 0, "nothing to withdraw"); first.'],
      },
      [['Checks-effects-interactions', 'Validate, update your own state, and only then call external contracts: prevents reentrancy.']],
    ),
    lesson(
      'sol-project',
      '🛠️ Mini project: A simple token',
      `
Tokens (ERC-20) are the most common smart contracts. Build a minimal one with balances, transfers and a fixed supply. Real projects use OpenZeppelin's audited ERC-20 implementation.
`,
      {
        prompt: 'Write `contract SimpleToken` with `name = "Quest"`, `symbol = "QST"`, a `totalSupply` of 1,000,000 minted to the deployer, a `balanceOf` mapping, a `Transfer` event and `transfer(address to, uint256 amount) returns (bool)` that rejects insufficient balances and the zero address.',
        starter: HEADER + 'contract SimpleToken {\n    string public name = "Quest";\n    string public symbol = "QST";\n    // supply, balances, event, constructor\n\n    function transfer(address to, uint256 amount) public returns (bool) {\n        return /* your code */;\n    }\n}\n',
        solution: HEADER + 'contract SimpleToken {\n    string public name = "Quest";\n    string public symbol = "QST";\n    uint256 public totalSupply = 1_000_000;\n    mapping(address => uint256) public balanceOf;\n\n    event Transfer(address indexed from, address indexed to, uint256 amount);\n\n    constructor() {\n        balanceOf[msg.sender] = totalSupply;\n        emit Transfer(address(0), msg.sender, totalSupply);\n    }\n\n    function transfer(address to, uint256 amount) public returns (bool) {\n        require(to != address(0), "zero address");\n        require(balanceOf[msg.sender] >= amount, "insufficient balance");\n        balanceOf[msg.sender] -= amount;\n        balanceOf[to] += amount;\n        emit Transfer(msg.sender, to, amount);\n        return true;\n    }\n}\n',
        expected: 'The deployer starts with 1000000 QST; transfer(to, 100) moves 100 tokens, emits Transfer and returns true; transferring more than the balance or to address(0) reverts.',
        hints: ['constructor() { balanceOf[msg.sender] = totalSupply; }', 'require both conditions, update both balances, emit Transfer(msg.sender, to, amount), return true.'],
      },
      [],
      80,
    ),
  ],
});
