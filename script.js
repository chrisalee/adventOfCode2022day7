const arrayEquals = (arr1, arr2) =>
  arr1.length === arr2.length &&
  arr1.every((value, idx) => value === arr2[idx]);

const modifyTree = (tree, newKey, newVal, destination, path = []) => {
  const newTree = Object.entries(tree).reduce((newTree, [key, value]) => {
    const nextValue =
      typeof value === "object"
        ? modifyTree(value, newKey, newVal, destination, [...path, key])
        : value;
    return { ...newTree, [key]: nextValue };
  }, {});

  return arrayEquals(destination, path)
    ? { ...newTree, [newKey]: newVal }
    : newTree;
};

const lines = sampleInput.split("\n");

// create a tree of the file systsem (in the form of nested objects)
const fileTree = lines.reduce(
  ({ tree, location }, line) => {
    const doNothing = () => ({ tree, location });
    const closeDirectory = () => ({ tree, location: location.slice(0, -1) });
    const goToHomeDirectory = () => ({ tree, location: [] });
    const openDirectory = (line) => {
      const dir = line.match(/\$ cd (\w+)/)[1];
      return { tree, location: [...location, dir] };
    };
    const createNewDirectory = (line) => {
      const dir = line.match(/dir (\w+)/)[1];
      const nextTree = modifyTree(tree, dir, {}, location);
      return { tree: nextTree, location };
    };
    const createFile = (line) => {
      const [size, file] = line.match(/(\d+) (.+)/).slice(1);
      const nextTree = modifyTree(tree, file, Number(size), location);
      return { tree: nextTree, location };
    };

    const commandMap = [
      { expression: /\$ ls/, function: doNothing },
      { expression: /\$ cd \.\./, function: closeDirectory },
      { expression: /\$ cd \//, function: goToHomeDirectory },
      { expression: /\$ cd \w+/, function: openDirectory },
      { expression: /dir \w+/, function: createNewDirectory },
      { expression: /\d+ .+/, function: createFile },
    ];
    const command = commandMap.find(({ expression }) =>
      expression.test(line)
    ).function;

    return command(line);
  },
  { tree: {}, location: [] }
).tree;
console.log(fileTree);

// depth first search the tree to find the size of each directory
const getDirectorySizes = (tree, path = "/", sizes = {}) => {
  // add up size of each file in this directory
  // for each subdirectory, run again to get its size
  const visitSubdirectory = (name, content, size, nextSizes) => {
    const { size: innerSize, sizes: innerSizes } = getDirectorySizes(
      content,
      `${path}${name}/`,
      nextSizes
    );
    return { size: size + innerSize, nextSizes: innerSizes };
  };
  const { size, nextSizes } = Object.entries(tree).reduce(
    ({ size, nextSizes }, [name, content]) =>
      typeof content === "object"
        ? visitSubdirectory()
        : { size: size + content, nextSizes },
    { size: 0, nextSizes: sizes }
  );

  return { size, sizes: { ...nextSizes, [path]: size } };
};

const { sizes } = getDirectorySizes(fileTree);
console.log(sizes);

// PART 1
// find all the directories under 100000 and add up their sizes
const sizeSum = Object.values(sizes)
  .filter((size) => size <= 100000)
  .reduce((sum, num) => sum + num, 0);
console.log(sizeSum);

// PART 2
//  find the smallest directory that would give us 40M of space if we deleted it
const minDeletionSize = sizes['/'] - 4e7;

const deletionCandidates = Object.values(sizes).filter((size) => size >= minDeletionSize);
const deletionSize = Math.min(...deletionCandidates);

console.log(deletionSize);
