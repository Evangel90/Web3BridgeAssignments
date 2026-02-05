# Ethereum Overview
Ethereum is a global computer that anyone can program and use, and the core of that computer is the Ethereum Virtual Machine (EVM), which runs transactions inside blocks, charging **gas** for execution and updating accounts and their balances. This article walks through the big moving parts, EVM, blocks, gas, accounts, and transactions, in a beginner-friendly but technically grounded way.

## From ledger to state machine

Bitcoin is often described as a distributed ledger that only tracks balances, but Ethereum is better understood as a **distributed** state machine. The state is one huge data structure that includes all accounts, their balances, and, for smart contracts, their code and storage; this state changes step by step as transactions are processed.  

Formally, Ethereum defines a state transition function \(Y(S, T) = S'\), meaning that given a previous valid state \(S\) and a set of valid transactions \(T\), the EVM deterministically produces a new state \(S'\). This state is stored in a special authenticated data structure called a modified Merkle Patricia trie, whose single root hash is written into blocks so every node can verify they are on the same state without downloading all data at once.  

## The EVM Ethereums CPU

The Ethereum Virtual Machine (EVM) is the deterministic runtime environment that executes smart contract bytecode on every node, ensuring that all nodes compute the same result for the same inputs. It behaves like a small virtual CPU with its own instruction set (opcodes), stack, memory, and persistent storage, and it is the component that actually applies the state transition function to process transactions.  

### Execution model: stack, memory, storage

The EVM is defined as a stack machine with a maximum depth of 1024 items where each item is a 256‑bit word. This choice aligns with 256‑bit cryptographic primitives like Keccak‑256 and secp256k1. During execution the EVM uses three main data areas:

- **Stack:** Last-in, first-out (LIFO) structure holding intermediate values for opcodes such as `ADD`, `MUL`, `AND`, `XOR`, or `BALANCE`. Most opcodes pop operands from the stack and push results back.
- **Memory:** A transient, byte-addressed array that exists only for the life of a single execution (transaction or internal call) and is discarded afterwards.
- **Storage:** A persistent key–value store per contract account implemented as its own Merkle Patricia trie and part of the global state; changes to storage survive between transactions.

Recent upgrades also added **transient storage**, a per-transaction key–value store accessed via `TSTORE` and `TLOAD`. Transient storage persists across internal calls within a single transaction but is cleared at the end and never committed to global state. This offers a gas-efficient way to share temporary data across nested calls without paying permanent storage costs.

### Opcodes and determinism

Smart contracts are compiled to EVM bytecode, which is a sequence of opcodes with associated data. Major opcode categories include:

- **Arithmetic & logic:** `ADD`, `SUB`, `MUL`, `DIV`, `AND`, `OR`, `XOR`
- **Stack & memory:** `PUSH`, `POP`, `DUP`, `SWAP`, `MLOAD`, `MSTORE`
- **Storage:** `SLOAD`, `SSTORE` (plus `TLOAD`, `TSTORE` for transient storage)
- **Control flow:** `JUMP`, `JUMPI`, `STOP`, `RETURN`, `REVERT`
- **Environment & blockchain:** `ADDRESS`, `CALLER`, `CALLVALUE`, `GASPRICE`, `BLOCKHASH`, etc.

Every opcode has a precisely defined effect and a fixed gas cost; nodes must run exactly the same opcodes in the same order to remain in consensus. To avoid ambiguity, all EVM implementations (for example Geth or Nethermind) follow the Yellow Paper specification.

### EVM and the state transition

When a transaction is included in a block, the execution client feeds it into the EVM with the sender, recipient, value, data, gas, and the current state snapshot. The EVM then executes contract code, updates storage and balances, emits logs/events, and either completes successfully (committing changes) or triggers an error or `REVERT` (rolling back state changes while consuming gas). The final result contributes to the new state root that is stored in the block header, linking EVM execution to the chain's cryptographic history.  

## Blocks time boxed batches of state changes

Blocks are ordered containers of transactions plus metadata, acting as the discrete ticks of Ethereum's global state machine. Each block references its parent's hash, forming a chain where executing all transactions in order from genesis to the current block reconstructs the full state.  

### Whats inside an Ethereum block

After the Merge Ethereum separates the consensus layer (Beacon chain) and execution layer, but you can think in terms of an outer block with consensus data and an embedded execution payload. At a high level a block includes:

- **Consensus fields (Beacon side)**
	- `slot`: time slot to which the block belongs
	- `proposer_index`: validator index proposing the block
	- `parent_root`: hash of the previous Beacon block
	- `state_root`: root hash of consensus state

