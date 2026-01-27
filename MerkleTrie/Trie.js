const crypto = require('crypto');

const keccak256 = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(data.toString());
  return hash.digest('hex').slice(0, 16);
};

const createLeaf = (data) => ({
  type: 'leaf',
  data,
  hash: keccak256(data),
});

const createBranch = (left, right) => ({
  type: 'branch',
  left,
  right,
  hash: keccak256(`${left.hash}${right.hash}`),
});

const buildMerkleTree = (nodes) => {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];

  const paddedNodes = nodes.length % 2 === 0 ? nodes : [...nodes, nodes[nodes.length - 1]];

  const branches = paddedNodes.reduce((acc, node, i) => {
    if (i % 2 === 0) {
      acc.push(createBranch(node, paddedNodes[i + 1]));
    }
    return acc;
  }, []);

  return branches.length === 1 ? branches[0] : buildMerkleTree(branches);
};

const getDepth = (node, currentDepth = 0) => {
  if (!node || node.type === 'leaf') return currentDepth;
  return Math.max(
    getDepth(node.left, currentDepth + 1),
    getDepth(node.right, currentDepth + 1)
  );
};


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

const data = ['Tnx1', 'Tnx2', 'Tnx3', 'Tnx4', 'Tnx5', 'Tnx6', 'Tnx7', 'Tnx8'];
printMerkleTree(data);
