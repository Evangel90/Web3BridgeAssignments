const crypto = require('crypto');

// Keccak256 hash function (functional)
const keccak256 = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(data.toString());
  return hash.digest('hex').slice(0, 16); // Short hash for readability
};

// Create leaf node (functional)
const createLeaf = (data) => ({
  type: 'leaf',
  data,
  hash: keccak256(data),
});

// Create branch node (functional)
const createBranch = (left, right) => ({
  type: 'branch',
  left,
  right,
  hash: keccak256(`${left.hash}${right.hash}`),
});

// Build merkle tree recursively (functional)
const buildMerkleTree = (nodes) => {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];

  // Pad nodes to even length
  const paddedNodes = nodes.length % 2 === 0 ? nodes : [...nodes, nodes[nodes.length - 1]];

  // Create branch pairs (functional approach)
  const branches = paddedNodes.reduce((acc, node, i) => {
    if (i % 2 === 0) {
      acc.push(createBranch(node, paddedNodes[i + 1]));
    }
    return acc;
  }, []);

  // Recursively build tree until single root
  return branches.length === 1 ? branches[0] : buildMerkleTree(branches);
};

// Count tree depth (functional)
const getDepth = (node, currentDepth = 0) => {
  if (!node || node.type === 'leaf') return currentDepth;
  return Math.max(
    getDepth(node.left, currentDepth + 1),
    getDepth(node.right, currentDepth + 1)
  );
};

// Generate visual diagram (functional)
const generateDiagram = (node, prefix = '', isLeft = null) => {
  if (!node) return '';

  const symbol = isLeft === null ? '' : isLeft ? '├── ' : '└── ';
  const nodeInfo = `${symbol}[${node.type.toUpperCase()}] ${node.hash}`;

  if (node.type === 'leaf') {
    return `${prefix}${nodeInfo} (${node.data})\n`;
  }

  const leftPrefix = prefix + (isLeft === null ? '' : isLeft ? '│   ' : '    ');
  const leftDiagram = node.left ? generateDiagram(node.left, leftPrefix, true) : '';
  const rightDiagram = node.right ? generateDiagram(node.right, leftPrefix, false) : '';

  return `${prefix}${nodeInfo}\n${leftDiagram}${rightDiagram}`;
};

// Print merkle tree structure (functional)
const printMerkleTree = (nodes) => {
  const tree = buildMerkleTree(nodes.map(createLeaf));
  
  if (!tree) {
    console.log('Tree is empty');
    return null;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('MERKLE TREE DIAGRAM (using Keccak256 Hashing)');
  console.log('═'.repeat(60));
  console.log(generateDiagram(tree));
  console.log('═'.repeat(60));
  console.log(`Root Hash: ${tree.hash}`);
  console.log(`Tree Depth: ${getDepth(tree)}`);
  console.log('═'.repeat(60) + '\n');

  return tree;
};

// Example usage
const data = ['Block1', 'Block2', 'Block3', 'Block4'];
const merkleTree = printMerkleTree(data);

// Additional utility: Verify leaf in merkle tree (functional)
const verifyLeaf = (tree, leafData, path = []) => {
  if (!tree) return false;
  if (tree.type === 'leaf') {
    return tree.data === leafData;
  }

  const leftValid = verifyLeaf(tree.left, leafData, [...path, 'L']);
  const rightValid = verifyLeaf(tree.right, leafData, [...path, 'R']);

  return leftValid || rightValid;
};

console.log(`Verifying "Block2" in tree: ${verifyLeaf(merkleTree, 'Block2')}`);
console.log(`Verifying "Block5" in tree: ${verifyLeaf(merkleTree, 'Block5')}`);

module.exports = {
  keccak256,
  createLeaf,
  createBranch,
  buildMerkleTree,
  printMerkleTree,
  verifyLeaf,
  getDepth,
  generateDiagram,
};