- **Execution payload (execution side)**
	- `block_number`: sequential number of the execution block
	- `parent_hash`: hash of the previous execution block
	- `state_root`: root hash of the execution state trie
	- `gas_limit`: maximum gas that all transactions in this block may consume
	- `gas_used`: actual gas consumed by included transactions
	- `timestamp`: block time
	- `base_fee_per_gas`: EIP-1559 base fee for this block
	- `transactions_root`: Merkle root of the transactions
	- `withdrawal_root` / `withdrawals`: validator withdrawals
	- `logs_bloom`, `prev_randao`, `extra_data`: additional execution fields

The transactions list in the payload is the ordered set of user operations executed by the EVM to advance the state and their cumulative gas usage must not exceed `gas_limit`.

### Ordering finality state

Within each block, transactions are strictly ordered. This ordering affects outcomes when multiple transactions touch the same accounts or contracts. Executing all transactions in order yields a new state root, and that root is stored in the block header so that clients can validate that the block's contents are consistent with the claimed state transition.  

Under proof-of-stake, validators propose blocks in assigned slots. Blocks progress through stages such as proposed, justified, and finalized; finalization means it would be extremely costly in staked ETH to revert that block. Once a block is finalized, its transactions and resulting state are, for practical purposes, permanent.  

## Accounts: externally owned vs contract

Ethereum's state is centered around accounts, objects that can hold ETH and interact with the EVM. There are two main account types which share fields like `nonce` and `balance`, but behave differently:

- **Externally Owned Accounts (EOAs)**
	- Controlled by private keys held by humans or software wallets; EOAs do not contain code.
	- The address is derived from the public key.
	- Only EOAs can create top-level transactions that initiate state changes on the base chain.
	- `nonce` tracks how many transactions have been sent; each new transaction must use the next nonce to prevent replay and enforce ordering.

- **Contract accounts**
	- Controlled by deployed code which determines how they react to calls and what storage they modify.
	- Fields include a code field (EVM bytecode), a storage trie (mapping 256-bit keys to 256-bit values), and a balance to hold ETH and tokenized assets.
	- Contracts cannot initiate top-level transactions; they only react to transactions or internal calls and may call other contracts via opcodes like `CALL`, `DELEGATECALL`, and `STATICCALL`. All calls execute within the same transaction context.

### Account abstraction (brief)

Classic Ethereum separates EOAs (key-based) and contracts (code-based). Newer proposals like EIP-7702 introduce transaction types that allow EOAs to behave like contracts via an authorization list, moving toward account abstraction for features such as batched operations, social recovery, or sponsored gas while remaining compatible with the EVM and mempool.

## Gas metering computation and storage

Gas is a unit that measures how much computational and storage work a transaction or operation performs in the EVM. You pay for this work using ETH and this payment both compensates validators and protects the network from spam and runaway computation such as infinite loops.  

### Why gas exists

Every EVM operation (from arithmetic to storage writes) has an associated gas cost chosen roughly proportional to the computational and bandwidth resources it uses. Gas serves several roles:

- Prevents denial-of-service by making large or complex computations expensive.
- Encourages contract efficiency since expensive code is costly to run.
- Compensates validators who execute, verify, and store transaction results.

Without gas, a malicious contract could force nodes into unbounded computation and break the network's liveness.


### Gas limit, gas price, and EIP-1559 fees

When sending a transaction the sender specifies:

- `gasLimit` (`gas`): maximum units of gas the transaction is allowed to consume.
- `maxPriorityFeePerGas`: the tip to the validator per gas unit.
- `maxFeePerGas`: the maximum total fee per gas (base fee + tip) the sender is willing to pay.

Under EIP-1559 (type 2) each block has a `baseFeePerGas` that is algorithmically adjusted depending on how full previous blocks were. The actual gas price paid is:

- `effectiveGasPrice = min(maxFeePerGas, baseFeePerGas + priorityFeePerGas)`

Total fee paid by a successful transaction is:

- `totalFee = gasUsed * effectiveGasPrice`

For example a simple ETH transfer uses 21000 gas units with a base fee of 190 gwei and a priority fee of 10 gwei the sender pays 200  21000 = 4 200 000 gwei or 0 0042 ETH in fees on top of the value transferred. The base fee portion is burned reducing ETH supply and the priority fee goes to the validator any unused gas gasLimit minus gasUsed is refunded to the sender.  

### Gas during execution and block gas limit

When the EVM executes a transaction it is given a gas supply equal to the transaction's `gasLimit`. Gas is deducted per opcode; if gas runs out the EVM triggers an Out of Gas exception, reverting state changes while still consuming the provided gas.

