import { DynNode } from './DynNode';

const Trees: DynNode[] = [];

export function init() {
  async function RecurseForDyns(htmlnode: Node, currentNode?: DynNode): Promise<void> {
    if (htmlnode.nodeType === Node.ELEMENT_NODE && htmlnode instanceof HTMLElement) {
      if (htmlnode.hasAttribute('dyn')) {
        const newNode = new DynNode(htmlnode, currentNode);
        if (currentNode === undefined) {
          Trees.push(newNode);
        }
        await newNode.LoadNoad();
        currentNode = newNode;
      }
    }
    for (let i = 0; i < htmlnode.childNodes.length; i++) {
      await RecurseForDyns(htmlnode.childNodes[i], currentNode);
    }
  }

  async function BootStrapDyn(): Promise<void> {
    await RecurseForDyns(document.documentElement);
  }
  document.addEventListener('DOMContentLoaded', BootStrapDyn);
}