At the block level, `gas_used` is the sum of gas used by all transactions in the block and must not exceed the block's `gas_limit`. The block gas limit caps how many (and what types of) transactions fit in a block, limiting worst-case resource usage and influencing throughput.

## Transactions signed instructions that change state

A transaction is a signed instruction from an EOA that requests a state change in the EVM most commonly sending ETH calling a contract or deploying code. Every action that changes Ethereums global state must start with a transaction from an EOA.  


### Transaction structure

A basic Ethereum transaction includes the following key fields:

- `from`: sender's address (an EOA, inferred from the signature)
- `to`: recipient address; if omitted, this is a contract creation transaction
- `nonce`: sender's transaction count (prevents replay and enforces ordering)
- `value`: amount of ETH in wei to transfer
- `gasLimit`: maximum gas units allowed for this transaction
- `maxPriorityFeePerGas`: maximum tip per gas unit
- `maxFeePerGas`: maximum total price per gas (base fee + tip)
- `input` / `data`: optional arbitrary data (often ABI-encoded function call + arguments)
- `signature` (`v`, `r`, `s`): ECDSA signature proving ownership of the `from` private key

Wallets construct this object, sign it with the user's private key, and serialize it for broadcast to the network.

### The data field and contract calls

For contract interactions the data field encodes the function call using the ABI Application Binary Interface format. In Solidity  

The first 4 bytes of data are the function selector the first 4 bytes of the Keccak 256 hash of the function signature for example transfer address uint256.  
The remaining bytes are the arguments encoded as 32 byte words with integers and addresses left padded with zeros.  

For example a typical ERC 20 transfer call encodes the recipient address and the token amount in this ABI format and contract code decodes this data during execution.  


### Transaction types (0–4)

EIP-2718 introduced a typed envelope for transactions so new feature sets can be added without breaking older formats. Common types:

- **Type 0 (legacy):** Original format using `gasPrice` only; no EIP-1559 or access lists. Still valid but less used.
- **Type 1:** Adds `accessList` (EIP-2930) for specifying addresses and storage keys to be touched.
- **Type 2:** EIP-1559 transactions with `maxFeePerGas` and `maxPriorityFeePerGas`; uses a dynamic `baseFeePerGas` (standard on mainnet).
- **Type 3 (Blob):** EIP-4844 introducing `blobVersionedHashes`, `maxFeePerBlobGas`, and blob gas for rollup data availability.
- **Type 4:** EIP-7702 (account abstraction) with `authorization_list` for delegating EOA behavior to contract code.

Typed transactions are encoded as `TransactionType` followed by `TransactionPayload`, where the first byte indicates the type and the payload is defined by that type's specification.


### Transaction lifecycle

Once a user signs and submits a transaction it typically follows these steps:

- **Construction & signing:** Wallet builds the transaction fields, signs with the sender's private key, and computes the transaction hash (ID).
- **Broadcast:** The signed transaction is propagated across the peer-to-peer network and enters nodes' mempools (pending sets).
- **Selection by validator:** A validator proposing a block selects transactions (often prioritizing higher `effectiveGasPrice`) while keeping total `gas_used` under the block `gas_limit`.
- **Execution:** The execution client runs each transaction in order using the EVM, updating balances, storage, and logs, and computing the new state root.
- **Inclusion & propagation:** The block containing the execution payload is proposed and gossiped; other nodes verify transactions and state transitions.
- **Finality:** Consensus messages (on the Beacon/consensus layer) eventually finalize the block; reverting a finalized block is economically prohibitive.

If a transaction runs out of gas or encounters an exception (without `REVERT`), state changes are rolled back but the gas is still consumed. If it explicitly calls `REVERT`, state changes are rolled back and some gas may be refunded depending on the logic.


## How the pieces fit together

Putting it all together:

- **Transactions:** Signed messages from EOAs describing desired state changes and specifying how much gas the sender will spend.
- **Accounts:** EOAs and contracts are the stateful objects the EVM manipulates (balances, code, storage).
- **EVM execution:** The EVM executes transactions opcode-by-opcode, consuming gas and updating accounts and storage per deterministic rules.
- **Blocks & consensus:** Blocks package ordered transactions; each block header commits to the resulting state via a root hash, and consensus ensures agreement on the canonical chain.

A helpful mental model: each block is a tick of a global computer; during that tick the EVM runs the programs specified by transactions, charges gas, updates accounts, and seals the new state into a block that becomes part of Ethereum's permanent history.
